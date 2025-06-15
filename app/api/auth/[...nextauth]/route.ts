import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          // If user doesn't exist or password doesn't match
          if (!user || !user.password) {
            logger.info({ email: credentials.email }, "Login failed: User not found");
            return null;
          }

          // Compare passwords
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          if (!passwordMatch) {
            logger.info({ email: credentials.email }, "Login failed: Invalid password");
            return null;
          }

          // Log successful login
          logger.info({ userId: user.id, email: user.email, role: user.role }, "User logged in successfully");

          // Create audit log for login
          await prisma.auditLog.create({
            data: {
              action: "LOGIN",
              entityId: user.id,
              entityType: "USER",
              userId: user.id,
              metadata: { email: user.email },
            },
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          logger.error({ error, email: credentials.email }, "Error during authentication");
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add role to JWT token when user signs in
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role and id to session from token
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  events: {
    async signOut({ token }) {
      if (token.sub) {
        // Create audit log for logout
        await prisma.auditLog.create({
          data: {
            action: "LOGOUT",
            entityId: token.sub,
            entityType: "USER",
            userId: token.sub,
          },
        });
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };