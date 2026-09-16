import type { Locale } from "../lib/i18n";

export const commonLabels: Record<Locale, Record<string, string>> = {
  en: {
    home: "Home",
    mainNavigation: "Main navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    switchLanguage: "Switch language",
    theme: "Theme",
    toggleTheme: "Toggle theme",
    light: "Light",
    dark: "Dark",
    requestDemo: "Request a demo",
    contactUs: "Contact us",
    learnMore: "Learn more",
    references: "References",
    detailedReference: "Detailed reference",
    nameOnlyReference: "Reference"
  },
  sl: {
    home: "Domov",
    mainNavigation: "Glavna navigacija",
    openMenu: "Odpri meni",
    closeMenu: "Zapri meni",
    language: "Jezik",
    switchLanguage: "Preklopi jezik",
    theme: "Tema",
    toggleTheme: "Preklopi temo",
    light: "Svetla",
    dark: "Temna",
    requestDemo: "Rezervirajte predstavitev",
    contactUs: "Kontaktirajte nas",
    learnMore: "Več",
    references: "Reference",
    detailedReference: "Podrobna referenca",
    nameOnlyReference: "Referenca"
  }
};

export function t(locale: Locale, key: keyof typeof commonLabels.en): string {
  return commonLabels[locale][key] ?? commonLabels.en[key];
}
