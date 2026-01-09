// Gemini API service for question validation
import Constants from 'expo-constants';
import { isYearAnswer } from '../utils/formatting';

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

export interface TriviaQuestionResult {
  success: boolean;
  question?: string;
  answer?: number;
  units?: string;
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
      // Normalize units for year-type answers
      let units = parsedResponse.units || 'units';
      const answer = parsedResponse.answer;

      // If this is a year question, always use singular 'year' as units
      if (isYearAnswer(question, answer)) {
        units = 'year';
      }

      return {
        isValid: true,
        answer: answer,
        units: units,
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

// Humor styles for variety in snarky comments
const COMMENT_STYLES = [
  { name: 'comparison', instruction: 'Make a comparison to something absurd or unexpected' },
  { name: 'rhetorical', instruction: 'Ask a rhetorical question about the guess' },
  { name: 'historical', instruction: 'Reference what was actually happening at that time/number' },
  { name: 'exaggeration', instruction: 'Use playful exaggeration about how off the guess was' },
  { name: 'pop-culture', instruction: 'Make a pop culture, movie, or TV reference' },
  { name: 'deadpan', instruction: 'Use dry, deadpan humor with a straight-faced delivery' },
];

// Format styles that vary HOW the comment is delivered (not just what it says)
const FORMAT_STYLES = [
  { name: 'standard', instruction: 'Write a normal witty sentence with 1-2 emojis', weight: 40 },
  { name: 'sarcasm', instruction: 'Use heavy sarcasm. Examples: "Oh sure, that makes total sense 🙄", "Wow, so close! (not)", "Yeah no that\'s definitely right 😏"', weight: 10 },
  { name: 'all-caps-chaos', instruction: 'Write in ALL CAPS with chaotic energy. Short phrases like "EXCUSE ME??" or "SIR THIS IS A WENDY\'S" or "I CANNOT 💀"', weight: 10 },
  { name: 'casual-buddy', instruction: 'Write like you\'re roasting a friend. Use "bud", "chief", "my guy", "bestie", etc. Example: "I don\'t know about that one, chief 😬"', weight: 15 },
  { name: 'stunned-silence', instruction: 'Express being speechless. Like "..." or "I- ...what? 🫠" or "No thoughts. Just pain. 💀"', weight: 5 },
  { name: 'internet-speak', instruction: 'Use internet/meme language. Things like "bestie no 😭", "the math ain\'t mathing", "sir/ma\'am please", "crying screaming throwing up"', weight: 20 },
];

const getRandomFormatStyle = () => {
  const totalWeight = FORMAT_STYLES.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const style of FORMAT_STYLES) {
    random -= style.weight;
    if (random <= 0) return style;
  }
  return FORMAT_STYLES[0];
};

const getRandomCommentStyle = () => {
  return COMMENT_STYLES[Math.floor(Math.random() * COMMENT_STYLES.length)];
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
    // Detect if this is a year/date question
    const isYearQuestion = isYearAnswer(questionText, correctAnswer);

    const errorPercent = Math.abs((worstGuess - correctAnswer) / correctAnswer) * 100;
    const yearDiff = Math.abs(worstGuess - correctAnswer);

    // Build error description based on question type
    let errorDescription: string;
    let snarkGuidelines: string;

    if (isYearQuestion) {
      errorDescription = `Error: ${yearDiff} years off`;
      snarkGuidelines = `IMPORTANT - Scale your reaction based on how many years off the guess is:
- If off by <10 years: Be gentle and encouraging. "Pretty close!" or "Almost had it!"
- If off by 10-30 years: Mild teasing, light-hearted. "Not quite, but decent try!"
- If off by 30-75 years: Moderate snark, point out the gap playfully
- If off by >75 years: Full snark mode! Be hilariously sassy about how far off it was`;
    } else {
      errorDescription = `Error: ${errorPercent.toFixed(0)}% off`;
      snarkGuidelines = `IMPORTANT - Scale your reaction based on how bad the guess is:
- If error is <20%: Be gentle and encouraging, barely snarky at all. "Pretty close!" or "Almost had it!"
- If error is 20-50%: Mild teasing, light-hearted. "Not quite, but decent try!"
- If error is 50-100%: Moderate snark, point out the gap playfully
- If error is >100%: Full snark mode! Be hilariously sassy about how far off it was`;
    }

    // Select random styles for this comment
    const commentStyle = getRandomCommentStyle();
    const formatStyle = getRandomFormatStyle();

    const prompt = `You are a witty game show host commenting on a guess.

Question: "${questionText}"
Correct Answer: ${correctAnswer} ${units || ''}
Worst Guess: ${worstGuess} ${units || ''}
${errorDescription}

${snarkGuidelines}

HUMOR APPROACH: ${commentStyle.instruction}
FORMAT STYLE: ${formatStyle.instruction}

Rules:
- Keep it playful, never mean or hurtful
- Max 120 characters
- Don't mention the player's name
- IMPORTANT: Follow the FORMAT STYLE strictly - it defines the structure of your response

Examples showing FORMAT variety:
Standard: "That would put Everest in outer space! 🚀"
Standard: "Even Doc Brown couldn't go that far back! 🚗⚡"
Sarcasm: "Oh sure, that makes total sense 🙄"
Sarcasm: "Wow, so close! ...not even a little bit 😏"
All-caps: "EXCUSE ME?? 💀"
All-caps: "I CANNOT WITH THIS GUESS 😭"
Casual-buddy: "I don't know about that one, chief 😬"
Casual-buddy: "My guy... no 🫠"
Stunned: "I- ...what?"
Stunned: "No thoughts. Just pain. 💀"
Internet-speak: "bestie the math ain't mathing 😭"
Internet-speak: "crying screaming throwing up rn"

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
          temperature: 0.85,
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

export const generateTriviaQuestion = async (
  previousQuestions: string[] = []
): Promise<TriviaQuestionResult> => {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      errorMessage: 'Trivia generation not available right now',
    };
  }

  try {
    const avoidList = previousQuestions.length > 0
      ? `\n\nAVOID these topics (already asked):\n${previousQuestions.map(q => `- ${q}`).join('\n')}`
      : '';

    const prompt = `Generate a trivia question for a party estimation game. The question must have a specific, verifiable numeric answer.

Good question types:
- Population of cities/countries
- Heights/lengths of landmarks or natural features
- Distances between places
- Counts of things (restaurants, countries, species, etc.)
- Historical dates or durations
- Sports statistics
- Geographic facts
- Scientific measurements

Requirements:
1. The answer must be a single number (not a range)
2. The question should be fun and interesting
3. Most people won't know the exact answer but can make educated guesses
4. Avoid questions that are too obscure
5. Include clear units in the answer${avoidList}

Respond in JSON format:
{
  "question": "<the trivia question>",
  "answer": <numeric answer>,
  "units": "<unit of measurement like 'feet', 'people', 'miles', etc.>"
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
          temperature: 0.9,
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

    const parsedResponse = JSON.parse(jsonMatch[0]);

    if (!parsedResponse.question || parsedResponse.answer === undefined) {
      throw new Error('Invalid response format');
    }

    // Normalize units for year-type answers
    let units = parsedResponse.units || 'units';
    const answer = parsedResponse.answer;
    const question = parsedResponse.question;

    // If this is a year question, always use singular 'year' as units
    if (isYearAnswer(question, answer)) {
      units = 'year';
    }

    return {
      success: true,
      question: parsedResponse.question,
      answer: answer,
      units: units,
    };
  } catch (error) {
    console.error('Error generating trivia question:', error);
    return {
      success: false,
      errorMessage: 'Unable to generate trivia question',
    };
  }
};
