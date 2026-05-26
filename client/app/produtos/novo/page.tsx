"use client";

import { Suspense } from "react";
import NovoProduto from "@/screens/NovoProduto";

export default function NovoProdutoPage() {
  return (
    <Suspense fallback={null}>
      <NovoProduto />
    </Suspense>
  );
}
