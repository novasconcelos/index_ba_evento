"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { IndexLogo } from "@/components/brand/index-logo";
import { authenticate } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <div className="flex w-full items-center justify-center bg-brand-navy p-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <IndexLogo className="mx-auto h-12 w-12" />
          <h1 className="mt-3 text-xl font-bold text-brand-navy">
            INDEX · Painel administrativo
          </h1>
          <p className="text-sm text-gray-500">Acesse com suas credenciais</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="admin@fieb.org.br"
            />
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
          <p className="text-center text-xs text-gray-400">
            Seed: admin@fieb.org.br / admin123
          </p>
        </div>
      </form>
    </div>
  );
}
