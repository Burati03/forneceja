import { createFileRoute } from "@tanstack/react-router";
import { ForneceApp } from "@/components/fornece/FronteceApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fornece Já" },
      { name: "description", content: "Conecte sua empresa a fornecedores no atacado: produtos, orçamentos e conversas em um só app." },
      { property: "og:title", content: "Fornece Já — Marketplace B2B de fornecedores" },
      { property: "og:description", content: "Conecte sua empresa a fornecedores no atacado: produtos, orçamentos e conversas em um só app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForneceApp,
});
