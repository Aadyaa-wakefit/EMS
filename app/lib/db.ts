import { Pool } from "pg"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL environment variable")
}

export const pool = new Pool({
  connectionString: databaseUrl
})