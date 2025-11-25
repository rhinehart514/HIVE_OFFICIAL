declare module '@sendgrid/mail' {
  interface MailDataRequired {
    to: string | string[];
    from: string | { email: string; name?: string };
    subject: string;
    text?: string;
    html?: string;
    [key: string]: any;
  }

  interface SendGridClient {
    setApiKey(key: string): void;
    send(data: MailDataRequired | MailDataRequired[]): Promise<any>;
  }

  const client: SendGridClient;
  export = client;
}
