import Link from "next/link";

import { buttonVariants } from "@workspace/ui/components/button";
import { locales, type Locale } from "@/components/how-it-works/copy";

const languageNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  return (
    <nav aria-label={label} className="flex items-center gap-1">
      {locales.map((option) => (
        <Link
          key={option}
          href={{ pathname: "/how-it-works", query: { lang: option } }}
          hrefLang={option}
          lang={option}
          scroll={false}
          aria-current={option === locale ? "page" : undefined}
          className={buttonVariants({
            variant: option === locale ? "secondary" : "ghost",
            size: "sm",
          })}
        >
          {languageNames[option]}
        </Link>
      ))}
    </nav>
  );
}

export { LanguageSwitcher };
