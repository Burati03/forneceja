export type CatalogItem = {
  id: number;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  views: number;
  fornecedor?: string;
  cidade?: string | null;
};

type Vector = Map<string, number>;

const STOP_WORDS = new Set(
  "a ao aos as com da das de do dos e em eu for foi na nas no nos o os ou para pela pelas pelo pelos por que se sem sua suas um uma uns umas preciso precisa precisamos tenho tem negocio empresa produto produtos item itens".split(
    " ",
  ),
);

function tokens(text: string): string[] {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((token) => token.length > 1 && !STOP_WORDS.has(token)) ?? []
  );
}

function normalize(vector: Vector): Vector {
  const magnitude = Math.sqrt([...vector.values()].reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return new Map([...vector].map(([feature, value]) => [feature, value / magnitude]));
}

function cosine(left: Vector, right: Vector): number {
  const [smaller, larger] = left.size <= right.size ? [left, right] : [right, left];
  let result = 0;
  for (const [feature, value] of smaller) result += value * (larger.get(feature) ?? 0);
  return result;
}

function addVector(target: Vector, source: Vector, weight = 1): void {
  for (const [feature, value] of source) {
    target.set(feature, (target.get(feature) ?? 0) + value * weight);
  }
}

function meanVector(vectors: Vector[]): Vector {
  const mean = new Map<string, number>();
  vectors.forEach((vector) => addVector(mean, vector, 1 / vectors.length));
  return normalize(mean);
}

function cluster(items: { id: number; vector: Vector; views: number }[]): Vector[] {
  if (!items.length) return [];

  const count = Math.min(5, Math.max(1, Math.round(Math.sqrt(items.length / 2))));
  const first = [...items].sort((a, b) => b.views - a.views || a.id - b.id)[0];
  if (!first) return [];
  const initial = items[0];
  if (!initial) return [];
  const centroids = [first.vector];

  while (centroids.length < count) {
    const next = items.reduce(
      (best, item) => {
        const distance = 1 - Math.max(...centroids.map((center) => cosine(item.vector, center)));
        return distance > best.distance ? { item, distance } : best;
      },
      { item: initial, distance: -1 },
    ).item;
    if (!next) break;
    centroids.push(next.vector);
  }

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const groups = centroids.map(() => [] as Vector[]);
    for (const item of items) {
      let bestIndex = 0;
      let bestScore = -Infinity;
      centroids.forEach((center, index) => {
        const score = cosine(item.vector, center);
        if (score > bestScore) {
          bestIndex = index;
          bestScore = score;
        }
      });
      const group = groups[bestIndex];
      if (group) group.push(item.vector);
    }
    groups.forEach((group, index) => {
      if (group.length) {
        const updated = meanVector(group);
        if (updated) centroids[index] = updated;
      }
    });
  }

  return centroids;
}

export function rankCatalogClusters(
  products: CatalogItem[],
  searches: string[],
  purchasedProductIds: number[],
): number[] {
  if (!products.length) return [];

  const productTerms = products.map((product) => {
    const counts = new Map<string, number>();
    tokens(product.categoria ?? "").forEach((term) =>
      counts.set(term, (counts.get(term) ?? 0) + 3),
    );
    tokens(product.nome).forEach((term) => counts.set(term, (counts.get(term) ?? 0) + 2));
    tokens(product.fornecedor ?? "").forEach((term) =>
      counts.set(term, (counts.get(term) ?? 0) + 0.5),
    );
    tokens(product.cidade ?? "").forEach((term) => counts.set(term, (counts.get(term) ?? 0) + 1.5));
    tokens(product.descricao ?? "").forEach((term) =>
      counts.set(term, (counts.get(term) ?? 0) + 0.5),
    );
    return counts;
  });
  const documentFrequency = new Map<string, number>();
  productTerms.forEach((termsForProduct) => {
    termsForProduct.forEach((_, term) => {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    });
  });

  const inverseDocumentFrequency = (term: string) =>
    Math.log(1 + products.length / (1 + (documentFrequency.get(term) ?? 0)));
  const vectors = productTerms.map((termsForProduct) => {
    const vector = new Map<string, number>();
    termsForProduct.forEach((count, term) =>
      vector.set(term, count * inverseDocumentFrequency(term)),
    );
    return normalize(vector);
  });
  const productById = new Map(products.map((product, index) => [product.id, index]));
  const preferences = new Map<string, number>();

  searches.slice(0, 30).forEach((search, index) => {
    const queryVector = new Map<string, number>();
    tokens(search).forEach((term) => {
      if (documentFrequency.has(term)) queryVector.set(term, inverseDocumentFrequency(term));
    });
    addVector(preferences, normalize(queryVector), Math.max(0.5, 1 - index * 0.025) * 2);
  });
  purchasedProductIds.slice(0, 100).forEach((productId) => {
    const productIndex = productById.get(productId);
    const vector = productIndex === undefined ? undefined : vectors[productIndex];
    if (vector) addVector(preferences, vector, 4);
  });

  const profile = normalize(preferences);
  const items = products.flatMap((product, index) => {
    const vector = vectors[index];
    return vector ? [{ id: product.id, vector, views: product.views }] : [];
  });
  const centroids = cluster(items);

  if (!profile.size) {
    return [...items].sort((a, b) => b.views - a.views || b.id - a.id).map((item) => item.id);
  }

  const preferredCluster = centroids.reduce((best, center) =>
    cosine(center, profile) > cosine(best, profile) ? center : best,
  );

  return items
    .map((item) => {
      const clusterAffinity = cosine(item.vector, preferredCluster);
      const score = cosine(item.vector, profile) * 0.75 + clusterAffinity * 0.25;
      return { id: item.id, score, views: item.views };
    })
    .sort((a, b) => b.score - a.score || b.views - a.views || b.id - a.id)
    .map((item) => item.id);
}
