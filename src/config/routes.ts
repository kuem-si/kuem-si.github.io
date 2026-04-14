import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from './site';

export type RouteId =
  | 'home'
  | 'about'
  | 'services'
  | 'service-development'
  | 'service-architecture'
  | 'service-devops'
  | 'solutions'
  | 'solution-nexavia'
  | 'solution-nexavia-enterprise'
  | 'solution-thynkr'
  | 'contact';

export interface RouteEntry {
  id: RouteId;
  paths: Record<Locale, string[]>;
  nav: boolean;
  labels: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  intro: Record<Locale, string>;
  highlights: Record<Locale, string[]>;
}

export const ROUTES: RouteEntry[] = [
  {
    id: 'home',
    paths: { sl: [], en: [] },
    nav: true,
    labels: { sl: 'Domov', en: 'Home' },
    title: {
      sl: 'KUEM | Programske resitve in inzeniring',
      en: 'KUEM | Software Solutions and Engineering'
    },
    description: {
      sl: 'Razvoj digitalnih produktov, arhitektura sistemov in DevOps platforme.',
      en: 'Digital product engineering, software architecture and DevOps platforms.'
    },
    intro: {
      sl: 'Gradimo zanesljive digitalne produkte od ideje do produkcije.',
      en: 'We build reliable digital products from concept to production.'
    },
    highlights: {
      sl: ['Razvoj po meri', 'Arhitektura', 'Platformni inzeniring'],
      en: ['Custom software', 'Architecture', 'Platform engineering']
    }
  },
  {
    id: 'about',
    paths: { sl: ['o-nas'], en: ['about'] },
    nav: true,
    labels: { sl: 'O nas', en: 'About' },
    title: { sl: 'O nas | KUEM', en: 'About | KUEM' },
    description: {
      sl: 'Ekipa inzenirjev, ki povezuje poslovne cilje in vrhunsko tehnicno izvedbo.',
      en: 'A team of engineers connecting business goals with high-quality delivery.'
    },
    intro: {
      sl: 'Smo multidisciplinarna ekipa, osredotocena na kakovost, hitrost in stabilnost.',
      en: 'We are a multidisciplinary team focused on quality, speed, and stability.'
    },
    highlights: {
      sl: ['Produktni mindset', 'Pragmaticna izvedba', 'Dolgorocna podpora'],
      en: ['Product mindset', 'Pragmatic delivery', 'Long-term support']
    }
  },
  {
    id: 'services',
    paths: { sl: ['storitve'], en: ['services'] },
    nav: true,
    labels: { sl: 'Storitve', en: 'Services' },
    title: { sl: 'Storitve | KUEM', en: 'Services | KUEM' },
    description: {
      sl: 'Od razvoja aplikacij do arhitekture in DevOps avtomatizacije.',
      en: 'From application development to architecture and DevOps automation.'
    },
    intro: {
      sl: 'Storitve pokrivajo celoten zivljenjski cikel programske opreme.',
      en: 'Our services cover the complete software lifecycle.'
    },
    highlights: {
      sl: ['Razvoj programske opreme', 'Arhitektura in svetovanje', 'DevOps in platforme'],
      en: ['Software development', 'Architecture and consulting', 'DevOps and platforms']
    }
  },
  {
    id: 'service-development',
    paths: {
      sl: ['storitve', 'razvoj-programske-opreme'],
      en: ['services', 'software-development']
    },
    nav: false,
    labels: { sl: 'Razvoj programske opreme', en: 'Software development' },
    title: {
      sl: 'Razvoj programske opreme | KUEM',
      en: 'Software Development | KUEM'
    },
    description: {
      sl: 'Nacrtovanje in razvoj skalabilnih aplikacij po meri.',
      en: 'Design and implementation of scalable custom applications.'
    },
    intro: {
      sl: 'Od MVP do enterprise sistema z osredotocenostjo na poslovno vrednost.',
      en: 'From MVP to enterprise systems with focus on business value.'
    },
    highlights: {
      sl: ['Backend in frontend', 'Integracije', 'Kakovost in testiranje'],
      en: ['Backend and frontend', 'Integrations', 'Quality and testing']
    }
  },
  {
    id: 'service-architecture',
    paths: {
      sl: ['storitve', 'arhitektura-programske-opreme-in-svetovanje'],
      en: ['services', 'software-architecture-and-consulting']
    },
    nav: false,
    labels: { sl: 'Arhitektura in svetovanje', en: 'Architecture and consulting' },
    title: {
      sl: 'Arhitektura programske opreme in svetovanje | KUEM',
      en: 'Software Architecture and Consulting | KUEM'
    },
    description: {
      sl: 'Arhitekturne odlocitve, modernizacija sistemov in tehnicno svetovanje.',
      en: 'Architecture decisions, system modernization, and technical consulting.'
    },
    intro: {
      sl: 'Pomagamo pri zahtevnih odlocitvah in nacrtovanju robustnih platform.',
      en: 'We support critical decisions and robust platform design.'
    },
    highlights: {
      sl: ['Domain driven design', 'Cloud-native pristop', 'Varnost in skladnost'],
      en: ['Domain-driven design', 'Cloud-native architecture', 'Security and compliance']
    }
  },
  {
    id: 'service-devops',
    paths: {
      sl: ['storitve', 'devops-in-platform-engineering'],
      en: ['services', 'devops-and-platform-engineering']
    },
    nav: false,
    labels: { sl: 'DevOps in platformni inzeniring', en: 'DevOps and platform engineering' },
    title: {
      sl: 'DevOps in platform engineering | KUEM',
      en: 'DevOps and Platform Engineering | KUEM'
    },
    description: {
      sl: 'CI/CD, opaznost in avtomatizacija za hitrejse in varnejse dostave.',
      en: 'CI/CD, observability, and automation for safer and faster delivery.'
    },
    intro: {
      sl: 'Zgradimo platforme, ki zmanjsajo operativni stres in pospesijo razvoj.',
      en: 'We build platforms that reduce operational load and speed up development.'
    },
    highlights: {
      sl: ['CI/CD cevovodi', 'Kubernetes in cloud', 'Monitoring in SLO'],
      en: ['CI/CD pipelines', 'Kubernetes and cloud', 'Monitoring and SLOs']
    }
  },
  {
    id: 'solutions',
    paths: { sl: ['resitve'], en: ['solutions'] },
    nav: true,
    labels: { sl: 'Resitve', en: 'Solutions' },
    title: { sl: 'Resitve | KUEM', en: 'Solutions | KUEM' },
    description: {
      sl: 'Produkti in domensko usmerjene platforme za industrijske in poslovne procese.',
      en: 'Products and domain-driven platforms for industrial and business processes.'
    },
    intro: {
      sl: 'Poleg storitev gradimo tudi lastne resitve za specificne domene.',
      en: 'Besides services, we build focused products for specific domains.'
    },
    highlights: {
      sl: ['Nexavia', 'Nexavia Enterprise', 'Thynkr'],
      en: ['Nexavia', 'Nexavia Enterprise', 'Thynkr']
    }
  },
  {
    id: 'solution-nexavia',
    paths: { sl: ['resitve', 'nexavia'], en: ['solutions', 'nexavia'] },
    nav: false,
    labels: { sl: 'Nexavia', en: 'Nexavia' },
    title: { sl: 'Nexavia | KUEM', en: 'Nexavia | KUEM' },
    description: {
      sl: 'Digitalna platforma za upravljanje kompleksnih procesov.',
      en: 'A digital platform for managing complex workflows.'
    },
    intro: {
      sl: 'Nexavia povezuje procese, podatke in ljudi v enotnem sistemu.',
      en: 'Nexavia unifies process execution, data, and teams in one system.'
    },
    highlights: {
      sl: ['Upravljanje tokov', 'Vloga in pravice', 'Integracije'],
      en: ['Workflow management', 'Roles and permissions', 'Integrations']
    }
  },
  {
    id: 'solution-nexavia-enterprise',
    paths: {
      sl: ['resitve', 'nexavia', 'nexavia-enterprise'],
      en: ['solutions', 'nexavia', 'nexavia-enterprise']
    },
    nav: false,
    labels: { sl: 'Nexavia Enterprise', en: 'Nexavia Enterprise' },
    title: { sl: 'Nexavia Enterprise | KUEM', en: 'Nexavia Enterprise | KUEM' },
    description: {
      sl: 'Razsirjena enterprise razlicica platforme Nexavia.',
      en: 'Enterprise extension of the Nexavia platform.'
    },
    intro: {
      sl: 'Enterprise funkcionalnosti za organizacije z visoko zahtevnostjo.',
      en: 'Enterprise-grade features for organizations with demanding operations.'
    },
    highlights: {
      sl: ['Multi-tenant', 'Napredna varnost', 'Skalabilna arhitektura'],
      en: ['Multi-tenant', 'Advanced security', 'Scalable architecture']
    }
  },
  {
    id: 'solution-thynkr',
    paths: { sl: ['resitve', 'thynkr'], en: ['solutions', 'thynkr'] },
    nav: false,
    labels: { sl: 'Thynkr', en: 'Thynkr' },
    title: { sl: 'Thynkr | KUEM', en: 'Thynkr | KUEM' },
    description: {
      sl: 'Resitev za strukturirano sodelovanje in odlocanje.',
      en: 'A solution for structured collaboration and decision making.'
    },
    intro: {
      sl: 'Thynkr izboljsa transparentnost in hitrost ekipnih odlocitev.',
      en: 'Thynkr improves transparency and speed in team decisions.'
    },
    highlights: {
      sl: ['Skupinsko sodelovanje', 'Vpogledi v podatke', 'Sledenje odlocitvam'],
      en: ['Collaborative workflows', 'Data insights', 'Decision traceability']
    }
  },
  {
    id: 'contact',
    paths: { sl: ['kontakt'], en: ['contact'] },
    nav: true,
    labels: { sl: 'Kontakt', en: 'Contact' },
    title: { sl: 'Kontakt | KUEM', en: 'Contact | KUEM' },
    description: {
      sl: 'Stopite v stik z ekipo KUEM in se pogovorimo o vasem projektu.',
      en: 'Get in touch with KUEM and discuss your next project.'
    },
    intro: {
      sl: 'Povejte, kaj gradite, in pripravili bomo predlog izvedbe.',
      en: 'Tell us what you are building, and we will propose an execution plan.'
    },
    highlights: {
      sl: ['Hiter odziv', 'Tehnicni pregled', 'Predlog naslednjih korakov'],
      en: ['Fast response', 'Technical assessment', 'Practical next steps']
    }
  }
];

const routeMap = new Map<RouteId, RouteEntry>(ROUTES.map((route) => [route.id, route]));

export const MAIN_NAV: RouteId[] = ['home', 'services', 'solutions', 'about', 'contact'];

export function getRoute(routeId: RouteId): RouteEntry {
  const route = routeMap.get(routeId);
  if (!route) {
    throw new Error(`Unknown route id: ${routeId}`);
  }

  return route;
}

export function buildLocalizedSegments(locale: Locale, routeId: RouteId): string[] {
  const route = getRoute(routeId);
  const localized = route.paths[locale];

  if (locale === DEFAULT_LOCALE) {
    return localized;
  }

  return [locale, ...localized];
}

export function buildLocalizedPath(locale: Locale, routeId: RouteId): string {
  const segments = buildLocalizedSegments(locale, routeId);
  return segments.length ? `/${segments.join('/')}` : '/';
}

export function getNavItems(locale: Locale): Array<{ id: RouteId; href: string; label: string }> {
  return MAIN_NAV.map((routeId) => {
    const route = getRoute(routeId);
    return {
      id: routeId,
      href: buildLocalizedPath(locale, routeId),
      label: route.labels[locale]
    };
  });
}

export function getAlternatePaths(routeId: RouteId): Record<Locale, string> {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, buildLocalizedPath(locale, routeId)])
  ) as Record<Locale, string>;
}

export function buildStaticSlugParam(locale: Locale, routeId: RouteId): string | undefined {
  const segments = buildLocalizedSegments(locale, routeId);
  return segments.length ? segments.join('/') : undefined;
}
