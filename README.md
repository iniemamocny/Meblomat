# Carpentry System – Development & Deployment Guide

Ten repozytorium zawiera szkielet systemu do zarządzania warsztatem
stolarskim. Znajdziesz tutaj gotowy frontend (Next.js), schemat Prisma
oraz podstawowe narzędzia do łączenia się z bazą danych PostgreSQL
(lokalną lub hostowaną w chmurze). Kod został przygotowany tak, aby
można było natychmiast projektować interfejs i równolegle pracować nad
warstwą backendową.

## Co jest w pakiecie?

- **Dashboard Next.js** – aplikacja w katalogu `web/` z gotowym ekranem
  startowym prezentującym zlecenia, klientów i zespół. Interfejs wymaga
  zalogowania i obsługuje sesje HTTP-only.
- **Prisma schema** – rozbudowany model domeny (`prisma/schema.prisma`)
  z tabelami `Workshop`, `Carpenter`, `Client`, `Order`, `OrderTask`,
  `OrderNote`, `User` i `Session` oraz enumami `OrderStatus`,
  `OrderPriority`, `TaskStatus`, `UserRole`.
- **API Next.js** – endpointy `/api/health`, `/api/orders`,
  `/api/auth/login` oraz `/api/auth/logout` używane do monitorowania stanu
  połączenia, uwierzytelniania i pobierania listy zleceń.
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
2. Skopiuj plik `.env.example` do `.env` i uzupełnij zmienne
   środowiskowe: `DATABASE_URL`, `AUTH_SESSION_COOKIE_NAME`,
   `AUTH_SESSION_TTL_MINUTES` oraz `AUTH_SESSION_COOKIE_SECURE`.
   Adres powinien wskazywać na Twoją bazę PostgreSQL (np.
   `postgresql://user:password@host:5432/dbname`).
   > 🪟 Użytkownicy Windows: ustaw `DATABASE_URL` w PowerShellu
   > poleceniem `setx DATABASE_URL "postgresql://..."` lub skorzystaj z
   > WSL, aby uniknąć problemów z migracjami.
3. Wygeneruj klienta Prisma i utwórz tabele (migracje są wersjonowane w katalogu `prisma/migrations/`):
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
   Jeśli musisz ręcznie odtworzyć schemat, uruchom skrypt z pliku `prisma/sql/20250926_init.sql` w swojej bazie.

   Skrypt pomija już istniejące typy enum, indeksy i klucze obce, dzięki czemu można go bezpiecznie uruchamiać ponownie.

   Po tej zmianie tabele `User`/`Session` (oraz odpowiadające im `public.users`/`public.sessions`) mają włączoną politykę RLS, która dopuszcza jedynie rolę `service_role` Supabase. Jeśli chcesz, aby inne role (np. `authenticated`/`anon` lub dedykowane role aplikacji) mogły czytać lub zapisywać dane logowania, dodaj własne polityki `CREATE POLICY` po wdrożeniu migracji.


4. Utwórz konto administratora (wymagane do logowania):
   ```bash
   npx ts-node scripts/create-admin.ts admin@example.com SuperTajneHaslo
   ```
   Polecenie tworzy (lub aktualizuje) użytkownika z rolą `admin` i ustawia nowe hasło.

5. Uruchom lokalnie dashboard (w katalogu `web/`):
   ```bash
   npm run dev
   ```
   Interfejs będzie dostępny pod adresem `http://localhost:3000`.

Po wykonaniu migracji i utworzeniu kont użytkowników interfejs wymaga
zalogowania. Jeśli baza nie ma jeszcze tabel, moduł dashboardu nadal może
wyświetlić dane przykładowe (dla celów projektowych), ale endpointy API
zwracają komunikaty o brakujących migracjach.

> 💡 Jeśli klonujesz repozytorium po raz pierwszy na Windowsie,
> rozważ uruchomienie polecenia `git config core.autocrlf false`, aby
> uniknąć ponownej konwersji końcówek linii w plikach.

## Model danych

| Model       | Kluczowe pola                              | Opis                                                 |
|-------------|--------------------------------------------|------------------------------------------------------|
| `Workshop`  | `name`, `location`                         | Warsztat lub zespół, do którego przypisani są stolarze. |
| `Carpenter` | `name`, `skills[]`, `workshopId`           | Informacje o stolarzach, ich umiejętnościach i powiązaniu z warsztatem. |
| `Client`    | `name`, `company`, `contact`               | Dane kontaktowe klientów oraz notatki.               |
| `Order`     | `reference`, `status`, `priority`, `budgetCents`, `dueDate` | Zamówienia wraz z priorytetem, terminami i przypisaniami. |
| `OrderTask` | `title`, `status`, `assigneeId`, `dueDate` | Zadania składające się na zamówienie (checklista).   |
| `OrderNote` | `author`, `message`                        | Notatki wewnętrzne do zlecenia.                      |
| `User`      | `email`, `passwordHash`, `roles[]`         | Konta użytkowników z opcjonalnym powiązaniem z klientem/stolarzem. |
| `Session`   | `token`, `userId`, `expiresAt`             | Sesje HTTP-only, kasowane po wylogowaniu lub wygaśnięciu. |

Enumy:

- `OrderStatus` – `PENDING`, `IN_PROGRESS`, `READY_FOR_DELIVERY`,
  `COMPLETED`, `CANCELLED`
- `OrderPriority` – `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- `TaskStatus` – `PENDING`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`
- `UserRole` – `admin`, `carpenter`, `client`

## Endpointy API (Next.js)

| Endpoint        | Opis                                                         |
|-----------------|--------------------------------------------------------------|
| `GET /api/health` | Zwraca status połączenia z bazą (`ok`, `unreachable`, `error`). |
| `GET /api/orders` | Lista zleceń z relacjami. Wymaga aktywnej sesji; przy braku migracji zwraca komunikat o błędzie. |
| `POST /api/auth/login` | Uwierzytelnienie użytkownika, zapis sesji i ustawienie ciasteczka HTTP-only. |
| `POST /api/auth/logout` | Usuwa sesję i czyści ciasteczko. |

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
migracje. Jeśli Twój dostawca udostępnia PgBouncera lub inny pooler,
podłącz się do wskazanego portu (najczęściej 6543); w pozostałych
przypadkach użyj standardowego portu 5432.

> 💾 Potrzebujesz manualnie zainicjalizować bazę? Skorzystaj ze skryptu
> `prisma/sql/20250926_init.sql`, który odtwarza aktualny schemat
> (generowany poleceniem `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`).

## Integracja z bazą danych i Google Cloud SQL

### Hostowana baza PostgreSQL

Platformy takie jak Neon, Railway czy Render udostępniają connection
string, który wystarczy wkleić do `.env`. Pamiętaj o ustawieniu zmiennej
`DATABASE_URL` również w środowisku produkcyjnym (np. na Vercelu), aby
aplikacja mogła połączyć się z bazą. Komenda `npm run db:check`
zweryfikuje, czy połączenie działa poprawnie.

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
├── scripts/           # check-db.ts, create-admin.ts (narzędzia CLI)
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
2. Rozbuduj obsługę ról (np. zróżnicowane uprawnienia `admin`/`carpenter`/`client`).
3. Rozbuduj pipeline CI/CD i monitoruj logi po wdrożeniu na produkcję.

Powodzenia w dalszym rozwijaniu Meblomatu! Jeśli potrzebujesz kolejnych
funkcjonalności, rozbuduj moduły w katalogach `web/src/server` i
`web/src/app/api`.
