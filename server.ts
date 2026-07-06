import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
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
