import { describe, expect, it } from "vitest";
import { rankCatalogClusters, type CatalogItem } from "./catalog-recommendations";

const catalog: CatalogItem[] = [
  {
    id: 1,
    nome: "Café em grãos",
    categoria: "Alimentos",
    descricao: "Café torrado para cafeteria",
    views: 5,
    cidade: "Campinas, SP",
  },
  {
    id: 2,
    nome: "Açúcar refinado",
    categoria: "Alimentos",
    descricao: "Pacote para cozinha",
    views: 8,
  },
  {
    id: 3,
    nome: "Detergente neutro",
    categoria: "Limpeza",
    descricao: "Limpeza profissional",
    views: 4,
  },
  {
    id: 4,
    nome: "Desinfetante concentrado",
    categoria: "Limpeza",
    descricao: "Limpeza de ambientes",
    views: 3,
  },
  {
    id: 5,
    nome: "Lâmpada LED",
    categoria: "Eletrônicos",
    descricao: "Iluminação econômica",
    views: 30,
  },
];

describe("rankCatalogClusters", () => {
  it("prioritizes the product clusters that match recent searches", () => {
    const ranked = rankCatalogClusters(catalog, ["cafe para cafeteria"], []);

    expect(ranked[0]).toBe(1);
    expect(ranked.indexOf(2)).toBeLessThan(ranked.indexOf(3));
  });

  it("uses supplier locations as a signal for city searches", () => {
    const ranked = rankCatalogClusters(catalog, ["Campinas"], []);

    expect(ranked[0]).toBe(1);
  });

  it("uses completed purchase history to personalize the catalog", () => {
    const ranked = rankCatalogClusters(catalog, [], [3]);

    expect(ranked[0]).toBe(3);
    expect(ranked.indexOf(4)).toBeLessThan(ranked.indexOf(1));
  });

  it("falls back to popularity when there is no user history", () => {
    expect(rankCatalogClusters(catalog, [], [])).toEqual([5, 2, 1, 3, 4]);
  });

  it("returns an empty ranking for an empty catalog", () => {
    expect(rankCatalogClusters([], [], [])).toEqual([]);
  });
});
