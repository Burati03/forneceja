import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { buscarComIA } from "@/lib/busca.functions";
import logoBranco from "@/assets/logo-branco.png.asset.json";
import logoCor from "@/assets/logo-cor.png.asset.json";
import logoEmp from "@/assets/logo-empilhado.png.asset.json";

const ICONS: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6", grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", msg: "M4 5h16v11H9l-5 4z",
  heart: "M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z", user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6",
  bell: "M6 17v-6a6 6 0 0 1 12 0v6l2 2H4zM10 21h4", back: "M15 5l-7 7 7 7", plus: "M12 5v14M5 12h14", box: "M12 3l9 4.5v9L12 21l-9-4.5v-9zM3 7.5l9 4.5 9-4.5M12 12v9",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6", send: "M4 12L20 4l-6 16-3-7z", truck: "M2 6h11v10H2zM13 10h4l3 3v3h-7zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2 6.5 20.2l1-6.2L3 9.6l6.2-.9z", trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4",
  pin: "M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", file: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6", card: "M3 6h18v12H3zM3 10h18M7 15h4",
  store: "M4 9l1-5h14l1 5M4 9h16M5 9v11h14V9M10 20v-6h4v6", briefcase: "M3 8h18v12H3zM9 8V5h6v3M3 13h18", sack: "M8 3h8l1 4 2 3v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9l2-3zM8 7h8M9 13h6",
  droplet: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z", coffee: "M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 9h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2",
  bottle: "M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3zM8 13h8", shirt: "M9 3l-6 3 2 5 3-1v11h8V10l3 1 2-5-6-3a3 3 0 0 1-6 0z", plug: "M9 3v5M15 3v5M7 8h10v4a5 5 0 0 1-10 0zM12 17v4",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z", battery: "M3 8h16v8H3zM21 11v2M6 11v2M9 11v2",
  can: "M6 6c0-1.5 2.7-3 6-3s6 1.5 6 3v12c0 1.5-2.7 3-6 3s-6-1.5-6-3zM6 6c0 1.5 2.7 3 6 3s6-1.5 6-3M6 12c0 1.5 2.7 3 6 3s6-1.5 6-3", bag: "M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2",
  help: "M9 9a3 3 0 1 1 5 2c-1.5 1-2 1.5-2 3M12 17h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
  camera: "M3 7h4l2-3h6l2 3h4v13H3zM12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
};
const Ic = ({ k, f }: { k: string; f?: boolean }) => (
  <svg className={"i" + (f ? " f" : "")} viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[k] || ICONS["box"]} /></svg>
);
const PL: Record<string, string> = { unidade: "unidades", caixa: "caixas", fardo: "fardos", pacote: "pacotes", "peça": "peças", "galão": "galões" };
const pl = (n: number, u: string) => (+n === 1 ? u : PL[u] || u);
const STs = ["Em negociação", "Aguardando envio", "Enviado", "Recusado"];
const CATS = ["Todos", "Alimentos", "Roupas", "Limpeza", "Eletrônicos"];
const brl = (n: number) => "R$ " + Number(n).toFixed(2).replace(".", ",");

type Me = { id: string; tipo: "f" | "e"; empresa: string; email: string | null; descricao: string | null; avatar_path: string | null; atuacao: string | null; categoria: string | null; cidade: string | null };
type Prod = { id: number; nome: string; preco: number; unidade: string; qtd_min: number; categoria: string | null; descricao: string | null; icone: string; views: number; fornecedor_id: string; fornecedor: string; cidade: string | null; fav?: boolean };
type Scr = "splash" | "login" | "tipo" | "cad" | "feed" | "favs" | "meus" | "det" | "conversas" | "chat" | "painel" | "pedidos" | "perfil" | "editar" | "novo" | "esqueci" | "ia" | "forn" | "avaliar";

const PSEL = "*, p:profiles!produtos_fornecedor_id_fkey(empresa,cidade)";
const mapP = (r: any): Prod => ({ ...r, preco: Number(r.preco), fornecedor: r.p?.empresa ?? "", cidade: r.p?.cidade ?? null });
const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <span className="stars" aria-label={`${n.toFixed(1)} de 5`}>{[1, 2, 3, 4, 5].map((i) => (
    <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i <= Math.round(n) ? "on" : ""}><path d={ICONS["star"]} /></svg>))}</span>
);
const media = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0);
const err = (e: any) => { if (e) throw new Error(e.message); };

export function ForneceApp() {
  const [scr, setScr] = useState<Scr>("splash");
  const [me, setMe] = useState<Me | null>(null);
  const [d, setD] = useState<any>(null);
  const [x, setX] = useState<any>(null);
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const [toastMsg, setToast] = useState("");
  const [help, setHelp] = useState(false);
  const [role, setRole] = useState<"f" | "e" | null>(null);
  const [docTipo, setDocTipo] = useState<"cpf" | "cnpj">("cpf");
  const [busy, setBusy] = useState(false);
  const [notif, setNotif] = useState<{ k: string; t: string; ic: string; tit: string; sub: string; act: () => void }[] | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ empresa: "", descricao: "", cidade: "", atuacao: "" });
  const fresh = useRef(0);
  const meRef = useRef<Me | null>(null);
  meRef.current = me;

  const toast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2400); };
  const signedPhoto = async (path: string | null | undefined) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("fotos-perfil").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const load = useCallback(async (s: Scr, arg?: any, opts?: { cat?: string; q?: string }) => {
    const m = meRef.current;
    const id = ++fresh.current;
    try {
      let data: any = null;
      const favIds = async () => {
        const { data: f } = await supabase.from("favoritos").select("produto_id");
        return new Set((f || []).map((r) => r.produto_id));
      };
      if (s === "feed" || s === "meus" || s === "favs") {
        let qb = supabase.from("produtos").select(PSEL).order("id", { ascending: false });
        const c = opts?.cat ?? cat;
        if (s === "feed" && c !== "Todos") qb = qb.eq("categoria", c);
        if (s === "meus" && m) qb = qb.eq("fornecedor_id", m.id);
        const { data: rows, error } = await qb; err(error);
        const fs = await favIds();
        let list = (rows || []).map(mapP).map((p) => ({ ...p, fav: fs.has(p.id) }));
        if (s === "favs") list = list.filter((p) => p.fav);
        const term = (opts?.q ?? q).trim().toLowerCase();
        if (s === "feed" && term) list = list.filter((p) => [p.nome, p.fornecedor, p.cidade || ""].some((v) => v.toLowerCase().includes(term)));
        data = list;
      } else if (s === "det") {
        await supabase.rpc("ver_produto", { _id: arg });
        const { data: r, error } = await supabase.from("produtos").select(PSEL).eq("id", arg).single(); err(error);
        const fs = await favIds();
        const { data: av } = await supabase.from("avaliacoes").select("nota").eq("fornecedor_id", r!.fornecedor_id);
        const notas = (av || []).map((a) => a.nota);
        data = { ...mapP(r), fav: fs.has(arg), nota: media(notas), nAval: notas.length };
      } else if (s === "forn") {
        const { data: pf, error } = await supabase.from("profiles").select("id,empresa,categoria,cidade,descricao,avatar_path,atuacao").eq("id", arg).single(); err(error);
        const { data: av } = await supabase.from("avaliacoes")
          .select("id,nota,comentario,criado_em,autor:profiles!avaliacoes_empresario_id_fkey(empresa)").eq("fornecedor_id", arg).order("id", { ascending: false });
        const { data: rows } = await supabase.from("produtos").select(PSEL).eq("fornecedor_id", arg).order("id", { ascending: false });
        data = { pf, avatarUrl: await signedPhoto(pf?.avatar_path), av: av || [], nota: media((av || []).map((a) => a.nota)), prods: (rows || []).map(mapP) };
      } else if (s === "perfil" && m) {
        const { data: pf, error } = await supabase.from("profiles").select("id,tipo,empresa,email,descricao,avatar_path,atuacao,categoria,cidade").eq("id", m.id).single(); err(error);
        setMe(pf as Me);
        setAvatarUrl(await signedPhoto(pf?.avatar_path));
        data = pf;
      } else if (s === "conversas" && m) {
        const { data: msgs, error } = await supabase.from("mensagens").select("de_id,para_id,texto,id").order("id", { ascending: false }); err(error);
        const seen = new Map<string, string>();
        (msgs || []).forEach((r) => { const o = r.de_id === m.id ? r.para_id : r.de_id; if (!seen.has(o)) seen.set(o, r.texto); });
        const ids = [...seen.keys()];
        const { data: ps } = ids.length ? await supabase.from("profiles").select("id,empresa").in("id", ids) : { data: [] };
        const nm = new Map((ps || []).map((p) => [p.id, p.empresa]));
        data = ids.map((i) => ({ id: i, empresa: nm.get(i) || "—", texto: seen.get(i) }));
      } else if (s === "chat" && m) {
        const { data: com } = await supabase.from("profiles").select("id,empresa").eq("id", arg).single();
        const { data: msgs, error } = await supabase.from("mensagens").select("de_id,texto,criado_em")
          .or(`and(de_id.eq.${m.id},para_id.eq.${arg}),and(de_id.eq.${arg},para_id.eq.${m.id})`).order("id"); err(error);
        data = { com, msgs: (msgs || []).map((r) => ({ ...r, hora: new Date(r.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) })) };
      } else if (s === "painel" && m) {
        const { data: ps } = await supabase.from("produtos").select("id,views").eq("fornecedor_id", m.id);
        const { count: msgs } = await supabase.from("mensagens").select("id", { count: "exact", head: true }).eq("para_id", m.id);
        const { count: peds } = await supabase.from("pedidos").select("id", { count: "exact", head: true });
        data = { produtos: ps?.length || 0, views: (ps || []).reduce((a, p) => a + p.views, 0), mensagens: msgs || 0, pedidos: peds || 0 };
      } else if (s === "pedidos") {
        const { data: rows, error } = await supabase.from("pedidos")
          .select("id,qtd,status,empresario_id,produto:produtos(nome,unidade,fornecedor_id),cliente:profiles!pedidos_empresario_id_fkey(empresa)").order("id", { ascending: false }); err(error);
        const { data: avs } = await supabase.from("avaliacoes").select("pedido_id");
        const aval = new Set((avs || []).map((a) => a.pedido_id));
        data = (rows || []).map((o: any) => ({ avaliado: aval.has(o.id), fornecedor_id: o.produto?.fornecedor_id, id: o.id, qtd: o.qtd, status: o.status, nome: o.produto?.nome, unidade: o.produto?.unidade, cliente: o.cliente?.empresa, cliente_id: o.empresario_id }));
      }
      if (id !== fresh.current) return;
      setD(data); setX(arg); setScr(s);
    } catch (e: any) { toast(e.message || "Erro de conexão"); }
  }, [cat, q]);

  const go = (s: Scr, arg?: any) => load(s, arg);
  const home = (m = me) => { if (m) { meRef.current = m; load(m.tipo === "f" ? "painel" : "feed"); } };

  const loadMe = useCallback(async (): Promise<Me | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    let { data: p } = await supabase.from("profiles").select("id,tipo,empresa,email,descricao,avatar_path,atuacao,categoria,cidade").eq("id", user.id).maybeSingle();
    if (!p) {
      const md: any = user.user_metadata || {};
      if (!md.tipo) return null;
      const ins = { id: user.id, tipo: md.tipo, empresa: md.empresa || user.email || "Minha empresa", email: user.email ?? null, categoria: md.categoria || null, cidade: md.cidade || null, atuacao: md.atuacao || null, descricao: null, avatar_path: null };
      const { error } = await supabase.from("profiles").insert(ins);
      if (error) return null;
      await supabase.from("profiles_private").insert({ id: user.id, documento: md.documento || null, documento_tipo: md.documento_tipo || "cnpj", telefone: md.telefone || null });
      p = ins as any;
    }
    return p as Me;
  }, []);

  useEffect(() => {
    loadMe().then((m) => { if (m) { setMe(m); home(m); } });
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === "SIGNED_OUT") { setMe(null); setScr("splash"); }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const val = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value || "";
  const togglePw = (id: string, btn: HTMLButtonElement) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) return;
    const show = el.type === "password";
    el.type = show ? "text" : "password";
    btn.setAttribute("aria-pressed", String(show));
    btn.textContent = show ? "Ocultar" : "Mostrar";
  };
  const Pw = ({ id, label, autoComplete, onEnter }: { id: string; label: string; autoComplete: string; onEnter?: () => void }) => (
    <label>{label}<span className="pw-wrap">
      <input id={id} type="password" autoComplete={autoComplete} defaultValue="" readOnly onFocus={(e) => e.currentTarget.removeAttribute("readonly")} onKeyDown={(e) => e.key === "Enter" && onEnter?.()} />
      <button type="button" className="pw-eye" aria-pressed="false" onClick={(e) => togglePw(id, e.currentTarget)}>Mostrar</button>
    </span></label>
  );

  async function login() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: val("em").trim().toLowerCase(), password: val("sn") });
    setBusy(false);
    if (error) return toast(error.message.includes("confirm") ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha incorretos.");
    const m = await loadMe();
    if (!m) return toast("Não foi possível carregar seu perfil.");
    setMe(m); home(m);
  }

  async function cadastrar() {
    const f = role === "f", dt = f ? "cnpj" : docTipo;
    const empresa = val("c1").trim(), email = val("c4").trim().toLowerCase(), senha = val("c5");
    const documento = val("c2").replace(/\D/g, "");
    if (!empresa || !email.includes("@")) return toast("Preencha seu nome ou nome da empresa e um e-mail válido.");
    if (senha.length < 6) return toast("A senha precisa ter ao menos 6 caracteres.");
    if (senha !== val("c5b")) return toast("As senhas não conferem. Digite a mesma senha nos dois campos.");
    if (!f && documento.length !== (dt === "cpf" ? 11 : 14)) return toast(`Informe um ${dt === "cpf" ? "CPF" : "CNPJ"} válido.`);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password: senha,
      options: { emailRedirectTo: window.location.origin, data: { tipo: role, empresa, documento, documento_tipo: dt, telefone: val("c3"), categoria: val("c6"), cidade: f ? val("c7") : null, atuacao: val("c8") || null } },
    });
    setBusy(false);
    if (error) return toast(error.message.includes("registered") ? "Este e-mail já está cadastrado." : error.message);
    if (!data.session) { toast("Enviamos um link de confirmação para seu e-mail."); setScr("login"); return; }
    const m = await loadMe(); if (m) { setMe(m); home(m); }
  }

  async function fav(id: number) {
    if (!me) return;
    if (d.fav) await supabase.from("favoritos").delete().eq("produto_id", id).eq("user_id", me.id);
    else await supabase.from("favoritos").insert({ user_id: me.id, produto_id: id });
    setD({ ...d, fav: !d.fav });
    toast(d.fav ? "Removido dos favoritos" : "Salvo nos favoritos");
  }

  async function pedir(p: Prod) {
    if (!me) return;
    const qtd = Math.max(parseInt(val("qt")) || p.qtd_min, p.qtd_min);
    const { error } = await supabase.from("pedidos").insert({ produto_id: p.id, empresario_id: me.id, qtd });
    if (error) return toast(error.message);
    toast(`Orçamento de ${qtd} ${pl(qtd, p.unidade)} enviado!`); go("pedidos");
  }

  async function snd() {
    const el = document.getElementById("mi") as HTMLInputElement; const t = el.value.trim();
    if (!t || !me) return;
    const { error } = await supabase.from("mensagens").insert({ de_id: me.id, para_id: x, texto: t });
    if (error) return toast("Mensagem inválida.");
    el.value = ""; go("chat", x);
  }

  async function st(id: number, s: string) {
    const { error } = await supabase.rpc("mudar_status", { _id: id, _status: s });
    if (error) return toast(error.message);
    toast("Pedido atualizado"); go("pedidos");
  }

  async function publicar() {
    if (!me) return;
    const preco = parseFloat(val("n2").replace(",", "."));
    const nome = val("n1").trim();
    if (!nome || !(preco > 0)) return toast("Informe o nome e um preço maior que zero.");
    const categoria = val("n4");
    const icone = ({ Alimentos: "sack", Roupas: "shirt", Limpeza: "bottle", "Eletrônicos": "plug" } as any)[categoria] || "box";
    const { error } = await supabase.from("produtos").insert({ fornecedor_id: me.id, nome, preco, unidade: val("n6") || "unidade", qtd_min: parseInt(val("n3")) || 1, categoria, descricao: val("n5") || "Sem descrição.", icone });
    if (error) return toast(error.message);
    toast("Produto publicado!"); go("meus");
  }

  const buscar = useServerFn(buscarComIA);
  const [ia, setIa] = useState<{ texto: string; busy: boolean; resumo: string; prods: Prod[] | null }>({ texto: "", busy: false, resumo: "", prods: null });
  async function buscarIA() {
    const pedido = ia.texto.trim();
    if (pedido.length < 3) return toast("Descreva o que você precisa.");
    setIa((v) => ({ ...v, busy: true, prods: null, resumo: "" }));
    try {
      const res = await buscar({ data: { pedido } });
      if (!res.ok) { setIa((v) => ({ ...v, busy: false })); return toast(res.erro); }
      let prods: Prod[] = [];
      if (res.ids.length) {
        const { data: rows } = await supabase.from("produtos").select(PSEL).in("id", res.ids);
        const byId = new Map((rows || []).map((r: any) => [r.id, mapP(r)]));
        prods = res.ids.map((i) => byId.get(i)).filter(Boolean) as Prod[];
      }
      setIa((v) => ({ ...v, busy: false, resumo: res.resumo, prods }));
    } catch { setIa((v) => ({ ...v, busy: false })); toast("Não foi possível fazer a busca agora."); }
  }

  async function esqueci() {
    const email = val("re").trim().toLowerCase();
    if (!email.includes("@")) return toast("Informe um e-mail válido.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
    setBusy(false);
    if (error) return toast("Não foi possível enviar agora. Tente de novo em instantes.");
    toast("Se o e-mail estiver cadastrado, você receberá um link."); setScr("login");
  }

  const [nota, setNota] = useState(0);
  async function enviarAvaliacao() {
    if (!me || !x) return;
    if (!nota) return toast("Escolha de 1 a 5 estrelas.");
    const comentario = val("ac").trim() || null;
    const { error } = await supabase.from("avaliacoes").insert({ pedido_id: x.id, fornecedor_id: x.fornecedor_id, empresario_id: me.id, nota, comentario });
    if (error) return toast(error.code === "23505" ? "Você já avaliou este pedido." : "Só é possível avaliar pedidos enviados.");
    toast("Obrigado pela avaliação!"); go("pedidos");
  }

  const editarPerfil = () => {
    if (!me) return;
    setForm({ empresa: me.empresa, descricao: me.descricao || "", cidade: me.cidade || "", atuacao: me.atuacao || "" });
    setFoto(null); setFotoPreview(null); setScr("editar");
  };
  async function salvarPerfil() {
    if (!me || busy) return;
    const nome = form.empresa.trim();
    if (!nome) return toast("Informe o nome da empresa, loja ou seu nome.");
    if (form.descricao.trim().length > 1000) return toast("A descrição pode ter até 1000 caracteres.");
    setBusy(true);
    let path = me.avatar_path;
    let novoPath: string | null = null;
    try {
      if (foto) {
        const ext = foto.type === "image/png" ? "png" : foto.type === "image/webp" ? "webp" : "jpg";
        novoPath = `${me.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("fotos-perfil").upload(novoPath, foto, { contentType: foto.type });
        err(error); path = novoPath;
      }
      const { data: updated, error } = await supabase.from("profiles")
        .update({ empresa: nome, descricao: form.descricao.trim() || null, cidade: form.cidade.trim() || null, atuacao: form.atuacao || null, avatar_path: path })
        .eq("id", me.id).select("id,tipo,empresa,email,descricao,avatar_path,atuacao,categoria,cidade").single();
      err(error);
      if (novoPath && me.avatar_path) await supabase.storage.from("fotos-perfil").remove([me.avatar_path]);
      setMe(updated as Me); setFoto(null); setFotoPreview(null);
      await load("perfil"); toast("Perfil atualizado!");
    } catch (e: any) {
      if (novoPath) await supabase.storage.from("fotos-perfil").remove([novoPath]);
      toast(e.message || "Não foi possível salvar o perfil.");
    } finally { setBusy(false); }
  }
  const escolherFoto = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast("Escolha uma imagem JPG, PNG ou WebP.");
    if (file.size > 2 * 1024 * 1024) return toast("A foto deve ter até 2 MB.");
    setFoto(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const Back = ({ to, children }: { to: () => void; children?: React.ReactNode }) => (
    <div className="top"><button className="ib" aria-label="Voltar" onClick={to}><Ic k="back" /></button>{children}</div>
  );
  const HelpButton = () => <button className="ib" aria-label="Ajuda" title="Ajuda" onClick={() => setHelp(true)}><Ic k="help" /></button>;
  const Title = ({ children }: { children: React.ReactNode }) => <div className="screen-title"><h1>{children}</h1><HelpButton /></div>;
  const Avatar = ({ url, name }: { url?: string | null; name: string }) => <div className="profile-avatar">{url ? <img src={url} alt={`Foto de ${name}`} /> : <Ic k="user" />}</div>;
  const Nav = ({ a }: { a: string }) => {
    const f = me?.tipo === "f";
    const it: [Scr, string, string][] = f
      ? [["painel", "home", "Início"], ["meus", "box", "Produtos"], ["conversas", "msg", "Mensagens"], ["pedidos", "receipt", "Pedidos"], ["perfil", "user", "Perfil"]]
      : [["feed", "home", "Início"], ["conversas", "msg", "Mensagens"], ["favs", "heart", "Favoritos"], ["perfil", "user", "Perfil"]];
    return <nav className="nav">{it.map((i) => (
      <button key={i[2]} className={i[0] === a ? "on" : ""} onClick={() => go(i[0])}><Ic k={i[1]} />{i[2]}</button>
    ))}</nav>;
  };
  const Card = ({ p }: { p: Prod }) => (
    <div className="pc"><div className="pic"><Ic k={p.icone} /></div><div style={{ flex: 1 }}>
      <div className="nm">{p.nome}</div><div className="mute">{p.fornecedor} · {p.cidade || ""}</div>
      <div className="price">{brl(p.preco)} / {p.unidade}</div>
      <button className="sm" onClick={() => go("det", p.id)}>Ver detalhes</button></div></div>
  );
  const abrirNotif = async () => {
    if (notif) return setNotif(null);
    const m = meRef.current; if (!m) return;
    setNotif([]);
    const { data: msgs } = await supabase.from("mensagens").select("id,de_id,texto,criado_em").eq("para_id", m.id).order("id", { ascending: false }).limit(6);
    const { data: peds } = await supabase.from("pedidos").select("id,status,criado_em,produto:produtos(nome)").order("id", { ascending: false }).limit(5);
    const ids = [...new Set((msgs || []).map((r) => r.de_id))];
    const { data: ps } = ids.length ? await supabase.from("profiles").select("id,empresa").in("id", ids) : { data: [] };
    const nm = new Map((ps || []).map((p) => [p.id, p.empresa]));
    const its = [
      ...(msgs || []).map((r) => ({ k: "m" + r.id, t: r.criado_em, ic: "msg", tit: nm.get(r.de_id) || "Mensagem", sub: r.texto, act: () => go("chat", r.de_id) })),
      ...(peds || []).map((o: any) => ({ k: "p" + o.id, t: o.criado_em, ic: "receipt", tit: `Pedido: ${o.produto?.nome ?? ""}`, sub: o.status, act: () => go("pedidos") })),
    ].sort((a, b) => (a.t < b.t ? 1 : -1));
    setNotif(its);
  };
  const Bell = () => (
    <div className="notif-wrap">
      <button className="ib" aria-label="Notificações" aria-expanded={!!notif} onClick={abrirNotif}><Ic k="bell" /></button>
      {notif && <div className="notif-pop" role="dialog" aria-label="Notificações">
        <b>Notificações</b>
        {notif.length ? notif.map((n) => (
          <button key={n.k} className="notif-it" onClick={() => { setNotif(null); n.act(); }}><Ic k={n.ic} /><span><b>{n.tit}</b><span className="mute">{n.sub}</span></span></button>
        )) : <p className="mute">Nenhuma novidade por enquanto.</p>}
      </div>}
    </div>
  );
  const searchT = useRef<any>(null);

  let body: React.ReactNode = null;
  switch (scr) {
    case "splash": body = (
      <div className="splash"><button className="help-btn" onClick={() => setHelp(true)}>Ajuda</button>
        <img src={logoEmp.url} alt="Fornece Já — fornecedores que impulsionam seu negócio" />
        <button className="btn or" onClick={() => setScr("login")}>Entrar</button>
        <button className="btn ghost" onClick={() => { setRole(null); setScr("tipo"); }}>Criar conta</button>
        <p className="mute" style={{ textAlign: "center", marginTop: 18, color: "#fffc" }}>Fornecedor ou comprador</p></div>); break;
    case "login": body = (
      <div className="scr"><Back to={() => setScr("splash")} /><img className="lg" src={logoCor.url} alt="Fornece Já" />
        <h1>Entrar</h1><p className="mute">Use o e-mail cadastrado na sua conta.</p>
        <p className="login-explain"><b>Comprador</b> é quem busca produtos para comprar, seja pessoa física ou jurídica, indústria, loja ou empresa. <b>Fornecedor</b> divulga produtos e atende pedidos.</p>
        <label>E-mail<input id="em" type="email" autoComplete="username" /></label>
        <Pw id="sn" label="Senha" autoComplete="current-password" onEnter={login} />
        <button className="btn or" disabled={busy} onClick={login}>{busy ? "Entrando..." : "Entrar"}</button>
        <button className="linkbtn" onClick={() => setScr("esqueci")}>Esqueci minha senha</button>
        <button className="btn ghost" onClick={() => setScr("tipo")}>Criar conta</button></div>); break;
    case "esqueci": body = (
      <div className="scr"><Back to={() => setScr("login")} /><h1>Recuperar senha</h1>
        <p className="mute">Enviaremos um link para você criar uma nova senha.</p>
        <label>E-mail da conta<input id="re" type="email" autoComplete="username" onKeyDown={(e) => e.key === "Enter" && esqueci()} /></label>
        <button className="btn or" disabled={busy} onClick={esqueci}>{busy ? "Enviando..." : "Enviar link"}</button></div>); break;
    case "ia": body = (<>
      <div className="scr"><Back to={() => go("feed")} /><h1>Busca inteligente</h1>
        <p className="mute">Conte o que seu negócio precisa e encontramos produtos do catálogo para você.</p>
        <label>O que você precisa?<textarea rows={4} value={ia.texto} maxLength={600} placeholder="Ex.: Tenho um restaurante e preciso abastecer a cozinha e a limpeza para o mês"
          onChange={(e) => setIa((v) => ({ ...v, texto: e.target.value }))} /></label>
        <button className="btn or" disabled={ia.busy} onClick={buscarIA}><Ic k="star" />{ia.busy ? "Procurando..." : "Encontrar produtos"}</button>
        {ia.resumo && <p className="ai-note">{ia.resumo}</p>}
        {ia.prods && (ia.prods.length ? ia.prods.map((p) => <Card key={p.id} p={p} />) : <p className="mute" style={{ marginTop: 12 }}>Nenhum produto do catálogo atende a esse pedido.</p>)}
      </div><Nav a="feed" /></>); break;
    case "forn": {
      const own = me?.id === d.pf.id;
      body = (<><div className="scr"><Back to={() => (own ? go("perfil") : go("feed"))}><HelpButton /></Back>
        <div className="profile-summary"><Avatar url={d.avatarUrl} name={d.pf.empresa} /><div><h1>{d.pf.empresa}</h1><p className="mute">{[d.pf.atuacao, d.pf.categoria, d.pf.cidade].filter(Boolean).join(" · ")}</p></div></div>
        {d.pf.descricao && <p className="profile-description">{d.pf.descricao}</p>}
        {own && <button className="menu" onClick={editarPerfil}><Ic k="user" />Editar perfil</button>}
        <div className="rating-box"><b>{d.av.length ? d.nota.toFixed(1) : "—"}</b><div><Stars n={d.nota} size={20} />
          <div className="mute">{d.av.length ? `${d.av.length} avaliaç${d.av.length === 1 ? "ão" : "ões"}` : "Ainda sem avaliações"}</div></div></div>
        <h2>Comentários</h2>
        {d.av.length ? d.av.map((a: any) => (
          <div key={a.id} className="pc" style={{ display: "block" }}><Stars n={a.nota} />
            <div className="nm" style={{ fontSize: 14, marginTop: 4 }}>{a.autor?.empresa ?? "Comprador"}</div>
            {a.comentario && <p style={{ marginTop: 4 }}>{a.comentario}</p>}
            <div className="mute" style={{ fontSize: 12, marginTop: 4 }}>{new Date(a.criado_em).toLocaleDateString("pt-BR")}</div></div>
        )) : <p className="mute">Nenhum comentário ainda.</p>}
        <h2>Produtos</h2>{d.prods.length ? d.prods.map((p: Prod) => <Card key={p.id} p={p} />) : <p className="mute">Sem produtos publicados.</p>}
      </div><Nav a={own ? "perfil" : "feed"} /></>);
      break;
    }
    case "avaliar": body = (
      <div className="scr"><Back to={() => go("pedidos")} /><h1>Avaliar pedido</h1>
        <p className="mute">{x.qtd} {pl(x.qtd, x.unidade)} de {x.nome}</p>
        <label>Sua nota</label>
        <div className="star-pick" role="radiogroup" aria-label="Nota">{[1, 2, 3, 4, 5].map((i) => (
          <button key={i} role="radio" aria-checked={nota === i} aria-label={`${i} estrela${i > 1 ? "s" : ""}`} className={i <= nota ? "on" : ""} onClick={() => setNota(i)}>
            <svg viewBox="0 0 24 24"><path d={ICONS["star"]} /></svg></button>))}</div>
        <label>Comentário (opcional)<textarea id="ac" rows={4} maxLength={1000} placeholder="Como foi a negociação, a entrega e a qualidade?" /></label>
        <button className="btn or" onClick={enviarAvaliacao}>Enviar avaliação</button></div>); break;
    case "tipo": body = (
      <div className="scr"><Back to={() => setScr("splash")} /><h1>Criar conta</h1><p className="mute">Selecione o tipo de conta</p>
        <button className={"opt " + (role === "f" ? "sel" : "")} onClick={() => setRole("f")}><Ic k="store" /><span><b>Sou Fornecedor</b><span className="mute">Quero divulgar meus produtos</span></span></button>
        <button className={"opt " + (role === "e" ? "sel" : "")} onClick={() => { setRole("e"); setDocTipo("cpf"); }}><Ic k="briefcase" /><span><b>Sou Comprador</b><span className="mute">Pessoa física ou jurídica que busca produtos para comprar</span></span></button>
        <button className="btn or" onClick={() => (role ? setScr("cad") : toast("Escolha um tipo de conta"))}>Continuar</button></div>); break;
    case "cad": {
      const f = role === "f", pf = !f && docTipo === "cpf";
      body = (
        <div className="scr"><Back to={() => setScr("tipo")} /><h1>Cadastro {f ? "Fornecedor" : "Comprador"}</h1>
          <div className="person-type" role="group" aria-label="Tipo de pessoa">
            <button className={"chip " + (pf ? "on" : "")} aria-pressed={pf} onClick={() => setDocTipo("cpf")}>Pessoa física</button>
            <button className={"chip " + (!pf ? "on" : "")} aria-pressed={!pf} onClick={() => setDocTipo("cnpj")}>Pessoa jurídica</button></div>
          <label>{pf ? "Nome completo" : "Nome da empresa"}<input id="c1" /></label>
          <label>{pf ? "CPF" : "CNPJ"}<input id="c2" key={pf ? "cpf" : "cnpj"} inputMode="numeric" maxLength={pf ? 14 : 18} placeholder={pf ? "000.000.000-00" : "00.000.000/0000-00"} /></label>
          <label>Telefone<input id="c3" type="tel" /></label>
          {f && <label>Cidade / UF<input id="c7" placeholder="Campinas, SP" /></label>}
          <label>E-mail<input id="c4" type="email" autoComplete="off" defaultValue="" /></label>
          <Pw id="c5" label="Senha (mín. 6 caracteres)" autoComplete="new-password" />
          <Pw id="c5b" label="Confirmar senha" autoComplete="new-password" onEnter={cadastrar} />
          <label>{f ? "Categoria" : "Segmento"}<select id="c6">{(f ? CATS.slice(1) : ["Restaurante", "Mercado", "Loja de roupas", "Assistência técnica"]).map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>Atividade<select id="c8" defaultValue=""><option value="">Selecione (opcional)</option><option>Indústria</option><option>Loja/empresa</option></select></label>
          <button className="btn or" disabled={busy} onClick={cadastrar}>{busy ? "Cadastrando..." : "Cadastrar"}</button></div>);
      break;
    }
    case "feed": body = (<>
      <div className="hd"><img src={logoBranco.url} alt="Fornece Já" /><div className="header-actions"><HelpButton /><Bell /></div></div>
      <div className="scr"><div className="top"><input style={{ margin: 0 }} placeholder="Buscar produto, fornecedor ou cidade" value={q}
        onChange={(e) => { const v = e.target.value; setQ(v); clearTimeout(searchT.current); searchT.current = setTimeout(() => load("feed", undefined, { q: v }), 250); }} /></div>
        <div className="chips">{CATS.map((c) => <button key={c} className={"chip " + (cat === c ? "on" : "")} onClick={() => { setCat(c); load("feed", undefined, { cat: c }); }}>{c}</button>)}</div>
        {me?.tipo === "e" && <button className="ai-cta" onClick={() => setScr("ia")}><Ic k="star" /><span><b>Busca inteligente</b><span className="mute">Descreva o que precisa e a IA encontra os produtos</span></span></button>}
        <h2>Destaques para você</h2>
        {d?.length ? d.map((p: Prod) => <Card key={p.id} p={p} />) : <p className="mute">Nada encontrado. Tente outro termo ou categoria.</p>}
      </div><Nav a="feed" /></>); break;
    case "favs": body = (<><div className="scr"><Title>Favoritos</Title>
      {d?.length ? d.map((p: Prod) => <Card key={p.id} p={p} />) : <p className="mute" style={{ marginTop: 12 }}>Toque no coração nos detalhes de um produto para salvá-lo aqui.</p>}
    </div><Nav a="favs" /></>); break;
    case "det": {
      const p = d as Prod, mine = me?.tipo === "f";
      body = (
        <div className="scr"><Back to={() => go(mine ? "meus" : "feed")}><span style={{ flex: 1 }} />
          <button className="ib fav" aria-label="Favoritar" onClick={() => fav(p.id)}><Ic k="heart" f={!!p.fav} /></button></Back>
          <div className="hero"><Ic k={p.icone} /></div>
          <h1 style={{ marginTop: 14 }}>{p.nome}</h1><button className="forn-link" onClick={() => go("forn", p.fornecedor_id)}>
            <span className="mute">Fornecedor: <b>{p.fornecedor}</b></span>
            <span className="forn-rate"><Stars n={(d as any).nota} />{(d as any).nAval ? ` ${(d as any).nota.toFixed(1)} (${(d as any).nAval})` : " Sem avaliações"}</span></button>
          <div className="row"><span>Preço atacado</span><span className="price">{brl(p.preco)} / {p.unidade}</span></div>
          <div className="row"><span>Quantidade mínima</span><b>{p.qtd_min} {pl(p.qtd_min, p.unidade)}</b></div>
          <div className="row"><span>Origem</span><b>{p.cidade || "—"}</b></div>
          <div className="row"><span>Visualizações</span><b>{p.views}</b></div>
          <h2>Descrição</h2><p>{p.descricao}</p>
          {!mine && <>
            <button className="btn" onClick={() => go("chat", p.fornecedor_id)}><Ic k="msg" />Conversar</button>
            <label>Quantidade desejada ({pl(2, p.unidade)})<input id="qt" type="number" min={p.qtd_min} defaultValue={p.qtd_min} /></label>
            <button className="btn ghost" onClick={() => pedir(p)}><Ic k="receipt" />Solicitar orçamento</button></>}
        </div>);
      break;
    }
    case "conversas": body = (<><div className="scr"><Title>Mensagens</Title>
      {d?.length ? d.map((c: any) => (
        <button key={c.id} className="menu" style={{ display: "block", textAlign: "left" }} onClick={() => go("chat", c.id)}><b>{c.empresa}</b><div className="mute">{c.texto}</div></button>
      )) : <p className="mute" style={{ marginTop: 12 }}>Nenhuma conversa ainda. Abra um produto e toque em Conversar.</p>}
    </div><Nav a="conversas" /></>); break;
    case "chat": body = (<>
      <div style={{ padding: "14px 18px", display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid var(--line)" }}>
        <button className="ib" aria-label="Voltar" onClick={() => go("conversas")}><Ic k="back" /></button><b>{d.com?.empresa}</b></div>
      <div className="scr"><div className="chat">{d.msgs.length ? d.msgs.map((m: any, i: number) => (
        <div key={i} className={"m " + (m.de_id === me?.id ? "me" : "")}>{m.texto}<small>{m.hora}</small></div>
      )) : <p className="mute">Diga olá para começar a conversa.</p>}</div></div>
      <div className="send"><input id="mi" placeholder="Digite sua mensagem..." onKeyDown={(e) => e.key === "Enter" && snd()} />
        <button aria-label="Enviar" onClick={snd}><Ic k="send" /></button></div></>); break;
    case "painel": body = (<>
      <div className="hd"><img src={logoBranco.url} alt="Fornece Já" /><div className="header-actions"><HelpButton /><Bell /></div></div>
      <div className="scr"><h1>Olá, {me?.empresa}!</h1><p className="mute">Seu painel de hoje</p>
        <div className="grid" style={{ marginTop: 12 }}>
          <div className="kpi"><b>{d.produtos}</b>Produtos ativos</div><div className="kpi"><b>{d.views}</b>Visualizações</div>
          <div className="kpi"><b>{d.mensagens}</b>Mensagens</div><div className="kpi"><b>{d.pedidos}</b>Pedidos recebidos</div></div>
        <button className="menu" onClick={() => setScr("novo")}><Ic k="plus" />Adicionar produto</button>
        <button className="menu" onClick={() => go("meus")}><Ic k="box" />Meus produtos</button>
        <button className="menu" onClick={() => go("pedidos")}><Ic k="receipt" />Pedidos recebidos</button>
        <button className="menu" onClick={() => setScr("perfil")}><Ic k="user" />Meu perfil</button>
      </div><Nav a="painel" /></>); break;
    case "meus": body = (<><div className="scr"><Title>Meus produtos</Title>
      {d?.length ? d.map((p: Prod) => <Card key={p.id} p={p} />) : <p className="mute" style={{ marginTop: 12 }}>Você ainda não publicou produtos.</p>}
      <button className="btn or" onClick={() => setScr("novo")}>Adicionar produto</button></div><Nav a="meus" /></>); break;
    case "pedidos": {
      const f = me?.tipo === "f";
      body = (<><div className="scr"><Title>{f ? "Pedidos recebidos" : "Meus pedidos"}</Title>
        {d?.length ? d.map((o: any) => (
          <div key={o.id} className="pc" style={{ display: "block" }}>
            <div className="nm">{f ? o.cliente : o.nome}</div><div className="mute">{o.qtd} {pl(o.qtd, o.unidade)} de {o.nome}</div>
            <span className={"tag t" + STs.indexOf(o.status)}>{o.status}</span>
            {f && <div className="act">
              {o.status === "Em negociação" && <><button className="btn sm2" onClick={() => st(o.id, "Aguardando envio")}>Aceitar</button>
                <button className="btn ghost sm2" onClick={() => st(o.id, "Recusado")}>Recusar</button></>}
              {o.status === "Aguardando envio" && <button className="btn or sm2" onClick={() => st(o.id, "Enviado")}>Marcar enviado</button>}
              <button className="btn ghost sm2" onClick={() => go("chat", o.cliente_id)}>Conversar</button></div>}
            {!f && o.status === "Enviado" && (o.avaliado
              ? <div className="mute" style={{ marginTop: 6 }}>Você já avaliou este pedido.</div>
              : <button className="btn or sm2" onClick={() => { setNota(0); setX(o); setScr("avaliar"); }}><Ic k="star" />Avaliar fornecedor</button>)}
          </div>)) : <p className="mute" style={{ marginTop: 12 }}>Nenhum pedido por enquanto.</p>}
      </div><Nav a="pedidos" /></>);
      break;
    }
    case "perfil": body = (<><div className="scr"><div className="screen-title"><span /><HelpButton /></div>
      <div className="profile-summary"><Avatar url={avatarUrl} name={me?.empresa || "Perfil"} /><div><h1>{me?.empresa}</h1><p className="mute">{me?.tipo === "f" ? "Fornecedor" : "Comprador"}{me?.atuacao ? ` · ${me.atuacao}` : ""}</p></div></div>
      <p className="mute">{me?.email}{me?.cidade ? ` · ${me.cidade}` : ""}</p>
      {me?.descricao && <p className="profile-description">{me.descricao}</p>}
      <button className="menu" onClick={editarPerfil}><Ic k="user" />Editar perfil</button>
      {me?.tipo === "f" && <button className="menu" onClick={() => go("forn", me.id)}><Ic k="star" />Minhas avaliações</button>}
      <h2>Diferenciais do Fornece Já</h2><div className="diff">
        {[["star", "Avaliação de fornecedores"], ["trophy", "Mais vendidos"], ["bell", "Promoções"], ["pin", "Busca por estado/cidade"], ["file", "Catálogo em PDF"], ["card", "Pagamento integrado"], ["truck", "Rastreio de entrega"]].map(([k, t]) => <span key={t}><Ic k={k!} />{t}</span>)}</div>
      <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sair</button></div><Nav a="perfil" /></>); break;
    case "editar": body = (<><div className="scr"><Back to={() => go("perfil")} /><h1>Editar perfil</h1>
      <label className="photo-picker"><Avatar url={fotoPreview || avatarUrl} name={form.empresa || "Perfil"} /><span><Ic k="camera" />{foto ? "Trocar foto" : "Adicionar foto"}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => escolherFoto(e.target.files?.[0])} /></label>
      <p className="mute photo-hint">JPG, PNG ou WebP · até 2 MB</p>
      <label>Nome {me?.tipo === "f" ? "da empresa ou loja" : "ou nome da empresa/loja"}<input value={form.empresa} maxLength={120} onChange={(e) => setForm((v) => ({ ...v, empresa: e.target.value }))} /></label>
      <label>Descrição<textarea rows={4} maxLength={1000} value={form.descricao} placeholder="Conte sobre você ou seu negócio" onChange={(e) => setForm((v) => ({ ...v, descricao: e.target.value }))} /></label>
      <label>Cidade / UF<input value={form.cidade} maxLength={120} placeholder="Cidade, UF" onChange={(e) => setForm((v) => ({ ...v, cidade: e.target.value }))} /></label>
      <label>Atividade<select value={form.atuacao} onChange={(e) => setForm((v) => ({ ...v, atuacao: e.target.value }))}><option value="">Não informar</option><option>Indústria</option><option>Loja/empresa</option></select></label>
      <button className="btn or" disabled={busy} onClick={salvarPerfil}>{busy ? "Salvando..." : "Salvar alterações"}</button>
    </div><Nav a="perfil" /></>); break;
    case "novo": body = (
      <div className="scr"><Back to={() => go("painel")} /><h1>Novo produto</h1>
        <label>Nome do produto<input id="n1" /></label><label>Preço atacado (R$)<input id="n2" inputMode="decimal" /></label>
        <label>Quantidade mínima<input id="n3" inputMode="numeric" /></label>
        <label>Vendido por<select id="n6">{["unidade", "caixa", "fardo", "pacote", "peça", "galão"].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Categoria<select id="n4">{CATS.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Descrição do produto<textarea id="n5" rows={3} /></label>
        <button className="btn or" onClick={publicar}>Publicar produto</button></div>); break;
  }

  return (
    <div className="fj-body"><div className="fj-app">
      {body}
      {help && <div className="help-overlay" role="presentation" onClick={(e) => e.target === e.currentTarget && setHelp(false)}>
        <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <button className="ib help-close" aria-label="Fechar ajuda" onClick={() => setHelp(false)}>×</button>
          <h1 id="help-title">Como começar</h1>
          <p>Já tem uma conta? Toque em <b>Entrar</b> e use seu e-mail e senha.</p>
          <p>É novo por aqui? Toque em <b>Criar conta</b> e escolha fornecedor para anunciar produtos ou comprador para encontrar produtos, conversar e solicitar pedidos.</p>
          <p>No <b>Perfil</b>, adicione uma foto, descrição e nome. No sino, veja mensagens e atualizações de pedidos.</p>
        </section></div>}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div></div>
  );
}
