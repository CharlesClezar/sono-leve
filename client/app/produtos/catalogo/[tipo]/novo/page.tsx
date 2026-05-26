"use client";

import { Suspense } from "react";
import NovoCatalogoProduto from "@/screens/NovoCatalogoProduto";

export default function NovoCatalogoProdutoPage() {
  return (
    <Suspense fallback={null}>
      <NovoCatalogoProduto />
    </Suspense>
  );
}
