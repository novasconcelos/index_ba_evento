export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(input: SendEmailInput): Promise<void>;
}

// Adaptador de desenvolvimento: registra o e-mail no console do servidor.
class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";
  async send(input: SendEmailInput): Promise<void> {
    console.log("\n=== [EMAIL] ===");
    console.log("Para:", input.to);
    console.log("Assunto:", input.subject);
    console.log(input.text ?? input.html);
    console.log("=== [/EMAIL] ===\n");
  }
}

let instance: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (instance) return instance;
  // Espaço para plugar SMTP/Resend conforme EMAIL_PROVIDER.
  instance = new ConsoleEmailProvider();
  return instance;
}
