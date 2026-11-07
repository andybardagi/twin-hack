import type { ReactNode } from "react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { PonteLogo } from "@/components/brand/ponte-logo";
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

const paymentRouterUrl = "https://arbiscan.io/address/0x4DE32c75eecDF3229114F105293698284b261Bb1";

function AudienceCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="space-y-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {children}
    </article>
  );
}

function HowItWorks({ locale }: { locale: Locale }) {
  const text = copy[locale];

  return (
    <div lang={locale} className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-300 px-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-2 py-4">
          <PonteLogo size={28} />
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

          <Section title={text.problem.title}>
            <div className="grid gap-6 md:grid-cols-2">
              {[text.problem.customers, text.problem.merchants].map((side) => (
                <AudienceCard key={side.title} title={side.title}>
                  <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                    {side.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </AudienceCard>
              ))}
            </div>
          </Section>

          <Section title={text.solution.title} lede={text.solution.lede}>
            <div className="grid gap-6 md:grid-cols-2">
              {[text.solution.customers, text.solution.merchants].map((side) => (
                <AudienceCard key={side.title} title={side.title}>
                  <dl className="space-y-4">
                    {side.items.map((item) => (
                      <div key={item.title} className="space-y-1">
                        <dt className="font-medium">{item.title}</dt>
                        <dd className="text-sm text-muted-foreground">{item.body}</dd>
                      </div>
                    ))}
                  </dl>
                </AudienceCard>
              ))}
            </div>
          </Section>

          <Section title={text.steps.title} lede={text.steps.lede}>
            <PaymentSteps text={text.steps} />
            <p className="text-xs text-muted-foreground">{text.steps.disclaimer}</p>
          </Section>

          <Section title={text.business.title} lede={text.business.lede}>
            <ul className="grid gap-6 md:grid-cols-3">
              {text.business.items.map((item) => (
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
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              {text.business.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </Section>

          <Section title={text.distribution.title} lede={text.distribution.lede}>
            <ul className="grid gap-6 md:grid-cols-3">
              {text.distribution.items.map((item) => (
                <li
                  key={item.title}
                  className="space-y-2 rounded-xl border border-border bg-card p-6 text-card-foreground"
                >
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
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
            <a
              href={paymentRouterUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "link" })}
            >
              {text.cta.contract}
            </a>
          </section>
        </main>
      </div>
    </div>
  );
}

export { HowItWorks };
