import { ENV } from "./_core/env";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = "noreply@durakonlinefromkz.online";
const FROM_NAME = "Дурак Online";

export async function sendVerificationEmail(toEmail: string, code: string): Promise<boolean> {
  if (!ENV.brevoApiKey) {
    console.error("[Brevo] BREVO_API_KEY is not set");
    return false;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a1a; color: #fff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1a0a2e 0%, #0d1b3e 100%); padding: 32px; text-align: center;">
        <h1 style="color: #e63946; margin: 0; font-size: 28px; letter-spacing: 2px;">ДУРАК ONLINE</h1>
        <p style="color: #aaa; margin: 8px 0 0; font-size: 14px;">durakonlinefromkz.online</p>
      </div>
      <div style="padding: 32px; text-align: center;">
        <h2 style="color: #fff; margin: 0 0 16px; font-size: 20px;">Подтверждение регистрации</h2>
        <p style="color: #ccc; margin: 0 0 24px; font-size: 15px;">Введите этот код для завершения регистрации:</p>
        <div style="background: #1a1a2e; border: 2px solid #e63946; border-radius: 12px; padding: 20px; display: inline-block; margin: 0 auto;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #e63946; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #888; margin: 24px 0 0; font-size: 13px;">Код действителен 10 минут. Не передавайте его никому.</p>
      </div>
      <div style="background: #0d0d1a; padding: 16px; text-align: center;">
        <p style="color: #555; margin: 0; font-size: 12px;">Если вы не регистрировались — просто проигнорируйте это письмо.</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": ENV.brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: toEmail }],
        subject: `${code} — ваш код подтверждения`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Brevo] Failed to send email:", response.status, error);
      return false;
    }

    console.log("[Brevo] Verification email sent to:", toEmail);
    return true;
  } catch (error) {
    console.error("[Brevo] Error sending email:", error);
    return false;
  }
}
