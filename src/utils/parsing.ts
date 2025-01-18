import { Position, MearthActionResponse } from "../types";
import { mearthJsonBlockPattern } from "../templates";

/**
 * Parses a Mearth action response from text input with improved error handling
 * and validation.
 *
 * @param text - The input text to parse for Mearth actions
 * @returns Parsed MearthActionResponse object or null if parsing fails
 */
export function parseMearthActionFromText(
  text: string
): { action: MearthActionResponse } | null {
  try {
    const jsonData = extractJsonFromText(text);
    if (!jsonData) return null;

    // Validate required fields according to MearthActionResponse type
    if (!jsonData.user || !jsonData.text || !jsonData.action) {
      return null;
    }

    const action: MearthActionResponse = {
      user: jsonData.user,
      text: jsonData.text,
      action: jsonData.action,
    };

    return { action };
  } catch (error) {
    console.error("Error parsing Mearth action:", error);
    return null;
  }
}

// Helper functions for extracting JSON from text
function extractJsonFromText(text: string): any {
  const jsonBlockMatch = text.match(mearthJsonBlockPattern);
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1]);
  }
  const objectPattern = /{[\s\S]*?}/;
  const objectMatch = text.match(objectPattern);
  return objectMatch ? JSON.parse(objectMatch[0]) : null;
}

/**
 * Parses position with validation
 */
export function parsePosition(text: string): Position | null {
  try {
    const pos = JSON.parse(text);
    if (
      typeof pos.x === "number" &&
      typeof pos.y === "number" &&
      Number.isFinite(pos.x) &&
      Number.isFinite(pos.y)
    ) {
      return `${pos.x},${pos.y}`;
    }
  } catch (e) {
    console.error("Error parsing position:", e);
  }
  return null;
}

export function parseActionFromText(text: string): MearthActionResponse | null {
  const jsonData = extractJsonFromText(text);
  if (!jsonData) return null;
  return jsonData;
}
