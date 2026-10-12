import { createClient } from "npm:@supabase/supabase-js@2";
import {
  adminClient,
  authenticatedUser,
  corsHeaders,
  jsonResponse,
} from "../_shared/mercado-pago.ts";

async function removeUserFiles(
  admin: ReturnType<typeof adminClient>,
  bucket: string,
  userId: string,
) {
  const storage = admin.storage.from(bucket);
  let offset = 0;
  const paths: string[] = [];

  while (true) {
    const { data, error } = await storage.list(userId, { limit: 1000, offset });
    if (error) {
      if (error.statusCode === "404" || error.message.toLowerCase().includes("bucket not found"))
        return;
      throw new Error(`Não foi possível limpar os arquivos do bucket ${bucket}.`);
    }

    paths.push(...(data || []).filter((file) => file.id).map((file) => `${userId}/${file.name}`));

    if (!data || data.length < 1000) break;
    offset += data.length;
  }

  for (let index = 0; index < paths.length; index += 100) {
    const { error: removeError } = await storage.remove(paths.slice(index, index + 100));
    if (removeError) throw new Error(`Não foi possível remover arquivos do bucket ${bucket}.`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  try {
    const admin = adminClient();
    const user = await authenticatedUser(req, admin);
    if (!user) return jsonResponse({ error: "Entre novamente para excluir sua conta." }, 401);

    const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
    if (typeof body?.password !== "string" || !body.password)
      return jsonResponse({ error: "Digite sua senha para excluir a conta." }, 400);
    if (!user.email)
      return jsonResponse({ error: "Não foi possível validar a senha desta conta." }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publicKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!supabaseUrl || !publicKey)
      return jsonResponse({ error: "A autenticação do Supabase não está configurada." }, 503);
    const verifier = createClient(supabaseUrl, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: passwordError } = await verifier.auth.signInWithPassword({
      email: user.email,
      password: body.password,
    });
    if (passwordError)
      return jsonResponse({ error: "Senha incorreta. Confira e tente novamente." }, 401);

    await removeUserFiles(admin, "fotos-perfil", user.id);
    await removeUserFiles(admin, "fotos-produtos", user.id);

    const { error } = await admin.rpc("excluir_conta", { _user_id: user.id });
    if (error) {
      console.error("[excluir-conta] Database deletion failed", error);
      return jsonResponse({ error: "Não foi possível excluir sua conta. Tente novamente." }, 500);
    }

    return jsonResponse({ deleted: true });
  } catch (error) {
    console.error("[excluir-conta] Account deletion failed", error);
    return jsonResponse({ error: "Não foi possível excluir sua conta. Tente novamente." }, 500);
  }
});
