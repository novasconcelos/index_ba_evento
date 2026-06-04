"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { recordLead } from "@/app/(public)/mapa/lead-actions";

export interface LeadInfo {
  email: string;
  whatsapp: string;
}

export function LeadCaptureModal({
  open,
  standCode,
  standId,
  onSaved,
  onCancel,
}: {
  open: boolean;
  standCode?: string | null;
  standId?: string | null;
  onSaved: (info: LeadInfo) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("email", email);
    fd.set("whatsapp", whatsapp);
    if (standId) fd.set("standId", standId);
    if (standCode) fd.set("standCode", standCode);
    try {
      const result = await recordLead(fd);
      if (result.ok) {
        onSaved({ email: email.trim().toLowerCase(), whatsapp: whatsapp.trim() });
      } else {
        setError(result.error);
        setSubmitting(false);
      }
    } catch {
      setError("Não foi possível registrar. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-brand-navy">
          Quase lá! Deixe seu contato
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {standCode
            ? `Para reservar o stand ${standCode}, informe seu e-mail e WhatsApp.`
            : "Informe seu e-mail e WhatsApp para continuar."}{" "}
          Assim conseguimos retomar o contato caso você não finalize agora.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="lead-email">E-mail *</Label>
            <Input
              id="lead-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com.br"
            />
          </div>
          <div>
            <Label htmlFor="lead-whatsapp">WhatsApp *</Label>
            <Input
              id="lead-whatsapp"
              type="tel"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(71) 99999-9999"
              inputMode="tel"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Salvando…" : "Continuar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
