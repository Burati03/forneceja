import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase server configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticatedUser(req: Request, admin: SupabaseClient) {
  const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error) return null;
  return data.user;
}

export async function sellerAccessToken(admin: SupabaseClient, profileId: string) {
  const { data: account, error } = await admin
    .from("mercado_pago_contas")
    .select("mp_user_id,access_token,refresh_token,expires_at")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw new Error("Não foi possível consultar a conexão do Mercado Pago.");
  if (!account) throw new Error("Conecte sua conta do Mercado Pago antes de receber pedidos.");

  if (new Date(account.expires_at).getTime() > Date.now() + 5 * 60 * 1000) {
    return { token: account.access_token, mpUserId: account.mp_user_id };
  }

  const clientId = Deno.env.get("MP_CLIENT_ID");
  const clientSecret = Deno.env.get("MP_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("A integração do Mercado Pago não está configurada.");
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });
  const refreshed = await response.json();
  if (!response.ok || typeof refreshed.access_token !== "string" || typeof refreshed.refresh_token !== "string" || !(Number(refreshed.expires_in) > 0)) {
    throw new Error("A conexão do fornecedor com o Mercado Pago expirou. Reconecte a conta.");
  }

  const expiresAt = new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString();
  const { error: updateError } = await admin
    .from("mercado_pago_contas")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: expiresAt,
      atualizado_em: new Date().toISOString(),
    })
    .eq("profile_id", profileId);
  if (updateError) throw new Error("Não foi possível renovar a conexão do Mercado Pago.");
  return { token: refreshed.access_token as string, mpUserId: account.mp_user_id };
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
