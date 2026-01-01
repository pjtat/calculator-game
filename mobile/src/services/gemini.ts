// Gemini API service for question validation
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;
const GEMINI_API_KEY = extra?.geminiApiKey;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface QuestionValidationResult {
  isValid: boolean;
  answer?: number;
  units?: string;
  errorMessage?: string;
  reasoning?: string;
}

export const validateQuestion = async (question: string): Promise<QuestionValidationResult> => {
  try {
    const prompt = `You are helping validate a trivia estimation question for a multiplayer game.

Question: "${question}"

Your task:
1. Determine if this question has a single, factual, quantifiable numeric answer.
2. If yes, provide the most accurate answer as a number.
3. Identify the units of measurement (e.g., "people", "miles", "pounds", "years", "dollars", etc.)
4. If no (subjective, time-sensitive, unknowable, or impossible to quantify), explain why.

Important guidelines:
- The answer must be a concrete number (not a range)
- The answer should be factual and verifiable
- Reject questions that are too subjective or opinion-based
- Reject questions that change frequently (e.g., "How many followers does @user have right now?")
- Accept historical facts with numeric answers (e.g., "How many people attended Woodstock?")
- For count questions without explicit units, use "items" or a contextual noun (e.g., "people", "restaurants", "countries")

Respond in JSON format:
{
  "isValid": true or false,
  "answer": <number or null>,
  "units": "<unit of measurement>",
  "reasoning": "<brief explanation>"
}

ONLY respond with the JSON object, nothing else.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Parse JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (typeof parsedResponse.isValid !== 'boolean') {
      throw new Error('Invalid response format from Gemini');
    }

    if (parsedResponse.isValid) {
      return {
        isValid: true,
        answer: parsedResponse.answer,
        units: parsedResponse.units || 'units',
        reasoning: parsedResponse.reasoning,
      };
    } else {
      return {
        isValid: false,
        errorMessage: parsedResponse.reasoning || 'Question could not be validated',
        reasoning: parsedResponse.reasoning,
      };
    }
  } catch (error) {
    console.error('Error validating question with Gemini:', error);

    // Return user-friendly error
    return {
      isValid: false,
      errorMessage: 'Unable to validate question. Please try a different question or try again.',
    };
  }
};
