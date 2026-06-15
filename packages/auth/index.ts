import { betterAuth } from "better-auth";
import { Pool } from "pg";

function createAuth() {
  return betterAuth({
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

type Auth = ReturnType<typeof createAuth>;

let _auth: Auth;

export const auth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) _auth = createAuth();
    return (_auth as any)[prop];
  },
});

export type Session = typeof auth.$Infer.Session;
