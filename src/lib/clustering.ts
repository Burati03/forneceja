// Agrupamento (k-means com TF-IDF) de produtos para montar um catálogo personalizado.
export type ItemTexto = { id: number; texto: string; preco: number };
export type Sinal = { texto: string; peso: number; produtoId?: number };
export type Grupo = { rotulo: string; ids: number[]; afinidade: number };

const STOP = new Set("de da do das dos e a o as os para com em por um uma no na nos nas kg un unidade caixa pacote".split(" "));

export function tokens(s: string): string[] {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t)).map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));
}

type Vec = Map<string, number>;
function norm(v: Vec): Vec { let s = 0; v.forEach((x) => (s += x * x)); s = Math.sqrt(s) || 1; v.forEach((x, k) => v.set(k, x / s)); return v; }
function cos(a: Vec, b: Vec) { let s = 0; const [m, n] = a.size < b.size ? [a, b] : [b, a]; m.forEach((x, k) => { const y = n.get(k); if (y) s += x * y; }); return s; }

export function agrupar(itens: ItemTexto[], sinais: Sinal[]): Grupo[] {
  if (!itens.length) return [];
  const docs = itens.map((i) => tokens(i.texto));
  const df = new Map<string, number>();
  docs.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) || 0) + 1)));
  const N = docs.length;
  const idf = (t: string) => Math.log((N + 1) / ((df.get(t) || 0) + 1)) + 1;
  const vecOf = (toks: string[]): Vec => { const v: Vec = new Map(); toks.forEach((t) => v.set(t, (v.get(t) || 0) + 1)); v.forEach((c, t) => v.set(t, c * idf(t))); return norm(v); };
  const vecs = docs.map(vecOf);

  // k-means (k ≈ √(N/2)), inicialização k-means++ determinística
  const k = Math.max(1, Math.min(8, Math.round(Math.sqrt(N / 2))));
  const cents: Vec[] = [new Map(vecs[0])];
  while (cents.length < k) {
    let best = 0, bd = -1;
    vecs.forEach((v, i) => { const dist = 1 - Math.max(...cents.map((c) => cos(v, c))); if (dist > bd) { bd = dist; best = i; } });
    cents.push(new Map(vecs[best]));
  }
  let asg = new Array(N).fill(0);
  for (let it = 0; it < 20; it++) {
    const novo = vecs.map((v) => { let b = 0, bs = -1; cents.forEach((c, j) => { const s = cos(v, c); if (s > bs) { bs = s; b = j; } }); return b; });
    const mudou = novo.some((a, i) => a !== asg[i]); asg = novo;
    cents.forEach((_, j) => { const c: Vec = new Map(); vecs.forEach((v, i) => { if (asg[i] === j) v.forEach((x, t) => c.set(t, (c.get(t) || 0) + x)); }); if (c.size) cents[j] = norm(c); });
    if (!mudou && it > 0) break;
  }

  // afinidade do usuário com cada grupo
  const idx = new Map(itens.map((i, n) => [i.id, n]));
  const af = new Array(k).fill(0);
  sinais.forEach((s) => {
    const n = s.produtoId != null ? idx.get(s.produtoId) : undefined;
    if (n != null) { af[asg[n]] += s.peso; return; }
    const v = vecOf(tokens(s.texto)); if (!v.size) return;
    cents.forEach((c, j) => (af[j] += s.peso * cos(v, c)));
  });

  const grupos: Grupo[] = cents.map((c, j) => {
    const membros = itens.map((_, i) => i).filter((i) => asg[i] === j);
    const top = [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t[0]!.toUpperCase() + t.slice(1));
    membros.sort((a, b) => cos(vecs[b]!, c) - cos(vecs[a]!, c));
    return { rotulo: top.join(" · ") || "Outros", ids: membros.map((i) => itens[i]!.id), afinidade: af[j] };
  }).filter((g) => g.ids.length);
  return grupos.sort((a, b) => b.afinidade - a.afinidade);
}
