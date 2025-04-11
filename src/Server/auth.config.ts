import { DefaultSession, NextAuthConfig} from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials"
import { z } from "zod";
import { db, eq } from "./DB";
import { users } from "./DB/schema";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface User {
        role?: "user" | "admin";
    }

    interface Session {
        user: {
            id: string;
            role?: "user" | "admin";
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: "user" | "admin";
    }
}

export const authConfig:  NextAuthConfig = {
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: "/login",
        signOut: "/logout",
        error: "/login",
        verifyRequest: "/verify-request",
        newUser: "/register",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl }}) {
            const isLoggedIn = !!auth?.user;
            const isOnDashBoard = nextUrl.pathname.startsWith("/dashboard");
            const isOnAdmin = nextUrl.pathname.startsWith("/admin");

            if (isOnAdmin) {
                return isLoggedIn && auth?.user?.role === "admin";
            } else if (isOnDashBoard) {
                return false;
            } else if (isLoggedIn) {
                return true;
            }
            return true;
        },
        jwt: async ({ token, user }) => {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.image = user.image;
                token.role = user.role;
            }
            return token;
        },
        session: async ({ session, token }) => {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role ;
            }
            return session;
        },
    },

    providers: [
        Github({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "example@me.com",
                },
                password: {
                    label: "Password",
                    type: "password",
                }
            },
            async authorize(credentials) {
                const parsedCredentials = z.object({
                    email: z.string().email(),
                    password: z.string().min(6),
                }).safeParse(credentials);

                if (!parsedCredentials.success) {
                    return null;
                }
                const { email, password } = parsedCredentials.data;

                const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email.toLowerCase()));
                
                if (!user) return null;
                
                const passwordMatch = await bcrypt.compare(
                    password,
                    user.password || ""
                );

                if (!passwordMatch) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.image,
                };
            }
        })
    ]
}