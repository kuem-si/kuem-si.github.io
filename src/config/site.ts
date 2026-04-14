export const SITE = {
  name: 'KUEM',
  url: 'https://www.kuem.si',
  legalName: 'KUEM d.o.o.',
  email: 'info@kuem.si',
  social: {
    linkedin: 'https://www.linkedin.com/company/kuemsi',
    github: 'https://github.com/kuem-si'
  }
} as const;

export const SUPPORTED_LOCALES = ['sl', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'sl';

export const localeLabels: Record<Locale, string> = {
  sl: 'Slovenscina',
  en: 'English'
};
