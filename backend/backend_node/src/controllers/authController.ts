import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const GUEST_SESSION_MS = 24 * 60 * 60 * 1000;

const signToken = (userId: number, email: string): string | null => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;
  return jwt.sign({ userId, email }, jwtSecret, { expiresIn: '1h' });
};

const registerSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  name: z.string().trim().min(1).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must include a letter')
    .regex(/[0-9]/, 'Password must include a number'),
});

// 1. Register logic
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ message: parsed.error.issues[0]?.message || 'Invalid registration details' });
      return;
    }
    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // 409 Conflict, not 400 — the request itself was well-formed, it
      // just conflicts with existing state.
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }

    // Hash the password (Security Best Practice)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to DB
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

// 2. Login logic
export const login = async (req: Request, res: Response): Promise<void> => {
  try{
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(422).json({ message: 'Email and password are required' });
      return;
    }
    // Find User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Same generic message as a wrong password, so login never reveals
      // whether an email is registered.
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const token = signToken(user.id, user.email);
    if (!token) {
      res.status(500).json({ message: 'Server misconfigured: JWT_SECRET is missing' });
      return;
    }
    res.json({ token, userId: user.id, name: user.name, isGuest: user.isGuest });

  } catch(error){
        res.status(500).json({ message: 'Something went wrong', error });
    }
};

// 3. Guest login — lets a reviewer try the app (search, cart, chat,
// checkout) without registering. The account is real (so it works with
// every existing userId-scoped query) but flagged isGuest with a 24h
// expiresAt; cleanupExpiredGuests (src/jobs/cleanupGuests.ts) deletes it
// — and, via cascading FKs, its cart and orders — once that passes.
export const createGuest = async (_req: Request, res: Response): Promise<void> => {
  try {
    const id = randomUUID();
    const randomPasswordHash = await bcrypt.hash(randomUUID(), 10);

    const created = await prisma.user.create({
      data: {
        email: `guest-${id}@guest.megamart.local`,
        password: randomPasswordHash,
        name: 'Guest',
        isGuest: true,
        expiresAt: new Date(Date.now() + GUEST_SESSION_MS),
      },
    });

    const token = signToken(created.id, created.email);
    if (!token) {
      res.status(500).json({ message: 'Server misconfigured: JWT_SECRET is missing' });
      return;
    }
    res.status(201).json({ token, userId: created.id, name: created.name, isGuest: true });
  } catch (error) {
    console.error('⚠️ Guest session error:', error);
    res.status(500).json({ message: 'Could not start a guest session' });
  }
};

