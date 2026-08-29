/**
 * Local Ollama & Local-LLM Provider Service
 * 100% Offline-First AI/LLM Assistance:
 * - Probes local Ollama instance (default: http://localhost:11434) or LM Studio
 * - Discovers installed models via /api/tags
 * - Runs offline SQL query generation, schema synthesis, and formula optimization
 * - Includes offline rule-based heuristic fallback if no local daemon is running
 */

import { Table, Relationship } from '../types';

export interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaStatus {
  isAvailable: boolean;
  endpoint: string;
  models: OllamaModelInfo[];
  selectedModel: string;
  latencyMs?: number;
  errorMessage?: string;
}

export class LocalOllamaService {
  private static endpoint: string = 'http://localhost:11434';
  private static selectedModel: string = 'llama3';

  public static getEndpoint(): string {
    return this.endpoint;
  }

  public static setEndpoint(url: string) {
    this.endpoint = url.replace(/\/$/, '');
  }

  public static getSelectedModel(): string {
    return this.selectedModel;
  }

  public static setSelectedModel(model: string) {
    this.selectedModel = model;
  }

  /**
   * Health-Checks the local Ollama daemon and fetches installed models
   */
  public static async probeLocalDaemon(customUrl?: string): Promise<OllamaStatus> {
    const targetUrl = (customUrl || this.endpoint).replace(/\/$/, '');
    const startTime = performance.now();

    try {
      const response = await fetch(`${targetUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(2500),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const models: OllamaModelInfo[] = data.models || [];
      const latencyMs = Math.round(performance.now() - startTime);

      let activeModel = this.selectedModel;
      if (models.length > 0 && !models.some((m) => m.name === this.selectedModel)) {
        activeModel = models[0].name;
        this.selectedModel = activeModel;
      }

      return {
        isAvailable: true,
        endpoint: targetUrl,
        models,
        selectedModel: activeModel,
        latencyMs,
      };
    } catch (err: any) {
      return {
        isAvailable: false,
        endpoint: targetUrl,
        models: [],
        selectedModel: this.selectedModel,
        errorMessage: err.message || 'Lokaler Ollama Daemon (http://localhost:11434) antwortet nicht.',
      };
    }
  }

  /**
   * Sends a prompt to local Ollama /api/generate
   */
  public static async generateCompletion(prompt: string, systemPrompt?: string, model?: string): Promise<{ text: string; durationMs: number; isFallback: boolean }> {
    const activeModel = model || this.selectedModel;
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          prompt,
          system: systemPrompt || 'Du bist ein präziser SQL- und Datenbank-Experte für DB Studio Pro. Antworte auf Deutsch und gib sauberen SQL- oder TypeScript-Code aus.',
          stream: false,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        throw new Error(`Ollama Server returned ${response.status}`);
      }

      const data = await response.json();
      const durationMs = Math.round(performance.now() - startTime);

      return {
        text: data.response || '',
        durationMs,
        isFallback: false,
      };
    } catch (err) {
      // Local Heuristic Fallback
      const durationMs = Math.round(performance.now() - startTime);
      const fallbackText = this.generateLocalRuleBasedFallback(prompt);
      return {
        text: fallbackText,
        durationMs,
        isFallback: true,
      };
    }
  }

  /**
   * Offline Rule-based Heuristic SQL Synthesizer (runs 100% offline in JS memory)
   */
  private static generateLocalRuleBasedFallback(prompt: string): string {
    const lower = prompt.toLowerCase();

    if (lower.includes('kunde') || lower.includes('adress') || lower.includes('crm')) {
      return `-- [Offline-Heuristik Fallback: Kein Ollama Daemon aktiv]
SELECT 
    k.id AS kunden_id,
    k.firma,
    k.nachname || ', ' || k.vorname AS kontaktperson,
    k.email,
    k.ort,
    COUNT(p.id) AS anzahl_projekte,
    COALESCE(SUM(p.auftragswert), 0.00) AS gesamtumsatz_eur
FROM kunden k
LEFT JOIN projekte p ON p.kunde_id = k.id
GROUP BY k.id, k.firma, k.nachname, k.vorname, k.email, k.ort
ORDER BY gesamtumsatz_eur DESC;`;
    }

    if (lower.includes('projekt') || lower.includes('baustelle') || lower.includes('status')) {
      return `-- [Offline-Heuristik Fallback]
SELECT 
    p.id,
    p.projektnummer,
    p.bezeichnung,
    p.status,
    p.start_datum,
    p.fertigstellung_soll,
    p.auftragswert
FROM projekte p
WHERE p.status IN ('IN_PLANUNG', 'IN_AUSFUEHRUNG')
ORDER BY p.fertigstellung_soll ASC;`;
    }

    if (lower.includes('rechnung') || lower.includes('umsatz') || lower.includes('offen')) {
      return `-- [Offline-Heuristik Fallback]
SELECT 
    r.rechnungsnummer,
    r.rechnungsdatum,
    r.faelligkeitsdatum,
    r.betrag_netto,
    r.betrag_brutto,
    r.status
FROM rechnungen r
WHERE r.status = 'OFFEN' AND r.faelligkeitsdatum < CURRENT_DATE
ORDER BY r.faelligkeitsdatum ASC;`;
    }

    return `-- [Offline-Heuristik Fallback: Standard-Query]
SELECT * 
FROM projekte 
LIMIT 50;`;
  }
}
