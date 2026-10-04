import { adminClient } from "../_shared/mercado-pago.ts";

Deno.serve(async (req) => {
  const appUrl = Deno.env.get("APP_URL");
  if (!appUrl) return new Response("A URL do aplicativo não está configurada.", { status: 503 });
  const destination = new URL("/", appUrl);
  const params = new URL(req.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");

  try {
    if (!code || !state) throw new Error("Autorização cancelada ou inválida.");
    const redirectUri = Deno.env.get("MP_REDIRECT_URI");
    const clientId = Deno.env.get("MP_CLIENT_ID");
    const clientSecret = Deno.env.get("MP_CLIENT_SECRET");
    if (!redirectUri || !clientId || !clientSecret) throw new Error("A integração do Mercado Pago ainda não foi configurada.");

    const admin = adminClient();
    const { data: oauthState, error: stateError } = await admin
      .from("mercado_pago_oauth_states")
      .select("profile_id,expires_at")
      .eq("state", state)
      .maybeSingle();
    if (stateError || !oauthState || new Date(oauthState.expires_at).getTime() < Date.now()) {
      throw new Error("A autorização expirou. Tente conectar novamente.");
    }
    const { error: deleteError } = await admin.from("mercado_pago_oauth_states").delete().eq("state", state);
    if (deleteError) throw new Error("Não foi possível validar a autorização recebida.");

    const response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokens = await response.json();
    if (!response.ok || !tokens.access_token || !tokens.refresh_token || !tokens.user_id) {
      console.error("[mercado-pago-callback] token exchange failed", response.status, tokens?.error || "unexpected_token_response");
      throw new Error("O Mercado Pago não autorizou a conta. Tente novamente.");
    }

    const { error: saveError } = await admin.from("mercado_pago_contas").upsert({
      profile_id: oauthState.profile_id,
      mp_user_id: String(tokens.user_id),
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString(),
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "profile_id" });
    if (saveError) throw new Error("Não foi possível salvar a conta conectada.");
    destination.searchParams.set("mercado_pago", "conectado");
  } catch (error) {
    console.error("[mercado-pago-callback]", error);
    destination.searchParams.set("mercado_pago", "erro");
  }
  return Response.redirect(destination, 303);
});
