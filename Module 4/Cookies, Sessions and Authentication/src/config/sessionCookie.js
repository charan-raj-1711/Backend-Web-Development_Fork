const COOKIE_NAME = 'sid';

const ttlMs = Number(process.env.SESSION_TTL_MS || 3600000);
if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
  throw new Error('SESSION_TTL_MS must be a positive integer');
}

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && process.env.COOKIE_SECURE !== 'true') {
  throw new Error('COOKIE_SECURE=true is required in production; serve the API over HTTPS');
}
const secure = isProduction || process.env.COOKIE_SECURE === 'true';

const cookieOptions = Object.freeze({
  httpOnly: true,
  sameSite: 'lax',
  secure,
  path: '/',
  maxAge: ttlMs,
});

const clearCookieOptions = Object.freeze({
  httpOnly: true,
  sameSite: 'lax',
  secure,
  path: '/',
});

module.exports = { COOKIE_NAME, ttlMs, cookieOptions, clearCookieOptions };
