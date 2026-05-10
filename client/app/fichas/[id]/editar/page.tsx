"use client";

import { Suspense } from "react";
import NovaFicha from "@/screens/NovaFicha";

export default function EditarFichaPage() {
  return (
    <Suspense fallback={null}>
      <NovaFicha />
    </Suspense>
  );
}
