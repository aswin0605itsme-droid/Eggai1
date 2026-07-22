import { GoogleGenAI, Type } from "@google/genai";
import type { GenderPredictionResult, GroundingSource } from '../types';

const getGenAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is not set. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const dataUriToGenerativePart = (uri: string) => {
    const [meta, data] = uri.split(',');
    const mimeType = meta.split(':')[1].split(';')[0];
    return {
        inlineData: {
            data,
            mimeType,
        },
    };
};

const imagePrompt = `
As a poultry science expert, analyze the provided egg image to predict the chick's gender with high precision.

**Analysis Criteria:**
1.  **Shape Index (Visual Estimation):**
    *   **Female:** Look for a high shape index. The egg should appear significantly oval, rounded, or "blunt" on both ends.
    *   **Male:** Look for a low shape index. The egg should appear elongated, pointed, or have a distinct "sharp" end.
2.  **Symmetry:**
    *   Male eggs often show more asymmetry (one end much more pointed than the other).
    *   Female eggs are often more symmetrical and uniform.

**Instructions:**
*   Analyze the contour of the egg carefully.
*   If the image contains multiple eggs, focus on the most prominent one or return "Uncertain" if it's too cluttered.
*   If the image is blurry, dark, or the egg is obscured, return "Uncertain".

**Output Format:**
Provide your analysis in a JSON format with the following structure:
{
  "predictedGender": "Male" | "Female" | "Uncertain",
  "confidence": "High" | "Medium" | "Low",
  "reasoning": "A detailed explanation citing specific visual features (e.g., 'pointed tip', 'rounded symmetry') that led to the conclusion."
}
`;

export const predictEggGender = async (imageData: string): Promise<GenderPredictionResult> => {
    const ai = getGenAI();
    if (!ai) {
        return {
            predictedGender: 'Uncertain',
            confidence: 'Low',
            reasoning: 'API Key is missing. Please configure VITE_GEMINI_API_KEY in your environment variables.'
        };
    }

    try {
        const imagePart = dataUriToGenerativePart(imageData);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: imagePrompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        predictedGender: { type: Type.STRING },
                        confidence: { type: Type.STRING },
                        reasoning: { type: Type.STRING },
                    },
                    required: ["predictedGender", "confidence", "reasoning"],
                },
            },
        });
        
        const text = response.text.trim();
        const result = JSON.parse(text);
        return result as GenderPredictionResult;
    } catch (error) {
        console.error("Error predicting egg gender:", error);
        return {
            predictedGender: 'Uncertain',
            confidence: 'Low',
            reasoning: 'An error occurred during analysis. Please try again with a clearer image.'
        };
    }
};

export const predictEggGenderFromMeasurements = async (length: number, width: number, weight: number): Promise<GenderPredictionResult> => {
    const ai = getGenAI();
    if (!ai) {
        return {
            predictedGender: 'Uncertain',
            confidence: 'Low',
            reasoning: 'API Key is missing. Please configure VITE_GEMINI_API_KEY in your environment variables.'
        };
    }

    const shapeIndex = (width / length) * 100;
    const measurementPrompt = `
As a poultry science expert, analyze the provided egg measurements to predict the chick's gender.

**Scientific Basis:**
*   **Shape Index (SI = Width/Length * 100):**
    *   **SI < 72:** Strongly indicates **Male** (Elongated/Pointed).
    *   **SI > 76:** Strongly indicates **Female** (Round/Oval).
    *   **SI 72-76:** Transition zone. Look at weight as a secondary factor.
*   **Weight:**
    *   Heavier eggs in a batch *can* sometimes skew male, but this is breed-dependent and less reliable than shape. Use this only to tip the scale in the transition zone.

**Data:**
*   Long Axis (Length): ${length.toFixed(2)} mm
*   Short Axis (Width): ${width.toFixed(2)} mm
*   Weight: ${weight.toFixed(2)} g
*   Calculated Shape Index: ${shapeIndex.toFixed(2)}

**Output Format:**
Provide your analysis in a JSON format with the following structure:
{
  "predictedGender": "Male" | "Female" | "Uncertain",
  "confidence": "High" | "Medium" | "Low",
  "reasoning": "Explain the decision based on the Shape Index threshold and how weight influenced the outcome."
}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: measurementPrompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        predictedGender: { type: Type.STRING },
                        confidence: { type: Type.STRING },
                        reasoning: { type: Type.STRING },
                    },
                    required: ["predictedGender", "confidence", "reasoning"],
                },
            },
        });
        
        const text = response.text.trim();
        const result = JSON.parse(text);
        return result as GenderPredictionResult;
    } catch (error) {
        console.error("Error predicting egg gender from measurements:", error);
        return {
            predictedGender: 'Uncertain',
            confidence: 'Low',
            reasoning: 'An error occurred during analysis. Please try again.'
        };
    }
};

export const getGroundedAnswer = async (query: string): Promise<{ text: string, sources: GroundingSource[] }> => {
    const ai = getGenAI();
    if (!ai) {
        return {
            text: "API Key is missing. Please configure VITE_GEMINI_API_KEY.",
            sources: []
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const text = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        return { text, sources };
    } catch (error) {
        console.error("Error with grounded search:", error);
        return {
            text: "Sorry, I encountered an error while searching for an answer. Please try again.",
            sources: []
        };
    }
};
