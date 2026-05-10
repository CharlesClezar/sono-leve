"use client";

import { Suspense } from "react";
import Vendas from "@/screens/Vendas";

export default function VendasPage() {
  return (
    <Suspense fallback={null}>
      <Vendas />
    </Suspense>
  );
}
