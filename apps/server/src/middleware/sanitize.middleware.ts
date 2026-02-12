import type { Request, Response, NextFunction } from 'express';

/** Strip control characters (except newline, tab) */
function stripControlChars(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');
}

/** Normalize excessive whitespace */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Encode XML-like tags to prevent prompt injection via tag manipulation */
function encodeXmlTags(text: string): string {
  return text
    .replace(/</g, '＜')
    .replace(/>/g, '＞');
}

/** Remove zero-width and invisible Unicode characters */
function stripInvisibleUnicode(text: string): string {
  return text.replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g, '');
}

/** Full sanitization pipeline */
export function sanitizeText(text: string): string {
  return encodeXmlTags(
    normalizeWhitespace(
      stripControlChars(
        stripInvisibleUnicode(
          text.normalize('NFKC')
        )
      )
    )
  );
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body?.message && typeof req.body.message === 'string') {
    req.body.message = sanitizeText(req.body.message);
  }
  next();
}
