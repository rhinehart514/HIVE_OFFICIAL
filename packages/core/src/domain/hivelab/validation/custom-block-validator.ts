import type {
  CodeValidationError,
  CodeValidationResult,
  CodeValidationWarning,
  CustomBlockCode,
} from '../custom-block.types';

const KB = 1024;
const HTML_MAX_BYTES = 50 * KB;
const CSS_MAX_BYTES = 20 * KB;
const JS_MAX_BYTES = 50 * KB;
const TOTAL_MAX_BYTES = 100 * KB;

const JS_FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; message: string; code: string }> = [
  { pattern: /\beval\s*\(/i, message: 'Use of eval() is forbidden', code: 'JS_FORBIDDEN_EVAL' },
  { pattern: /\bFunction\s*\(/, message: 'Use of Function() constructor is forbidden', code: 'JS_FORBIDDEN_FUNCTION' },
  { pattern: /\bsetTimeout\s*\(\s*['"`]/i, message: 'setTimeout() with string argument is forbidden', code: 'JS_FORBIDDEN_SETTIMEOUT_STRING' },
  { pattern: /\bsetInterval\s*\(\s*['"`]/i, message: 'setInterval() with string argument is forbidden', code: 'JS_FORBIDDEN_SETINTERVAL_STRING' },
  { pattern: /\bdocument\s*\.\s*cookie\b/i, message: 'Access to document.cookie is forbidden', code: 'JS_FORBIDDEN_COOKIE' },
  { pattern: /\blocalStorage\b/i, message: 'Access to localStorage is forbidden', code: 'JS_FORBIDDEN_LOCALSTORAGE' },
  { pattern: /\bsessionStorage\b/i, message: 'Access to sessionStorage is forbidden', code: 'JS_FORBIDDEN_SESSIONSTORAGE' },
  { pattern: /\bindexedDB\b/i, message: 'Access to indexedDB is forbidden', code: 'JS_FORBIDDEN_INDEXEDDB' },
  { pattern: /\bXMLHttpRequest\b/, message: 'Use of XMLHttpRequest is forbidden', code: 'JS_FORBIDDEN_XHR' },
  { pattern: /\bfetch\s*\(/i, message: 'Network requests via fetch() are forbidden', code: 'JS_FORBIDDEN_FETCH' },
  { pattern: /\bWebSocket\b/, message: 'Use of WebSocket is forbidden', code: 'JS_FORBIDDEN_WEBSOCKET' },
  { pattern: /\bnavigator\s*\.\s*sendBeacon\s*\(/i, message: 'Use of navigator.sendBeacon() is forbidden', code: 'JS_FORBIDDEN_BEACON' },
  { pattern: /\bwindow\s*\.\s*open\s*\(/i, message: 'Use of window.open() is forbidden', code: 'JS_FORBIDDEN_WINDOW_OPEN' },
  { pattern: /\bwindow\s*\.\s*location\b/i, message: 'Access to window.location is forbidden', code: 'JS_FORBIDDEN_WINDOW_LOCATION' },
  { pattern: /\bdocument\s*\.\s*domain\b/i, message: 'Access to document.domain is forbidden', code: 'JS_FORBIDDEN_DOCUMENT_DOMAIN' },
  { pattern: /\bimportScripts\s*\(/i, message: 'Use of importScripts() is forbidden', code: 'JS_FORBIDDEN_IMPORTSCRIPTS' },
  { pattern: /\bWorker\s*\(/, message: 'Use of Worker() is forbidden', code: 'JS_FORBIDDEN_WORKER' },
];

const HTML_FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; message: string; code: string }> = [
  {
    pattern: /<script[^>]*\ssrc\s*=/i,
    message: 'External scripts are forbidden (<script src=...)',
    code: 'HTML_FORBIDDEN_EXTERNAL_SCRIPT',
  },
  {
    pattern: /<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*href\s*=/i,
    message: 'External stylesheets are forbidden (<link rel=\"stylesheet\" href=...)',
    code: 'HTML_FORBIDDEN_EXTERNAL_STYLESHEET',
  },
  { pattern: /<iframe\b/i, message: 'Nested <iframe> elements are forbidden', code: 'HTML_FORBIDDEN_IFRAME' },
  { pattern: /<object\b/i, message: 'Use of <object> elements is forbidden', code: 'HTML_FORBIDDEN_OBJECT' },
  { pattern: /<embed\b/i, message: 'Use of <embed> elements is forbidden', code: 'HTML_FORBIDDEN_EMBED' },
  {
    pattern: /\son[a-z]+\s*=/i,
    message: 'Inline event handlers are forbidden (use addEventListener in JS)',
    code: 'HTML_FORBIDDEN_INLINE_HANDLER',
  },
];

const textEncoder = new TextEncoder();

function byteSize(value: string): number {
  return textEncoder.encode(value).length;
}

function pushSizeError(errors: CodeValidationError[], message: string, code: string): void {
  errors.push({
    type: 'size',
    message,
    code,
  });
}

export function validateCustomBlockCode(code: CustomBlockCode): CodeValidationResult {
  const errors: CodeValidationError[] = [];
  const warnings: CodeValidationWarning[] = [];

  const htmlSize = byteSize(code.html || '');
  const cssSize = byteSize(code.css || '');
  const jsSize = byteSize(code.js || '');
  const totalSize = htmlSize + cssSize + jsSize;

  if (htmlSize >= HTML_MAX_BYTES) {
    pushSizeError(errors, `HTML exceeds limit (max ${HTML_MAX_BYTES} bytes)`, 'HTML_SIZE_LIMIT_EXCEEDED');
  }

  if (cssSize >= CSS_MAX_BYTES) {
    pushSizeError(errors, `CSS exceeds limit (max ${CSS_MAX_BYTES} bytes)`, 'CSS_SIZE_LIMIT_EXCEEDED');
  }

  if (jsSize >= JS_MAX_BYTES) {
    pushSizeError(errors, `JavaScript exceeds limit (max ${JS_MAX_BYTES} bytes)`, 'JS_SIZE_LIMIT_EXCEEDED');
  }

  if (totalSize >= TOTAL_MAX_BYTES) {
    pushSizeError(errors, `Total code size exceeds limit (max ${TOTAL_MAX_BYTES} bytes)`, 'TOTAL_SIZE_LIMIT_EXCEEDED');
  }

  for (const rule of JS_FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(code.js || '')) {
      errors.push({
        type: 'security',
        message: rule.message,
        code: rule.code,
      });
    }
  }

  for (const rule of HTML_FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(code.html || '')) {
      errors.push({
        type: 'security',
        message: rule.message,
        code: rule.code,
      });
    }
  }

  if (!code.html || code.html.trim().length === 0) {
    errors.push({
      type: 'structure',
      message: 'HTML must not be empty',
      code: 'HTML_EMPTY',
    });
  }

  if (!/\bwindow\s*\.\s*HIVE\b/.test(code.js || '')) {
    warnings.push({
      type: 'best-practice',
      message: 'JavaScript does not reference window.HIVE; state and actions may not integrate with runtime',
      severity: 'medium',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      htmlSize,
      cssSize,
      jsSize,
      totalSize,
    },
  };
}
