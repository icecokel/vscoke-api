import Transport = require('winston-transport');
import { LoggerOptions } from 'winston';

interface NotifyTransportOptions extends Transport.TransportStreamOptions {
  webhookUrl?: string; // e.g., http://localhost:7232/api/notify/send
  username?: string;
  password?: string;
}

export class NotifyTransport extends Transport {
  private readonly webhookUrl: string;
  private readonly authHeader: string;

  constructor(opts?: NotifyTransportOptions) {
    super(opts);

    this.webhookUrl =
      opts?.webhookUrl ||
      process.env.NOTIFY_SERVICE_URL ||
      'http://localhost:7232/api/notify/send';

    const user = opts?.username || process.env.NOTIFY_SERVICE_USER || 'admin';
    const pass =
      opts?.password || process.env.NOTIFY_SERVICE_PASSWORD || 'admin';

    this.authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (info.level === 'error') {
      const message =
        typeof info.message === 'string'
          ? info.message
          : JSON.stringify(info.message);

      // Extract stack trace if available
      const stack = info.stack ? `\nStack: ${info.stack}` : '';
      const context = info.context ? `[${info.context}] ` : '';

      const payload = {
        message: `🚨 **Server Error** 🚨\n${context}${message}${stack}`,
      };

      fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) {
            console.error(
              `NotifyTransport: Failed to send notification. Status: ${res.status}`,
            );
          }
        })
        .catch((err) => {
          // Prevent infinite loops if logging fails
          console.error('NotifyTransport: Network error', err.message);
        });
    }

    callback();
  }
}
