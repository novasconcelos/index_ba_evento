"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authenticateExhibitor } from "./actions";

export default function ExhibitorLoginPage() {
  const [error, formAction, pending] = useActionState(
    authenticateExhibitor,
    undefined,
  );

  return (
    <div className="mx-auto flex max-w-sm flex-col py-8">
      <form
        action={formAction}
        className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-bold text-brand-navy">Área do expositor</h1>
        <p className="mt-1 text-sm text-gray-500">
          Acesse para acompanhar sua solicitação e ver o contrato.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando…" : "Entrar"}
          </Button>

          <p className="text-center text-xs text-gray-500">
            Ainda não tem uma reserva?{" "}
            <Link href="/mapa" className="font-semibold text-brand-navy underline">
              Escolha seus stands no mapa
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
