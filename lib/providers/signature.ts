export interface CreateSignatureInput {
  orderId: string;
  trackingToken: string;
  contractHtml: string;
  signer: { name: string; email: string };
}

export interface CreateSignatureResult {
  provider: string;
  externalId: string | null;
  signUrl: string;
  status: "PENDING" | "SIGNED";
}

export interface SignatureProvider {
  readonly name: string;
  createSignatureRequest(
    input: CreateSignatureInput,
  ): Promise<CreateSignatureResult>;
}

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

// Adaptador manual: gera um "link" interno de assinatura até plugarmos
// ZapSign/Clicksign/etc.
class ManualSignatureProvider implements SignatureProvider {
  readonly name = "manual";
  async createSignatureRequest(
    input: CreateSignatureInput,
  ): Promise<CreateSignatureResult> {
    return {
      provider: this.name,
      externalId: input.orderId,
      signUrl: `${appUrl()}/acompanhar/${input.trackingToken}`,
      status: "PENDING",
    };
  }
}

let instance: SignatureProvider | null = null;

export function getSignatureProvider(): SignatureProvider {
  if (instance) return instance;
  // Espaço para plugar ZapSign/Clicksign/etc. conforme SIGNATURE_PROVIDER.
  instance = new ManualSignatureProvider();
  return instance;
}
