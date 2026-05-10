"use client";

import { Suspense } from "react";
import NovaVenda from "@/screens/NovaVenda";

export default function NovaVendaPage() {
  return (
    <Suspense fallback={null}>
      <NovaVenda />
    </Suspense>
  );
}
