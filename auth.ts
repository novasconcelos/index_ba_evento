import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Provider do admin (id padrão "credentials").
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          kind: "admin",
        };
      },
    }),
    // Provider do expositor (login no portal /painel).
    Credentials({
      id: "exhibitor",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const exhibitor = await prisma.exhibitor.findUnique({
          where: { email },
        });
        if (!exhibitor?.passwordHash) return null;

        const ok = await bcrypt.compare(password, exhibitor.passwordHash);
        if (!ok) return null;

        return {
          id: exhibitor.id,
          name: exhibitor.nomeFantasia,
          email: exhibitor.email,
          kind: "exhibitor",
          exhibitorId: exhibitor.id,
        };
      },
    }),
  ],
});
