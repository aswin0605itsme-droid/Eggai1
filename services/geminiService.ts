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
As a poultry science expert, analyze the provided egg image based on the findings from the research paper 'High accuracy gender determination using the egg shape index'.

The paper indicates a strong correlation between egg shape and chick gender:
- **Female:** Associated with a high shape index, meaning the egg is more oval or rounded.
- **Male:** Associated with a low shape index, meaning the egg is more pointed or elongated.

Based on the visual shape of the egg in the image, please predict the gender of the chick. Provide your analysis in a JSON format with the following structure:
{
  "predictedGender": "Male" | "Female" | "Uncertain",
  "confidence": "High" | "Medium" | "Low",
  "reasoning": "A brief explanation for your prediction based on the egg's shape."
}

If the image is not a clear view of a single egg, or if the shape is ambiguous, return "Uncertain" with an explanatory comment.
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
As a poultry science expert, analyze the provided egg measurements based on the findings from the research paper 'High accuracy gender determination using the egg shape index'.

The paper indicates a strong correlation between egg shape and chick gender:
- **Female:** Associated with a high shape index (e.g., > 74), meaning the egg is more oval or rounded.
- **Male:** Associated with a low shape index (e.g., < 74), meaning the egg is more pointed or elongated.

The provided measurements are:
- Long Axis (Length): ${length.toFixed(2)} mm
- Short Axis (Width): ${width.toFixed(2)} mm
- Weight: ${weight.toFixed(2)} g
- Calculated Shape Index: ${shapeIndex.toFixed(2)}

Based on these measurements, please predict the gender of the chick. Egg weight can also be a factor, with some studies suggesting a slight correlation. Consider all factors in your analysis.

Provide your analysis in a JSON format with the following structure:
{
  "predictedGender": "Male" | "Female" | "Uncertain",
  "confidence": "High" | "Medium" | "Low",
  "reasoning": "A brief explanation for your prediction based on the shape index and weight."
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
