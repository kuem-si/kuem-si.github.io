import type { Locale } from "../lib/i18n";

export type SolutionDetailKey =
  | "remoteMeterReading"
  | "municipalInfrastructure"
  | "publicLighting"
  | "environmentalMonitoring"
  | "schoolsKindergartens"
  | "waste"
  | "trafficMobility"
  | "haccpTemperature"
  | "tourismCampsMarinas"
  | "dataCenters";

export type SolutionDetail = {
  seoTitle: string;
  metaDescription: string;
  title: string;
  heroHeadline?: string;
  subtitle: string;
  keyMessage?: string;
  focus: string[];
  references: string[];
  ctaTitle: string;
  ctaText: string;
  ctaHref: string;
};

const cta = {
  sl: { ctaText: "Dogovorite predstavitev", ctaHref: "/sl/kontakt" },
  en: { ctaText: "Book a presentation", ctaHref: "/en/contact" }
};

export const solutionDetails: Record<SolutionDetailKey, Record<Locale, SolutionDetail>> = {
  remoteMeterReading: {
    sl: {
      seoTitle: "Daljinsko odčitavanje števcev | KUEM",
      metaDescription: "Daljinsko odčitavanje števcev vode, plina in energije z alarmi, zgodovino porabe in integracijo z obračunskimi sistemi.",
      title: "Daljinsko odčitavanje števcev vode, plina in energije",
      subtitle: "Nexavia omogoča ročna in samodejna odčitavanja števcev, spremljanje porabe, alarmiranje ob nepravilnostih ter povezavo podatkov z obračunskimi sistemi.",
      keyMessage: "Manj ročnega dela, manj napak, hitrejše zaznavanje nepravilnosti in boljši podatki za obračun.",
      focus: ["Plinomeri", "Vodomerji", "Števci električne energije", "Industrijski števci", "Ročna in samodejna odčitavanja", "Alarmi", "Zgodovina porabe", "Integracija z obračunskimi sistemi"],
      references: ["DOMPLAN, d.d.", "JKP Brezovica d.o.o.", "Sombor-gas d.o.o."],
      ctaTitle: "Želite digitalizirati odčitavanje števcev?",
      ...cta.sl
    },
    en: {
      seoTitle: "Remote meter reading | KUEM",
      metaDescription: "Remote reading of water, gas and energy meters with alarms, consumption history and integration with billing systems.",
      title: "Remote reading of water, gas and energy meters",
      subtitle: "Nexavia supports manual and automatic meter readings, consumption monitoring, alarms for irregularities and integration of data with billing systems.",
      keyMessage: "Less manual work, fewer errors, faster detection of irregularities and better data for billing.",
      focus: ["Gas meters", "Water meters", "Electricity meters", "Industrial meters", "Manual and automatic readings", "Alarms", "Consumption history", "Integration with billing systems"],
      references: ["DOMPLAN, d.d.", "JKP Brezovica d.o.o.", "Sombor-gas d.o.o."],
      ctaTitle: "Do you want to digitalize meter reading?",
      ...cta.en
    }
  },
  municipalInfrastructure: {
    sl: {
      seoTitle: "Digitalizacija občinske infrastrukture | KUEM",
      metaDescription: "Digitalizacija občinske infrastrukture s platformo Nexavia za daljinski nadzor števcev, javne razsvetljave, odpadkov, okolja, prometa in vodotokov.",
      title: "Digitalizacija občinske infrastrukture",
      heroHeadline: "Pametnejše upravljanje občinske infrastrukture na eni platformi",
      subtitle: "KUEM z lastno platformo Nexavia občinam in javnim podjetjem omogoča daljinsko spremljanje števcev, javne razsvetljave, odpadkov, kakovosti zraka, hrupa, prometa, vodotokov ter pogojev v šolah in vrtcih.",
      keyMessage: "Občina lahko začne z enim pilotom in platformo kasneje širi po modulih.",
      focus: ["Voda, plin in energija", "Javna razsvetljava", "Odpadki", "Šole in vrtci", "Promet in mobilnost", "AQI in hrup", "Vodotoki", "Občinska infrastruktura"],
      references: ["JKP Brezovica d.o.o.", "Krk / Callidus Grupa d.o.o.", "Grad Gradiška", "Mestna občina Novo mesto", "DOMPLAN, d.d.", "Sombor-gas d.o.o."],
      ctaTitle: "Začnite z enim občinskim pilotom",
      ...cta.sl
    },
    en: {
      seoTitle: "Municipal infrastructure digitalization | KUEM",
      metaDescription: "Municipal infrastructure digitalization with Nexavia for remote monitoring of meters, public lighting, waste, environment, traffic and watercourses.",
      title: "Municipal infrastructure digitalization",
      heroHeadline: "Smarter management of municipal infrastructure on one platform",
      subtitle: "With its own Nexavia platform, KUEM enables municipalities and public utilities to remotely monitor meters, public lighting, waste, air quality, noise, traffic, watercourses and conditions in schools and kindergartens.",
      keyMessage: "A municipality can start with one pilot and later expand the platform module by module.",
      focus: ["Water, gas and energy", "Public lighting", "Waste", "Schools and kindergartens", "Traffic and mobility", "AQI and noise", "Watercourses", "Municipal infrastructure"],
      references: ["JKP Brezovica d.o.o.", "Krk / Callidus Grupa d.o.o.", "Grad Gradiška", "Mestna občina Novo mesto", "DOMPLAN, d.d.", "Sombor-gas d.o.o."],
      ctaTitle: "Start with one municipal pilot",
      ...cta.en
    }
  },
  publicLighting: {
    sl: {
      seoTitle: "Digitalni nadzor javne razsvetljave | KUEM",
      metaDescription: "Digitalni nadzor javne razsvetljave z nadzorom svetilk, porabe, napak, urnikov delovanja, vzdrževanja in povezavo s platformo Nexavia.",
      title: "Digitalni nadzor javne razsvetljave",
      subtitle: "KUEM omogoča spremljanje javne razsvetljave prek platforme Nexavia, vključno z nadzorom svetilk, porabe, napak, urnikov in vzdrževalnih aktivnosti.",
      focus: ["Nadzor svetilk", "Spremljanje porabe", "Zaznavanje napak", "Urniki delovanja", "Optimizacija vzdrževanja", "LoRaWAN povezljivost", "Integracija z Nexavio"],
      references: ["Krk / Callidus Grupa d.o.o.", "JKP Brezovica d.o.o."],
      ctaTitle: "Želite nadzor nad javno razsvetljavo?",
      ...cta.sl
    },
    en: {
      seoTitle: "Digital supervision of public lighting | KUEM",
      metaDescription: "Digital supervision of public lighting with luminaire monitoring, consumption monitoring, fault detection, schedules, maintenance optimization and Nexavia integration.",
      title: "Digital supervision of public lighting",
      subtitle: "KUEM enables public-lighting monitoring through the Nexavia platform, including luminaire status, consumption, faults, operating schedules and maintenance activities.",
      focus: ["Luminaire monitoring", "Consumption monitoring", "Fault detection", "Operating schedules", "Maintenance optimization", "LoRaWAN connectivity", "Integration with Nexavia"],
      references: ["Krk / Callidus Grupa d.o.o.", "JKP Brezovica d.o.o."],
      ctaTitle: "Do you need supervision of public lighting?",
      ...cta.en
    }
  },
  environmentalMonitoring: {
    sl: {
      seoTitle: "Okoljski monitoring za občine in javne prostore | KUEM",
      metaDescription: "Okoljski monitoring za občine in javne prostore z nadzorom AQI, delcev PM, hrupa, temperature, vlage, CO₂, vremena, vodostaja in alarmov.",
      title: "Okoljski monitoring za občine in javne prostore",
      subtitle: "KUEM povezuje okoljske senzorje v platformo Nexavia za spremljanje kakovosti zraka, hrupa, vremena, vodostajev in drugih parametrov v javnem prostoru.",
      keyMessage: "Občina dobi realne podatke o kakovosti bivanja in okolju, ne samo občasnih meritev.",
      focus: ["AQI", "Delci PM", "Hrup", "Temperatura", "Vlaga", "CO₂", "Vremenski podatki", "Vodostaj", "Alarmi"],
      references: ["Grad Gradiška"],
      ctaTitle: "Želite spremljati okoljske parametre?",
      ...cta.sl
    },
    en: {
      seoTitle: "Environmental monitoring for municipalities and public spaces | KUEM",
      metaDescription: "Environmental monitoring for municipalities and public spaces with AQI, PM particles, noise, temperature, humidity, CO₂, weather data, river level and alarms.",
      title: "Environmental monitoring for municipalities and public spaces",
      subtitle: "KUEM connects environmental sensors into the Nexavia platform for monitoring air quality, noise, weather, river levels and other parameters in public spaces.",
      keyMessage: "The municipality gets real data about quality of life and the environment, not only occasional measurements.",
      focus: ["AQI", "PM particles", "Noise", "Temperature", "Humidity", "CO₂", "Weather data", "River level", "Alarms"],
      references: ["Grad Gradiška"],
      ctaTitle: "Do you want to monitor environmental parameters?",
      ...cta.en
    }
  },
  schoolsKindergartens: {
    sl: {
      seoTitle: "Digitalni nadzor pogojev v šolah in vrtcih | KUEM",
      metaDescription: "Digitalni nadzor pogojev v šolah in vrtcih: CO₂, temperatura, vlaga, odprta okna, radiatorji, alarmi in poročila za občine.",
      title: "Digitalni nadzor pogojev v šolah in vrtcih",
      subtitle: "KUEM pomaga občinam in upravljavcem objektov spremljati pogoje v učilnicah, igralnicah in sanitarnih prostorih ter podatke povezati z alarmi in poročili.",
      focus: ["CO₂", "Temperatura", "Vlaga", "Odprta okna", "Radiatorji", "Optimizacija ogrevanja", "Zaznavanje kajenja v sanitarnih prostorih", "Alarmi za vzdrževalce ali upravnike objektov", "Poročila za občine"],
      references: [],
      ctaTitle: "Želite spremljati pogoje v javnih objektih?",
      ...cta.sl
    },
    en: {
      seoTitle: "Digital monitoring of conditions in schools and kindergartens | KUEM",
      metaDescription: "Digital monitoring of conditions in schools and kindergartens: CO₂, temperature, humidity, open windows, radiators, alarms and reports for municipalities.",
      title: "Digital monitoring of conditions in schools and kindergartens",
      subtitle: "KUEM helps municipalities and facility managers monitor conditions in classrooms, playrooms and sanitary facilities and connect the data with alarms and reports.",
      focus: ["CO₂", "Temperature", "Humidity", "Open windows", "Radiators", "Heating optimization", "Smoking detection in sanitary facilities", "Alarms for maintenance staff or facility managers", "Reports for municipalities"],
      references: [],
      ctaTitle: "Do you want to monitor conditions in public buildings?",
      ...cta.en
    }
  },
  waste: {
    sl: {
      seoTitle: "Digitalno spremljanje nivoja odpadkov v zabojnikih | KUEM",
      metaDescription: "Digitalno spremljanje nivoja odpadkov v zabojnikih, alarmi, zgodovina polnjenja in podpora optimizaciji praznjenja ter načrtovanju poti.",
      title: "Digitalno spremljanje nivoja odpadkov v zabojnikih",
      subtitle: "Nexavia omogoča spremljanje napolnjenosti zabojnikov in uporabo podatkov za boljše načrtovanje praznjenja, alarmiranje in pregled zgodovine polnjenja.",
      focus: ["Nivo napolnjenosti zabojnikov", "Podzemni zabojniki", "Optimizacija praznjenja", "Alarmi", "Zgodovina polnjenja", "Podpora načrtovanju poti"],
      references: [],
      ctaTitle: "Želite optimizirati spremljanje odpadkov?",
      ...cta.sl
    },
    en: {
      seoTitle: "Digital monitoring of waste levels in containers | KUEM",
      metaDescription: "Digital monitoring of waste levels in containers, alarms, fill history and support for emptying optimization and route planning.",
      title: "Digital monitoring of waste levels in containers",
      subtitle: "Nexavia enables container fill-level monitoring and the use of data for better emptying plans, alarms and fill-history review.",
      focus: ["Container fill level", "Underground containers", "Emptying optimization", "Alarms", "Fill history", "Support for route planning"],
      references: [],
      ctaTitle: "Do you want to optimize waste monitoring?",
      ...cta.en
    }
  },
  trafficMobility: {
    sl: {
      seoTitle: "Štetje prometa in analiza mobilnosti | KUEM",
      metaDescription: "Štetje prometa in analiza mobilnosti za vozila, kolesarje, prometne tokove, lokacijsko analitiko in podporo prometnemu načrtovanju.",
      title: "Štetje prometa in analiza mobilnosti",
      subtitle: "KUEM povezuje podatke o prometu in mobilnosti v digitalne nadzorne plošče, ki pomagajo pri razumevanju tokov in podpori prometnemu načrtovanju.",
      focus: ["Štetje vozil", "Štetje kolesarjev", "Prometni tokovi", "Lokacijska analitika", "Podpora prometnemu načrtovanju"],
      references: ["Mestna občina Novo mesto", "Grad Gradiška"],
      ctaTitle: "Želite boljši vpogled v prometne tokove?",
      ...cta.sl
    },
    en: {
      seoTitle: "Traffic counting and mobility analysis | KUEM",
      metaDescription: "Traffic counting and mobility analysis for vehicles, cyclists, traffic flows, location-based analytics and support for traffic planning.",
      title: "Traffic counting and mobility analysis",
      subtitle: "KUEM connects traffic and mobility data into digital dashboards that help understand flows and support traffic planning.",
      focus: ["Vehicle counting", "Cyclist counting", "Traffic flows", "Location-based analytics", "Support for traffic planning"],
      references: ["Mestna občina Novo mesto", "Grad Gradiška"],
      ctaTitle: "Do you need better insight into traffic flows?",
      ...cta.en
    }
  },
  haccpTemperature: {
    sl: {
      seoTitle: "HACCP temperaturni monitoring | KUEM",
      metaDescription: "HACCP temperaturni monitoring za hladilnike, zamrzovalnike, solatne bare, ogrevane površine, alarmiranje, zgodovino meritev in poročila.",
      title: "HACCP temperaturni monitoring",
      subtitle: "KUEM omogoča digitalno spremljanje kritičnih temperaturnih točk, alarmiranje ob odstopanjih, zgodovino meritev in poročila za manj ročnega zapisovanja.",
      focus: ["Hladilniki", "Zamrzovalniki", "Solatni bari", "Ogrevana območja s hrano", "Temperaturni alarmi", "Zgodovina meritev", "Poročila", "Manj ročnega zapisovanja"],
      references: ["Tropic Maloprodaja d.o.o."],
      ctaTitle: "Želite digitalizirati HACCP spremljanje temperature?",
      ...cta.sl
    },
    en: {
      seoTitle: "HACCP temperature monitoring | KUEM",
      metaDescription: "HACCP temperature monitoring for refrigerators, freezers, salad bars, heated food areas, temperature alarms, measurement history and reports.",
      title: "HACCP temperature monitoring",
      subtitle: "KUEM enables digital monitoring of critical temperature points, alarms for deviations, measurement history and reports with less manual recording.",
      focus: ["Refrigerators", "Freezers", "Salad bars", "Heated food areas", "Temperature alarms", "Measurement history", "Reports", "Less manual recording"],
      references: ["Tropic Maloprodaja d.o.o."],
      ctaTitle: "Do you want to digitalize HACCP temperature monitoring?",
      ...cta.en
    }
  },
  tourismCampsMarinas: {
    sl: {
      seoTitle: "Digitalni nadzor porabe v turizmu, kampih in marinah | KUEM",
      metaDescription: "Digitalni nadzor porabe vode in elektrike v turizmu, kampih, marinah in mobilnih hiškah z alarmi, ventili in obračunom po porabi.",
      title: "Digitalni nadzor porabe v turizmu, kampih, marinah in mobilnih hiškah",
      subtitle: "KUEM omogoča spremljanje porabe vode in elektrike na turističnih lokacijah, kamp parcelah, marinah in mobilnih hiškah ter povezavo podatkov z alarmi in obračunom.",
      focus: ["Poraba vode", "Poraba elektrike", "Ventili", "Alarmi", "Mobilne hiške", "Kamp parcele", "Marine", "Obračun po porabi"],
      references: ["Marina Cloud d.o.o."],
      ctaTitle: "Želite spremljati porabo na turističnih lokacijah?",
      ...cta.sl
    },
    en: {
      seoTitle: "Digital consumption monitoring for tourism, camps and marinas | KUEM",
      metaDescription: "Digital monitoring of water and electricity consumption for tourism, camps, marinas and mobile homes with alarms, valves and consumption-based billing.",
      title: "Digital consumption monitoring for tourism, camps, marinas and mobile homes",
      subtitle: "KUEM enables monitoring of water and electricity consumption at tourism sites, campsite pitches, marinas and mobile homes, with data connected to alarms and billing.",
      focus: ["Water consumption", "Electricity consumption", "Valves", "Alarms", "Mobile homes", "Campsite pitches", "Marinas", "Consumption-based billing"],
      references: ["Marina Cloud d.o.o."],
      ctaTitle: "Do you want to monitor consumption at tourism sites?",
      ...cta.en
    }
  },
  dataCenters: {
    sl: {
      seoTitle: "Monitoring okolja v podatkovnih centrih | KUEM",
      metaDescription: "Monitoring okolja v podatkovnih centrih: temperatura na nivoju omare, vlaga, meritve na vstopu in izstopu zraka, zaznavanje vode, alarmi in integracije.",
      title: "Monitoring okolja v podatkovnih centrih",
      subtitle: "KUEM omogoča spremljanje okoljskih pogojev v podatkovnih centrih z alarmiranjem, lokalno postavitvijo in integracijo z obstoječimi nadzornimi sistemi.",
      focus: ["Temperatura na nivoju omare", "Vlaga", "Meritev na vstopu in izstopu zraka", "Zaznavanje izliva vode", "Alarmi", "Lokalna postavitev", "Integracija z obstoječimi nadzornimi sistemi"],
      references: [],
      ctaTitle: "Želite spremljati pogoje v podatkovnem centru?",
      ...cta.sl
    },
    en: {
      seoTitle: "Environmental monitoring in data centers | KUEM",
      metaDescription: "Environmental monitoring in data centers: rack-level temperature, humidity, air intake and exhaust measurement, water leak detection, alarms and integrations.",
      title: "Environmental monitoring in data centers",
      subtitle: "KUEM enables monitoring of environmental conditions in data centers with alarms, local deployment and integration with existing monitoring systems.",
      focus: ["Rack-level temperature", "Humidity", "Measurement at air intake and exhaust", "Water leak detection", "Alarms", "Local deployment", "Integration with existing monitoring systems"],
      references: [],
      ctaTitle: "Do you want to monitor data-center conditions?",
      ...cta.en
    }
  }
};
