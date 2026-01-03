import {
  stripHtml,
  removeInjectionPatterns,
  normalizeWhitespace,
  sanitizeNickname,
  sanitizeQuestion,
  sanitizeUnits,
  containsInappropriateContent,
  sanitizeUserInput,
  MAX_LENGTHS,
} from '../../utils/sanitize';

describe('sanitize utilities', () => {
  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      expect(stripHtml('<script>alert("xss")</script>')).toBe('');
      expect(stripHtml('<b>bold</b>')).toBe('bold');
      expect(stripHtml('<div><p>nested</p></div>')).toBe('nested');
    });

    it('decodes HTML entities', () => {
      expect(stripHtml('&lt;tag&gt;')).toBe('<tag>');
      expect(stripHtml('&amp;')).toBe('&');
      expect(stripHtml('&quot;quoted&quot;')).toBe('"quoted"');
    });

    it('handles empty and normal strings', () => {
      expect(stripHtml('')).toBe('');
      expect(stripHtml('normal text')).toBe('normal text');
    });
  });

  describe('removeInjectionPatterns', () => {
    it('removes SQL injection patterns', () => {
      expect(removeInjectionPatterns('SELECT * FROM users')).not.toContain('SELECT');
      expect(removeInjectionPatterns('DROP TABLE users')).not.toContain('DROP');
    });

    it('removes JavaScript patterns', () => {
      expect(removeInjectionPatterns('javascript:alert(1)')).not.toContain('javascript:');
      expect(removeInjectionPatterns('onclick=alert(1)')).not.toContain('onclick=');
    });

    it('removes null bytes', () => {
      expect(removeInjectionPatterns('hello\0world')).toBe('helloworld');
    });
  });

  describe('normalizeWhitespace', () => {
    it('collapses multiple spaces', () => {
      expect(normalizeWhitespace('hello    world')).toBe('hello world');
    });

    it('trims leading and trailing whitespace', () => {
      expect(normalizeWhitespace('  hello  ')).toBe('hello');
    });

    it('handles tabs and newlines', () => {
      expect(normalizeWhitespace('hello\t\nworld')).toBe('hello world');
    });
  });

  describe('sanitizeNickname', () => {
    it('sanitizes valid nicknames', () => {
      expect(sanitizeNickname('John')).toBe('John');
      expect(sanitizeNickname('Player123')).toBe('Player123');
    });

    it('removes HTML and scripts', () => {
      expect(sanitizeNickname('<script>bad</script>John')).toBe('John');
    });

    it('truncates to max length', () => {
      const longName = 'A'.repeat(50);
      expect(sanitizeNickname(longName).length).toBe(MAX_LENGTHS.nickname);
    });

    it('normalizes whitespace', () => {
      expect(sanitizeNickname('  John   Doe  ')).toBe('John Doe');
    });
  });

  describe('sanitizeQuestion', () => {
    it('sanitizes valid questions', () => {
      const question = 'How many people live in NYC?';
      expect(sanitizeQuestion(question)).toBe(question);
    });

    it('removes HTML', () => {
      expect(sanitizeQuestion('<b>How</b> many?')).toBe('How many?');
    });

    it('truncates to max length', () => {
      const longQuestion = 'A'.repeat(1000);
      expect(sanitizeQuestion(longQuestion).length).toBe(MAX_LENGTHS.question);
    });

    it('preserves single newlines', () => {
      expect(sanitizeQuestion('Line 1\nLine 2')).toBe('Line 1\nLine 2');
    });

    it('collapses multiple newlines', () => {
      expect(sanitizeQuestion('Line 1\n\n\n\nLine 2')).toBe('Line 1\n\nLine 2');
    });
  });

  describe('sanitizeUnits', () => {
    it('sanitizes valid units', () => {
      expect(sanitizeUnits('miles')).toBe('miles');
      expect(sanitizeUnits('dollars')).toBe('dollars');
      expect(sanitizeUnits('sq ft')).toBe('sq ft');
    });

    it('allows common unit characters', () => {
      expect(sanitizeUnits('$/hr')).toBe('$/hr');
      expect(sanitizeUnits('50%')).toBe('50%');
      expect(sanitizeUnits('°F')).toBe('°F');
    });

    it('removes invalid characters', () => {
      expect(sanitizeUnits('units<script>')).toBe('unitsscript');
    });
  });

  describe('containsInappropriateContent', () => {
    it('detects inappropriate patterns', () => {
      expect(containsInappropriateContent('this is spam')).toBe(true);
      expect(containsInappropriateContent('total scam')).toBe(true);
    });

    it('allows normal content', () => {
      expect(containsInappropriateContent('How many restaurants?')).toBe(false);
    });
  });

  describe('sanitizeUserInput', () => {
    it('validates nicknames correctly', () => {
      const result = sanitizeUserInput('John', 'nickname');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('John');
    });

    it('rejects short nicknames', () => {
      const result = sanitizeUserInput('J', 'nickname');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 2');
    });

    it('validates questions correctly', () => {
      const result = sanitizeUserInput('How many people live in NYC?', 'question');
      expect(result.isValid).toBe(true);
    });

    it('rejects short questions', () => {
      const result = sanitizeUserInput('How many?', 'question');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 10');
    });

    it('rejects empty input', () => {
      const result = sanitizeUserInput('', 'nickname');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });
  });
});
