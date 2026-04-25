import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
    database: Pool,
    secret: process.env.BETTER_AUTH_SECRET,
})

