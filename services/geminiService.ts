import { GoogleGenAI, Type } from "@google/genai";
import { Table } from "../types/index";

// FIX: Initialize GoogleGenAI client with a named apiKey parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTableSchema = async (description: string): Promise<any> => {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Erstelle ein JSON-Schema für eine Datenbanktabelle basierend auf dieser Beschreibung: "${description}". 
      Gib ein Objekt zurück mit 'tableName' (string) und 'fields' (Array von Objekten mit 'name' und 'type' [INTEGER, VARCHAR, TEXT, DATE, BOOLEAN]).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tableName: { type: Type.STRING },
            fields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    
    // FIX: Access the text content from the response using the .text property instead of calling a method.
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generateSqlExplanation = async (tables: Table[], queryGoal: string): Promise<string> => {
  if (!process.env.API_KEY) return "API Key missing.";

  const schemaContext = tables.map(t => `${t.name}(${t.fields.map(f => f.name).join(', ')})`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Hier ist das Datenbankschema:\n${schemaContext}\n\nErstelle eine SQL-Abfrage für folgendes Ziel: "${queryGoal}". Gib nur den SQL-Code und eine kurze Erklärung auf Deutsch zurück.`
    });
    // FIX: Access the text content from the response using the .text property instead of calling a method.
    return response.text || "Keine Antwort erhalten.";
  } catch (error) {
    console.error(error);
    return "Fehler bei der Anfrage.";
  }
};