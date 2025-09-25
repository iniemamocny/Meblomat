# Carpentry System – Development & Deployment Guide

Ten repozytorium zawiera szkielet systemu do zarządzania warsztatem
stolarskim. Znajdziesz tutaj gotowy frontend (Next.js), schemat Prisma
oraz podstawowe narzędzia do łączenia się z bazą danych (Supabase na
start, później Cloud SQL). Kod został przygotowany tak, aby można było
natychmiast projektować interfejs i równolegle pracować nad warstwą
backendową.

## Co jest w pakiecie?

- **Dashboard Next.js** – aplikacja w katalogu `web/` z gotowym ekranem
  startowym prezentującym zlecenia, klientów i zespół. W trybie braku
  bazy aplikacja korzysta z danych przykładowych, aby UI pozostał w pełni
  funkcjonalny.
- **Prisma schema** – rozbudowany model domeny (`prisma/schema.prisma`)
  z tabelami `Workshop`, `Carpenter`, `Client`, `Order`, `OrderTask` i
  `OrderNote` oraz enumami `OrderStatus`, `OrderPriority`, `TaskStatus`.
- **API Next.js** – endpointy `/api/health` oraz `/api/orders` używane do
  monitorowania stanu połączenia i pobierania listy zleceń.
- **Skrypty pomocnicze** – `npm run db:check` testuje połączenie z bazą,
  a `prisma/migrate.sh` uruchamia migracje w sposób przyjazny dla CI/CD.
- **Konfiguracja deploymentu** – Dockerfile w `docker/` oraz (do
  uzupełnienia) workflow GitHub Actions do Vercela i Google Cloud Run.

## Szybki start

1. Zainstaluj zależności (w katalogu głównym repozytorium):
   ```bash
   npm install
   npm install --prefix web
   ```
2. Skopiuj plik `.env.example` do `.env` i uzupełnij zmienną
   `DATABASE_URL` adresem połączeniowym z Supabase.
3. Wygeneruj klienta Prisma i utwórz tabele:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
4. Uruchom lokalnie dashboard (w katalogu `web/`):
   ```bash
   npm run dev
   ```
   Interfejs będzie dostępny pod adresem `http://localhost:3000`.

Na tym etapie, jeśli baza nie ma jeszcze tabel, w panelu zobaczysz dane
przykładowe. Po wykonaniu migracji i uzupełnieniu tabel wystarczy
odświeżyć stronę – dashboard automatycznie przełączy się na dane
produkcyjne.

## Model danych

| Model       | Kluczowe pola                              | Opis                                                 |
|-------------|--------------------------------------------|------------------------------------------------------|
| `Workshop`  | `name`, `location`                         | Warsztat lub zespół, do którego przypisani są stolarze. |
| `Carpenter` | `name`, `skills[]`, `workshopId`           | Informacje o stolarzach, ich umiejętnościach i powiązaniu z warsztatem. |
| `Client`    | `name`, `company`, `contact`               | Dane kontaktowe klientów oraz notatki.               |
| `Order`     | `reference`, `status`, `priority`, `budgetCents`, `dueDate` | Zamówienia wraz z priorytetem, terminami i przypisaniami. |
| `OrderTask` | `title`, `status`, `assigneeId`, `dueDate` | Zadania składające się na zamówienie (checklista).   |
| `OrderNote` | `author`, `message`                        | Notatki wewnętrzne do zlecenia.                      |

Enumy:

- `OrderStatus` – `PENDING`, `IN_PROGRESS`, `READY_FOR_DELIVERY`,
  `COMPLETED`, `CANCELLED`
- `OrderPriority` – `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- `TaskStatus` – `PENDING`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`

## Endpointy API (Next.js)

| Endpoint        | Opis                                                         |
|-----------------|--------------------------------------------------------------|
| `GET /api/health` | Zwraca status połączenia z bazą (`ok`, `unreachable`, `error`). |
| `GET /api/orders` | Lista zleceń z relacjami. W przypadku braku tabel zwraca dane przykładowe. |

Kolejne kroki to dodanie metod `POST/PUT/DELETE`, które pozwolą
zarządzać zleceniami z poziomu panelu.

## Testowanie połączenia z bazą

Skrypt `npm run db:check` (uruchamiany w katalogu głównym) wczytuje
zmienne z `.env`, łączy się z bazą za pomocą Prisma i wykonuje zapytanie
`SELECT NOW()`. Jeśli zobaczysz błąd połączenia, upewnij się, że
`DATABASE_URL` jest ustawione poprawnie oraz że masz dostęp sieciowy do
instancji.

## Uruchamianie migracji

```bash
export DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
bash prisma/migrate.sh
```

Skrypt wygeneruje klienta Prisma i zastosuje wszystkie oczekujące
migracje. W przypadku Supabase możesz skorzystać zarówno z portu 5432
(połączenie bezpośrednie), jak i z PgBouncera na porcie 6543.

## Integracja z Supabase i Google Cloud SQL

### Start na Supabase

Supabase oferuje szybki start z bazą PostgreSQL. W panelu projektów
kopiuj connection string (najlepiej PgBouncer) i umieść go w `.env`.
Przy wdrażaniu na Vercelu ustaw tę zmienną w sekcji *Environment
Variables*. Skrypt `npm run db:check` powinien zwrócić aktualny czas z
serwera, co potwierdzi poprawne połączenie.

### Migracja do Cloud SQL

Gdy projekt urośnie, zaplanuj migrację do Google Cloud SQL w regionie
`europe-central2` (Warszawa). Masz dwa warianty połączenia:

1. **Cloud SQL Auth Proxy** – osobny proces uwierzytelniany przez IAM,
   zestawia szyfrowane połączenie TLS. Wymaga wystawienia publicznego IP
   lub prywatnego łącza VPC.
2. **Cloud SQL Node.js Connector** – biblioteka dołączana do aplikacji,
   również korzystająca z IAM i TLS 1.3. Po zainicjalizowaniu funkcją
   `startLocalProxy()` możesz przekierować `DATABASE_URL` na gniazdo Unix.

Pamiętaj, że Vercel nie gwarantuje stałych adresów IP – użyj proxy lub
konektora, aby uniknąć konieczności białych list IP.

## Docker i deployment

- `docker/Dockerfile` – wieloetapowy build, który najpierw instaluje
  zależności i buduje projekt, a następnie przygotowuje lekki obraz
  runtime z Node.js. Kontener domyślnie wystawia port 3000.
- Po zbudowaniu obrazu (`docker build -t meblomat .`) możesz uruchomić
  kontener lokalnie: `docker run -p 3000:3000 meblomat`.

Workflow GitHub Actions (`.github/workflows/`) pozostawiono pusty do
uzupełnienia – możesz dodać automatyczne publikacje do Vercela i Cloud
Run, gdy projekt będzie gotowy do wdrożeń.

## Struktura repozytorium

```
.
├── prisma/            # Schema, klient Prisma i skrypt migracyjny
├── scripts/           # check-db.ts (test połączenia z bazą)
├── web/               # Aplikacja Next.js (dashboard)
│   ├── src/app/       # Strony, endpointy API i style globalne
│   ├── src/components # Komponenty UI (statusy, pipeline zleceń)
│   ├── src/lib/       # Dane przykładowe, formatowanie, helpery Prisma
│   └── src/server/    # Logika łączenia danych dla dashboardu
├── docker/            # Dockerfile dla Cloud Run
└── README.md          # Ten plik
```

## Następne kroki

1. Zaimplementuj endpointy `POST`/`PATCH` dla zamówień oraz notatek.
2. Dodaj autoryzację (np. Clerk, Auth0 lub Supabase Auth).
3. Rozbuduj pipeline CI/CD i monitoruj logi po wdrożeniu na produkcję.

Powodzenia w dalszym rozwijaniu Meblomatu! Jeśli potrzebujesz kolejnych
funkcjonalności, rozbuduj moduły w katalogach `web/src/server` i
`web/src/app/api`.
