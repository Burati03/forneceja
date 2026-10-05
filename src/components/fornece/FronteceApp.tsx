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
const STs = ["Em negociação", "Contraproposta", "Aguardando pagamento", "Pago", "Aguardando envio", "Enviado", "Recusado"];
const statusLabel = (status: string) => ({
  "Em negociação": "Pendente",
  Contraproposta: "Contraproposta",
  "Aguardando pagamento": "Aceita",
  Pago: "Aceita",
  "Aguardando envio": "Aceita",
  Enviado: "Finalizada",
  Recusado: "Recusada",
}[status] || status);
const CATS = ["Todos", "Alimentos", "Bebidas", "Roupas", "Limpeza", "Eletrônicos", "Químicos", "Agropecuária", "Construção", "Embalagens", "Higiene", "Autopeças"];
const brl = (n: number) => "R$ " + Number(n).toFixed(2).replace(".", ",");
const subtotalCents = (unitPrice: number, quantity: number) => Math.round(unitPrice * 100) * quantity;
const brlCents = (cents: number) => brl(cents / 100);
const SAVED_LOGIN_KEY = "forneceja.saved-login";
const SAVED_EMAIL_KEY = "forneceja.saved-email";
const HELP_COPY: Partial<Record<Scr, { title: string; paragraphs: string[] }>> = {
  splash: { title: "Como começar", paragraphs: ["Entre com seu e-mail ou crie uma conta como comprador ou fornecedor.", "Compradores encontram produtos e negociam pelo chat. Fornecedores publicam produtos e atendem pedidos."] },
  login: { title: "Ajuda para entrar", paragraphs: ["Use o mesmo e-mail cadastrado e sua senha. Confira se não há espaços no e-mail.", "Marque “Manter login” para conservar a sessão neste dispositivo; desmarque para encerrar a sessão ao fechar o navegador. O aplicativo nunca armazena sua senha."] },
  feed: { title: "Encontrar produtos", paragraphs: ["Busque por produto, fornecedor ou cidade e use as categorias para filtrar.", "Abra os detalhes para conversar com o fornecedor ou enviar uma solicitação de negociação."] },
  favs: { title: "Seus favoritos", paragraphs: ["Alterne entre produtos e fornecedores favoritos para encontrar seus contatos salvos.", "Os favoritos ficam associados à sua conta para você encontrá-los depois de entrar."] },
  conversas: { title: "Mensagens", paragraphs: ["Abra uma conversa para falar com comprador ou fornecedor.", "Pedidos de negociação e confirmações aparecem em cartões dentro da conversa."] },
  chat: { title: "Negociação no chat", paragraphs: ["Confira produto, quantidade, valor e mensagens da negociação.", "O fornecedor pode aceitar, recusar ou enviar uma contraproposta. O comprador responde no próprio chat."] },
  pedidos: { title: "Pedidos", paragraphs: ["Acompanhe negociações e pedidos enviados nesta tela.", "Quando os dois lados aceitarem, o comprador poderá pagar. O fornecedor só deve marcar como enviado após a confirmação do pagamento."] },
  perfil: { title: "Seu perfil", paragraphs: ["Edite suas informações e foto para que outras empresas conheçam seu negócio.", "Fornecedores podem conectar o Mercado Pago para receber pagamentos. Compradores podem revisar pedidos e favoritos."] },
  editar: { title: "Editar perfil", paragraphs: ["Atualize seus dados. O e-mail pode exigir confirmação pelo link enviado pela autenticação.", "Fornecedores informam dados comerciais; o telefone e documento do comprador permanecem privados."] },
  meus: { title: "Seus produtos", paragraphs: ["Veja os produtos publicados na sua conta de fornecedor.", "Use “Adicionar produto” para publicar um item com preço, unidade e quantidade mínima."] },
  painel: { title: "Painel do fornecedor", paragraphs: ["Acompanhe visualizações, pedidos, mensagens e avaliações.", "Para receber pagamentos pelo marketplace, conecte sua própria conta Mercado Pago no perfil."] },
  det: { title: "Detalhes do produto", paragraphs: ["Confira preço, quantidade mínima, fornecedor e descrição antes de negociar.", "Adicione o produto ao carrinho para organizar vários itens ou envie uma solicitação direta; em ambos os casos, o pedido aparece na negociação com o fornecedor."] },
  ia: { title: "Busca inteligente", paragraphs: ["Descreva o que sua empresa precisa e a busca sugere produtos do catálogo.", "Revise os detalhes e negocie diretamente com o fornecedor."] },
  tipo: { title: "Tipo de conta", paragraphs: ["Escolha comprador para encontrar produtos e negociar compras.", "Escolha fornecedor para publicar produtos e receber pedidos."] },
  cad: { title: "Criar conta", paragraphs: ["Preencha os dados solicitados e use um e-mail válido para confirmar a conta.", "A senha deve ter pelo menos seis caracteres. Dados de documento são usados para identificar o tipo de conta."] },
  esqueci: { title: "Recuperar senha", paragraphs: ["Informe o e-mail da conta para receber um link de redefinição.", "Se não encontrar a mensagem, confira a pasta de spam e confirme se digitou o mesmo e-mail do cadastro."] },
  novo: { title: "Publicar produto", paragraphs: ["Informe nome, imagem, preço, quantidade mínima, unidade, categoria e descrição.", "Você pode editar seus produtos; ao excluir, eles saem do catálogo sem apagar o histórico de pedidos."] },
  forn: { title: "Perfil do fornecedor", paragraphs: ["Confira a descrição, as avaliações e os produtos deste fornecedor.", "Use o chat para tirar dúvidas e enviar uma solicitação de negociação."] },
  avaliar: { title: "Avaliar pedido", paragraphs: ["Escolha uma nota de uma a cinco estrelas e, se quiser, descreva sua experiência.", "A avaliação fica associada ao pedido enviado."] },
  carrinho: { title: "Carrinho de compras", paragraphs: ["Confira produtos, quantidades mínimas e totais antes de enviar.", "Enviar o carrinho cria solicitações de negociação; cada pedido só poderá ser pago após comprador e fornecedor aceitarem."] },
  compras: { title: "Acompanhar compras", paragraphs: ["Acompanhe negociação, pagamento e envio de cada pedido nesta tela.", "O aplicativo mostra as atualizações registradas pelo fornecedor e pelo Mercado Pago. Ainda não há integração com rastreio de transportadoras."] },
};

type Me = { id: string; tipo: "f" | "e"; empresa: string; email: string | null; descricao: string | null; avatar_path: string | null; atuacao: string | null; categoria: string | null; cidade: string | null; cnpj: string | null; telefone: string | null; endereco: string | null };
type Prod = { id: number; nome: string; preco: number; unidade: string; qtd_min: number; categoria: string | null; descricao: string | null; icone: string; views: number; fornecedor_id: string; fornecedor: string; cidade: string | null; imagem_path: string | null; imageUrl: string | null; ativo: boolean; fav?: boolean; favFornecedor?: boolean };
type CartItem = Pick<Prod, "id" | "nome" | "preco" | "unidade" | "qtd_min" | "icone" | "fornecedor_id" | "fornecedor" | "cidade"> & { quantidade: number };
type Negotiation = { id: number; qtd: number; preco_unitario: number; status: string; comprador_aceitou: boolean; fornecedor_aceitou: boolean; pagamento_status: string; mensagem_proposta: string | null; produto: { id: number; nome: string; unidade: string; fornecedor_id: string } | null };
type Purchase = { id: number; qtd: number; status: string; criado_em: string; avaliado: boolean; fornecedor_id: string; nome: string; unidade: string; cliente: string; cliente_id: string; comprador_aceitou: boolean; fornecedor_aceitou: boolean; pagamento_status: string; preco_unitario: number };
type MercadoPagoStatus = "connected" | "disconnected" | "unavailable";
type Notification = { id: number; tipo: string; titulo: string; texto: string; pedido_id: number | null; mensagem_id: number | null; criado_em: string; lida_em: string | null };
type SupplierProfile = { id: string; empresa: string; categoria: string | null; cidade: string | null; descricao: string | null; avatar_path: string | null; atuacao: string | null; cnpj: string | null; telefone_publico: string | null; endereco: string | null };
type Scr = "splash" | "login" | "tipo" | "cad" | "feed" | "favs" | "meus" | "det" | "conversas" | "chat" | "painel" | "pedidos" | "perfil" | "editar" | "novo" | "esqueci" | "ia" | "forn" | "avaliar" | "carrinho" | "compras";

const PSEL = "*, p:profiles!produtos_fornecedor_id_fkey(empresa,cidade)";
const productPhotoUrl = (path: string | null | undefined) => path ? supabase.storage.from("fotos-produtos").getPublicUrl(path).data.publicUrl : null;
const mapP = (r: any): Prod => ({ ...r, preco: Number(r.preco), fornecedor: r.p?.empresa ?? "", cidade: r.p?.cidade ?? null, imageUrl: productPhotoUrl(r.imagem_path) });
const isMissingColumnError = (error: { code?: string } | null) => error?.code === "42703" || error?.code === "PGRST204";
const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <span className="stars" aria-label={`${n.toFixed(1)} de 5`}>{[1, 2, 3, 4, 5].map((i) => (
    <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i <= Math.round(n) ? "on" : ""}><path d={ICONS["star"]} /></svg>))}</span>
);
const media = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0);
const err = (e: any) => { if (e) throw new Error(e.message); };

export function ForneceApp() {
  const [scr, setScr] = useState<Scr>("splash");
  const [me, setMe] = useState<Me | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOwnerId, setCartOwnerId] = useState<string | null>(null);
  const [d, setD] = useState<any>(null);
  const [x, setX] = useState<any>(null);
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [favKind, setFavKind] = useState<"produtos" | "fornecedores">("produtos");
  const [toastMsg, setToast] = useState("");
  const [help, setHelp] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(() => {
    try { return typeof window !== "undefined" && localStorage.getItem(SAVED_LOGIN_KEY) !== "false"; }
    catch { return false; }
  });
  const [savedEmail] = useState(() => {
    try { return typeof window !== "undefined" && localStorage.getItem(SAVED_LOGIN_KEY) !== "false" ? localStorage.getItem(SAVED_EMAIL_KEY) || "" : ""; }
    catch { return ""; }
  });
  const [mercadoPagoStatus, setMercadoPagoStatus] = useState<MercadoPagoStatus>("disconnected");
  const mercadoPagoConnected = mercadoPagoStatus === "connected";
  const [role, setRole] = useState<"f" | "e" | null>(null);
  const [docTipo, setDocTipo] = useState<"cpf" | "cnpj">("cpf");
  const [busy, setBusy] = useState(false);
  const [notif, setNotif] = useState<Notification[] | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ empresa: "", email: "", descricao: "", cidade: "", atuacao: "", cnpj: "", telefone: "", endereco: "" });
  const [productDraft, setProductDraft] = useState<Prod | null>(null);
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [productPhotoPreview, setProductPhotoPreview] = useState<string | null>(null);
  const [counterDraft, setCounterDraft] = useState<{ id: number; qtd: string; preco: string; mensagem: string } | null>(null);
  const fresh = useRef(0);
  const meRef = useRef<Me | null>(null);
  meRef.current = me;
  const activeUserId = me?.id;

  const refreshNotificationCount = async () => {
    if (!activeUserId) {
      setUnreadNotifCount(0);
      return;
    }
    const { count, error } = await supabase.from("notificacoes").select("id", { count: "exact", head: true }).is("lida_em", null);
    if (error) {
      console.error("[notifications] Could not load unread count", error);
      return;
    }
    setUnreadNotifCount(count || 0);
  };

  useEffect(() => {
    if (!activeUserId) {
      setUnreadNotifCount(0);
      return;
    }
    void refreshNotificationCount();
    const channel = supabase.channel(`notifications-${activeUserId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notificacoes",
        filter: `user_id=eq.${activeUserId}`,
      }, () => { void refreshNotificationCount(); })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") console.error("[notifications] Realtime subscription failed");
      });
    return () => { void supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserId]);

  useEffect(() => {
    if (!activeUserId) {
      setCart([]);
      setCartOwnerId(null);
      return;
    }

    setCartOwnerId(null);
    try {
      const saved = localStorage.getItem(`forneceja.cart.${activeUserId}`);
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      const validItems = Array.isArray(parsed) ? parsed.filter((item): item is CartItem =>
        item && Number.isSafeInteger(item.id) && item.id > 0 &&
        typeof item.nome === "string" && typeof item.unidade === "string" &&
        Number.isFinite(item.preco) && item.preco > 0 &&
        Number.isSafeInteger(item.qtd_min) && item.qtd_min > 0 &&
        Number.isSafeInteger(item.quantidade) && item.quantidade >= item.qtd_min && item.quantidade <= 2_147_483_647 &&
        Number.isSafeInteger(subtotalCents(item.preco, item.quantidade)) &&
        typeof item.fornecedor_id === "string" && typeof item.fornecedor === "string" &&
        typeof item.icone === "string" && (item.cidade == null || typeof item.cidade === "string")
      ) : [];
      setCart(validItems);
    } catch (error) {
      console.error("[cart] Could not restore this user's cart", error);
      setCart([]);
    }
    setCartOwnerId(activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    if (!me || cartOwnerId !== me.id) return;
    try {
      const key = `forneceja.cart.${me.id}`;
      if (cart.length) localStorage.setItem(key, JSON.stringify(cart));
      else localStorage.removeItem(key);
    } catch (error) {
      console.error("[cart] Could not save this user's cart", error);
      toast("Não foi possível salvar o carrinho neste dispositivo.");
    }
  }, [cart, cartOwnerId, me]);

  const toast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2400); };
  const signedPhoto = async (path: string | null | undefined) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("fotos-perfil").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const load = useCallback(async (s: Scr, arg?: any, opts?: { cat?: string; q?: string; minPrice?: string; maxPrice?: string; favKind?: "produtos" | "fornecedores" }) => {
    const m = meRef.current;
    const id = ++fresh.current;
    try {
      let data: any = null;
      const favIds = async () => {
        const { data: f, error } = await supabase.from("favoritos").select("produto_id");
        err(error);
        return new Set((f || []).map((r) => r.produto_id));
      };
      if (s === "feed" || s === "meus" || s === "favs") {
        let qb = supabase.from("produtos").select(PSEL).order("id", { ascending: false });
        const c = opts?.cat ?? cat;
        if (s === "feed" && c !== "Todos") qb = qb.eq("categoria", c);
        if (s === "meus" && m) qb = qb.eq("fornecedor_id", m.id);
        const { data: rows, error } = await qb; err(error);
        const fs = await favIds();
        let list = (rows || []).filter((row) => row.ativo !== false).map(mapP).map((p) => ({ ...p, fav: fs.has(p.id) }));
        if (s === "favs") list = list.filter((p) => p.fav);
        const term = (opts?.q ?? q).trim().toLowerCase();
        if (s === "feed" && term) list = list.filter((p) => [p.nome, p.fornecedor, p.cidade || ""].some((v) => v.toLowerCase().includes(term)));
        const lowText = (opts?.minPrice ?? minPrice).replace(",", ".").trim();
        const highText = (opts?.maxPrice ?? maxPrice).replace(",", ".").trim();
        const low = lowText ? Number(lowText) : null;
        const high = highText ? Number(highText) : null;
        if (s === "feed" && low !== null && Number.isFinite(low)) list = list.filter((p) => p.preco >= low);
        if (s === "feed" && high !== null && Number.isFinite(high)) list = list.filter((p) => p.preco <= high);
        if (s === "favs" && (opts?.favKind ?? favKind) === "fornecedores") {
          const { data: favorites, error: favoriteError } = await supabase.from("fornecedores_favoritos").select("fornecedor_id");
          err(favoriteError);
          const ids = (favorites || []).map((favorite) => favorite.fornecedor_id);
          if (!ids.length) data = [];
          else {
            const { data: suppliers, error: supplierError } = await supabase.from("profiles")
              .select("id,empresa,categoria,cidade,descricao,avatar_path,atuacao")
              .in("id", ids);
            err(supplierError);
            data = suppliers || [];
          }
        } else {
          data = list;
        }
      } else if (s === "det") {
        const { data: r, error } = await supabase.from("produtos").select(PSEL).eq("id", arg).single(); err(error);
        if (!r) throw new Error("Produto não encontrado.");
        if (r.ativo === false) throw new Error("Este produto não está mais disponível.");
        const { error: viewError } = await supabase.rpc("ver_produto", { _id: arg });
        err(viewError);
        const fs = await favIds();
        const { data: av } = await supabase.from("avaliacoes").select("nota").eq("fornecedor_id", r!.fornecedor_id);
        const notas = (av || []).map((a) => a.nota);
        data = { ...mapP(r), fav: fs.has(arg), nota: media(notas), nAval: notas.length };
      } else if (s === "forn") {
        const { data: pf, error } = await supabase.from("profiles").select("id,empresa,categoria,cidade,descricao,avatar_path,atuacao").eq("id", arg).single(); err(error);
        const { data: details, error: detailsError } = await supabase.from("profiles").select("cnpj,telefone_publico,endereco").eq("id", arg).maybeSingle();
        if (detailsError && !isMissingColumnError(detailsError)) err(detailsError);
        const supplierProfile = { ...pf, ...(details || {}) };
        const { data: av } = await supabase.from("avaliacoes")
          .select("id,nota,comentario,criado_em,autor:profiles!avaliacoes_empresario_id_fkey(empresa)").eq("fornecedor_id", arg).order("id", { ascending: false });
        const { data: rows, error: productError } = await supabase.from("produtos").select(PSEL).eq("fornecedor_id", arg).order("id", { ascending: false });
        err(productError);
        const { data: supplierFavorite, error: supplierFavoriteError } = m?.tipo === "e"
          ? await supabase.from("fornecedores_favoritos").select("fornecedor_id").eq("fornecedor_id", arg).maybeSingle()
          : { data: null, error: null };
        err(supplierFavoriteError);
        data = { pf: supplierProfile, avatarUrl: await signedPhoto(pf?.avatar_path), av: av || [], nota: media((av || []).map((a) => a.nota)), prods: (rows || []).filter((row) => row.ativo !== false).map(mapP), favoritado: !!supplierFavorite };
      } else if (s === "perfil" && m) {
        const { data: pf, error } = await supabase.from("profiles").select("id,tipo,empresa,descricao,avatar_path,atuacao,categoria,cidade").eq("id", m.id).single(); err(error);
        if (!pf) throw new Error("Não foi possível carregar seu perfil.");
        const { data: details, error: detailsError } = await supabase.from("profiles").select("cnpj,telefone_publico,endereco").eq("id", m.id).maybeSingle();
        if (detailsError && !isMissingColumnError(detailsError)) err(detailsError);
        const { data: privateProfile, error: privateError } = await supabase.from("profiles_private").select("telefone,documento,documento_tipo").eq("id", m.id).maybeSingle();
        err(privateError);
        const profileMe = {
          ...pf,
          ...(details || {}),
          email: m.email,
          cnpj: details?.cnpj || (pf.tipo === "f" && privateProfile?.documento_tipo === "cnpj" ? privateProfile.documento : null),
          telefone: pf.tipo === "f" ? details?.telefone_publico || privateProfile?.telefone : privateProfile?.telefone,
          endereco: details?.endereco || null,
        };
        setMe(profileMe as Me);
        setAvatarUrl(await signedPhoto(pf?.avatar_path));
        data = profileMe;
        if (pf.tipo === "f") {
          const { data: connected, error: connectionError } = await supabase.rpc("mercado_pago_conectado");
          if (connectionError) {
            console.error("[profile] Could not check Mercado Pago connection", connectionError);
            setMercadoPagoStatus("unavailable");
          } else {
            setMercadoPagoStatus(connected ? "connected" : "disconnected");
          }
        } else {
          setMercadoPagoStatus("disconnected");
        }
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
        let orderQuery = supabase.from("pedidos")
          .select("id,qtd,preco_unitario,status,comprador_aceitou,fornecedor_aceitou,pagamento_status,mensagem_proposta,empresario_id,produto:produtos(id,nome,unidade,fornecedor_id)")
          .order("id", { ascending: false }).limit(30);
        if (m.tipo === "e") {
          orderQuery = orderQuery.eq("empresario_id", m.id);
        } else {
          const { data: products, error: productsError } = await supabase.from("produtos").select("id").eq("fornecedor_id", m.id);
          err(productsError);
          const productIds = (products || []).map((product) => product.id);
          orderQuery = productIds.length
            ? orderQuery.eq("empresario_id", arg).in("produto_id", productIds)
            : orderQuery.eq("empresario_id", arg).in("produto_id", [-1]);
        }
        const { data: orders, error: ordersError } = await orderQuery; err(ordersError);
        const negotiations = (orders || []).filter((order) =>
          m.tipo === "e" ? order.produto?.fornecedor_id === arg : true
        );
        data = {
          com,
          msgs: (msgs || []).map((r) => ({ ...r, hora: new Date(r.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) })),
          negotiations,
        };
      } else if (s === "painel" && m) {
        const { data: ps } = await supabase.from("produtos").select("id,nome,preco,unidade,views").eq("fornecedor_id", m.id);
        const { count: msgs } = await supabase.from("mensagens").select("id", { count: "exact", head: true }).eq("para_id", m.id);
        const ids = (ps || []).map((p) => p.id);
        const { data: pds } = ids.length ? await supabase.from("pedidos").select("produto_id,qtd,status,preco_unitario").in("produto_id", ids) : { data: [] as any[] };
        const { data: avs } = await supabase.from("avaliacoes").select("nota").eq("fornecedor_id", m.id);
        const st: Record<string, number> = { "Em negociação": 0, Contraproposta: 0, "Aguardando pagamento": 0, Pago: 0, "Aguardando envio": 0, Enviado: 0, Recusado: 0 };
        let receita = 0, unidades = 0;
        const linhas = (ps || []).map((p) => {
          const meus = (pds || []).filter((o: any) => o.produto_id === p.id);
          const pedidosEnviados = meus.filter((o: any) => o.status === "Enviado");
          const vend = pedidosEnviados.reduce((a: number, o: any) => a + o.qtd, 0);
          const rec = pedidosEnviados.reduce((a: number, o: any) => a + o.qtd * Number(o.preco_unitario || p.preco), 0);
          receita += rec; unidades += vend;
          return { ...p, pedidos: meus.length, vendidos: vend, receita: rec, conv: p.views ? Math.round((meus.length / p.views) * 100) : 0 };
        }).sort((a, b) => b.receita - a.receita || b.views - a.views);
        (pds || []).forEach((o: any) => { st[o.status] = (st[o.status] || 0) + 1; });
        const notas = (avs || []).map((a) => a.nota);
        data = { produtos: ps?.length || 0, views: (ps || []).reduce((a, p) => a + p.views, 0), mensagens: msgs || 0, pedidos: pds?.length || 0,
          receita, unidades, st, linhas, media: notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : "—", nAval: notas.length };
      } else if (s === "pedidos" || s === "compras") {
        let orderQuery = supabase.from("pedidos")
          .select("id,qtd,status,criado_em,empresario_id,comprador_aceitou,fornecedor_aceitou,pagamento_status,preco_unitario,mensagem_proposta,produto:produtos(nome,unidade,fornecedor_id),cliente:profiles!pedidos_empresario_id_fkey(empresa)")
          .order("id", { ascending: false });
        if (s === "compras" && m?.tipo === "e") orderQuery = orderQuery.eq("empresario_id", m.id);
        const { data: rows, error } = await orderQuery; err(error);
        const { data: avs } = await supabase.from("avaliacoes").select("pedido_id");
        const aval = new Set((avs || []).map((a) => a.pedido_id));
        data = (rows || []).map((o) => ({ avaliado: aval.has(o.id), fornecedor_id: o.produto?.fornecedor_id, id: o.id, qtd: o.qtd, status: o.status, criado_em: o.criado_em, comprador_aceitou: o.comprador_aceitou, fornecedor_aceitou: o.fornecedor_aceitou, pagamento_status: o.pagamento_status, preco_unitario: o.preco_unitario, mensagem_proposta: o.mensagem_proposta, nome: o.produto?.nome, unidade: o.produto?.unidade, cliente: o.cliente?.empresa, cliente_id: o.empresario_id }));
      }
      if (id !== fresh.current) return;
      setD(data); setX(arg); setScr(s);
    } catch (e: any) { toast(e.message || "Erro de conexão"); }
  }, [cat, favKind, maxPrice, minPrice, q]);

  const go = (s: Scr, arg?: any) => load(s, arg);
  const home = (m = me) => { if (m) { meRef.current = m; load(m.tipo === "f" ? "painel" : "feed"); } };

  const loadMe = useCallback(async (): Promise<Me | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile, error: profileError } = await supabase.from("profiles").select("id,tipo,empresa,descricao,avatar_path,atuacao,categoria,cidade").eq("id", user.id).maybeSingle();
    err(profileError);
    let p = profile;
    if (!p) {
      const md: any = user.user_metadata || {};
      if (!md.tipo) return null;
      const ins = { id: user.id, tipo: md.tipo, empresa: md.empresa || user.email || "Minha empresa", email: user.email ?? null, categoria: md.categoria || null, cidade: md.cidade || null, atuacao: md.atuacao || null, descricao: null, avatar_path: null };
      const { error } = await supabase.from("profiles").insert(ins);
      if (error) throw new Error(error.message);
      const { error: privateInsertError } = await supabase.from("profiles_private").insert({ id: user.id, documento: md.documento || null, documento_tipo: md.documento_tipo || "cnpj", telefone: md.telefone || null });
      if (privateInsertError) throw new Error(privateInsertError.message);
      p = ins as any;
    }
    if (!p) throw new Error("Não foi possível carregar seu perfil.");
    const { data: privateProfile, error: privateError } = await supabase.from("profiles_private").select("telefone,documento,documento_tipo").eq("id", user.id).maybeSingle();
    err(privateError);
    return {
      ...p,
      email: user.email ?? null,
      cnpj: p.tipo === "f" && privateProfile?.documento_tipo === "cnpj" ? privateProfile.documento : null,
      telefone: privateProfile?.telefone ?? null,
      endereco: null,
    } as Me;
  }, []);

  useEffect(() => {
    loadMe()
      .then((m) => { if (m) { setMe(m); home(m); } })
      .catch((error) => {
        console.error("[session] Could not restore the signed-in profile", error);
        toast("Sua sessão existe, mas não foi possível carregar o perfil. Verifique a configuração do banco e tente entrar novamente.");
      });
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === "SIGNED_OUT") { setMe(null); setScr("splash"); }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("mercado_pago");
    if (!result) return;
    if (result === "conectado") toast("Conta Mercado Pago conectada para receber.");
    else if (result === "sucesso") toast("Pagamento enviado para confirmação. O pedido será atualizado após a confirmação do Mercado Pago.");
    else if (result === "pendente") toast("Pagamento pendente. A confirmação será atualizada pelo Mercado Pago.");
    else toast("Não foi possível concluir a operação do Mercado Pago.");
    window.history.replaceState({}, "", window.location.pathname);
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
      <input id={id} type="password" autoComplete={autoComplete} defaultValue="" onKeyDown={(e) => e.key === "Enter" && onEnter?.()} />
      <button type="button" className="pw-eye" aria-pressed="false" onClick={(e) => togglePw(id, e.currentTarget)}>Mostrar</button>
    </span></label>
  );

  async function login() {
    const email = val("em").trim().toLowerCase();
    const password = val("sn");
    if (!email.includes("@") || !password) return toast("Informe um e-mail válido e sua senha.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === "email_not_confirmed" || error.message.toLowerCase().includes("confirm")) {
          return toast("Confirme seu e-mail pelo link enviado antes de entrar.");
        }
        if (error.status === 429) return toast("Muitas tentativas. Aguarde um pouco e tente novamente.");
        if (error.status === 400 || error.code === "invalid_credentials") return toast("E-mail ou senha incorretos. Confira os dados ou recupere sua senha.");
        console.error("[login] Supabase authentication failed", error);
        if (error.name === "AuthRetryableFetchError" || error.status === 0) {
          return toast("Não foi possível alcançar o servidor de autenticação do Supabase. Tente novamente em instantes.");
        }
        return toast(error.message || "A autenticação não pôde ser concluída.");
      }
      try {
        if (rememberLogin) {
          localStorage.setItem(SAVED_LOGIN_KEY, "true");
          localStorage.setItem(SAVED_EMAIL_KEY, email);
        } else {
          localStorage.setItem(SAVED_LOGIN_KEY, "false");
          localStorage.removeItem(SAVED_EMAIL_KEY);
        }
      } catch {
        toast("Login realizado, mas não foi possível salvar sua preferência neste dispositivo.");
      }
      let m: Me | null;
      try {
        m = await loadMe();
      } catch (error) {
        console.error("[login] Authentication succeeded but profile loading failed", error);
        toast(error instanceof Error
          ? `Login reconhecido, mas não foi possível carregar o perfil: ${error.message}`
          : "Login reconhecido, mas não foi possível carregar o perfil.");
        return;
      }
      if (!m) return toast("Login confirmado, mas não foi possível carregar seu perfil. Tente novamente.");
      setMe(m); home(m);
    } catch (error) {
      console.error("[login] Unexpected authentication error", error);
      const message = error instanceof Error ? error.message : "";
      const networkFailure = error instanceof TypeError || /network|fetch failed|failed to fetch/i.test(message);
      toast(networkFailure
        ? "Não foi possível alcançar o servidor de autenticação do Supabase. Tente novamente em instantes."
        : message || "Não foi possível concluir o login. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function cadastrar() {
    const f = role === "f", dt = f ? "cnpj" : docTipo;
    const empresa = val("c1").trim(), email = val("c4").trim().toLowerCase(), senha = val("c5");
    const documento = val("c2").replace(/\D/g, "");
    if (!empresa || !email.includes("@")) return toast("Preencha seu nome ou nome da empresa e um e-mail válido.");
    if (senha.length < 6) return toast("A senha precisa ter ao menos 6 caracteres.");
    if (senha !== val("c5b")) return toast("As senhas não conferem. Digite a mesma senha nos dois campos.");
    if (documento.length !== (dt === "cpf" ? 11 : 14)) return toast(`Informe um ${dt === "cpf" ? "CPF" : "CNPJ"} válido.`);
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
    if (me.tipo !== "e") return toast("Favoritos estão disponíveis para contas compradoras.");
    const result = d?.fav
      ? await supabase.from("favoritos").delete().eq("produto_id", id).eq("user_id", me.id)
      : await supabase.from("favoritos").insert({ user_id: me.id, produto_id: id });
    if (result.error) return toast("Não foi possível atualizar seus favoritos.");
    setD({ ...d, fav: !d.fav });
    toast(d.fav ? "Removido dos favoritos" : "Salvo nos favoritos");
  }

  async function favFornecedor(id: string, currentlyFavorited?: boolean) {
    if (!me || me.tipo !== "e") return toast("Favoritos estão disponíveis para contas compradoras.");
    const favoritado = currentlyFavorited ?? (scr === "forn" && x === id && d?.favoritado);
    const result = favoritado
      ? await supabase.from("fornecedores_favoritos").delete().eq("comprador_id", me.id).eq("fornecedor_id", id)
      : await supabase.from("fornecedores_favoritos").insert({ comprador_id: me.id, fornecedor_id: id });
    if (result.error) return toast("Não foi possível atualizar seus fornecedores favoritos.");
    if (scr === "forn" && x === id) setD({ ...d, favoritado: !favoritado });
    toast(favoritado ? "Fornecedor removido dos favoritos." : "Fornecedor salvo nos favoritos.");
  }

  function adicionarAoCarrinho(product: Prod) {
    if (!me || me.tipo !== "e") return toast("O carrinho está disponível para contas compradoras.");
    if (product.fornecedor_id === me.id) return toast("Você não pode comprar seu próprio produto.");
    const quantidade = Number(val("qt"));
    if (!Number.isSafeInteger(quantidade) || quantidade < product.qtd_min || quantidade > 2_147_483_647) {
      return toast(`A quantidade mínima deste produto é ${product.qtd_min} ${pl(product.qtd_min, product.unidade)}.`);
    }
    if (!Number.isSafeInteger(subtotalCents(product.preco, quantidade))) {
      return toast("O subtotal excede o limite permitido para um pedido.");
    }
    const item: CartItem = {
      id: product.id,
      nome: product.nome,
      preco: product.preco,
      unidade: product.unidade,
      qtd_min: product.qtd_min,
      icone: product.icone,
      fornecedor_id: product.fornecedor_id,
      fornecedor: product.fornecedor,
      cidade: product.cidade,
      quantidade,
    };
    const alreadyInCart = cartOwnerId === me.id ? cart.find((entry) => entry.id === item.id) : undefined;
    if (alreadyInCart && alreadyInCart.quantidade + quantidade > 2_147_483_647) {
      return toast("A quantidade total excede o limite permitido para um pedido.");
    }
    if (alreadyInCart && !Number.isSafeInteger(subtotalCents(alreadyInCart.preco, alreadyInCart.quantidade + quantidade))) {
      return toast("O subtotal excede o limite permitido para um pedido.");
    }
    setCart((current) => {
      const userCart = cartOwnerId === me.id ? current : [];
      const existing = userCart.find((entry) => entry.id === item.id);
      return existing
        ? userCart.map((entry) => entry.id === item.id ? { ...entry, quantidade: entry.quantidade + quantidade } : entry)
        : [...userCart, item];
    });
    setCartOwnerId(me.id);
    toast(`${product.nome} adicionado ao carrinho.`);
  }

  function atualizarQuantidadeCarrinho(productId: number, value: string) {
    const item = cart.find((entry) => entry.id === productId);
    if (!item) return;
    const quantity = Number(value);
    if (!Number.isSafeInteger(quantity) || quantity > 2_147_483_647) {
      toast("A quantidade máxima permitida foi excedida.");
      return;
    }
    if (quantity < item.qtd_min) {
      toast(`A quantidade mínima é ${item.qtd_min} ${pl(item.qtd_min, item.unidade)}.`);
      return;
    }
    if (!Number.isSafeInteger(subtotalCents(item.preco, quantity))) {
      toast("O subtotal excede o limite permitido para um pedido.");
      return;
    }
    setCart((current) => current.map((entry) => entry.id === productId ? { ...entry, quantidade: quantity } : entry));
  }

  function removerDoCarrinho(productId: number) {
    setCart((current) => current.filter((entry) => entry.id !== productId));
    toast("Produto removido do carrinho.");
  }

  async function enviarCarrinho() {
    if (!me || me.tipo !== "e" || !cart.length || busy) return;
    setBusy(true);
    try {
      const { data: products, error: productsError } = await supabase.from("produtos")
        .select("*")
        .in("id", cart.map((item) => item.id));
      if (productsError) throw new Error(productsError.message);

      const available = new Map((products || []).filter((product) => product.ativo !== false).map((product) => [product.id, product]));
      const missing = cart.filter((item) => !available.has(item.id));
      if (missing.length) {
        const missingIds = new Set(missing.map((item) => item.id));
        setCart((current) => current.filter((item) => !missingIds.has(item.id)));
        toast(`${missing.map((item) => item.nome).join(", ")} não está mais disponível e foi removido do carrinho.`);
        return;
      }

      const currentCart = cart.map((item) => {
        const product = available.get(item.id)!;
        return {
          ...item,
          nome: product.nome,
          preco: Number(product.preco),
          unidade: product.unidade,
          qtd_min: product.qtd_min,
          fornecedor_id: product.fornecedor_id,
        };
      });
      const changed = currentCart.some((item, index) => {
        const previousItem = cart[index];
        return !previousItem ||
          item.nome !== previousItem.nome ||
          item.preco !== previousItem.preco ||
          item.unidade !== previousItem.unidade ||
          item.qtd_min !== previousItem.qtd_min ||
          item.fornecedor_id !== previousItem.fornecedor_id;
      });
      if (changed) {
        setCart(currentCart.map((item) => ({ ...item, quantidade: Math.max(item.quantidade, item.qtd_min) })));
        toast("Preço ou quantidade mínima alterados. Confira o carrinho e envie novamente.");
        return;
      }
      if (currentCart.some((item) => item.fornecedor_id === me.id || item.quantidade < item.qtd_min)) {
        throw new Error("Revise os produtos e quantidades do carrinho antes de continuar.");
      }
      if (currentCart.some((item) => !Number.isSafeInteger(subtotalCents(item.preco, item.quantidade)))) {
        throw new Error("O subtotal de um produto excede o limite permitido para pagamento.");
      }
      const cartTotalCents = currentCart.reduce((sum, item) => sum + subtotalCents(item.preco, item.quantidade), 0);
      if (!Number.isSafeInteger(cartTotalCents)) throw new Error("O valor total do carrinho excede o limite permitido para pagamento.");

      const { error } = await supabase.from("pedidos").insert(currentCart.map((item) => ({
        produto_id: item.id,
        empresario_id: me.id,
        qtd: item.quantidade,
        preco_unitario: item.preco,
        comprador_aceitou: true,
      })));
      if (error) throw new Error(error.message);
      const itemCount = currentCart.length;
      setCart([]);
      toast(`${itemCount} ${itemCount === 1 ? "pedido enviado" : "pedidos enviados"} para negociação.`);
      go("pedidos");
    } catch (error) {
      console.error("[cart] Could not create purchase requests", error);
      toast(error instanceof Error ? `Não foi possível enviar o carrinho: ${error.message}` : "Não foi possível enviar o carrinho.");
    } finally {
      setBusy(false);
    }
  }

  async function pedir(p: Prod) {
    if (!me || me.tipo !== "e") return toast("Somente compradores podem enviar propostas.");
    const qtd = Number(val("qt"));
    const preco = Number(val("proposta-preco").replace(",", "."));
    const mensagem = val("proposta-mensagem").trim();
    if (!Number.isSafeInteger(qtd) || qtd < p.qtd_min) return toast(`A quantidade mínima é ${p.qtd_min} ${pl(p.qtd_min, p.unidade)}.`);
    if (!Number.isFinite(preco) || preco <= 0) return toast("Informe um valor proposto maior que zero.");
    if (mensagem.length < 1 || mensagem.length > 1000) return toast("Escreva uma mensagem de até 1000 caracteres para o fornecedor.");
    const { error } = await supabase.rpc("criar_proposta", { _produto_id: p.id, _quantidade: qtd, _preco: preco, _mensagem: mensagem });
    if (error) return toast(error.message || "Não foi possível enviar a proposta.");
    toast(`Proposta para ${qtd} ${pl(qtd, p.unidade)} enviada!`);
    go("chat", p.fornecedor_id);
  }

  async function aceitarNegociacao(orderId: number) {
    const { error } = await supabase.rpc("aceitar_negociacao", { _id: orderId });
    if (error) return toast(error.message || "Não foi possível aceitar a negociação.");
    toast("Sua confirmação foi registrada.");
    if (scr === "chat") go("chat", x);
    else go("pedidos");
  }

  async function responderContraproposta(orderId: number, aceitar: boolean) {
    const { error } = await supabase.rpc("responder_contraproposta", { _id: orderId, _aceitar: aceitar });
    if (error) return toast(error.message || "Não foi possível responder à contraproposta.");
    toast(aceitar ? "Contraproposta aceita." : "Contraproposta recusada.");
    if (scr === "chat") go("chat", x);
    else go("pedidos");
  }

  async function enviarContraproposta(orderId: number) {
    if (!me || me.tipo !== "f" || counterDraft?.id !== orderId) return;
    const quantidade = Number(counterDraft.qtd);
    const preco = Number(counterDraft.preco.replace(",", "."));
    const mensagem = counterDraft.mensagem.trim();
    if (!Number.isSafeInteger(quantidade) || quantidade < 1) return toast("Informe uma quantidade válida.");
    if (!Number.isFinite(preco) || preco <= 0) return toast("Informe um preço maior que zero.");
    if (!mensagem || mensagem.length > 1000) return toast("Escreva uma mensagem de até 1000 caracteres.");
    const { error } = await supabase.rpc("contrapropor_negociacao", {
      _id: orderId,
      _quantidade: quantidade,
      _preco: preco,
      _mensagem: mensagem,
    });
    if (error) return toast(error.message || "Não foi possível enviar a contraproposta.");
    setCounterDraft(null);
    toast("Contraproposta enviada.");
    go("chat", x);
  }

  async function pagarPedido(orderId: number) {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("mercado-pago-checkout", { body: { orderId } });
      if (error) {
        if (error.context instanceof Response) {
          const responseBody = await error.context.clone().json().catch(() => null);
          throw new Error(responseBody?.error || error.message);
        }
        throw error;
      }
      if (!data?.url || typeof data.url !== "string") throw new Error(data?.error || "O Mercado Pago não retornou o endereço de pagamento.");
      window.location.assign(data.url);
    } catch (error) {
      console.error("[checkout] Mercado Pago checkout failed", error);
      const message = error instanceof Error ? error.message : "";
      toast(message.includes("FunctionsFetchError") ? "Checkout indisponível. Verifique se as funções do Mercado Pago foram implantadas." : message || "Não foi possível iniciar o pagamento.");
      setBusy(false);
    }
  }

  async function conectarMercadoPago() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("mercado-pago-connect", { body: {} });
      if (error) {
        if (error.context instanceof Response) {
          const responseBody = await error.context.clone().json().catch(() => null);
          throw new Error(responseBody?.error || error.message);
        }
        throw error;
      }
      if (!data?.url || typeof data.url !== "string") throw new Error(data?.error || "Não foi possível conectar ao Mercado Pago.");
      window.location.assign(data.url);
    } catch (error) {
      console.error("[mercado-pago-connect] Could not start seller authorization", error);
      toast(error instanceof Error ? error.message : "Não foi possível conectar ao Mercado Pago.");
      setBusy(false);
    }
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
    if (!me || me.tipo !== "f") return toast("Somente fornecedores podem cadastrar produtos.");
    const preco = parseFloat(val("n2").replace(",", "."));
    const nome = val("n1").trim();
    const qtdMin = Number(val("n3"));
    const descricao = val("n5").trim();
    if (!nome || !(preco > 0)) return toast("Informe o nome e um preço maior que zero.");
    if (!Number.isSafeInteger(qtdMin) || qtdMin < 1) return toast("Informe uma quantidade mínima válida.");
    if (descricao.length > 1000) return toast("A descrição pode ter até 1000 caracteres.");
    if (!productPhoto && !productDraft?.imagem_path) return toast("Adicione uma imagem para o produto.");
    const categoria = val("n4");
    const icone = ({ Alimentos: "sack", Roupas: "shirt", Limpeza: "bottle", "Eletrônicos": "plug" } as any)[categoria] || "box";
    setBusy(true);
    let newPhotoPath: string | null = null;
    try {
      let imagem_path = productDraft?.imagem_path || null;
      if (productPhoto) {
        const ext = productPhoto.type === "image/png" ? "png" : productPhoto.type === "image/webp" ? "webp" : "jpg";
        newPhotoPath = `${me.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("fotos-produtos").upload(newPhotoPath, productPhoto, { contentType: productPhoto.type });
        err(uploadError);
        imagem_path = newPhotoPath;
      }
      const product = { nome, preco, unidade: val("n6") || "unidade", qtd_min: qtdMin, categoria, descricao: descricao || null, icone, imagem_path };
      if (productDraft) {
        const { data: updated, error } = await supabase.from("produtos").update(product)
          .eq("id", productDraft.id).eq("fornecedor_id", me.id).select("id").maybeSingle();
        err(error);
        if (!updated) throw new Error("O produto não está mais disponível para edição.");
        if (productDraft.imagem_path && productDraft.imagem_path !== imagem_path) {
          const { error: removeError } = await supabase.storage.from("fotos-produtos").remove([productDraft.imagem_path]);
          if (removeError) console.error("[products] Could not remove replaced product image", removeError);
        }
        toast("Produto atualizado.");
      } else {
        const { error } = await supabase.from("produtos").insert({ ...product, fornecedor_id: me.id });
        err(error);
        toast("Produto publicado!");
      }
      newPhotoPath = null;
      setProductDraft(null);
      setProductPhoto(null);
      setProductPhotoPreview(null);
      go("meus");
    } catch (error) {
      console.error("[products] Could not save product", error);
      if (newPhotoPath) {
        const { error: cleanupError } = await supabase.storage.from("fotos-produtos").remove([newPhotoPath]);
        if (cleanupError) console.error("[products] Could not remove temporary product image", cleanupError);
      }
      toast(error instanceof Error ? error.message : "Não foi possível salvar o produto.");
    } finally {
      setBusy(false);
    }
  }

  function editarProduto(product: Prod) {
    if (!me || me.tipo !== "f" || product.fornecedor_id !== me.id) return toast("Você só pode editar seus próprios produtos.");
    setProductDraft(product);
    setProductPhoto(null);
    setProductPhotoPreview(null);
    setScr("novo");
  }

  function novoProduto() {
    if (!me || me.tipo !== "f") return toast("Somente fornecedores podem cadastrar produtos.");
    setProductDraft(null);
    setProductPhoto(null);
    setProductPhotoPreview(null);
    setScr("novo");
  }

  async function excluirProduto(product: Prod) {
    if (!me || me.tipo !== "f" || product.fornecedor_id !== me.id) return toast("Você só pode excluir seus próprios produtos.");
    if (!window.confirm(`Excluir "${product.nome}" do catálogo?`)) return;
    const { data: archived, error } = await supabase.from("produtos").update({ ativo: false })
      .eq("id", product.id).eq("fornecedor_id", me.id).select("id").maybeSingle();
    if (error || !archived) return toast(error?.message || "O produto não está mais disponível para remoção.");
    toast("Produto removido do catálogo.");
    go("meus");
  }

  const buscar = useServerFn(buscarComIA);
  const [ia, setIa] = useState<{ texto: string; busy: boolean; resumo: string; prods: Prod[] | null }>({ texto: "", busy: false, resumo: "", prods: null });
  async function buscarIA() {
    const pedido = ia.texto.trim();
    if (pedido.length < 3) return toast("Descreva o que você precisa.");
    setIa((v) => ({ ...v, busy: true, prods: null, resumo: "" }));
    try {
      registrarBusca(pedido);
      const res = await buscar({ data: { pedido } });
      if (!res.ok) { setIa((v) => ({ ...v, busy: false })); return toast(res.erro); }
      let prods: Prod[] = [];
      if (res.ids.length) {
        const { data: rows } = await supabase.from("produtos").select(PSEL).in("id", res.ids);
        const byId = new Map((rows || []).map((r: any) => [r.id, mapP(r)]));
        prods = res.ids.map((i) => byId.get(i)).filter((product): product is Prod => !!product && product.ativo !== false);
      }
      setIa((v) => ({ ...v, busy: false, resumo: res.resumo, prods }));
    } catch { setIa((v) => ({ ...v, busy: false })); toast("Não foi possível fazer a busca agora."); }
  }

  const [grupos, setGrupos] = useState<{ rotulo: string; prods: Prod[] }[] | null>(null);
  function registrarBusca(termo: string) {
    const t = termo.trim();
    if (t.length >= 3 && me?.tipo === "e") void supabase.from("buscas" as any).insert({ termo: t.slice(0, 600) } as any);
  }
  async function carregarCatalogo() {
    if (!me || me.tipo !== "e") return setGrupos(null);
    const [pr, bs, pd, fv] = await Promise.all([
      supabase.from("produtos").select(PSEL).limit(300),
      supabase.from("buscas" as any).select("termo").eq("user_id", me.id).order("criado_em", { ascending: false }).limit(40),
      supabase.from("pedidos").select("produto_id,qtd").eq("empresario_id", me.id).limit(200),
      supabase.from("favoritos").select("produto_id").eq("user_id", me.id),
    ]);
    const prods = (pr.data || []).map((r: any) => mapP(r)).filter((p: Prod) => p.ativo !== false);
    const sinais = [
      ...((bs.data as any[]) || []).map((b, i) => ({ texto: b.termo as string, peso: Math.max(0.3, 1 - i * 0.03) })),
      ...(pd.data || []).map((o: any) => ({ texto: "", peso: 3, produtoId: o.produto_id })),
      ...(fv.data || []).map((f: any) => ({ texto: "", peso: 2, produtoId: f.produto_id })),
    ];
    const comprados = new Set((pd.data || []).map((o: any) => o.produto_id));
    const byId = new Map(prods.map((p: Prod) => [p.id, p]));
    const gs = agrupar(prods.map((p: any) => ({ id: p.id, preco: p.preco, texto: `${p.nome} ${p.categoria ?? ""} ${p.nome} ${p.descricao ?? ""}` })), sinais);
    const temSinal = sinais.length > 0;
    setGrupos(gs.filter((g) => !temSinal || g.afinidade > 0).slice(0, 4).map((g) => ({
      rotulo: g.rotulo,
      prods: [...g.ids.filter((i) => !comprados.has(i)), ...g.ids.filter((i) => comprados.has(i))].slice(0, 6).map((i) => byId.get(i)!).filter(Boolean),
    })).filter((g) => g.prods.length));
  }
  useEffect(() => { if (scr === "feed") void carregarCatalogo(); }, [scr, me?.id]);

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
    setForm({
      empresa: me.empresa,
      email: me.email || "",
      descricao: me.descricao || "",
      cidade: me.cidade || "",
      atuacao: me.atuacao || "",
      cnpj: me.cnpj || "",
      telefone: me.telefone || "",
      endereco: me.endereco || "",
    });
    setFoto(null); setFotoPreview(null); setScr("editar");
  };
  async function salvarPerfil() {
    if (!me || busy) return;
    const nome = form.empresa.trim();
    if (!nome) return toast("Informe o nome da empresa, loja ou seu nome.");
    const email = form.email.trim().toLowerCase();
    if (!email.includes("@")) return toast("Informe um e-mail válido.");
    if (form.descricao.trim().length > 1000) return toast("A descrição pode ter até 1000 caracteres.");
    const cnpj = form.cnpj.replace(/\D/g, "");
    if (me.tipo === "f" && cnpj.length !== 14) return toast("Informe um CNPJ com 14 dígitos.");
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
        .update({
          empresa: nome,
          descricao: form.descricao.trim() || null,
          cidade: form.cidade.trim() || null,
          atuacao: form.atuacao || null,
          avatar_path: path,
        })
        .eq("id", me.id).select("id,tipo,empresa,descricao,avatar_path,atuacao,categoria,cidade").single();
      err(error);
      if (!updated) throw new Error("Não foi possível carregar os dados atualizados do perfil.");

      let extraProfileFieldsSaved = me.tipo !== "f";
      if (me.tipo === "f") {
        const { error: extraFieldsError } = await supabase.from("profiles")
          .update({
            cnpj,
            telefone_publico: form.telefone.trim() || null,
            endereco: form.endereco.trim() || null,
          })
          .eq("id", me.id);
        if (extraFieldsError && !isMissingColumnError(extraFieldsError)) throw new Error(extraFieldsError.message);
        extraProfileFieldsSaved = !extraFieldsError;

        const { error: privateUpdateError } = await supabase.from("profiles_private")
          .upsert({ id: me.id, documento: cnpj, documento_tipo: "cnpj", telefone: form.telefone.trim() || null }, { onConflict: "id" });
        err(privateUpdateError);
      } else {
        const { error: privateUpdateError } = await supabase.from("profiles_private")
          .upsert({ id: me.id, telefone: form.telefone.trim() || null }, { onConflict: "id" });
        err(privateUpdateError);
      }
      if (email !== me.email) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({ email });
        err(emailUpdateError);
      }
      if (novoPath && me.avatar_path) await supabase.storage.from("fotos-perfil").remove([me.avatar_path]);
      setMe({
        ...updated,
        email: me.email,
        cnpj: me.tipo === "f" ? cnpj : null,
        telefone: form.telefone.trim() || null,
        endereco: me.tipo === "f" && extraProfileFieldsSaved ? form.endereco.trim() || null : null,
      } as Me);
      setFoto(null); setFotoPreview(null);
      await load("perfil");
      if (!extraProfileFieldsSaved) {
        toast("Perfil salvo, mas CNPJ, telefone comercial e endereço precisam da migração mais recente do Supabase.");
      } else {
        toast(email !== me.email ? "Perfil salvo. Confirme a alteração do e-mail pelo link enviado." : "Perfil atualizado!");
      }
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
  const escolherImagemProduto = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast("Escolha uma imagem JPG, PNG ou WebP.");
    if (file.size > 5 * 1024 * 1024) return toast("A imagem do produto deve ter até 5 MB.");
    setProductPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setProductPhotoPreview(typeof reader.result === "string" ? reader.result : null);
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
    const cartItemsCount = cartOwnerId === me?.id ? cart.length : 0;
    const it: [Scr, string, string][] = f
      ? [["painel", "home", "Início"], ["meus", "box", "Produtos"], ["conversas", "msg", "Mensagens"], ["pedidos", "receipt", "Pedidos"], ["perfil", "user", "Perfil"]]
      : [["feed", "home", "Início"], ["conversas", "msg", "Mensagens"], ["carrinho", "bag", `Carrinho${cartItemsCount ? ` (${cartItemsCount})` : ""}`], ["favs", "heart", "Favoritos"], ["perfil", "user", "Perfil"]];
    return <nav className="nav">{it.map((i) => (
      <button key={i[2]} className={i[0] === a ? "on" : ""} onClick={() => go(i[0])}><Ic k={i[1]} />{i[2]}</button>
    ))}</nav>;
  };
  const Card = ({ p }: { p: Prod }) => (
    <div className="pc"><div className="pic">{p.imageUrl ? <img src={p.imageUrl} alt={p.nome} /> : <Ic k={p.icone} />}</div><div style={{ flex: 1, minWidth: 0 }}>
      <div className="nm">{p.nome}</div><div className="mute">{p.fornecedor} · {p.cidade || ""}</div>
      <div className="price">{brl(p.preco)} / {p.unidade}</div>
      <div className="mute">Mínimo: {p.qtd_min} {pl(p.qtd_min, p.unidade)}</div>
      <div className="card-actions"><button className="sm" onClick={() => go("det", p.id)}>Ver detalhes</button>
        {scr === "meus" && me?.tipo === "f" && p.fornecedor_id === me.id && <>
          <button className="linkbtn" onClick={() => editarProduto(p)}>Editar</button>
          <button className="linkbtn danger-link" onClick={() => excluirProduto(p)}>Excluir</button>
        </>}
      </div></div></div>
  );
  const abrirNotif = async () => {
    if (notif) return setNotif(null);
    const m = meRef.current; if (!m) return;
    const { data: items, error } = await supabase.from("notificacoes")
      .select("id,tipo,titulo,texto,pedido_id,mensagem_id,criado_em,lida_em")
      .order("criado_em", { ascending: false }).limit(30);
    if (error) {
      console.error("[notifications] Could not load notifications", error);
      return toast("Não foi possível carregar as notificações.");
    }
    const rows = (items || []) as Notification[];
    setNotif(rows);
    const unreadIds = rows.filter((item) => !item.lida_em).map((item) => item.id);
    if (unreadIds.length) {
      const readAt = new Date().toISOString();
      const { error: updateError } = await supabase.from("notificacoes").update({ lida_em: readAt }).in("id", unreadIds).is("lida_em", null);
      if (updateError) {
        console.error("[notifications] Could not mark notifications as read", updateError);
        toast("As notificações foram abertas, mas não foi possível marcá-las como lidas.");
      } else {
        setNotif(rows.map((item) => unreadIds.includes(item.id) ? { ...item, lida_em: readAt } : item));
        setUnreadNotifCount((count) => Math.max(0, count - unreadIds.length));
      }
    }
  };
  const abrirItemNotificacao = async (item: Notification) => {
    setNotif(null);
    if (item.mensagem_id) {
      const { data: message, error } = await supabase.from("mensagens").select("de_id,para_id").eq("id", item.mensagem_id).maybeSingle();
      if (error) return toast("Não foi possível abrir a conversa.");
      if (message) return go("chat", message.de_id === me?.id ? message.para_id : message.de_id);
    }
    if (item.pedido_id) return go("pedidos");
    if (item.tipo === "nova_avaliacao" && me?.tipo === "f") return go("forn", me.id);
  };
  const Bell = () => (
    <div className="notif-wrap">
      <button className="ib notif-bell" aria-label={`Notificações${unreadNotifCount ? `, ${unreadNotifCount} não lidas` : ""}`} aria-expanded={!!notif} onClick={abrirNotif}>
        <Ic k="bell" />{unreadNotifCount > 0 && <span className="notif-count">{unreadNotifCount > 99 ? "99+" : unreadNotifCount}</span>}
      </button>
      {notif && <div className="notif-pop" role="dialog" aria-label="Notificações">
        <b>Notificações</b>
        {notif.length ? notif.map((n) => (
          <button key={n.id} className={`notif-it${n.lida_em ? "" : " unread"}`} onClick={() => abrirItemNotificacao(n)}>
            <Ic k={n.tipo === "nova_mensagem" ? "msg" : n.tipo === "nova_avaliacao" ? "star" : "receipt"} />
            <span><b>{n.titulo}</b><span>{n.texto}</span><small>{new Date(n.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</small></span>
          </button>
        )) : <p className="mute">Nenhuma novidade por enquanto.</p>}
      </div>}
    </div>
  );
  const searchT = useRef<any>(null);

  const chatNegotiations = (d?.negotiations || []) as Negotiation[];
  let body: React.ReactNode = null;
  switch (scr) {
    case "splash": body = (
      <div className="splash"><button className="help-btn" onClick={() => setHelp(true)}>Ajuda</button>
        <img src={logoEmp.url} alt="Fornece Já — fornecedores que impulsionam seu negócio" />
        <button className="btn or" onClick={() => setScr("login")}>Entrar</button>
        <button className="btn ghost" onClick={() => { setRole(null); setScr("tipo"); }}>Criar conta</button>
        <p className="mute" style={{ textAlign: "center", marginTop: 18, color: "#fffc" }}>Fornecedor ou comprador</p></div>); break;
    case "login": body = (
      <div className="scr"><Back to={() => setScr("splash")}><HelpButton /></Back><img className="lg" src={logoCor.url} alt="Fornece Já" />
        <h1>Entrar</h1><p className="mute">Use o e-mail cadastrado na sua conta.</p>
        <p className="login-explain"><b>Comprador</b> é quem busca produtos para comprar, seja pessoa física ou jurídica, indústria, loja ou empresa. <b>Fornecedor</b> divulga produtos e atende pedidos.</p>
        <label>E-mail<input id="em" type="email" autoComplete="username" defaultValue={savedEmail} /></label>
        <Pw id="sn" label="Senha" autoComplete="current-password" onEnter={login} />
        <label className="remember-login"><input type="checkbox" checked={rememberLogin} onChange={(e) => {
          const checked = e.target.checked;
          setRememberLogin(checked);
          try {
            localStorage.setItem(SAVED_LOGIN_KEY, String(checked));
            if (!checked) localStorage.removeItem(SAVED_EMAIL_KEY);
          } catch { toast("Não foi possível salvar sua preferência neste dispositivo."); }
        }} /><span>Manter login neste dispositivo <small>{rememberLogin ? "Sessão e e-mail salvos; a senha nunca é armazenada." : "A sessão termina ao fechar o navegador; senha nunca é armazenada."}</small></span></label>
        <button className="btn or" disabled={busy} onClick={login}>{busy ? "Entrando..." : "Entrar"}</button>
        <button className="linkbtn" onClick={() => setScr("esqueci")}>Esqueci minha senha</button>
        <button className="btn ghost" onClick={() => setScr("tipo")}>Criar conta</button></div>); break;
    case "esqueci": body = (
      <div className="scr"><Back to={() => setScr("login")}><HelpButton /></Back><h1>Recuperar senha</h1>
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
        {!own && me?.tipo === "e" && <button className="btn ghost" onClick={() => favFornecedor(d.pf.id, d.favoritado)}>
          <Ic k="heart" f={d.favoritado} />{d.favoritado ? "Remover fornecedor dos favoritos" : "Favoritar fornecedor"}
        </button>}
        {d.pf.cnpj && <div className="row"><span>CNPJ</span><b>{d.pf.cnpj}</b></div>}
        {d.pf.telefone_publico && <div className="row"><span>Telefone</span><b>{d.pf.telefone_publico}</b></div>}
        {d.pf.endereco && <div className="row"><span>Endereço</span><b>{d.pf.endereco}</b></div>}
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
      <div className="scr"><Back to={() => setScr("splash")}><HelpButton /></Back><h1>Criar conta</h1><p className="mute">Selecione o tipo de conta</p>
        <button className={"opt " + (role === "f" ? "sel" : "")} onClick={() => setRole("f")}><Ic k="store" /><span><b>Sou Fornecedor</b><span className="mute">Quero divulgar meus produtos</span></span></button>
        <button className={"opt " + (role === "e" ? "sel" : "")} onClick={() => { setRole("e"); setDocTipo("cpf"); }}><Ic k="briefcase" /><span><b>Sou Comprador</b><span className="mute">Pessoa física ou jurídica que busca produtos para comprar</span></span></button>
        <button className="btn or" onClick={() => (role ? setScr("cad") : toast("Escolha um tipo de conta"))}>Continuar</button></div>); break;
    case "cad": {
      const f = role === "f", pf = !f && docTipo === "cpf";
      body = (
        <div className="scr"><Back to={() => setScr("tipo")}><HelpButton /></Back><h1>Cadastro {f ? "Fornecedor" : "Comprador"}</h1>
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
          <label>{f ? "Categoria" : "Segmento"}<select id="c6">{(f ? CATS.slice(1) : ["Mercado / Supermercado", "Restaurante / Lanchonete", "Indústria química", "Indústria alimentícia", "Indústria têxtil", "Indústria metalúrgica", "Fazenda / Agronegócio", "Construção civil", "Farmácia / Drogaria", "Padaria / Confeitaria", "Loja de roupas", "Material de construção", "Autopeças / Oficina", "Hotel / Pousada", "Distribuidora", "Assistência técnica", "Outro"]).map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>Atividade<select id="c8" defaultValue=""><option value="">Selecione (opcional)</option><option>Indústria</option><option>Loja/empresa</option></select></label>
          <button className="btn or" disabled={busy} onClick={cadastrar}>{busy ? "Cadastrando..." : "Cadastrar"}</button></div>);
      break;
    }
    case "feed": body = (<>
      <div className="hd"><img src={logoBranco.url} alt="Fornece Já" /><div className="header-actions"><HelpButton /><Bell /></div></div>
      <div className="scr"><div className="top"><input style={{ margin: 0 }} placeholder="Buscar produto, fornecedor ou cidade" value={q}
        onChange={(e) => { const v = e.target.value; setQ(v); clearTimeout(searchT.current); searchT.current = setTimeout(() => load("feed", undefined, { q: v }), 250); clearTimeout(logT.current); logT.current = setTimeout(() => registrarBusca(v), 1500); }} /></div>
        <div className="chips">{CATS.map((c) => <button key={c} className={"chip " + (cat === c ? "on" : "")} onClick={() => { setCat(c); load("feed", undefined, { cat: c }); }}>{c}</button>)}</div>
        <div className="price-filters">
          <label>Preço mínimo<input type="number" min="0" step="0.01" inputMode="decimal" value={minPrice} placeholder="R$ 0,00" onChange={(event) => {
            const value = event.target.value;
            setMinPrice(value);
            clearTimeout(searchT.current);
            searchT.current = setTimeout(() => load("feed", undefined, { minPrice: value }), 250);
          }} /></label>
          <label>Preço máximo<input type="number" min="0" step="0.01" inputMode="decimal" value={maxPrice} placeholder="Sem limite" onChange={(event) => {
            const value = event.target.value;
            setMaxPrice(value);
            clearTimeout(searchT.current);
            searchT.current = setTimeout(() => load("feed", undefined, { maxPrice: value }), 250);
          }} /></label>
        </div>
        {me?.tipo === "e" && <button className="ai-cta" onClick={() => setScr("ia")}><Ic k="star" /><span><b>Busca inteligente</b><span className="mute">Descreva o que precisa e a IA encontra os produtos</span></span></button>}
        {me?.tipo === "e" && !q && grupos && grupos.length > 0 && <>
          <h2>Catálogo para você</h2>
          <p className="mute" style={{ marginTop: -6 }}>Grupos de produtos parecidos, ordenados pelas suas buscas, favoritos e compras.</p>
          {grupos.map((g) => <div key={g.rotulo} style={{ marginBottom: 10 }}><h3 style={{ margin: "10px 0 6px" }}>{g.rotulo}</h3>{g.prods.map((p) => <Card key={"g" + p.id} p={p} />)}</div>)}
        </>}
        <h2>Destaques para você</h2>
        {d?.length ? d.map((p: Prod) => <Card key={p.id} p={p} />) : <p className="mute">Nada encontrado. Tente outro termo ou categoria.</p>}
      </div><Nav a="feed" /></>); break;
    case "favs": body = (<><div className="scr"><Title>Favoritos</Title>
      <div className="fav-tabs" role="tablist" aria-label="Tipo de favorito">
        <button role="tab" aria-selected={favKind === "produtos"} className={favKind === "produtos" ? "on" : ""} onClick={() => { setFavKind("produtos"); load("favs", undefined, { favKind: "produtos" }); }}>Produtos</button>
        <button role="tab" aria-selected={favKind === "fornecedores"} className={favKind === "fornecedores" ? "on" : ""} onClick={() => { setFavKind("fornecedores"); load("favs", undefined, { favKind: "fornecedores" }); }}>Fornecedores</button>
      </div>
      {favKind === "produtos"
        ? d?.length ? d.map((p: Prod) => <Card key={p.id} p={p} />) : <p className="mute" style={{ marginTop: 12 }}>Toque no coração nos detalhes de um produto para salvá-lo aqui.</p>
        : d?.length ? d.map((supplier: SupplierProfile) => <div key={supplier.id} className="menu supplier-favorite">
          <button onClick={() => go("forn", supplier.id)}><b>{supplier.empresa}</b><span className="mute">{[supplier.categoria, supplier.cidade].filter(Boolean).join(" · ")}</span></button>
          <button className="ib" aria-label={`Remover ${supplier.empresa} dos favoritos`} onClick={() => { void favFornecedor(supplier.id, true).then(() => load("favs", undefined, { favKind: "fornecedores" })); }}><Ic k="heart" f /></button>
        </div>) : <p className="mute" style={{ marginTop: 12 }}>Visite o perfil de um fornecedor para salvá-lo aqui.</p>}
    </div><Nav a="favs" /></>); break;
    case "det": {
      const p = d as Prod, mine = me?.tipo === "f";
      body = (
        <div className="scr"><Back to={() => go(mine ? "meus" : "feed")}><span style={{ flex: 1 }} />
          <button className="ib fav" aria-label={p.fav ? "Remover dos favoritos" : "Favoritar produto"} onClick={() => fav(p.id)}><Ic k="heart" f={!!p.fav} /></button></Back>
          <div className="hero">{p.imageUrl ? <img src={p.imageUrl} alt={p.nome} /> : <Ic k={p.icone} />}</div>
          <h1 style={{ marginTop: 14 }}>{p.nome}</h1><button className="forn-link" onClick={() => go("forn", p.fornecedor_id)}>
            <span className="mute">Fornecedor: <b>{p.fornecedor}</b></span>
            <span className="forn-rate"><Stars n={(d as any).nota} />{(d as any).nAval ? ` ${(d as any).nota.toFixed(1)} (${(d as any).nAval})` : " Sem avaliações"}</span></button>
          <div className="row"><span>Preço atacado</span><span className="price">{brl(p.preco)} / {p.unidade}</span></div>
          <div className="row"><span>Quantidade mínima</span><b>{p.qtd_min} {pl(p.qtd_min, p.unidade)}</b></div>
          <div className="row"><span>Origem</span><b>{p.cidade || "—"}</b></div>
          <div className="row"><span>Visualizações</span><b>{p.views}</b></div>
          <h2>Descrição</h2><p>{p.descricao}</p>
          {!mine && me?.tipo === "e" && <>
            <button className="btn" onClick={() => go("chat", p.fornecedor_id)}><Ic k="msg" />Conversar</button>
            <label>Quantidade desejada ({pl(2, p.unidade)})<input id="qt" type="number" min={p.qtd_min} defaultValue={p.qtd_min} /></label>
            <button className="btn or" onClick={() => adicionarAoCarrinho(p)}><Ic k="bag" />Adicionar ao carrinho</button>
            <label>Valor proposto por {p.unidade} (R$)<input id="proposta-preco" type="number" min="0.01" step="0.01" defaultValue={p.preco.toFixed(2)} /></label>
            <label>Mensagem para o fornecedor<textarea id="proposta-mensagem" rows={3} maxLength={1000} placeholder="Informe prazo, condições ou detalhes da sua proposta" /></label>
            <button className="btn ghost" onClick={() => pedir(p)}><Ic k="receipt" />Enviar proposta</button></>}
        </div>);
      break;
    }
    case "carrinho": {
      const buyerCart = cartOwnerId === me?.id ? cart : [];
      const total = buyerCart.reduce((sum, item) => sum + subtotalCents(item.preco, item.quantidade), 0);
      body = (<>
        <div className="scr">
          <Title>Meu carrinho</Title>
          {buyerCart.length ? <>
            {buyerCart.map((item) => (
              <article key={item.id} className="cart-item">
                <div className="cart-product-icon"><Ic k={item.icone} /></div>
                <div className="cart-product-info">
                  <b>{item.nome}</b>
                  <span className="mute">{item.fornecedor}{item.cidade ? ` · ${item.cidade}` : ""}</span>
                  <span className="price">{brl(item.preco)} / {item.unidade}</span>
                  <div className="cart-quantity">
                    <span>Quantidade (mín. {item.qtd_min})</span>
                    <div className="cart-quantity-controls">
                      <button aria-label={`Diminuir quantidade de ${item.nome}`} disabled={item.quantidade <= item.qtd_min}
                        onClick={() => atualizarQuantidadeCarrinho(item.id, String(item.quantidade - 1))}>−</button>
                      <input aria-label={`Quantidade de ${item.nome}`} type="number" min={item.qtd_min} max={2_147_483_647}
                        value={item.quantidade} onChange={(event) => atualizarQuantidadeCarrinho(item.id, event.target.value)} />
                      <button aria-label={`Aumentar quantidade de ${item.nome}`} disabled={item.quantidade >= 2_147_483_647}
                        onClick={() => atualizarQuantidadeCarrinho(item.id, String(item.quantidade + 1))}>+</button>
                    </div>
                  </div>
                  <div className="cart-item-footer">
                    <b>Subtotal: {brlCents(subtotalCents(item.preco, item.quantidade))}</b>
                    <button className="cart-remove" onClick={() => removerDoCarrinho(item.id)}>Remover</button>
                  </div>
                </div>
              </article>
            ))}
            <div className="cart-summary">
              <div><span>{buyerCart.length} {buyerCart.length === 1 ? "produto" : "produtos"}</span><b>{brlCents(total)}</b></div>
              <p className="mute">Cada item será enviado como uma negociação separada ao fornecedor. O pagamento acontece após a aceitação dos dois lados.</p>
            </div>
            <button className="btn or cart-checkout" disabled={busy} onClick={enviarCarrinho}>
              <Ic k="receipt" />{busy ? "Enviando pedidos..." : "Enviar pedidos para negociação"}
            </button>
          </> : <>
            <div className="cart-empty"><Ic k="bag" /><b>Seu carrinho está vazio</b><p className="mute">Explore os produtos e adicione os itens que deseja negociar.</p></div>
            <button className="btn or" onClick={() => go("feed")}>Explorar produtos</button>
          </>}
        </div>
        <Nav a="carrinho" />
      </>);
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
      <div className="scr"><div className="chat">
        {chatNegotiations.map((order) => {
          const product = order.produto;
          if (!product) return null;
          const accepted = order.comprador_aceitou && order.fornecedor_aceitou;
          const total = Number(order.preco_unitario) * order.qtd;
          return <article key={`order-${order.id}`} className={`negotiation-card${accepted ? " accepted" : ""}`}>
            {accepted && <div className="negotiation-success"><span className="checkmark">✓</span><b>Negociação aceita</b></div>}
            <div className="negotiation-title"><Ic k="receipt" /><b>Pedido #{order.id} · {product.nome}</b></div>
            <span className={`tag t${Math.max(0, STs.indexOf(order.status))}`}>{statusLabel(order.status)}</span>
            <div className="negotiation-row"><span>Quantidade</span><b>{order.qtd} {pl(order.qtd, product.unidade)}</b></div>
            <div className="negotiation-row"><span>Preço unitário</span><b>{brl(Number(order.preco_unitario))}</b></div>
            <div className="negotiation-row negotiation-total"><span>Total</span><b>{brl(total)}</b></div>
            {order.mensagem_proposta && <p className="proposal-note">{order.mensagem_proposta}</p>}
            {order.status === "Em negociação" ? <>
              <p className="negotiation-parties">
                Comprador: {order.comprador_aceitou ? "aceitou" : "aguardando"} · Fornecedor: {order.fornecedor_aceitou ? "aceitou" : "aguardando"}
              </p>
              {((me?.tipo === "e" && !order.comprador_aceitou) || (me?.tipo === "f" && !order.fornecedor_aceitou)) &&
                <button className="btn or sm2" onClick={() => aceitarNegociacao(order.id)}>Aceitar negociação</button>}
              {me?.tipo === "f" && !order.fornecedor_aceitou && <>
                {counterDraft?.id === order.id ? <div className="counter-form">
                  <label>Quantidade<input type="number" min="1" value={counterDraft.qtd} onChange={(event) => setCounterDraft({ ...counterDraft, qtd: event.target.value })} /></label>
                  <label>Preço por unidade (R$)<input type="number" min="0.01" step="0.01" value={counterDraft.preco} onChange={(event) => setCounterDraft({ ...counterDraft, preco: event.target.value })} /></label>
                  <label>Mensagem<textarea rows={2} maxLength={1000} value={counterDraft.mensagem} onChange={(event) => setCounterDraft({ ...counterDraft, mensagem: event.target.value })} /></label>
                  <button className="btn or sm2" onClick={() => enviarContraproposta(order.id)}>Enviar contraproposta</button>
                  <button className="btn ghost sm2" onClick={() => setCounterDraft(null)}>Cancelar</button>
                </div> : <button className="btn ghost sm2" onClick={() => setCounterDraft({ id: order.id, qtd: String(order.qtd), preco: String(order.preco_unitario), mensagem: "" })}>Enviar contraproposta</button>}
              </>}
            </> : order.status === "Contraproposta" && me?.tipo === "e" ? <>
              <p className="negotiation-parties">O fornecedor enviou uma nova condição. Aceite para continuar ou recuse a negociação.</p>
              <button className="btn or sm2" onClick={() => responderContraproposta(order.id, true)}>Aceitar contraproposta</button>
              <button className="btn ghost sm2" onClick={() => responderContraproposta(order.id, false)}>Recusar contraproposta</button>
            </> : order.status === "Contraproposta" ? <p className="negotiation-parties">Aguardando resposta do comprador.</p>
            : order.status === "Recusado" ? <p className="negotiation-parties">Esta negociação foi recusada.</p>
            : order.status === "Aguardando pagamento" && me?.tipo === "e" ? <>
              <p className="mute negotiation-payment-note">Pagamento seguro pelo Mercado Pago: cartões de crédito e débito, Pix e boleto conforme disponibilidade da conta.</p>
              <button className="btn or" disabled={busy} onClick={() => pagarPedido(order.id)}>{busy ? "Abrindo checkout..." : "Pagar com Mercado Pago · " + brl(total)}</button>
            </> : order.pagamento_status === "pago" || order.status === "Enviado" ?
              <p className="negotiation-paid">Pagamento confirmado pelo Mercado Pago.</p> :
              <p className="mute negotiation-payment-note">A negociação foi aceita. O comprador iniciará o pagamento no Mercado Pago.</p>}
          </article>;
        })}
        {d.msgs.length ? d.msgs.map((m: any, i: number) => (
          <div key={m.id ?? i} className={"m " + (m.de_id === me?.id ? "me" : "")}><b>{m.de_id === me?.id ? "Você" : d.com?.empresa}</b>{m.texto}<small>{m.hora}</small></div>
        )) : !d.negotiations?.length && <p className="mute">Diga olá para começar a conversa.</p>}
      </div></div>
      <div className="send"><input id="mi" placeholder="Digite sua mensagem..." onKeyDown={(e) => e.key === "Enter" && snd()} />
        <button aria-label="Enviar" onClick={snd}><Ic k="send" /></button></div></>); break;
    case "painel": body = (<>
      <div className="hd"><img src={logoBranco.url} alt="Fornece Já" /><div className="header-actions"><HelpButton /><Bell /></div></div>
      <div className="scr"><h1>Olá, {me?.empresa}!</h1><p className="mute">Seu painel de hoje</p>
        <h3 style={{ marginTop: 14 }}>Painel de administração</h3>
        <div className="grid" style={{ marginTop: 8 }}>
          <div className="kpi"><b>{d.produtos}</b>Produtos ativos</div><div className="kpi"><b>{d.views}</b>Visualizações</div>
          <div className="kpi"><b>{d.pedidos}</b>Pedidos recebidos</div><div className="kpi"><b>{d.mensagens}</b>Mensagens</div>
          <div className="kpi"><b>{brl(d.receita || 0)}</b>Vendas concluídas</div><div className="kpi"><b>{d.unidades}</b>Unidades vendidas</div>
          <div className="kpi"><b>{d.media}</b>Nota média ({d.nAval})</div><div className="kpi"><b>{d.views ? Math.round((d.pedidos / d.views) * 100) : 0}%</b>Conversão</div></div>
        <h3 style={{ marginTop: 14 }}>Pedidos por status</h3>
        <div className="grid" style={{ marginTop: 8 }}>{Object.entries(d.st || {}).map(([k, v]) => <div key={k} className="kpi"><b>{v as number}</b>{k}</div>)}</div>
        <h3 style={{ marginTop: 14 }}>Desempenho por produto</h3>
        {(d.linhas || []).length === 0 ? <p className="mute">Nenhum produto cadastrado ainda.</p> : (
          <div style={{ overflowX: "auto", marginTop: 8 }}><table className="adm">
            <thead><tr><th>Produto</th><th>Preço</th><th>Views</th><th>Pedidos</th><th>Vendidos</th><th>Receita</th><th>Conv.</th></tr></thead>
            <tbody>{d.linhas.map((p: any) => <tr key={p.id}><td>{p.nome}</td><td>{brl(Number(p.preco))}</td><td>{p.views}</td><td>{p.pedidos}</td><td>{p.vendidos} {p.unidade}</td><td>{brl(p.receita)}</td><td>{p.conv}%</td></tr>)}</tbody>
          </table></div>)}
        <h3 style={{ marginTop: 14 }}>Atalhos</h3>
        <button className="menu" onClick={novoProduto}><Ic k="plus" />Adicionar produto</button>
        <button className="menu" onClick={() => go("meus")}><Ic k="box" />Meus produtos</button>
        <button className="menu" onClick={() => go("pedidos")}><Ic k="receipt" />Pedidos recebidos</button>
        <button className="menu" onClick={() => setScr("perfil")}><Ic k="user" />Meu perfil</button>
      </div><Nav a="painel" /></>); break;
    case "meus": body = (<><div className="scr"><Title>Meus produtos</Title>
      {d?.length ? d.map((p: Prod) => <Card key={p.id} p={p} />) : <p className="mute" style={{ marginTop: 12 }}>Você ainda não publicou produtos.</p>}
      <button className="btn or" onClick={novoProduto}>Adicionar produto</button></div><Nav a="meus" /></>); break;
    case "pedidos":
    case "compras": {
      const f = me?.tipo === "f";
      const purchasesView = scr === "compras";
      const listedOrders = (d || []) as Purchase[];
      body = (<><div className="scr"><Title>{purchasesView ? "Minhas compras e rastreamento" : f ? "Pedidos recebidos" : "Meus pedidos"}</Title>
        {purchasesView && <div className="purchase-summary">
          <b>Acompanhe suas compras</b>
          <span className="mute">Atualizações de negociação, pagamento e envio em um só lugar.</span>
        </div>}
        {listedOrders.length ? listedOrders.map((o) => {
          const rejected = o.status === "Recusado";
          const paid = o.pagamento_status === "pago" || o.status === "Pago" || o.status === "Enviado";
          const steps = [
            { label: "Solicitação enviada", state: "done" },
            { label: "Negociação", state: rejected ? "failed" : o.comprador_aceitou && o.fornecedor_aceitou ? "done" : "current" },
            { label: "Pagamento", state: rejected ? "upcoming" : paid ? "done" : o.status === "Aguardando pagamento" || o.pagamento_status === "pendente" ? "current" : "upcoming" },
            { label: "Envio", state: rejected ? "upcoming" : o.status === "Enviado" ? "done" : paid || o.status === "Aguardando envio" ? "current" : "upcoming" },
          ];
          return (
          <div key={o.id} className="pc" style={{ display: "block" }}>
            <div className="nm">{f ? o.cliente : o.nome}</div><div className="mute">{o.qtd} {pl(o.qtd, o.unidade)} de {o.nome}</div>
            <div className="mute">Total: {brl(Number(o.preco_unitario) * o.qtd)}</div>
            <span className={"tag t" + STs.indexOf(o.status)}>{statusLabel(o.status)}</span>
            {purchasesView && <>
              <p className="purchase-date">Pedido feito em {new Date(o.criado_em).toLocaleDateString("pt-BR")}</p>
              <ol className="purchase-timeline" aria-label={`Acompanhamento do pedido ${o.id}`}>
                {steps.map((step) => <li key={step.label} className={`purchase-step ${step.state}`}>
                  <span className="purchase-step-marker" aria-hidden="true">{step.state === "done" ? "✓" : step.state === "failed" ? "!" : ""}</span>
                  <span>{step.label}</span>
                  <small>{step.state === "done" ? "Concluído" : step.state === "current" ? "Em andamento" : step.state === "failed" ? "Recusada" : "Aguardando etapa anterior"}</small>
                </li>)}
              </ol>
              {rejected && <p className="purchase-tracking-note">Esta negociação foi recusada. Você pode conversar com o fornecedor para esclarecer dúvidas.</p>}
              {!rejected && o.status === "Enviado" && <p className="purchase-tracking-note">O fornecedor marcou este pedido como enviado. O app ainda não recebe código nem eventos de rastreio da transportadora.</p>}
              {!rejected && o.status !== "Enviado" && <p className="purchase-tracking-note">O envio ainda não foi confirmado pelo fornecedor.</p>}
            </>}
            {o.status === "Em negociação" && ((f && !o.fornecedor_aceitou) || (!f && !o.comprador_aceitou)) &&
              <button className="btn or sm2" onClick={() => aceitarNegociacao(o.id)}>Aceitar negociação</button>}
            {f && <div className="act">
              {o.status === "Em negociação" && <button className="btn ghost sm2" onClick={() => st(o.id, "Recusado")}>Recusar</button>}
              {(o.status === "Pago" || o.status === "Aguardando envio") && <button className="btn or sm2" onClick={() => st(o.id, "Enviado")}>Marcar enviado</button>}
            </div>}
            <button className="btn ghost sm2" onClick={() => go("chat", f ? o.cliente_id : o.fornecedor_id)}>Conversar</button>
            {!f && o.status === "Aguardando pagamento" && <button className="btn or sm2" disabled={busy} onClick={() => pagarPedido(o.id)}><Ic k="card" />Pagar com Mercado Pago</button>}
            {o.pagamento_status === "pago" && <p className="negotiation-paid">Pagamento confirmado pelo Mercado Pago.</p>}
            {!f && o.status === "Enviado" && (o.avaliado
              ? <div className="mute" style={{ marginTop: 6 }}>Você já avaliou este pedido.</div>
              : <button className="btn or sm2" onClick={() => { setNota(0); setX(o); setScr("avaliar"); }}><Ic k="star" />Avaliar fornecedor</button>)}
          </div>);
        }) : <p className="mute" style={{ marginTop: 12 }}>{purchasesView ? "Você ainda não fez compras. Explore o catálogo para encontrar produtos." : "Nenhum pedido por enquanto."}</p>}
        {purchasesView && !listedOrders.length && <button className="btn or" onClick={() => go("feed")}>Explorar produtos</button>}
      </div><Nav a={purchasesView ? "perfil" : "pedidos"} /></>);
      break;
    }
    case "perfil": body = (<><div className="scr"><div className="screen-title"><span /><HelpButton /></div>
      <div className="profile-summary"><Avatar url={avatarUrl} name={me?.empresa || "Perfil"} /><div className="profile-summary-info"><h1>{me?.empresa}</h1><p className="mute">{me?.tipo === "f" ? "Fornecedor" : "Comprador"}{me?.atuacao ? ` · ${me.atuacao}` : ""}</p><p className="mute">{me?.email}</p>{me?.cidade && <p className="mute">{me.cidade}</p>}{me?.telefone && <p className="mute">Telefone: {me.telefone}</p>}{me?.tipo === "f" && me.cnpj && <p className="mute">CNPJ: {me.cnpj}</p>}{me?.tipo === "f" && me.endereco && <p className="mute">{me.endereco}</p>}</div></div>
      {me?.descricao && <p className="profile-description">{me.descricao}</p>}
      <button className="menu" onClick={editarPerfil}><Ic k="user" />Editar perfil</button>
      {me?.tipo === "f" ? <>
        <button className="menu" onClick={() => go("painel")}><Ic k="grid" />Painel do fornecedor</button>
        <button className="menu" onClick={() => go("meus")}><Ic k="box" />Meus produtos</button>
        <button className="menu" onClick={() => go("pedidos")}><Ic k="receipt" />Pedidos recebidos</button>
        <button className="menu" onClick={() => go("conversas")}><Ic k="msg" />Conversas</button>
        <button className="menu" onClick={() => go("forn", me.id)}><Ic k="star" />Minhas avaliações</button>
        <button className="menu" disabled={busy || mercadoPagoConnected || mercadoPagoStatus === "unavailable"} onClick={conectarMercadoPago}><Ic k="card" />{mercadoPagoConnected ? "Mercado Pago conectado" : mercadoPagoStatus === "unavailable" ? "Status Mercado Pago indisponível" : "Conectar Mercado Pago para receber"}</button>
        {mercadoPagoStatus === "unavailable" && <p className="integration-notice" role="status">Seu perfil está disponível, mas o status do Mercado Pago não pôde ser verificado. Aplique a migração de pagamentos mais recente no Supabase para habilitar essa consulta.</p>}
      </> : <>
        <button className="menu" onClick={() => go("compras")}><Ic k="truck" />Minhas compras e rastreamento</button>
        <button className="menu" onClick={() => go("favs")}><Ic k="heart" />Produtos favoritos</button>
        <button className="menu" onClick={() => go("conversas")}><Ic k="msg" />Conversas com fornecedores</button>
      </>}
      <button className="menu" onClick={async () => {
        if (!me?.email) return toast("Sua conta não tem um e-mail para recuperação de senha.");
        const { error } = await supabase.auth.resetPasswordForEmail(me.email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) return toast("Não foi possível enviar o link de redefinição.");
        toast("Enviamos um link para redefinir sua senha.");
      }}><Ic k="file" />Redefinir senha</button>
      <h2>Diferenciais do Fornece Já</h2><div className="diff">
        {[["star", "Avaliação de fornecedores"], ["trophy", "Mais vendidos"], ["bell", "Promoções"], ["pin", "Busca por estado/cidade"], ["file", "Catálogo em PDF"], ["card", "Pagamento integrado"], ["truck", "Rastreio de entrega"]].map(([k, t]) => <span key={t}><Ic k={k!} />{t}</span>)}</div>
      <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sair</button></div><Nav a="perfil" /></>); break;
    case "editar": body = (<><div className="scr"><Back to={() => go("perfil")} /><h1>Editar perfil</h1>
      <label className="photo-picker"><Avatar url={fotoPreview || avatarUrl} name={form.empresa || "Perfil"} /><span><Ic k="camera" />{foto ? "Trocar foto" : "Adicionar foto"}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => escolherFoto(e.target.files?.[0])} /></label>
      <p className="mute photo-hint">JPG, PNG ou WebP · até 2 MB</p>
      <label>Nome {me?.tipo === "f" ? "da empresa ou loja" : "ou nome da empresa/loja"}<input value={form.empresa} maxLength={120} onChange={(e) => setForm((v) => ({ ...v, empresa: e.target.value }))} /></label>
      <label>E-mail<input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} /></label>
      {me?.tipo === "f" && <label>CNPJ<input inputMode="numeric" maxLength={18} value={form.cnpj} placeholder="00.000.000/0000-00" onChange={(e) => setForm((v) => ({ ...v, cnpj: e.target.value }))} /></label>}
      <label>Telefone<input type="tel" maxLength={30} value={form.telefone} onChange={(e) => setForm((v) => ({ ...v, telefone: e.target.value }))} /></label>
      <label>Descrição<textarea rows={4} maxLength={1000} value={form.descricao} placeholder="Conte sobre você ou seu negócio" onChange={(e) => setForm((v) => ({ ...v, descricao: e.target.value }))} /></label>
      <label>Cidade / UF<input value={form.cidade} maxLength={120} placeholder="Cidade, UF" onChange={(e) => setForm((v) => ({ ...v, cidade: e.target.value }))} /></label>
      {me?.tipo === "f" && <label>Endereço<input value={form.endereco} maxLength={250} placeholder="Rua, número, bairro, cidade - UF" onChange={(e) => setForm((v) => ({ ...v, endereco: e.target.value }))} /></label>}
      <label>Atividade<select value={form.atuacao} onChange={(e) => setForm((v) => ({ ...v, atuacao: e.target.value }))}><option value="">Não informar</option><option>Indústria</option><option>Loja/empresa</option></select></label>
      <button className="btn or" disabled={busy} onClick={salvarPerfil}>{busy ? "Salvando..." : "Salvar alterações"}</button>
    </div><Nav a="perfil" /></>); break;
    case "novo": body = (
      <div className="scr"><Back to={() => go("meus")}><HelpButton /></Back><h1>{productDraft ? "Editar produto" : "Novo produto"}</h1>
        <label className="product-photo-picker">
          {productPhotoPreview || productDraft?.imageUrl ? <img src={productPhotoPreview || productDraft?.imageUrl || ""} alt="Prévia do produto" /> : <span><Ic k="camera" />Adicionar imagem</span>}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => escolherImagemProduto(event.target.files?.[0])} />
        </label>
        <p className="mute photo-hint">Imagem JPG, PNG ou WebP · até 5 MB</p>
        <label>Nome do produto<input id="n1" maxLength={120} defaultValue={productDraft?.nome || ""} /></label>
        <label>Preço atacado (R$)<input id="n2" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={productDraft?.preco || ""} /></label>
        <label>Quantidade mínima<input id="n3" type="number" min="1" step="1" inputMode="numeric" defaultValue={productDraft?.qtd_min || 1} /></label>
        <label>Vendido por<select id="n6" defaultValue={productDraft?.unidade || "unidade"}>{["unidade", "caixa", "fardo", "pacote", "peça", "galão"].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Categoria<select id="n4" defaultValue={productDraft?.categoria || CATS[1]}>{CATS.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Descrição do produto<textarea id="n5" rows={3} maxLength={1000} defaultValue={productDraft?.descricao || ""} /></label>
        <button className="btn or" disabled={busy} onClick={publicar}>{busy ? "Salvando..." : productDraft ? "Salvar alterações" : "Publicar produto"}</button></div>); break;
  }

  return (
    <div className="fj-body"><div className="fj-app">
      {body}
      {help && <div className="help-overlay" role="presentation" onClick={(e) => e.target === e.currentTarget && setHelp(false)}>
        <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <button className="ib help-close" aria-label="Fechar ajuda" onClick={() => setHelp(false)}>×</button>
          <h1 id="help-title">{HELP_COPY[scr]?.title || "Ajuda"}</h1>
          {(HELP_COPY[scr]?.paragraphs || ["Use os botões desta tela para acessar as opções disponíveis. Se precisar, volte ao perfil ou fale com a equipe de suporte."]).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section></div>}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div></div>
  );
}
