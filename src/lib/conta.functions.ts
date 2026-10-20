import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const excluirMinhaConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: boolean; erro?: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    for (const bucket of ["fotos-perfil", "fotos-produtos"]) {
      const storage = supabaseAdmin.storage.from(bucket);
      const { data } = await storage.list(userId, { limit: 1000 });
      const paths = (data || []).filter((f) => f.id).map((f) => `${userId}/${f.name}`);
      if (paths.length) await storage.remove(paths);
    }
    const { error } = await supabaseAdmin.rpc("excluir_conta" as never, { _user_id: userId } as never);
    if (error) {
      console.error("[excluir-conta]", error);
      return { ok: false, erro: "Não foi possível excluir sua conta. Tente novamente." };
    }
    return { ok: true };
  });
