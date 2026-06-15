import { betterAuth } from "better-auth";
import { Pool } from "pg";

let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (!_auth) {
    _auth = betterAuth({
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
      ],
    });
  }
  return _auth;
}

// Eagerly initialize only at runtime, not during build
export const auth = typeof process !== "undefined" && process.env.DATABASE_URL
  ? getAuth()
  : (null as unknown as ReturnType<typeof betterAuth>);

export type Session = typeof auth.$Infer.Session;
