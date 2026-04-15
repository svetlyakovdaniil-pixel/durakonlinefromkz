import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import bcrypt from "bcryptjs";
import type { Express, Request, Response } from "express";

import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;
const SALT_ROUNDS = 10;

function generateOpenId(): string {
  // Generate a unique openId for email-registered users
  // Using crypto.randomUUID() for uniqueness
  const uuid = crypto.randomUUID();
  return `email_${uuid}`;
}

export function registerEmailAuthRoutes(app: Express) {
  /**
   * POST /api/auth/register
   * Body: { email, password, name }
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      // Validate email
      if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        res.status(400).json({ error: "invalid_email", message: "Введите корректный email" });
        return;
      }

      // Validate password
      if (!password || typeof password !== "string") {
        res.status(400).json({ error: "invalid_password", message: "Введите пароль" });
        return;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        res.status(400).json({ error: "password_too_short", message: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` });
        return;
      }
      if (password.length > MAX_PASSWORD_LENGTH) {
        res.status(400).json({ error: "password_too_long", message: "Пароль слишком длинный" });
        return;
      }

      // Validate name
      const trimmedName = (name && typeof name === "string") ? name.trim() : "";
      if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 12) {
        res.status(400).json({ error: "invalid_name", message: "Имя должно быть от 1 до 12 символов" });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if email already exists
      const existingCredential = await db.getCredentialByEmail(normalizedEmail);
      if (existingCredential) {
        res.status(409).json({ error: "email_exists", message: "Этот email уже зарегистрирован" });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user in users table
      const openId = generateOpenId();
      await db.upsertUser({
        openId,
        name: trimmedName,
        email: normalizedEmail,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Get the created user to get the id
      const user = await db.getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ error: "user_creation_failed", message: "Ошибка создания пользователя" });
        return;
      }

      // Create credentials
      await db.createUserCredential({
        userId: user.id,
        email: normalizedEmail,
        passwordHash,
      });

      // Create player profile (needed to activate referral code)
      const profile = await db.getOrCreateProfile(user.id, trimmedName);

      // Activate referral code if provided (non-fatal)
      const referralCode = req.body.referralCode;
      if (referralCode && typeof referralCode === 'string' && referralCode.trim().length > 0 && profile) {
        await db.activateReferralCode(profile.id, referralCode.trim().toUpperCase()).catch(err => {
          console.warn('[EmailAuth] Referral activation failed (non-fatal):', err);
        });
      }

      // Create session token and set cookie
      const sessionToken = await sdk.createSessionToken(openId, {
        name: trimmedName,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.status(201).json({ success: true, openId });
    } catch (error) {
      console.error("[EmailAuth] Registration failed:", error);
      res.status(500).json({ error: "server_error", message: "Ошибка сервера" });
    }
  });

  /**
   * POST /api/auth/login
   * Body: { email, password }
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || typeof email !== "string") {
        res.status(400).json({ error: "invalid_email", message: "Введите email" });
        return;
      }
      if (!password || typeof password !== "string") {
        res.status(400).json({ error: "invalid_password", message: "Введите пароль" });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Find credentials
      const credential = await db.getCredentialByEmail(normalizedEmail);
      if (!credential) {
        res.status(401).json({ error: "invalid_credentials", message: "Неверный email или пароль" });
        return;
      }

      // Verify password
      const isValid = await bcrypt.compare(password, credential.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: "invalid_credentials", message: "Неверный email или пароль" });
        return;
      }

      // Get user
      const user = await db.getUserById(credential.userId);
      if (!user) {
        res.status(401).json({ error: "user_not_found", message: "Пользователь не найден" });
        return;
      }

      // Update last signed in
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Create session token and set cookie
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.status(200).json({ success: true, openId: user.openId });
    } catch (error) {
      console.error("[EmailAuth] Login failed:", error);
      res.status(500).json({ error: "server_error", message: "Ошибка сервера" });
    }
  });
}
