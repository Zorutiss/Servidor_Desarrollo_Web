import { config } from '../config/index.js';

class LoggerService {
  async logError({ err, req }) {
    const payload = {
      timestamp: new Date().toISOString(),
      method: req?.method,
      path: req?.path,
      message: err?.message,
      stack: err?.stack,
    };

    console.error('[ERROR 5XX]', JSON.stringify(payload, null, 2));

    if (!config.slack.webhookUrl) return;

    try {
      await fetch(config.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *Error 5XX en BildyApp*\n` +
            `*Timestamp:* ${payload.timestamp}\n` +
            `*Método:* ${payload.method} ${payload.path}\n` +
            `*Error:* ${payload.message}\n` +
            `\`\`\`${payload.stack?.slice(0, 500)}\`\`\``,
        }),
      });
    } catch (e) {
      console.error('Error enviando a Slack:', e.message);
    }
  }
}

export const loggerService = new LoggerService();
