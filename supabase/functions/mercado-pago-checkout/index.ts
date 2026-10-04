import { adminClient, authenticatedUser, corsHeaders, jsonResponse, sellerAccessToken } from "../_shared/mercado-pago.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  try {
    const admin = adminClient();
    const user = await authenticatedUser(req, admin);
    if (!user) return jsonResponse({ error: "Faça login novamente para pagar." }, 401);
    const { orderId } = await req.json();
    if (!Number.isSafeInteger(orderId) || orderId < 1) return jsonResponse({ error: "Pedido inválido." }, 400);

    const { data: order, error: orderError } = await admin
      .from("pedidos")
      .select("id,qtd,preco_unitario,status,comprador_aceitou,fornecedor_aceitou,empresario_id,mercado_pago_preferencia_id,produto_id")
      .eq("id", orderId)
      .eq("empresario_id", user.id)
      .maybeSingle();
    if (orderError) throw new Error("Não foi possível consultar o pedido.");
    if (!order || order.status !== "Aguardando pagamento" || !order.comprador_aceitou || !order.fornecedor_aceitou) {
      return jsonResponse({ error: "A negociação ainda não foi aceita pelos dois lados." }, 409);
    }

    const { data: product, error: productError } = await admin
      .from("produtos")
      .select("id,nome,preco,fornecedor_id")
      .eq("id", order.produto_id)
      .maybeSingle();
    if (productError) throw new Error("Não foi possível consultar o produto.");
    if (!product) return jsonResponse({ error: "O produto deste pedido não está mais disponível." }, 404);

    const { token } = await sellerAccessToken(admin, product.fornecedor_id);
    const appUrl = Deno.env.get("APP_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!appUrl || !supabaseUrl) throw new Error("As URLs do aplicativo e Supabase não estão configuradas.");
    const appOrigin = new URL(appUrl).origin;

    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{
          id: String(product.id),
          title: product.nome,
          quantity: order.qtd,
          currency_id: "BRL",
          unit_price: Number(order.preco_unitario),
        }],
        external_reference: String(order.id),
        metadata: { order_id: order.id, buyer_id: user.id, supplier_id: product.fornecedor_id },
        back_urls: {
          success: `${appOrigin}/?mercado_pago=sucesso&pedido=${order.id}`,
          pending: `${appOrigin}/?mercado_pago=pendente&pedido=${order.id}`,
          failure: `${appOrigin}/?mercado_pago=erro&pedido=${order.id}`,
        },
        notification_url: `${supabaseUrl}/functions/v1/mercado-pago-webhook`,
        statement_descriptor: "FORNECE JA",
      }),
    });
    const preference = await preferenceResponse.json();
    const checkoutUrl = token.startsWith("TEST-")
      ? preference.sandbox_init_point || preference.init_point
      : preference.init_point;
    if (!preferenceResponse.ok || typeof checkoutUrl !== "string" || typeof preference.id !== "string") {
      console.error("[mercado-pago-checkout] preference creation failed", preference);
      return jsonResponse({ error: "O Mercado Pago não conseguiu iniciar o pagamento. Tente novamente." }, 502);
    }
    const checkoutAddress = new URL(checkoutUrl);
    const checkoutHost = checkoutAddress.hostname;
    const validCheckoutHost = checkoutHost === "mercadopago.com.br" ||
      checkoutHost === "mercadopago.com" ||
      checkoutHost.endsWith(".mercadopago.com.br") ||
      checkoutHost.endsWith(".mercadopago.com");
    if (checkoutAddress.protocol !== "https:" || !validCheckoutHost) {
      throw new Error("O Mercado Pago retornou um endereço de checkout inválido.");
    }

    const { error: updateError } = await admin.from("pedidos").update({
      mercado_pago_preferencia_id: preference.id,
      pagamento_status: "pendente",
    }).eq("id", order.id);
    if (updateError) throw new Error("Não foi possível registrar o checkout do pedido.");

    return jsonResponse({ url: checkoutUrl });
  } catch (error) {
    console.error("[mercado-pago-checkout]", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Não foi possível iniciar o pagamento." }, 500);
  }
});
