import type { Metadata } from "next";

import { HowItWorks } from "@/components/how-it-works/how-it-works";
import { copy, getLocale } from "@/components/how-it-works/copy";

type HowItWorksPageProps = {
  searchParams: Promise<{ lang?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: HowItWorksPageProps): Promise<Metadata> {
  const { lang } = await searchParams;
  return copy[getLocale(lang)].meta;
}

export default async function HowItWorksPage({ searchParams }: HowItWorksPageProps) {
  const { lang } = await searchParams;
  return <HowItWorks locale={getLocale(lang)} />;
}
