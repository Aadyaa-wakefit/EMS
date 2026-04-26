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

const DEFAULT_ALLOCATION = { sick: 8, casual: 6, vacation: 12 };

const pool = new pg.Pool({ connectionString: databaseUrl });

async function run() {
  const client = await pool.connect();
  try {
    await client.query("begin");

    await client.query('create extension if not exists "pgcrypto"');

    await client.query(`
      create table if not exists leave_requests (
        id uuid primary key default gen_random_uuid(),
        user_id text not null references "user"("id") on delete cascade,
        employee_name text not null,
        leave_type text not null check (leave_type in ('sick','casual','vacation')),
        start_date date not null,
        end_date date not null check (end_date >= start_date),
        status text not null check (status in ('pending','approved','rejected')) default 'pending',
        reason text null,
        decided_by text null references "user"("id") on delete set null,
        decided_at timestamptz null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);

    await client.query(`
      create table if not exists leave_balances (
        id uuid primary key default gen_random_uuid(),
        user_id text not null references "user"("id") on delete cascade,
        leave_type text not null check (leave_type in ('sick','casual','vacation')),
        allocated int not null default 0,
        used int not null default 0,
        updated_at timestamptz not null default now(),
        unique (user_id, leave_type)
      )
    `);

    await client.query(`
      create index if not exists idx_leave_requests_user_status
        on leave_requests(user_id, status)
    `);
    await client.query(`
      create index if not exists idx_leave_requests_status
        on leave_requests(status)
    `);
    await client.query(`
      create index if not exists idx_leave_requests_start_end
        on leave_requests(start_date, end_date)
    `);

    const seedSql = `
      insert into leave_balances (user_id, leave_type, allocated)
      select u.id, t.leave_type, t.allocated
      from "user" u
      cross join (values
        ('sick'::text, $1::int),
        ('casual'::text, $2::int),
        ('vacation'::text, $3::int)
      ) as t(leave_type, allocated)
      on conflict (user_id, leave_type) do nothing
    `;
    const seedResult = await client.query(seedSql, [
      DEFAULT_ALLOCATION.sick,
      DEFAULT_ALLOCATION.casual,
      DEFAULT_ALLOCATION.vacation,
    ]);

    await client.query("commit");

    console.log("Migration complete.");
    console.log(`Seeded ${seedResult.rowCount} balance rows.`);
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
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
