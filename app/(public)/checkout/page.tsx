"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { CartSummary } from "@/components/cart/cart-summary";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCNPJ } from "@/lib/utils";
import { createOrder } from "./actions";

const SEGMENTS = [
  "Alimentos e Bebidas",
  "Agroindústria",
  "Institucional",
  "Indústria",
  "Serviços",
  "Outro",
];

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const router = useRouter();
  const [cnpj, setCnpj] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Você ainda não selecionou nenhum stand.</p>
        <Link href="/mapa" className="mt-4 inline-block">
          <Button>Ir para o mapa</Button>
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    for (const item of items) fd.append("standIds", item.id);

    try {
      const result = await createOrder(fd);
      if (result.ok) {
        clear();
        router.push(`/acompanhar/${result.token}`);
      } else {
        setError(result.error);
        setSubmitting(false);
      }
    } catch {
      setError("Não foi possível concluir a reserva. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
      <form onSubmit={onSubmit} className="space-y-6">
        <h1 className="text-2xl font-bold text-brand-navy">
          Cadastro do expositor
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Dados da empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nomeFantasia">Nome fantasia *</Label>
              <Input id="nomeFantasia" name="nomeFantasia" required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="razaoSocial">Razão social</Label>
              <Input id="razaoSocial" name="razaoSocial" />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                name="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label htmlFor="segment">Segmento</Label>
              <Select id="segment" name="segment" defaultValue="">
                <option value="">Selecione…</option>
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" />
            </div>
            <div>
              <Label htmlFor="contato">Contato (responsável)</Label>
              <Input id="contato" name="contato" />
            </div>
            <div>
              <Label htmlFor="captador">Captação</Label>
              <Select id="captador" name="captador" defaultValue="">
                <option value="">Selecione…</option>
                <option value="FIEB">FIEB</option>
                <option value="SEBRAE">SEBRAE</option>
                <option value="BAHIA_EVENTOS">Bahia Eventos</option>
                <option value="OUTRO">Outro</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsável técnico</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="rtName">Nome *</Label>
              <Input id="rtName" name="rtName" required />
            </div>
            <div>
              <Label htmlFor="rtDocument">Documento (CPF/RG)</Label>
              <Input id="rtDocument" name="rtDocument" />
            </div>
            <div>
              <Label htmlFor="rtEmail">E-mail</Label>
              <Input id="rtEmail" name="rtEmail" type="email" />
            </div>
            <div>
              <Label htmlFor="rtPhone">Telefone</Label>
              <Input id="rtPhone" name="rtPhone" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marca / logotipo</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="brand">Envie a logomarca (PNG, JPG ou SVG)</Label>
            <input
              id="brand"
              name="brand"
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-navy file:px-4 file:py-2 file:text-white"
            />
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Processando…" : "Reservar e gerar contrato"}
        </Button>
      </form>

      <CartSummary showCheckout={false} />
    </div>
  );
}
