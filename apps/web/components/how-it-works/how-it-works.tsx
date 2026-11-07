import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { HeroDiagram } from "@/components/how-it-works/hero-diagram";
import { LanguageSwitcher } from "@/components/how-it-works/language-switcher";
import { PaymentSteps } from "@/components/how-it-works/payment-steps";
import { RoleCard } from "@/components/how-it-works/role-card";
import { RouteMap } from "@/components/how-it-works/route-map";
import { copy, type Locale } from "@/components/how-it-works/copy";

function Section({
  title,
  lede,
  centered = false,
  children,
}: {
  title: string;
  lede?: string;
  centered?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-8 border-t border-border py-16">
      <div className={cn("max-w-2xl space-y-2", centered && "mx-auto text-center")}>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {lede && <p className="text-muted-foreground">{lede}</p>}
      </div>
      {children}
    </section>
  );
}

function HowItWorks({ locale }: { locale: Locale }) {
  const text = copy[locale];

  return (
    <div lang={locale} className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-300 px-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-2 py-4">
          <div className="flex items-center gap-2">
            <Image src="/icon-192.png" alt="" width={24} height={24} className="rounded-md" />
            <p className="text-sm font-medium">Ponte</p>
          </div>
          <LanguageSwitcher locale={locale} label={text.languageLabel} />
        </header>
        <main>
          <section className="space-y-10 py-16">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-medium text-muted-foreground">{text.hero.eyebrow}</p>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                {text.hero.title}
              </h1>
              <p className="text-lg text-muted-foreground">{text.hero.lede}</p>
            </div>
            <HeroDiagram text={text.hero} />
          </section>

          <Section title={text.steps.title} lede={text.steps.lede}>
            <PaymentSteps text={text.steps} />
            <p className="text-xs text-muted-foreground">{text.steps.disclaimer}</p>
          </Section>

          <Section title={text.routing.title} lede={text.routing.lede}>
            <RouteMap text={text.routing} />
          </Section>

          <Section title={text.roles.title}>
            <div className="grid gap-6 md:grid-cols-2">
              <RoleCard
                title={text.roles.merchants}
                onceTitle={text.roles.once}
                onceItems={text.roles.merchantOnce}
                eachTitle={text.roles.everySale}
                eachItems={text.roles.merchantEach}
                note={text.roles.merchantNote}
              />
              <RoleCard
                title={text.roles.customers}
                onceTitle={text.roles.once}
                onceItems={text.roles.customerOnce}
                eachTitle={text.roles.everyPayment}
                eachItems={text.roles.customerEach}
                note={text.roles.customerNote}
              />
            </div>
          </Section>

          <Section title={text.safety.title}>
            <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {text.safety.items.map((item) => (
                <div key={item.title} className="space-y-1">
                  <dt className="font-medium">{item.title}</dt>
                  <dd className="text-sm text-muted-foreground">{item.body}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title={text.costs.title} lede={text.costs.lede}>
            <ul className="grid gap-6 md:grid-cols-3">
              {text.costs.items.map((item) => (
                <li
                  key={item.title}
                  className="space-y-2 rounded-xl border border-border bg-card p-6 text-card-foreground"
                >
                  <p className="text-xs font-medium text-muted-foreground">{item.who}</p>
                  <p className="text-3xl font-semibold tracking-tight">{item.value}</p>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={text.faq.title} centered>
            <Accordion className="mx-auto max-w-2xl">
              {text.faq.items.map((item) => (
                <AccordionItem key={item.question}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Section>

          <section className="flex flex-col items-center gap-4 border-t border-border py-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">{text.cta.title}</h2>
            <Link href="/sign-in" className={buttonVariants({ size: "lg" })}>
              {text.cta.action}
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}

export { HowItWorks };
