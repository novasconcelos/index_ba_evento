import type { NextAuthConfig } from "next-auth";

// Configuração base, segura para o middleware (edge): sem Prisma/bcrypt aqui.
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const kind = (auth?.user as { kind?: string } | undefined)?.kind;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnLogin = nextUrl.pathname.startsWith("/admin/login");

      if (isOnLogin) return true;
      // /admin exige sessão de admin (um expositor logado não entra aqui).
      // O portal /painel é protegido no server component via requireExhibitor().
      if (isOnAdmin) return kind === "admin";
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.kind = (user as { kind?: string }).kind;
        token.exhibitorId = (user as { exhibitorId?: string }).exhibitorId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { kind?: string }).kind = token.kind as string;
        (session.user as { exhibitorId?: string }).exhibitorId =
          token.exhibitorId as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
