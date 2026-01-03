// Gemini API service for question validation
import Constants from 'expo-constants';

// Gemini API key from app.config.ts extra (populated via environment variables)
const extra = Constants.expoConfig?.extra;
const GEMINI_API_KEY = extra?.geminiApiKey ?? '';

if (!GEMINI_API_KEY) {
  console.warn('Missing GEMINI_API_KEY environment variable.');
}
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface QuestionValidationResult {
  isValid: boolean;
  answer?: number;
  units?: string;
  errorMessage?: string;
  reasoning?: string;
  isApiError?: boolean;
}

export interface UnitConversionResult {
  success: boolean;
  answer?: number;
  units?: string;
  errorMessage?: string;
}

export interface SnarkyRemarkResult {
  success: boolean;
  remark?: string;
  errorMessage?: string;
}

export const validateQuestion = async (question: string): Promise<QuestionValidationResult> => {
  console.log('validateQuestion called with:', { question });
  console.log('API Key present:', !!GEMINI_API_KEY, 'Key length:', GEMINI_API_KEY.length);

  if (!GEMINI_API_KEY) {
    console.error('No Gemini API key configured');
    return {
      isValid: false,
      errorMessage: 'Automatic answers not available right now',
      isApiError: true,
    };
  }

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
- This is a casual party game - approximate answers using the most recent reliable data are perfectly acceptable
- Accept questions about populations, prices, statistics, etc. using the latest available figures
- Only reject questions that are truly opinion-based or completely unknowable
- Reject questions about real-time data that changes by the minute (e.g., "How many followers does @user have right now?")
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
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API error response:', errorBody);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));

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

    // Return API error flag so UI can show fallback
    return {
      isValid: false,
      errorMessage: 'Automatic answers not available right now',
      isApiError: true,
    };
  }
};

export const convertUnits = async (
  question: string,
  currentAnswer: number,
  currentUnits: string,
  targetUnits: string
): Promise<UnitConversionResult> => {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      errorMessage: 'Unit conversion not available right now',
    };
  }

  try {
    const prompt = `You are helping convert units for a trivia game answer.

Original question: "${question}"
Current answer: ${currentAnswer} ${currentUnits}
Target units: ${targetUnits}

Your task:
1. Convert the answer to the target units if possible
2. Return the converted numeric value
3. Return the exact units string provided by the user

Important guidelines:
- Only convert if the units are compatible (e.g., feet to meters, but not feet to pounds)
- Use standard conversion factors
- Round to a reasonable precision for a trivia game
- If the conversion is not possible, explain why

Respond in JSON format:
{
  "success": true or false,
  "answer": <converted number or null>,
  "units": "<target unit string>",
  "errorMessage": "<explanation if conversion failed, null otherwise>"
}

ONLY respond with the JSON object, nothing else.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error converting units with Gemini:', error);
    return {
      success: false,
      errorMessage: 'Unable to convert units',
    };
  }
};

export const generateSnarkyRemark = async (
  questionText: string,
  correctAnswer: number,
  worstGuess: number,
  units?: string
): Promise<SnarkyRemarkResult> => {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      errorMessage: 'Snarky remarks not available right now',
    };
  }

  try {
    const prompt = `You are a hilariously snarky game show host reacting to an absurdly bad guess with playful sass.

Question: "${questionText}"
Correct Answer: ${correctAnswer} ${units || ''}
Worst Guess: ${worstGuess} ${units || ''}

Generate a witty, sassy remark that contextualizes how ridiculously far off the worst guess was. Use comparisons to well-known facts or familiar quantities, and add expressive interjections and emojis for extra flair.

Rules:
- Keep it playfully snarky and fun, not mean or hurtful
- One sentence only (max 120 characters)
- Start with an interjection like "Yikes...", "Oof...", "Wow...", "Sheesh..."
- Include 1-2 relevant emojis (use actual emoji characters like 😬, 👀, 💀, 🤯, 😳)
- Use specific comparisons when possible
- Don't mention the player's name
- Focus on the magnitude of the error with sass

Examples:
- "Yikes... that's almost the entire population of the United States! 😬"
- "Oof... that's enough to circle the Earth 3 times! 🌍💀"
- "Wow... you could buy a small island with that much! 🏝️👀"
- "Sheesh... that's more people than live in all of Canada! 🤯"

Respond in JSON format:
{
  "remark": "<the snarky comment>"
}

ONLY respond with the JSON object, nothing else.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      remark: parsedResponse.remark || null,
    };
  } catch (error) {
    console.error('Error generating snarky remark with Gemini:', error);
    return {
      success: false,
      errorMessage: 'Unable to generate snarky remark',
    };
  }
};
