import type { Locale } from "../lib/i18n";

export type NavigationItem = {
  label: string;
  href: string;
};

export const primaryNavigation: Record<Locale, NavigationItem[]> = {
  sl: [
    { label: "Rešitve", href: "/resitve" },
    { label: "Nexavia", href: "/nexavia" },
    { label: "Panoge", href: "/panoge" },
    { label: "O nas", href: "/o-nas" },
  ],
  en: [
    { label: "Solutions", href: "/en/solutions" },
    { label: "Nexavia", href: "/en/nexavia" },
    { label: "Industries", href: "/en/industries" },
    { label: "About", href: "/en/company" },
  ],
  de: [
    { label: "Lösungen", href: "/de/loesungen" },
    { label: "Nexavia", href: "/de/nexavia" },
    { label: "Branchen", href: "/de/branchen" },
    { label: "Über uns", href: "/de/unternehmen" },
  ],
};

export const contactNavigation: Record<
  Locale,
  { label: string; shortLabel: string; href: string }
> = {
  sl: {
    label: "Dogovorite se za predstavitev",
    shortLabel: "Kontakt",
    href: "/kontakt",
  },
  en: {
    label: "Book a presentation",
    shortLabel: "Contact",
    href: "/en/contact",
  },
  de: {
    label: "Präsentation vereinbaren",
    shortLabel: "Kontakt",
    href: "/de/kontakt",
  },
};

export const getNavigation = (locale: Locale): NavigationItem[] =>
  primaryNavigation[locale];
