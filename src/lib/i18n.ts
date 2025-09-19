export type Language = "pl" | "en";

type SectionContent = {
  title: string;
  description: string;
  bullets: string[];
  imageAlt: string;
};

type ProtectedFeatureContent = {
  title: string;
  description: string;
  highlights: string[];
  callToAction: string;
};

type ProtectedPagesContent = {
  badge: string;
  unauthorizedTitle: string;
  unauthorizedDescription: string;
  goBackCta: string;
  features: {
    wycena: ProtectedFeatureContent;
    formatki: ProtectedFeatureContent;
    project: ProtectedFeatureContent;
  };
};

type Translations = {
  navigation: {
    meble: string;
    pomieszczenie: string;
    wycena: string;
    formatki: string;
    play: string;
  };
  authenticatedNavigation: {
    meble: string;
    pomieszczenie: string;
    wycena: string;
    formatki: string;
    project: string;
  };
  header: {
    login: string;
    register: string;
    languageLabel: string;
    languageNames: Record<Language, string>;
    languageShort: Record<Language, string>;
    brand: string;
  };
  auth: {
    login: {
      title: string;
      description: string;
      noAccountPrompt: string;
      registerLinkLabel: string;
    };
    register: {
      title: string;
      description: string;
      hasAccountPrompt: string;
      loginLinkLabel: string;
    };
    signUpForm: {
      emailLabel: string;
      passwordLabel: string;
      accountTypeLegend: string;
      accountTypes: {
        carpenter: {
          label: string;
          description: string;
        };
        client: {
          label: string;
          description: string;
        };
      };
      accountTypeLocked: string;
      errors: {
        emailRequired: string;
        passwordRequired: string;
        registrationFailed: string;
      };
      status: {
        checkEmail: string;
      };
      submit: {
        default: string;
        submitting: string;
      };
    };
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
  protectedPages: ProtectedPagesContent;
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
    authenticatedNavigation: {
      meble: "meble",
      pomieszczenie: "pomieszczenie",
      wycena: "wycena",
      formatki: "formatki",
      project: "pokaż projekt",
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
    auth: {
      login: {
        title: "Witamy ponownie",
        description: "Zaloguj się, aby kontynuować pracę.",
        noAccountPrompt: "Nie masz jeszcze konta?",
        registerLinkLabel: "Utwórz je",
      },
      register: {
        title: "Utwórz konto",
        description:
          "Zarejestruj się przy użyciu adresu e-mail – wyślemy link potwierdzający.",
        hasAccountPrompt: "Masz już konto?",
        loginLinkLabel: "Zaloguj się",
      },
      signUpForm: {
        emailLabel: "Adres e-mail",
        passwordLabel: "Hasło",
        accountTypeLegend: "Typ konta",
        accountTypes: {
          carpenter: {
            label: "Stolarz (abonament)",
            description:
              "Odblokuj wszystkie funkcje profesjonalne w płatnym planie dla stolarzy.",
          },
          client: {
            label: "Klient (bezpłatnie)",
            description: "Współpracuj ze swoim stolarzem bez dodatkowych kosztów.",
          },
        },
        accountTypeLocked:
          "Nie możesz zmienić typu konta, ponieważ dołączasz z zaproszenia.",
        errors: {
          emailRequired: "Adres e-mail jest wymagany.",
          passwordRequired: "Hasło jest wymagane.",
          registrationFailed: "Rejestracja nie powiodła się.",
        },
        status: {
          checkEmail:
            "Sprawdź skrzynkę e-mail i kliknij link potwierdzający, aby dokończyć zakładanie konta.",
        },
        submit: {
          default: "Utwórz konto",
          submitting: "Tworzenie konta…",
        },
      },
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
    protectedPages: {
      badge: "panel roboczy",
      unauthorizedTitle: "Brak dostępu",
      unauthorizedDescription:
        "Ta sekcja jest dostępna tylko dla kont administratora oraz stolarza. Skontaktuj się z właścicielem zespołu, aby rozszerzyć uprawnienia.",
      goBackCta: "Wróć do pulpitu",
      features: {
        wycena: {
          title: "Zaawansowana wycena projektów",
          description:
            "Zbieraj wszystkie koszty w jednym miejscu – od materiałów po robociznę – i przygotowuj ofertę gotową do wysłania klientowi.",
          highlights: [
            "Twórz własne cenniki materiałów i automatycznie aktualizuj marże.",
            "Porównuj warianty ofert, aby szybko dopasować budżet do oczekiwań klienta.",
            "Eksportuj kosztorys wraz z wizualizacjami do PDF lub CSV jednym kliknięciem.",
          ],
          callToAction: "Przejdź do pulpitu",
        },
        formatki: {
          title: "Generator formatek produkcyjnych",
          description:
            "Opracuj kompletne listy cięć i obrzeży bez ręcznego liczenia – system wygeneruje je na podstawie zaakceptowanego projektu.",
          highlights: [
            "Przygotowuj listy elementów z podziałem na płyty, fronty i akcesoria.",
            "Eksportuj formatki do plików CSV kompatybilnych z maszynami CNC.",
            "Udostępniaj zestawienia ekipie produkcyjnej lub partnerom logistycznym.",
          ],
          callToAction: "Otwórz panel formatek",
        },
        project: {
          title: "Prezentacja projektu dla klienta",
          description:
            "Zaprezentuj gotowy projekt w czytelnej formie, aby klient mógł przejrzeć wizualizacje, szczegóły oraz status realizacji.",
          highlights: [
            "Udostępniaj interaktywny widok 3D oraz wizualizacje poglądowe.",
            "Dodawaj komentarze i aktualizacje, aby ułatwić komunikację z klientem.",
            "Zapisuj wszystkie pliki projektu w jednym, uporządkowanym miejscu.",
          ],
          callToAction: "Wróć do pulpitu",
        },
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
    authenticatedNavigation: {
      meble: "furniture",
      pomieszczenie: "workspace",
      wycena: "pricing",
      formatki: "cut lists",
      project: "show project",
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
    auth: {
      login: {
        title: "Welcome back",
        description: "Sign in to continue where you left off.",
        noAccountPrompt: "Don't have an account?",
        registerLinkLabel: "Create one",
      },
      register: {
        title: "Create your account",
        description:
          "Register with your email address and we'll send a confirmation link.",
        hasAccountPrompt: "Already have an account?",
        loginLinkLabel: "Sign in",
      },
      signUpForm: {
        emailLabel: "Email",
        passwordLabel: "Password",
        accountTypeLegend: "Account type",
        accountTypes: {
          carpenter: {
            label: "Carpenter (subscription)",
            description:
              "Unlock all professional features with a paid carpenter plan.",
          },
          client: {
            label: "Client (free)",
            description: "Collaborate with your carpenter at no additional cost.",
          },
        },
        accountTypeLocked:
          "Your account type is locked because you are joining from an invitation.",
        errors: {
          emailRequired: "Email is required.",
          passwordRequired: "Password is required.",
          registrationFailed: "Registration failed.",
        },
        status: {
          checkEmail:
            "Check your email for a confirmation link to finish setting up your account.",
        },
        submit: {
          default: "Create account",
          submitting: "Creating account…",
        },
      },
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
    protectedPages: {
      badge: "workspace tools",
      unauthorizedTitle: "Access restricted",
      unauthorizedDescription:
        "This area is available only to administrator and carpenter accounts. Contact your workspace owner if you need additional permissions.",
      goBackCta: "Return to dashboard",
      features: {
        wycena: {
          title: "Advanced project pricing",
          description:
            "Track every cost component—from materials to labor—and deliver a polished offer ready for your client.",
          highlights: [
            "Build custom material price lists and keep margins up to date automatically.",
            "Compare offer variants to match the customer's expectations and budget.",
            "Export estimates with visualizations to PDF or CSV in a single click.",
          ],
          callToAction: "Back to dashboard",
        },
        formatki: {
          title: "Production cut-list generator",
          description:
            "Create complete cutting and edging lists without manual calculations—everything is based on the approved design.",
          highlights: [
            "Prepare itemized lists grouped by boards, fronts, and hardware.",
            "Export cut lists to CNC-friendly CSV files.",
            "Share production packages with your workshop or logistics partners.",
          ],
          callToAction: "Open cut-list workspace",
        },
        project: {
          title: "Project presentation for clients",
          description:
            "Showcase the finalized design in a clear layout so clients can review visuals, details, and progress updates.",
          highlights: [
            "Share interactive 3D views and illustrative visualizations.",
            "Add comments and status updates to streamline collaboration.",
            "Store every project document in a single, organized place.",
          ],
          callToAction: "Return to dashboard",
        },
      },
    },
    footer: {
      rights: "All rights reserved.",
      cta: "Get started",
    },
  },
};

export const supportedLanguages: Language[] = ["pl", "en"];
