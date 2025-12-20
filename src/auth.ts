
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Minimal schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = await loginSchema.parseAsync(credentials)

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          throw new Error("User not found.")
        }

        const passwordsMatch = await bcrypt.compare(password, user.password)

        if (!passwordsMatch) {
            console.log("Password mismatch for", email); 
            return null;
        }

        // Return user object (NextAuth defaults)
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role // We need to expose this to the session
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
        if (user) {
            token.role = (user as any).role;
            token.id = user.id;
        }
        return token;
    },
    async session({ session, token }) {
        if (token && session.user) {
            (session.user as any).role = token.role;
            (session.user as any).id = token.id;
        }
        return session;
    }
  },
  pages: {
    signIn: '/login', // Custom login page
  }
})
