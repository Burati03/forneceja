import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { askModel, GatewayError } from "./ai-gateway.server";

export type BuscaResultado = { ok: true; ids: number[]; resumo: string } | { ok: false; erro: string };

export const buscarComIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ pedido: z.string().trim().min(3).max(600) }).parse(d))
  .handler(async ({ data, context }): Promise<BuscaResultado> => {
    const { data: prods, error } = await context.supabase
      .from("produtos")
      .select("id,nome,preco,unidade,qtd_min,categoria,descricao,p:profiles!produtos_fornecedor_id_fkey(empresa,cidade)")
      .limit(300);
    if (error) return { ok: false, erro: "Não foi possível ler o catálogo." };
    const catalogo = (prods || []).map((p: any) =>
      `#${p.id} | ${p.nome} | ${p.categoria ?? ""} | R$ ${p.preco}/${p.unidade} (mín. ${p.qtd_min}) | ${p.p?.empresa ?? ""}, ${p.p?.cidade ?? ""} | ${p.descricao ?? ""}`,
    ).join("\n");
    try {
      const text = await askModel([
        {
          role: "system",
          content:
            "Você ajuda empresários brasileiros a achar produtos de atacado num catálogo. Escolha só produtos do catálogo que atendam à necessidade, do mais ao menos relevante (no máximo 8). " +
            'Responda APENAS com JSON: {"ids":[números],"resumo":"uma frase curta em português explicando a escolha"}. Se nada servir, ids vazio e explique no resumo.',
        },
        { role: "user", content: `Catálogo:\n${catalogo}\n\nNecessidade do empresário: ${data.pedido}` },
      ]);
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      const valid = new Set((prods || []).map((p) => p.id));
      const ids = (Array.isArray(json.ids) ? json.ids : []).map(Number).filter((i: number) => valid.has(i));
      return { ok: true, ids, resumo: String(json.resumo ?? "") };
    } catch (e) {
      if (e instanceof GatewayError) return { ok: false, erro: e.message };
      return { ok: false, erro: "A resposta da busca veio incompleta. Tente descrever de outro jeito." };
    }
  });
