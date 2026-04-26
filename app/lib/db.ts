import { Pool } from "pg"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL environment variable")
}

const parsedUrl = new URL(databaseUrl)
parsedUrl.searchParams.delete("sslmode")

export const pool = new Pool({
  connectionString: parsedUrl.toString(),
  ssl: { rejectUnauthorized: true },
})