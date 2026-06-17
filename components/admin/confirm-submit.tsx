"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

// Botão de submit com confirmação nativa (window.confirm) — usado em ações
// irreversíveis como ativar uma versão do mapa.
export function ConfirmSubmit({
  message,
  children,
  variant = "primary",
  size = "sm",
}: {
  message: string;
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
