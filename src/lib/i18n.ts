export type Language = "pl" | "en";

type SectionContent = {
  title: string;
  description: string;
  bullets: string[];
  imageAlt: string;
};

type Translations = {
  navigation: {
    meble: string;
    pomieszczenie: string;
    wycena: string;
    formatki: string;
    play: string;
  };
  header: {
    login: string;
    register: string;
    languageLabel: string;
    languageNames: Record<Language, string>;
    languageShort: Record<Language, string>;
    brand: string;
  };
  hero: {
    badge: string;
    heading: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    imageAlt: string;
  };
  sections: {
    meble: SectionContent;
    pomieszczenie: SectionContent;
    wycena: SectionContent;
    formatki: SectionContent;
  };
  footer: {
    rights: string;
    cta: string;
  };
};

export const translations: Record<Language, Translations> = {
  pl: {
    navigation: {
      meble: "meble",
      pomieszczenie: "pomieszczenie",
      wycena: "wycena",
      formatki: "formatki",
      play: "zobacz demo",
    },
    header: {
      login: "Zaloguj się",
      register: "Utwórz konto",
      languageLabel: "Zmień język",
      languageNames: {
        pl: "Polski",
        en: "Angielski",
      },
      languageShort: {
        pl: "PL",
        en: "EN",
      },
      brand: "Meblomat",
    },
    hero: {
      badge: "kreator zabudowy stolarskiej",
      heading: "Zaprojektuj wymarzoną zabudowę bez wychodzenia z domu",
      description:
        "Meblomat łączy wizualny konfigurator z wiedzą stolarzy. W kilka minut zbudujesz projekt, dobierzesz materiały i przygotujesz kompletny zestaw formatek do produkcji.",
      primaryCta: "Rozpocznij darmową próbę",
      secondaryCta: "Zobacz przykład konfiguracji",
      imageAlt: "Wizualizacja projektu mebli na wymiar",
    },
    sections: {
      meble: {
        title: "Projektuj meble dokładnie tak, jak potrzebujesz",
        description:
          "Elastyczny konfigurator pozwala budować szafy, zabudowy kuchenne i meble biurowe z zachowaniem dokładnych wymiarów. Wybierasz fronty, korpusy oraz akcesoria z biblioteki dostawców i natychmiast widzisz efekt na ekranie.",
        bullets: [
          "Gotowe szablony zabudów narożnych i wnękowych",
          "Szczegółowe sterowanie podziałami, frontami i okuciami",
          "Eksport projektu do PDF z rysunkami technicznymi",
        ],
        imageAlt: "Panel konfiguracji mebli",
      },
      pomieszczenie: {
        title: "Dopasuj zabudowę do realnych wymiarów pomieszczenia",
        description:
          "Wprowadź wymiary pomieszczenia lub wykorzystaj pliki z pomiarów laserowych. Kreator podpowie optymalny układ elementów, aby maksymalnie wykorzystać dostępną przestrzeń i zachować ergonomię.",
        bullets: [
          "Szybkie dopasowanie skosów, wnęk i nietypowych wysokości",
          "Weryfikacja kolizji z instalacjami oraz sprzętem AGD",
          "Widok 3D z możliwością udostępnienia klientowi",
        ],
        imageAlt: "Skanowanie pomieszczenia",
      },
      wycena: {
        title: "Przygotuj ofertę i kosztorys jednym kliknięciem",
        description:
          "System automatycznie wylicza zużycie materiałów, okucia oraz robociznę na podstawie Twoich cenników. Wygenerujesz czytelną ofertę PDF wraz z wizualizacjami i listą elementów do zamówienia.",
        bullets: [
          "Aktualizacja stawek i rabatów w czasie rzeczywistym",
          "Historia ofert i statusów akceptacji klienta",
          "Integracja z systemami księgowymi i magazynowymi",
        ],
        imageAlt: "Panel wyceny",
      },
      formatki: {
        title: "Eksportuj formatki gotowe dla stolarni",
        description:
          "Generuj listy formatek z rozkrojem płyt, opisem oklein oraz oznaczeniami otworów montażowych. Pliki wyślesz bezpośrednio do swojego dostawcy lub przekażesz do programu optymalizującego cięcie.",
        bullets: [
          "Eksport w formatach CSV, DXF oraz kompatybilnych z CNC",
          "Automatyczne generowanie etykiet elementów",
          "Harmonogram produkcji zsynchronizowany z kalendarzem",
        ],
        imageAlt: "Lista formatek do produkcji",
      },
    },
    footer: {
      rights: "Wszelkie prawa zastrzeżone.",
      cta: "Załóż konto",
    },
  },
  en: {
    navigation: {
      meble: "furniture",
      pomieszczenie: "workspace",
      wycena: "pricing",
      formatki: "cut lists",
      play: "view demo",
    },
    header: {
      login: "Log in",
      register: "Create account",
      languageLabel: "Change language",
      languageNames: {
        pl: "Polish",
        en: "English",
      },
      languageShort: {
        pl: "PL",
        en: "EN",
      },
      brand: "Meblomat",
    },
    hero: {
      badge: "cabinetry design suite",
      heading: "Design custom-built furniture without leaving home",
      description:
        "Meblomat combines a visual configurator with expert joinery knowledge. Build projects, choose materials, and prepare complete cutting lists for production in minutes.",
      primaryCta: "Start free trial",
      secondaryCta: "See configuration example",
      imageAlt: "Visualization of custom furniture project",
    },
    sections: {
      meble: {
        title: "Design furniture exactly the way you need",
        description:
          "A flexible configurator lets you create wardrobes, kitchen fittings, and office furniture with precise dimensions. Choose fronts, carcasses, and fittings from supplier libraries and instantly see the result on screen.",
        bullets: [
          "Ready-made templates for corner and alcove layouts",
          "Detailed control over divisions, fronts, and hardware",
          "Export projects to PDF with technical drawings",
        ],
        imageAlt: "Furniture configuration panel",
      },
      pomieszczenie: {
        title: "Match cabinetry to real room measurements",
        description:
          "Enter room dimensions or import laser measurement files. The wizard suggests the optimal arrangement to maximize space while maintaining ergonomics.",
        bullets: [
          "Quick adjustments for slants, niches, and unusual heights",
          "Collision checks with utilities and appliances",
          "Shareable 3D view for your client",
        ],
        imageAlt: "Room scanning",
      },
      wycena: {
        title: "Prepare offers and cost estimates in one click",
        description:
          "The system automatically calculates materials, hardware, and labor using your price lists. Generate a clear PDF offer with visualizations and a ready-to-order item list.",
        bullets: [
          "Real-time updates for rates and discounts",
          "Offer history with client approval statuses",
          "Integration with accounting and inventory systems",
        ],
        imageAlt: "Pricing panel",
      },
      formatki: {
        title: "Export cutting lists ready for the workshop",
        description:
          "Generate board cutting lists with edging details and drilling marks. Send files directly to suppliers or pass them to cutting optimization software.",
        bullets: [
          "Export to CSV, DXF, and CNC-ready formats",
          "Automatic generation of part labels",
          "Production schedule synchronized with your calendar",
        ],
        imageAlt: "Cut lists prepared for production",
      },
    },
    footer: {
      rights: "All rights reserved.",
      cta: "Get started",
    },
  },
};

export const supportedLanguages: Language[] = ["pl", "en"];
