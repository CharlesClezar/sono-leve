"use client";

import { Suspense } from "react";
import NovaEncomenda from "@/screens/NovaEncomenda";

export default function NovaEncomendaPage() {
  return (
    <Suspense fallback={null}>
      <NovaEncomenda />
    </Suspense>
  );
}
