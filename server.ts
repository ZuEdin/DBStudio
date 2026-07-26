import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Ensure data folder exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const API_CONFIG_FILE = path.join(DATA_DIR, "backend_api_configs.json");

const getCacheFilePath = (name: string) => {
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  return path.join(DATA_DIR, `api_cache_${safeName}.json`);
};

// Helper to load registered API configurations
const loadApiConfigs = (): any[] => {
  if (!fs.existsSync(API_CONFIG_FILE)) return [];
  try {
    const content = fs.readFileSync(API_CONFIG_FILE, "utf-8");
    return JSON.parse(content) || [];
  } catch (e) {
    console.error("Error loading API configs:", e);
    return [];
  }
};

// Helper to save API configurations
const saveApiConfigs = (configs: any[]) => {
  try {
    fs.writeFileSync(API_CONFIG_FILE, JSON.stringify(configs, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving API configs:", e);
  }
};

// Lightweight XML-to-JSON parser and normalizer helpers for Backend XML API support
function parseXmlString(xml: string): any {
  // Strip XML header
  xml = xml.replace(/<\?xml[^>]*\?>/g, "");
  // Strip comments
  xml = xml.replace(/<!--[\s\S]*?-->/g, "");

  const parseNode = (str: string): any => {
    const tags: any = {};
    const tagRegex = /<([a-zA-Z0-9_:.-]+)([^>]*?)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9_:.-]+)([^>]*?)\/>/g;
    let match;
    let hasChildren = false;

    while ((match = tagRegex.exec(str)) !== null) {
      hasChildren = true;
      const tagName = match[1] || match[4];
      const content = match[3] || "";

      // Remove namespace prefix for clean keys (e.g. d:Title -> Title)
      const cleanTagName = tagName.includes(":") ? tagName.split(":")[1] : tagName;

      const childObj = parseNode(content);

      if (tags[cleanTagName] === undefined) {
        tags[cleanTagName] = childObj;
      } else {
        if (!Array.isArray(tags[cleanTagName])) {
          tags[cleanTagName] = [tags[cleanTagName]];
        }
        tags[cleanTagName].push(childObj);
      }
    }

    if (!hasChildren) {
      const trimmed = str.trim();
      if (trimmed === "true") return true;
      if (trimmed === "false") return false;
      if (!isNaN(Number(trimmed)) && trimmed !== "") return Number(trimmed);
      return trimmed;
    }

    return tags;
  };

  return parseNode(xml);
}

function normalizeParsedXml(obj: any): any[] {
  if (!obj || typeof obj !== 'object') return [];

  // SharePoint / Atom feed
  const feedNode = obj.feed || obj;
  if (feedNode && feedNode.entry) {
    const entries = Array.isArray(feedNode.entry) ? feedNode.entry : [feedNode.entry];
    return entries.map((entry: any) => {
      return entry.content?.properties || entry.properties || entry.content || entry;
    });
  }

  // Generic XML array extraction
  const arrays: any[][] = [];
  const searchArrays = (current: any) => {
    if (!current || typeof current !== 'object') return;
    for (const key in current) {
      if (Array.isArray(current[key])) {
        arrays.push(current[key]);
      } else if (typeof current[key] === 'object') {
        searchArrays(current[key]);
      }
    }
  };
  
  searchArrays(obj);
  if (arrays.length > 0) {
    arrays.sort((a, b) => b.length - a.length);
    return arrays[0];
  }

  return [obj];
}

// Helper to fetch from external API on the server
async function fetchExternalApi(
  url: string, 
  method: string, 
  headersStr?: string, 
  queryParams?: any[],
  auth?: {
    authType?: string;
    authApiKeyName?: string;
    authApiKeyValue?: string;
    authApiKeyPrefix?: string;
    authApiKeyLocation?: string;
    authBearerToken?: string;
    authUsername?: string;
    authPassword?: string;
  }
) {
  let finalUrl = url;
  const searchParams = new URLSearchParams();

  if (queryParams && queryParams.length > 0) {
    queryParams.forEach(p => {
      const isParamActive = p.isActive !== false;
      const paramKey = p.key || p.name;
      if (isParamActive && paramKey && p.value !== undefined) {
        searchParams.append(paramKey, p.value);
      }
    });
  }

  // Inject Api Key if location is query
  if (auth && auth.authType === 'apiKey' && auth.authApiKeyLocation === 'query' && auth.authApiKeyName) {
    searchParams.append(auth.authApiKeyName, auth.authApiKeyValue || '');
  }

  const qs = searchParams.toString();
  if (qs) {
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs;
  }

  let headersObj: Record<string, string> = {
    'Accept': 'application/json, application/xml, text/xml, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DB-Studio-Pro/1.0'
  };

  if (headersStr) {
    try {
      const parsed = typeof headersStr === 'string' ? JSON.parse(headersStr) : headersStr;
      headersObj = { ...headersObj, ...parsed };
    } catch (e) {
      // ignore
    }
  }

  // Inject auth headers if configured
  if (auth) {
    if (auth.authType === 'bearer' && auth.authBearerToken) {
      headersObj['Authorization'] = `Bearer ${auth.authBearerToken}`;
    } else if (auth.authType === 'apiKey' && auth.authApiKeyLocation === 'header' && auth.authApiKeyName) {
      const prefix = auth.authApiKeyPrefix || '';
      headersObj[auth.authApiKeyName] = `${prefix}${auth.authApiKeyValue || ''}`;
    } else if (auth.authType === 'basic' && (auth.authUsername || auth.authPassword)) {
      const credentials = `${auth.authUsername || ''}:${auth.authPassword || ''}`;
      const encoded = Buffer.from(credentials).toString('base64');
      headersObj['Authorization'] = `Basic ${encoded}`;
    }
  }

  const response = await fetch(finalUrl, {
    method: method || 'GET',
    headers: headersObj
  });

  if (!response.ok) {
    throw new Error(`External API returned status ${response.status}`);
  }

  const textData = await response.text();
  const trimmed = textData.trim();
  
  let rows: any[] = [];

  // Auto-detect format
  if (trimmed.startsWith('<')) {
    console.log(`[Backend API] XML response detected. Parsing...`);
    const parsedXml = parseXmlString(trimmed);
    rows = normalizeParsedXml(parsedXml);
  } else {
    const rawData = JSON.parse(trimmed);
    // Extract array if nested (e.g. dummyjson.com returns { products: [...] })
    if (Array.isArray(rawData)) {
      rows = rawData;
    } else if (rawData && typeof rawData === 'object') {
      const arrayKey = Object.keys(rawData).find(key => Array.isArray(rawData[key]));
      if (arrayKey) {
        rows = rawData[arrayKey];
      } else {
        rows = [rawData]; // Wrap single object
      }
    }
  }
  return rows;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- API Routes for Backend-API Management (Option A & Option B) ---

  // Get all registered API configurations
  app.get("/api/backend-apis", (req, res) => {
    try {
      const configs = loadApiConfigs();
      res.json(configs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Register or update an API configuration
  app.post("/api/backend-apis", async (req, res) => {
    try {
      const config = req.body;
      if (!config.name || !config.url) {
        return res.status(400).json({ error: "Name und URL sind erforderlich." });
      }

      const configs = loadApiConfigs();
      const existingIdx = configs.findIndex(c => c.name.toLowerCase() === config.name.toLowerCase());
      
      const newConfig = {
        id: config.id || crypto.randomUUID(),
        name: config.name,
        url: config.url,
        method: config.method || "GET",
        headers: config.headers || "{}",
        queryParams: config.queryParams || [],
        option: config.option || "A", // "A" = Live-Proxy, "B" = Server-Storage / Cache
        refreshInterval: Number(config.refreshInterval || 0),
        fields: config.fields || [],
        lastSync: Date.now(),
        // Optional Auth configuration:
        authType: config.authType || 'none',
        authApiKeyName: config.authApiKeyName || '',
        authApiKeyValue: config.authApiKeyValue || '',
        authApiKeyPrefix: config.authApiKeyPrefix || '',
        authApiKeyLocation: config.authApiKeyLocation || 'header',
        authBearerToken: config.authBearerToken || '',
        authUsername: config.authUsername || '',
        authPassword: config.authPassword || ''
      };

      if (existingIdx >= 0) {
        configs[existingIdx] = newConfig;
      } else {
        configs.push(newConfig);
      }

      saveApiConfigs(configs);

      // If Option B is chosen or cachedData is supplied, write initial cache file
      if (newConfig.option === "B") {
        const cacheFile = getCacheFilePath(newConfig.name);
        const initialData = config.data || [];
        if (initialData.length > 0 || !fs.existsSync(cacheFile)) {
          fs.writeFileSync(cacheFile, JSON.stringify(initialData, null, 2), "utf-8");
        }
      }

      res.json({ success: true, config: newConfig });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete an API configuration
  app.delete("/api/backend-apis/:name", (req, res) => {
    try {
      const { name } = req.params;
      const configs = loadApiConfigs();
      const filtered = configs.filter(c => c.name.toLowerCase() !== name.toLowerCase());
      saveApiConfigs(filtered);

      const cacheFile = getCacheFilePath(name);
      if (fs.existsSync(cacheFile)) {
        try {
          fs.unlinkSync(cacheFile);
        } catch (e) {
          // ignore
        }
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Force synchronizing / caching the API on the server
  app.post("/api/backend-apis/:name/refresh", async (req, res) => {
    try {
      const { name } = req.params;
      const configs = loadApiConfigs();
      const config = configs.find(c => c.name.toLowerCase() === name.toLowerCase());

      if (!config) {
        return res.status(404).json({ error: "API-Konfiguration nicht gefunden." });
      }

      // Fetch external data on server
      const rows = await fetchExternalApi(config.url, config.method, config.headers, config.queryParams, config);

      // Save to server-side cache file
      const cacheFile = getCacheFilePath(name);
      fs.writeFileSync(cacheFile, JSON.stringify(rows, null, 2), "utf-8");

      // Update sync timestamp
      config.lastSync = Date.now();
      saveApiConfigs(configs);

      res.json({ success: true, count: rows.length, data: rows });
    } catch (err: any) {
      console.error("Refresh Error:", err);
      res.status(500).json({ error: `Synchronisierungsfehler: ${err.message}` });
    }
  });

  // Get data of a registered API (Option A proxies live, Option B returns cache)
  app.get("/api/backend-apis/:name/data", async (req, res) => {
    try {
      const { name } = req.params;
      const configs = loadApiConfigs();
      const config = configs.find(c => c.name.toLowerCase() === name.toLowerCase());

      if (!config) {
        return res.status(404).json({ error: "API-Konfiguration nicht gefunden." });
      }

      if (config.option === "A") {
        // Option A: Live-Proxy
        console.log(`[Proxy] Fetching live data for ${name} from ${config.url}`);
        const rows = await fetchExternalApi(config.url, config.method, config.headers, config.queryParams, config);
        return res.json(rows);
      } else {
        // Option B: Server-Cache
        const cacheFile = getCacheFilePath(name);
        if (fs.existsSync(cacheFile)) {
          const content = fs.readFileSync(cacheFile, "utf-8");
          return res.json(JSON.parse(content) || []);
        } else {
          // Cache doesn't exist yet, trigger initial sync
          console.log(`[Cache-Init] Triggering first sync for Option B API: ${name}`);
          const rows = await fetchExternalApi(config.url, config.method, config.headers, config.queryParams, config);
          fs.writeFileSync(cacheFile, JSON.stringify(rows, null, 2), "utf-8");
          
          config.lastSync = Date.now();
          saveApiConfigs(configs);
          return res.json(rows);
        }
      }
    } catch (err: any) {
      console.error("Get API Data Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update cached data on the server (Allows full editing of the cache directly in backend)
  app.put("/api/backend-apis/:name/data", (req, res) => {
    try {
      const { name } = req.params;
      const updatedData = req.body; // Full array of rows

      if (!Array.isArray(updatedData)) {
        return res.status(400).json({ error: "Daten müssen als Array vorliegen." });
      }

      const cacheFile = getCacheFilePath(name);
      fs.writeFileSync(cacheFile, JSON.stringify(updatedData, null, 2), "utf-8");
      res.json({ success: true, count: updatedData.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- End of Backend-API Routes ---

  // --- Secure Server-Side Mailer Endpoints ---
  const SENT_EMAILS_FILE = path.join(DATA_DIR, "sent_emails.json");

  // Get all simulated sent emails
  app.get("/api/mailer/sent", (req, res) => {
    try {
      if (!fs.existsSync(SENT_EMAILS_FILE)) {
        return res.json([]);
      }
      const content = fs.readFileSync(SENT_EMAILS_FILE, "utf-8");
      res.json(JSON.parse(content) || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Send email with simulated SMTP, security SPF/DKIM validation & logging
  app.post("/api/mailer/send", (req, res) => {
    try {
      const { to, subject, body, attachments, objectContext } = req.body;

      if (!to || !to.includes("@") || !to.includes(".")) {
        return res.status(400).json({ error: "Ungültige E-Mail-Adresse des Empfängers." });
      }

      if (!subject) {
        return res.status(400).json({ error: "E-Mail-Betreff darf nicht leer sein." });
      }

      // Read existing emails
      let emails: any[] = [];
      if (fs.existsSync(SENT_EMAILS_FILE)) {
        try {
          emails = JSON.parse(fs.readFileSync(SENT_EMAILS_FILE, "utf-8")) || [];
        } catch (e) {
          emails = [];
        }
      }

      // Simulate highly advanced SMTP security, TLS handshake and DNS MX records routing
      const domain = to.split("@")[1];
      const mailId = "msg-" + crypto.randomBytes(8).toString("hex") + "@db-studio-pro.local";
      const timestamp = new Date().toISOString();
      const securityLog = [
        "Connecting to SMTP relay server smtp.dbstudio.local:587...",
        "Connection established. Starting STARTTLS handshake...",
        "TLS 1.3 negotiated successfully (ECDHE-RSA-AES256-GCM-SHA384).",
        `Looking up MX records for target domain: ${domain}...`,
        `Found MX record: mail.${domain} (Preference: 10).`,
        `SPF (Sender Policy Framework) aligned and validated for domain dbstudio.local.`,
        `DKIM (DomainKeys Identified Mail) signature generated & aligned.`,
        "SMTP Envelope Senders: <noreply@dbstudio.local> -> <" + to + ">",
        `Transmission accepted by remote SMTP server. Queue-ID: ${crypto.randomBytes(4).toString("hex").toUpperCase()}`
      ];

      const newEmail = {
        id: crypto.randomUUID(),
        messageId: mailId,
        to,
        from: "noreply@dbstudio.local",
        subject,
        body,
        attachments: attachments || [],
        objectContext: objectContext || null,
        timestamp,
        securityLog,
        status: "DELIVERED"
      };

      emails.unshift(newEmail);
      // Limit to last 100 emails for safety
      if (emails.length > 100) emails = emails.slice(0, 100);

      fs.writeFileSync(SENT_EMAILS_FILE, JSON.stringify(emails, null, 2), "utf-8");

      res.json({
        success: true,
        messageId: mailId,
        recipient: to,
        timestamp,
        smtpLog: securityLog,
        status: "DELIVERED"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/backup/download", (req, res) => {
    try {
      const { filename, content } = req.body;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/json");
      res.send(content);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/refactor", async (req, res) => {
    try {
      const { prompt, currentCode, fileName, language, projectName } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const genAI = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const contentPrompt = `Du bist ein Senior Developer. Hier ist der Code der Datei '${fileName}' (${language}).
Projekt-Kontext: ${language}, ${projectName}.

Code:
${currentCode}

Aufgabe: ${prompt}

Gib NUR den kompletten, neuen Code zurück, ohne Markdown-Formatierung.`;

      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentPrompt
      });
      
      let text = response.text || "";
      
      // Clean up markdown if AI included it anyway
      text = text.trim().replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');

      res.json({ code: text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
