import fs from "node:fs";
import path from "node:path";
import pg from "pg";

function loadEnvFile(file) {
  const filepath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filepath)) return;
  const lines = fs.readFileSync(filepath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

function parseArgs(argv) {
  const args = { email: null, demote: false };
  for (const raw of argv) {
    if (raw === "--demote") args.demote = true;
    else if (raw === "--admin") args.demote = false;
    else if (!raw.startsWith("--") && !args.email) args.email = raw;
  }
  return args;
}

const { email, demote } = parseArgs(process.argv.slice(2));
if (!email) {
  console.error("Usage: pnpm node scripts/promote-admin.mjs <email> [--demote]");
  process.exit(2);
}

const targetRole = demote ? "employee" : "admin";

const parsedUrl = new URL(databaseUrl);
parsedUrl.searchParams.delete("sslmode");
const pool = new pg.Pool({
  connectionString: parsedUrl.toString(),
  ssl: { rejectUnauthorized: true },
});

async function run() {
  const found = await pool.query(
    `select id, email, coalesce(role, 'employee') as role
     from "user"
     where lower(email) = lower($1)
     limit 1`,
    [email],
  );
  const row = found.rows[0];
  if (!row) {
    console.error(`No user found for email: ${email}`);
    process.exit(1);
  }

  if (row.role === targetRole) {
    console.log(`User ${row.email} is already ${targetRole}. Nothing to do.`);
    return;
  }

  await pool.query(
    `update "user"
     set role = $1, "updatedAt" = now()
     where id = $2`,
    [targetRole, row.id],
  );

  console.log(`User ${row.email} is now ${targetRole} (was ${row.role}).`);
}

run()
  .then(async () => {
    await pool.end();
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
