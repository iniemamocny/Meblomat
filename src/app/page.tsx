import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-24 px-4 py-16">
        <section className="grid items-center gap-12 md:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-8 text-center md:text-left">
            <span className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-black/70 dark:border-white/20 dark:text-white/70">
              kreator zabudowy stolarskiej
            </span>
            <div className="space-y-5">
              <h1 className="text-5xl font-semibold tracking-tight text-black sm:text-6xl dark:text-white">
                Zaprojektuj wymarzoną zabudowę bez wychodzenia z domu
              </h1>
              <p className="text-lg text-black/60 dark:text-white/60 sm:text-xl">
                Meblomat łączy wizualny konfigurator z wiedzą stolarzy. W kilka minut zbudujesz projekt, dobierzesz materiały
                i przygotujesz kompletny zestaw formatki do produkcji.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                href="/auth/register"
              >
                Rozpocznij darmową próbę
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black transition hover:border-black/20 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
                href="/play"
              >
                Zobacz przykład konfiguracji
              </Link>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-6 rounded-3xl bg-black/5 blur-3xl dark:bg-white/5" aria-hidden="true" />
            <Image
              alt="Wizualizacja projektu mebli na wymiar"
              className="relative mx-auto w-full max-w-md rounded-3xl border border-black/10 bg-white/60 p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900/60"
              height={480}
              src="/window.svg"
              width={480}
            />
          </div>
        </section>

        <section
          className="grid gap-10 scroll-mt-32 rounded-3xl border border-black/10 bg-white/80 p-10 text-left shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/70 md:grid-cols-[1.1fr,0.9fr]"
          id="meble"
        >
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-black dark:text-white">Projektuj meble dokładnie tak, jak potrzebujesz</h2>
            <p className="text-base text-black/70 dark:text-white/70">
              Elastyczny konfigurator pozwala budować szafy, zabudowy kuchenne i meble biurowe z zachowaniem dokładnych wymiarów.
              Wybierasz fronty, korpusy oraz akcesoria z biblioteki dostawców i natychmiast widzisz efekt na ekranie.
            </p>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              <li>• Gotowe szablony zabudów narożnych i wnękowych</li>
              <li>• Szczegółowe sterowanie podziałami, frontami i okuciami</li>
              <li>• Eksport projektu do PDF z rysunkami technicznymi</li>
            </ul>
          </div>
          <div className="flex items-center justify-center">
            <Image
              alt="Panel konfiguracji mebli"
              className="w-full max-w-xs rounded-2xl border border-black/10 bg-white/70 p-5 shadow-md dark:border-white/10 dark:bg-neutral-800/70"
              height={360}
              src="/globe.svg"
              width={360}
            />
          </div>
        </section>

        <section
          className="grid gap-10 scroll-mt-32 rounded-3xl border border-black/10 bg-white/80 p-10 text-left shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/70 md:grid-cols-[0.9fr,1.1fr]"
          id="pomieszczenie"
        >
          <div className="flex items-center justify-center">
            <Image
              alt="Skanowanie pomieszczenia"
              className="w-full max-w-xs rounded-2xl border border-black/10 bg-white/70 p-5 shadow-md dark:border-white/10 dark:bg-neutral-800/70"
              height={360}
              src="/file.svg"
              width={360}
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-black dark:text-white">Dopasuj zabudowę do realnych wymiarów pomieszczenia</h2>
            <p className="text-base text-black/70 dark:text-white/70">
              Wprowadź wymiary pomieszczenia lub wykorzystaj pliki z pomiarów laserowych. Kreator podpowie optymalny układ elementów,
              aby maksymalnie wykorzystać dostępną przestrzeń i zachować ergonomię.
            </p>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              <li>• Szybkie dopasowanie skosów, wnęk i nietypowych wysokości</li>
              <li>• Weryfikacja kolizji z instalacjami oraz sprzętem AGD</li>
              <li>• Widok 3D z możliwością udostępnienia klientowi</li>
            </ul>
          </div>
        </section>

        <section
          className="grid gap-10 scroll-mt-32 rounded-3xl border border-black/10 bg-white/80 p-10 text-left shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/70 md:grid-cols-[1.1fr,0.9fr]"
          id="wycena"
        >
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-black dark:text-white">Przygotuj ofertę i kosztorys jednym kliknięciem</h2>
            <p className="text-base text-black/70 dark:text-white/70">
              System automatycznie wylicza zużycie materiałów, okucia oraz robociznę na podstawie Twoich cenników. Wygenerujesz
              czytelną ofertę PDF wraz z wizualizacjami i listą elementów do zamówienia.
            </p>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              <li>• Aktualizacja stawek i rabatów w czasie rzeczywistym</li>
              <li>• Historia ofert i statusów akceptacji klienta</li>
              <li>• Integracja z systemami księgowymi i magazynowymi</li>
            </ul>
          </div>
          <div className="flex items-center justify-center">
            <Image
              alt="Panel wyceny"
              className="w-full max-w-xs rounded-2xl border border-black/10 bg-white/70 p-5 shadow-md dark:border-white/10 dark:bg-neutral-800/70"
              height={360}
              src="/next.svg"
              width={360}
            />
          </div>
        </section>

        <section
          className="grid gap-10 scroll-mt-32 rounded-3xl border border-black/10 bg-white/80 p-10 text-left shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/70 md:grid-cols-[0.9fr,1.1fr]"
          id="formatki"
        >
          <div className="flex items-center justify-center">
            <Image
              alt="Lista formatek do produkcji"
              className="w-full max-w-xs rounded-2xl border border-black/10 bg-white/70 p-5 shadow-md dark:border-white/10 dark:bg-neutral-800/70"
              height={360}
              src="/vercel.svg"
              width={360}
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-black dark:text-white">Eksportuj formatki gotowe dla stolarni</h2>
            <p className="text-base text-black/70 dark:text-white/70">
              Generuj listy formatek z rozkrojem płyt, opisem oklein oraz oznaczeniami otworów montażowych. Pliki wyślesz bezpośrednio
              do swojego dostawcy lub przekażesz do programu optymalizującego cięcie.
            </p>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              <li>• Eksport w formatach CSV, DXF oraz kompatybilnych z CNC</li>
              <li>• Automatyczne generowanie etykiet elementów</li>
              <li>• Harmonogram produkcji zsynchronizowany z kalendarzem</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
