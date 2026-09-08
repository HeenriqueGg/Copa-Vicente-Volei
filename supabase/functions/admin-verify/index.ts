// Edge Function: verifica a senha do admin e gera um token de escrita de curta duracao.
// A senha fica na variavel de ambiente ADMIN_PASS (nunca exposta no frontend).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ADMIN_PASS = Deno.env.get("ADMIN_PASS");
const TOKEN_SECRET = Deno.env.get("TOKEN_SECRET");
const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutos

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

async function sign(payload: string): Promise<string> {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToHex(new Uint8Array(sig));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifySignature(token: string): Promise<boolean> {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  const payload = decodeURIComponent(escape(atob(payloadB64)));
  const key = await hmacKey();
  const sigBytes = hexToBytes(sig);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
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

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

Deno.serve(async (req) => {
  // CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // POST /admin-verify  { password }
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const password = String(body?.password ?? "");
      if (!ADMIN_PASS) return json({ error: "ADMIN_PASS nao configurado" }, 500, corsHeaders);

      if (password !== ADMIN_PASS) {
        return json({ error: "senha incorreta" }, 401, corsHeaders);
      }

      const exp = Date.now() + TOKEN_TTL_MS;
      const payload = JSON.stringify({ exp });
      const payloadB64 = btoa(unescape(encodeURIComponent(payload)));
      const token = `${payloadB64}.${await sign(payload)}`;

      return json({ token, expiresAt: exp }, 200, corsHeaders);
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
