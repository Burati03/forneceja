import { adminClient, authenticatedUser, corsHeaders, jsonResponse } from "../_shared/mercado-pago.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  try {
    const admin = adminClient();
    const user = await authenticatedUser(req, admin);
    if (!user) return jsonResponse({ error: "Faça login novamente para continuar." }, 401);

    const clientId = Deno.env.get("MP_CLIENT_ID");
    const redirectUri = Deno.env.get("MP_REDIRECT_URI");
    if (!clientId || !redirectUri) {
      return jsonResponse({ error: "A integração do Mercado Pago ainda não foi configurada." }, 503);
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("tipo")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw new Error("Não foi possível validar o perfil.");
    if (profile?.tipo !== "f") return jsonResponse({ error: "Somente fornecedores podem conectar uma conta de recebimento." }, 403);

    const stateBytes = crypto.getRandomValues(new Uint8Array(32));
    const state = btoa(String.fromCharCode(...stateBytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
    const { error: cleanupError } = await admin.from("mercado_pago_oauth_states").delete().lt("expires_at", new Date().toISOString());
    if (cleanupError) throw new Error("Não foi possível preparar a autorização da conta.");
    const { error: stateError } = await admin.from("mercado_pago_oauth_states").insert({
      state,
      profile_id: user.id,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (stateError) throw new Error("Não foi possível iniciar a conexão com o Mercado Pago.");

    const authUrl = new URL("https://auth.mercadopago.com/authorization");
    authUrl.search = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      platform_id: "mp",
      state,
      redirect_uri: redirectUri,
    }).toString();
    return jsonResponse({ url: authUrl.toString() });
  } catch (error) {
    console.error("[mercado-pago-connect]", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Não foi possível iniciar a conexão." }, 500);
  }
});
