"use client";

import { Suspense } from "react";
import Produtos from "@/screens/Produtos";

export default function ProdutosPage() {
  return (
    <Suspense fallback={null}>
      <Produtos />
    </Suspense>
  );
}
