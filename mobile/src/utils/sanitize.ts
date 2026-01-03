/**
 * Input sanitization utilities for user-generated content.
 * Prevents XSS attacks and filters inappropriate content before storing in Firebase.
 */

// Maximum allowed lengths for various inputs
export const MAX_LENGTHS = {
  nickname: 15,
  question: 500,
  units: 50,
  gameCode: 6,
};

/**
 * Remove HTML tags and script content from a string.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Remove potentially dangerous characters and patterns.
 */
export function removeInjectionPatterns(input: string): string {
  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove common SQL injection patterns
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE)\b)/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs
    .replace(/data:/gi, '')
    // Remove common XSS patterns
    .replace(/on\w+\s*=/gi, '')
    // Remove eval patterns
    .replace(/eval\s*\(/gi, '')
    // Remove constructor patterns
    .replace(/constructor\s*\(/gi, '');
}

/**
 * Normalize whitespace in a string.
 */
export function normalizeWhitespace(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize a nickname for safe storage and display.
 */
export function sanitizeNickname(nickname: string): string {
  let sanitized = nickname;

  // Strip HTML
  sanitized = stripHtml(sanitized);

  // Remove injection patterns
  sanitized = removeInjectionPatterns(sanitized);

  // Normalize whitespace
  sanitized = normalizeWhitespace(sanitized);

  // Remove non-printable characters except spaces
  sanitized = sanitized.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '');

  // Truncate to max length
  sanitized = sanitized.slice(0, MAX_LENGTHS.nickname);

  return sanitized;
}

/**
 * Sanitize a question for safe storage and API calls.
 */
export function sanitizeQuestion(question: string): string {
  let sanitized = question;

  // Strip HTML
  sanitized = stripHtml(sanitized);

  // Remove injection patterns
  sanitized = removeInjectionPatterns(sanitized);

  // Normalize whitespace (but allow single newlines for readability)
  sanitized = sanitized
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Remove non-printable characters except spaces and newlines
  sanitized = sanitized.replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, '');

  // Truncate to max length
  sanitized = sanitized.slice(0, MAX_LENGTHS.question);

  return sanitized;
}

/**
 * Sanitize units string.
 */
export function sanitizeUnits(units: string): string {
  let sanitized = units;

  // Strip HTML
  sanitized = stripHtml(sanitized);

  // Remove injection patterns
  sanitized = removeInjectionPatterns(sanitized);

  // Normalize whitespace
  sanitized = normalizeWhitespace(sanitized);

  // Only allow alphanumeric, spaces, and common unit characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-\/\.\,\$\%\°]/g, '');

  // Truncate to max length
  sanitized = sanitized.slice(0, MAX_LENGTHS.units);

  return sanitized;
}

/**
 * Validate that a string doesn't contain profanity or inappropriate content.
 * This is a basic filter - consider using a more comprehensive solution for production.
 */
const INAPPROPRIATE_PATTERNS = [
  // Add patterns as needed - keeping it minimal for this implementation
  /\b(spam|scam)\b/i,
];

export function containsInappropriateContent(input: string): boolean {
  return INAPPROPRIATE_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Full sanitization for user-submitted questions.
 */
export function sanitizeUserInput(
  input: string,
  type: 'nickname' | 'question' | 'units'
): { sanitized: string; isValid: boolean; error?: string } {
  if (!input || typeof input !== 'string') {
    return {
      sanitized: '',
      isValid: false,
      error: 'Input is required',
    };
  }

  let sanitized: string;

  switch (type) {
    case 'nickname':
      sanitized = sanitizeNickname(input);
      if (sanitized.length < 2) {
        return {
          sanitized,
          isValid: false,
          error: 'Nickname must be at least 2 characters',
        };
      }
      break;

    case 'question':
      sanitized = sanitizeQuestion(input);
      if (sanitized.length < 10) {
        return {
          sanitized,
          isValid: false,
          error: 'Question must be at least 10 characters',
        };
      }
      break;

    case 'units':
      sanitized = sanitizeUnits(input);
      break;

    default:
      sanitized = normalizeWhitespace(stripHtml(input));
  }

  if (containsInappropriateContent(sanitized)) {
    return {
      sanitized,
      isValid: false,
      error: 'Input contains inappropriate content',
    };
  }

  return {
    sanitized,
    isValid: true,
  };
}
