"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function authenticateExhibitor(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("exhibitor", {
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      password: formData.get("password"),
      redirectTo: "/painel",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "E-mail ou senha inválidos.";
    }
    throw error;
  }
}
