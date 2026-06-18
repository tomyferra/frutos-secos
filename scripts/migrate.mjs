import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = join(__dirname, "..", ".env");
const env = readFileSync(envPath, "utf-8");
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const anonKey = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!url || !anonKey) { console.error("Missing env vars"); process.exit(1); }

// Use service_role key from env (optional, falls back to anon)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

const supabase = createClient(url, serviceKey, {
  realtime: { transport: (await import("ws")).default },
});

const { error } = await supabase.rpc("exec_sql", {
  query: `ALTER TABLE productos ADD COLUMN IF NOT EXISTS "precioVentaKg" DOUBLE PRECISION NOT NULL DEFAULT 0;`,
});

if (error) {
  console.log("ℹ️  RPC exec_sql not available. Trying direct API:", error.message);
  // Try via Management API
  const ref = new URL(url).hostname.split(".")[0];
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (token) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `ALTER TABLE productos ADD COLUMN IF NOT EXISTS "precioVentaKg" DOUBLE PRECISION NOT NULL DEFAULT 0;`,
      }),
    });
    if (res.ok) { console.log("✅ Column added via Management API"); process.exit(0); }
    console.error("Management API failed:", await res.text());
  } else {
    console.log("ℹ️  No SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY set.");
  }
  console.log("\n⚠️  Run this SQL in Supabase Dashboard > SQL Editor:\n");
  console.log('ALTER TABLE productos ADD COLUMN IF NOT EXISTS "precioVentaKg" DOUBLE PRECISION NOT NULL DEFAULT 0;');
  process.exit(1);
}

console.log("✅ Column added successfully");
