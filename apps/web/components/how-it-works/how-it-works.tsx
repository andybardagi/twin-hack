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
import { BeloLogo } from "@/components/brand/belo-logo";
import { PonteLogo } from "@/components/brand/ponte-logo";
import { HeroDiagram } from "@/components/how-it-works/hero-diagram";
import { LanguageSwitcher } from "@/components/how-it-works/language-switcher";
import { PaymentSteps } from "@/components/how-it-works/payment-steps";
import { RoleCard } from "@/components/how-it-works/role-card";
import { RouteMap } from "@/components/how-it-works/route-map";
import { TokenText } from "@/components/how-it-works/token-chip";
import { copy, type Locale } from "@/components/how-it-works/copy";

function Section({
  title,
  lede,
  centered = false,
  children,
}: {
  title: ReactNode;
  lede?: ReactNode;
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

function AudienceCard({
  title,
  tag,
  children,
}: {
  title: string;
  tag?: string;
  children: ReactNode;
}) {
  return (
    <article className="space-y-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {tag && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {tag}
          </span>
        )}
      </div>
      {children}
    </article>
  );
}

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
      {children}
    </span>
  );
}

function OutlineIcon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d={path} />
    </svg>
  );
}

// A shield with a check, and a wallet with an outgoing arrow.
const noKycIconPath = "M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3zM9 12l2 2 4-4";
const payoutsIconPath =
  "M3 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zm0 0l2-3h11M14 13.5h6";

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
              {[
                { ...text.solution.customers, tag: text.hero.customerTag },
                { ...text.solution.merchants, tag: undefined },
              ].map((side) => (
                <AudienceCard key={side.title} title={side.title} tag={side.tag}>
                  <dl className="space-y-4">
                    {side.items.map((item) => (
                      <div key={item.title} className="space-y-1">
                        <dt className="font-medium">{item.title}</dt>
                        <dd className="text-sm text-muted-foreground">
                          <TokenText>{item.body}</TokenText>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </AudienceCard>
              ))}
            </div>
          </Section>

          <Section title={text.steps.title} lede={text.steps.lede}>
            <PaymentSteps text={text.steps} customerTag={text.hero.customerTag} />
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
                  <p className="text-sm text-muted-foreground">
                    <TokenText>{item.body}</TokenText>
                  </p>
                </li>
              ))}
            </ul>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              {text.business.points.map((point) => (
                <li key={point}>
                  <TokenText>{point}</TokenText>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={text.distribution.title} lede={text.distribution.lede}>
            <ul className="grid gap-6 md:grid-cols-3">
              {[
                {
                  ...text.distribution.noKyc,
                  icon: (
                    <FeatureIcon>
                      <OutlineIcon path={noKycIconPath} />
                    </FeatureIcon>
                  ),
                },
                {
                  ...text.distribution.payouts,
                  icon: (
                    <FeatureIcon>
                      <OutlineIcon path={payoutsIconPath} />
                    </FeatureIcon>
                  ),
                },
                { ...text.distribution.belo, icon: <BeloLogo className="h-10" /> },
              ].map((item) => (
                <li
                  key={item.title}
                  className="space-y-3 rounded-xl border border-border bg-card p-6 text-card-foreground"
                >
                  {item.icon}
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title={<TokenText>{text.routing.title}</TokenText>}
            lede={<TokenText>{text.routing.lede}</TokenText>}
          >
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
                    <TokenText>{item.answer}</TokenText>
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
