// Edge Function: salva os dados do site no banco.
// Exige um token de escrita valido (gerado por admin-verify) no header Authorization.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const TOKEN_SECRET = Deno.env.get("TOKEN_SECRET");

const encoder = new TextEncoder();

async function hmacKey() {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(TOKEN_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function verifyToken(token: string): Promise<boolean> {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  const payload = decodeURIComponent(escape(atob(payloadB64)));
  const key = await hmacKey();
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    hexToBytes(sig),
    encoder.encode(payload),
  );
  if (!valid) return false;
  try {
    const parsed = JSON.parse(payload);
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method === "POST") {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token || !(await verifyToken(token))) {
      return json({ error: "token invalido ou expirado" }, 401, corsHeaders);
    }

    try {
      const body = await req.json();
      const payload = body?.payload ?? null;
      if (payload === null) return json({ error: "payload ausente" }, 400, corsHeaders);

      const { error } = await supabase
        .from("site_data")
        .upsert({ id: 1, payload, updated_at: new Date().toISOString() });

      if (error) return json({ error: error.message }, 500, corsHeaders);
      return json({ ok: true }, 200, corsHeaders);
    } catch {
      return json({ error: "requisicao invalida" }, 400, corsHeaders);
    }
  }

  return json({ error: "metodo nao suportado" }, 405, corsHeaders);
});

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
