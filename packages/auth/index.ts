import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "https://chat.inhumane.in",
    "https://inhumane.in",
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: ".inhumane.in",
    },
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
