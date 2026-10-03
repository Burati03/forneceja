import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoCor from "@/assets/logo-cor.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Fornece Já" },
      { name: "description", content: "Crie uma nova senha para acessar sua conta Fornece Já." },
      { property: "og:title", content: "Redefinir senha — Fornece Já" },
      { property: "og:description", content: "Crie uma nova senha para acessar sua conta Fornece Já." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    const t = setTimeout(() => setMsg((m) => m || "Abra esta página pelo link enviado ao seu e-mail."), 4000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function salvar() {
    if (s1.length < 6) return setMsg("A senha precisa ter ao menos 6 caracteres.");
    if (s1 !== s2) return setMsg("As senhas não conferem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: s1 });
    setBusy(false);
    if (error) return setMsg("Não foi possível salvar. Peça um novo link e tente de novo.");
    setDone(true);
  }

  return (
    <div className="fj-body"><div className="fj-app"><div className="scr">
      <img className="lg" src={logoCor.url} alt="Fornece Já" />
      <h1>Nova senha</h1>
      {done ? (<>
        <p className="mute" style={{ marginTop: 8 }}>Senha alterada! Você já está conectado.</p>
        <a className="btn or" href="/">Ir para o aplicativo</a>
      </>) : ready ? (<>
        <p className="mute">Escolha uma nova senha para sua conta.</p>
        <label>Nova senha<input type="password" autoComplete="new-password" value={s1} onChange={(e) => setS1(e.target.value)} /></label>
        <label>Repita a nova senha<input type="password" autoComplete="new-password" value={s2} onChange={(e) => setS2(e.target.value)} /></label>
        <button className="btn or" disabled={busy} onClick={salvar}>{busy ? "Salvando..." : "Salvar nova senha"}</button>
        {msg && <p className="dm">{msg}</p>}
      </>) : (<>
        <p className="mute" style={{ marginTop: 8 }}>{msg || "Verificando seu link..."}</p>
        <a className="btn ghost" href="/">Voltar</a>
      </>)}
    </div></div></div>
  );
}
