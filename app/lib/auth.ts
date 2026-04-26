import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { dash } from "@better-auth/infra";
import { pool } from "@/app/lib/db";
import { ensureUserBalances } from "@/app/lib/users-repo";

let cachedAuth: ReturnType<typeof buildAuth> | undefined;

function buildAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing BETTER_AUTH_SECRET environment variable");
  }

  const baseURL = process.env.BETTER_AUTH_URL;
  const vercelURL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;

  const trustedOrigins = Array.from(
    new Set(
      [
        baseURL,
        vercelURL,
        "http://localhost:3000",
        process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : undefined,
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  return betterAuth({
    baseURL,
    secret,
    trustedOrigins,
    database: pool,
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "employee",
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              await ensureUserBalances(user.id);
            } catch (err) {
              console.error("Failed to seed leave balances for new user", {
                userId: user.id,
                error: err,
              });
            }
          },
        },
      },
    },
    plugins: [
      dash(),
      nextCookies(),
    ],
  });
}

export function getAuth() {
  if (!cachedAuth) {
    cachedAuth = buildAuth();
  }
  return cachedAuth;
}

export const auth = getAuth();
