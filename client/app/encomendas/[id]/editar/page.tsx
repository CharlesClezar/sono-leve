"use client";

import { Suspense } from "react";
import NovaEncomenda from "@/screens/NovaEncomenda";

export default function EditarEncomendaPage() {
  return (
    <Suspense fallback={null}>
      <NovaEncomenda />
    </Suspense>
  );
}
