import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import bcrypt from "bcryptjs";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { containsProfanity, PROFANITY_ERR_MSG } from "../shared/profanityFilter";
import { sendVerificationEmail } from "./brevoEmail";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;
const SALT_ROUNDS = 10;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

function generateOpenId(): string {
  const uuid = crypto.randomUUID();
  return `email_${uuid}`;
}

function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function registerEmailAuthRoutes(app: Express) {
  /**
   * POST /api/auth/register/send-code
   * Step 1: Validate input, send OTP code to email
   * Body: { email, password, name, referralCode? }
   */
  app.post("/api/auth/register/send-code", async (req: Request, res: Response) => {
    try {
      const { email, password, name, referralCode } = req.body;

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
      if (containsProfanity(trimmedName)) {
        res.status(400).json({ error: "profanity_name", message: PROFANITY_ERR_MSG });
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

      // Generate OTP
      const code = generateOtpCode();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

      // Store pending registration data
      const pendingData = JSON.stringify({
        name: trimmedName,
        passwordHash,
        referralCode: referralCode?.trim()?.toUpperCase() ?? null,
      });

      await db.createEmailVerificationCode({
        email: normalizedEmail,
        code,
        pendingData,
        attempts: 0,
        expiresAt,
      });

      // Send OTP email
      const sent = await sendVerificationEmail(normalizedEmail, code);
      if (!sent) {
        res.status(500).json({ error: "email_send_failed", message: "Не удалось отправить письмо. Попробуйте позже." });
        return;
      }

      res.status(200).json({ success: true, message: "Код подтверждения отправлен на ваш email" });
    } catch (error) {
      console.error("[EmailAuth] Send code failed:", error);
      res.status(500).json({ error: "server_error", message: "Ошибка сервера" });
    }
  });

  /**
   * POST /api/auth/register/verify-code
   * Step 2: Verify OTP code and complete registration
   * Body: { email, code }
   */
  app.post("/api/auth/register/verify-code", async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      if (!email || typeof email !== "string") {
        res.status(400).json({ error: "invalid_email", message: "Введите email" });
        return;
      }
      if (!code || typeof code !== "string") {
        res.status(400).json({ error: "invalid_code", message: "Введите код подтверждения" });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const record = await db.getEmailVerificationCode(normalizedEmail);

      if (!record) {
        res.status(400).json({ error: "code_not_found", message: "Код не найден. Запросите новый." });
        return;
      }

      // Check expiry
      if (new Date() > record.expiresAt) {
        await db.deleteEmailVerificationCode(normalizedEmail);
        res.status(400).json({ error: "code_expired", message: "Код истёк. Запросите новый." });
        return;
      }

      // Check attempts
      if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
        await db.deleteEmailVerificationCode(normalizedEmail);
        res.status(400).json({ error: "too_many_attempts", message: "Слишком много попыток. Запросите новый код." });
        return;
      }

      // Check code
      if (record.code !== code.trim()) {
        await db.incrementVerificationAttempts(record.id);
        const remaining = MAX_VERIFY_ATTEMPTS - record.attempts - 1;
        res.status(400).json({ error: "invalid_code", message: `Неверный код. Осталось попыток: ${remaining}` });
        return;
      }

      // Code is valid — complete registration
      const pending = JSON.parse(record.pendingData) as { name: string; passwordHash: string; referralCode: string | null };

      // Check again if email was registered while waiting
      const existingCredential = await db.getCredentialByEmail(normalizedEmail);
      if (existingCredential) {
        await db.deleteEmailVerificationCode(normalizedEmail);
        res.status(409).json({ error: "email_exists", message: "Этот email уже зарегистрирован" });
        return;
      }

      // Create user
      const openId = generateOpenId();
      await db.upsertUser({
        openId,
        name: pending.name,
        email: normalizedEmail,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ error: "user_creation_failed", message: "Ошибка создания пользователя" });
        return;
      }

      // Create credentials
      await db.createUserCredential({
        userId: user.id,
        email: normalizedEmail,
        passwordHash: pending.passwordHash,
      });

      // Create player profile
      const profile = await db.getOrCreateProfile(user.id, pending.name);

      // Activate referral code if provided
      if (pending.referralCode && profile) {
        await db.activateReferralCode(profile.id, pending.referralCode).catch(err => {
          console.warn('[EmailAuth] Referral activation failed (non-fatal):', err);
        });
      }

      // Clean up verification code
      await db.deleteEmailVerificationCode(normalizedEmail);

      // Create session token and set cookie
      const sessionToken = await sdk.createSessionToken(openId, {
        name: pending.name,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.status(201).json({ success: true, openId });
    } catch (error) {
      console.error("[EmailAuth] Verify code failed:", error);
      res.status(500).json({ error: "server_error", message: "Ошибка сервера" });
    }
  });

  /**
   * POST /api/auth/register/resend-code
   * Resend OTP code (rate-limited by deleting old and creating new)
   * Body: { email }
   */
  app.post("/api/auth/register/resend-code", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        res.status(400).json({ error: "invalid_email", message: "Введите email" });
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      const record = await db.getEmailVerificationCode(normalizedEmail);
      if (!record) {
        res.status(400).json({ error: "code_not_found", message: "Сначала начните регистрацию" });
        return;
      }
      // Rate limit: don't resend if code was created less than 60 seconds ago
      const secondsSinceCreation = (Date.now() - new Date(record.createdAt).getTime()) / 1000;
      if (secondsSinceCreation < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceCreation);
        res.status(429).json({ error: "rate_limited", message: `Подождите ${waitSeconds} секунд перед повторной отправкой` });
        return;
      }
      // Generate new code with same pending data
      const newCode = generateOtpCode();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
      await db.createEmailVerificationCode({
        email: normalizedEmail,
        code: newCode,
        pendingData: record.pendingData,
        attempts: 0,
        expiresAt,
      });
      const sent = await sendVerificationEmail(normalizedEmail, newCode);
      if (!sent) {
        res.status(500).json({ error: "email_send_failed", message: "Не удалось отправить письмо. Попробуйте позже." });
        return;
      }
      res.status(200).json({ success: true, message: "Новый код отправлен" });
    } catch (error) {
      console.error("[EmailAuth] Resend code failed:", error);
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
      if (!email || typeof email !== "string") {
        res.status(400).json({ error: "invalid_email", message: "Введите email" });
        return;
      }
      if (!password || typeof password !== "string") {
        res.status(400).json({ error: "invalid_password", message: "Введите пароль" });
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      const credential = await db.getCredentialByEmail(normalizedEmail);
      if (!credential) {
        res.status(401).json({ error: "invalid_credentials", message: "Неверный email или пароль" });
        return;
      }
      const isValid = await bcrypt.compare(password, credential.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: "invalid_credentials", message: "Неверный email или пароль" });
        return;
      }
      const user = await db.getUserById(credential.userId);
      if (!user) {
        res.status(401).json({ error: "user_not_found", message: "Пользователь не найден" });
        return;
      }
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
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
