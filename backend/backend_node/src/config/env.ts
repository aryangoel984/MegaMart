import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL', 'HF_API_KEY'] as const;

/**
 * Fail fast on boot if production-critical env vars are missing.
 * GROQ_API_KEY is optional (chat falls back to mock agent).
 * PORT is optional (defaults to 3000 / host-provided).
 */
export function assertRequiredEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('Set them in your local .env or in your host dashboard (Render/Railway/Vercel).');
    process.exit(1);
  }

  console.log('✅ Required env vars loaded (DATABASE_URL, JWT_SECRET, FRONTEND_URL, HF_API_KEY)');
  if (!process.env.GROQ_API_KEY?.trim()) {
    console.log('ℹ️  GROQ_API_KEY not set — chat will use the mock agent');
  }
}
