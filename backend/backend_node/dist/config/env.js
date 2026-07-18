"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertRequiredEnv = assertRequiredEnv;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL', 'HF_API_KEY'];
/**
 * Fail fast on boot if production-critical env vars are missing.
 * GROQ_API_KEY is optional (chat falls back to mock agent).
 * PORT is optional (defaults to 3000 / host-provided).
 */
function assertRequiredEnv() {
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
