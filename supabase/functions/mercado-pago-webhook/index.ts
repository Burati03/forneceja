import { adminClient, sellerAccessToken } from "../_shared/mercado-pago.ts";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifySignature(secret: string, signature: string, requestId: string, paymentId: string) {
  const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2)));
  const timestamp = parts.ts;
  const received = parts.v1;
  if (!timestamp || !received || !/^\d+$/.test(timestamp)) return false;
  const manifest = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return safeEqual(expected, received.toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await req.json();
    const paymentId = String(body?.data?.id ?? new URL(req.url).searchParams.get("data.id") ?? "");
    if (!paymentId || (body?.type && body.type !== "payment")) return new Response("Ignored", { status: 200 });

    const secret = Deno.env.get("MP_WEBHOOK_SECRET");
    const signature = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");
    if (!secret || !signature || !requestId || !(await verifySignature(secret, signature, requestId, paymentId))) {
      return new Response("Invalid signature", { status: 401 });
    }

    const mpUserId = String(body?.user_id ?? "");
    if (!mpUserId) return new Response("Missing seller", { status: 400 });
    const admin = adminClient();
    const { data: account, error: accountError } = await admin
      .from("mercado_pago_contas")
      .select("profile_id")
      .eq("mp_user_id", mpUserId)
      .maybeSingle();
    if (accountError || !account) return new Response("Unknown seller", { status: 404 });

    const { token } = await sellerAccessToken(admin, account.profile_id);
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok) throw new Error("Não foi possível consultar o pagamento no Mercado Pago.");
    if (String(payment.collector_id) !== mpUserId) return new Response("Seller mismatch", { status: 403 });

    const orderId = Number(payment.external_reference);
    if (!Number.isSafeInteger(orderId) || orderId < 1) return new Response("Invalid order reference", { status: 400 });
    const { data: order, error: orderError } = await admin
      .from("pedidos")
      .select("id,qtd,preco_unitario,empresario_id,produto_id,status")
      .eq("id", orderId)
      .maybeSingle();
    if (orderError || !order) return new Response("Order not found", { status: 404 });
    const { data: product, error: productError } = await admin
      .from("produtos")
      .select("preco,fornecedor_id")
      .eq("id", order.produto_id)
      .maybeSingle();
    if (productError || !product || product.fornecedor_id !== account.profile_id) {
      return new Response("Order seller mismatch", { status: 403 });
    }
    const expectedAmount = Math.round(Number(order.preco_unitario) * order.qtd * 100);
    const paidAmount = Math.round(Number(payment.transaction_amount) * 100);
    if (payment.currency_id !== "BRL" || paidAmount !== expectedAmount) {
      return new Response("Payment amount mismatch", { status: 400 });
    }
    if (payment.external_reference !== String(order.id) || payment.metadata?.buyer_id !== order.empresario_id) {
      return new Response("Order reference mismatch", { status: 400 });
    }

    const paymentStatus = payment.status === "approved"
      ? "pago"
      : payment.status === "refunded" || payment.status === "charged_back"
        ? "estornado"
        : payment.status === "rejected" || payment.status === "cancelled"
          ? "falhou"
          : "pendente";
    const nextOrderStatus = paymentStatus === "pago" && order.status === "Aguardando pagamento"
      ? "Pago"
      : paymentStatus === "estornado" && order.status === "Pago"
        ? "Aguardando pagamento"
        : order.status;
    const { error: updateError } = await admin.from("pedidos").update({
      mercado_pago_pagamento_id: String(payment.id),
      pagamento_status: paymentStatus,
      status: nextOrderStatus,
    }).eq("id", order.id);
    if (updateError) throw new Error("Não foi possível atualizar o pedido.");
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[mercado-pago-webhook]", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
});
