declare module '@sendgrid/mail' {
  interface MailDataRequired {
    to: string | string[];
    from: string;
    subject: string;
    text?: string;
    html?: string;
    [key: string]: unknown;
  }

  interface SendGridClient {
    setApiKey(key: string): void;
    send(data: MailDataRequired | MailDataRequired[]): Promise<unknown>;
  }

  const sendgrid: SendGridClient;
  export = sendgrid;
}

