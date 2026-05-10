import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Keyboard, CreditCard, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

const sections = [
  { icon: Keyboard, title: "Atalhos", desc: "Configure teclas para Windows/Linux e macOS", href: "/configuracoes/atalhos" },
  { icon: CreditCard, title: "Formas de pagamento", desc: "Taxas, parcelas e prazos", href: "/configuracoes/pagamentos" },
  { icon: SettingsIcon, title: "Parâmetros gerais", desc: "Preferências do sistema", href: "/configuracoes/parametros" },
];

export default function Configuracoes() {
  return (
    <AppShell>
      <PageHeader
        breadcrumb={["Configurações"]}
        title="Configurações"
        infoTooltip="Define atalhos, pagamentos e parâmetros gerais que afetam o comportamento do sistema."
      />
      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.title} href={s.href} className="block">
            <Card className="h-full cursor-pointer p-5 transition hover:border-primary hover:shadow-md">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
