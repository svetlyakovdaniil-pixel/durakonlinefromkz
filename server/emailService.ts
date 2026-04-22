import { ENV } from "./_core/env";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const apiKey = ENV.resendApiKey;
  if (!apiKey) {
    console.error("[emailService] RESEND_API_KEY is not set");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Дурак Онлайн <noreply@durakonlinefromkz.online>",
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[emailService] Resend API error:", error);
      return false;
    }

    const data = await response.json();
    console.log("[emailService] Email sent successfully:", data.id);
    return true;
  } catch (error) {
    console.error("[emailService] Failed to send email:", error);
    return false;
  }
}

export async function sendVerificationCode(email: string, code: string, username: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; overflow: hidden; max-width: 500px; width: 100%;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px; text-align: center; border-bottom: 2px solid #f59e0b;">
                  <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: bold;">🃏 Дурак Онлайн</h1>
                  <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">durakonlinefromkz.online</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 16px;">Привет, <strong style="color: #f59e0b;">${username}</strong>!</p>
                  <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px;">Для завершения регистрации введите код подтверждения:</p>
                  
                  <!-- Code box -->
                  <div style="background-color: #0f172a; border: 2px solid #f59e0b; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">Код подтверждения</p>
                    <p style="color: #f59e0b; font-size: 40px; font-weight: bold; letter-spacing: 12px; margin: 0; font-family: monospace;">${code}</p>
                  </div>
                  
                  <p style="color: #64748b; font-size: 12px; margin: 0 0 8px;">⏱ Код действителен 10 минут</p>
                  <p style="color: #64748b; font-size: 12px; margin: 0;">Если вы не регистрировались — просто проигнорируйте это письмо.</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #0f172a; padding: 16px 32px; border-top: 1px solid #334155; text-align: center;">
                  <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 Дурак Онлайн from KZ. Все права защищены.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `${code} — код подтверждения для Дурак Онлайн`,
    html,
    text: `Привет, ${username}!\n\nВаш код подтверждения: ${code}\n\nКод действителен 10 минут.\n\nЕсли вы не регистрировались — проигнорируйте это письмо.`,
  });
}
