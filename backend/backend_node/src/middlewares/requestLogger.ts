import { Request, Response, NextFunction } from 'express';

const SENSITIVE_KEYS = new Set(['password', 'token', 'authorization', 'jwt', 'secret', 'apiKey', 'apikey']);

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value !== 'object') return value;

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = redact(val);
    }
  }
  return out;
}

/**
 * Logs every incoming request and its response (status + duration).
 * Place after express.json() so req.body is available.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const started = Date.now();
  const { method, originalUrl, query, ip } = req;
  const origin = req.get('origin') || '-';
  const userAgent = req.get('user-agent') || '-';
  const hasAuth = Boolean(req.get('authorization'));
  const body =
    req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0
      ? redact(req.body)
      : undefined;

  console.log('\n──────── request ────────');
  console.log(`[${new Date().toISOString()}] → ${method} ${originalUrl}`);
  console.log(`  ip: ${ip}  origin: ${origin}`);
  console.log(`  auth: ${hasAuth ? 'Bearer present' : 'none'}`);
  if (Object.keys(query).length > 0) {
    console.log(`  query:`, query);
  }
  if (body !== undefined) {
    console.log(`  body:`, body);
  }
  console.log(`  ua: ${userAgent}`);

  res.on('finish', () => {
    const ms = Date.now() - started;
    const level = res.statusCode >= 500 ? 'ERR' : res.statusCode >= 400 ? 'WARN' : 'OK';
    console.log(
      `[${new Date().toISOString()}] ← ${level} ${method} ${originalUrl} → ${res.statusCode} (${ms}ms)`
    );
    console.log('──────── response ───────\n');
  });

  next();
};
