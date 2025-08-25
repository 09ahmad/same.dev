import NextAuth from "next-auth";
import { prismaClient } from "@repo/db/client";

import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
    callbacks: {
    async redirect({ baseUrl }:any) {
      return baseUrl + "/";
    },
    async signIn({ user }:any) {
      if (!user.email) return false;
      const existingUser = await prismaClient.user.findUnique({
        where: { email: user.email },
      });
      if (!existingUser) {
        await prismaClient.user.create({
          data: {
            email: user.email,
            name: user.name || "",
          },
        });
      }
      return true;
    },
    async jwt({ token, user }:any) {
      // Ensure token.id is set so session can expose session.user.id
      if (user?.email) {
        const dbUser = await prismaClient.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }:any) {
      if (token?.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },

};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
