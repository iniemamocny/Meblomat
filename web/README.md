# Meblomat – panel warsztatu z logowaniem Supabase

Interfejs Next.js zbudowany na potrzeby zarządzania warsztatem stolarskim. Repozytorium zawiera pełny dashboard oraz system
logowania/rejestracji oparty o Supabase z rozróżnieniem ról (administrator, stolarz, klient) i planów subskrypcyjnych.

## Wymagane zmienne środowiskowe

Utwórz plik `.env.local` w katalogu `web/` i uzupełnij go o dane swojego projektu Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# URL aplikacji używany do generowania linków afiliacyjnych
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Opcjonalnie – wymagane, jeśli chcesz wysyłać zaproszenia e-mail z uprawnieniami administratora Supabase
SUPABASE_SERVICE_ROLE_KEY=...
```

Po zmianie wartości uruchom `npm install` w katalogu `web/`, aby zainstalować zależności Supabase.

> **Uwaga:** podczas wdrożeń na Vercelu ustaw zmienną `NEXT_PUBLIC_SITE_URL` na publiczny adres swojej aplikacji (np. `https://twoja-domena.vercel.app`). Supabase wykorzystuje tę wartość do generowania linków logowania, dlatego nieprawidłowy URL spowoduje, że użytkownik otrzyma błędny adres w wiadomości e-mail.

## Uruchamianie projektu

```bash
npm run dev
```

Domyślnie aplikacja nasłuchuje na porcie `3000`. Po uruchomieniu odwiedź `http://localhost:3000`, aby zobaczyć panel. Jeśli nie
jesteś zalogowany, zostaniesz przekierowany na `/login`.

## Role i plany kont

- **Administrator** – konta tworzone ręcznie w Supabase (ustaw `role: "admin"` w `user_metadata`).
- **Stolarz** – podczas rejestracji otrzymuje plan `carpenter_professional`, automatyczny kod afiliacyjny oraz sekcję w dashboardzie z linkiem do udostępniania.
- **Klient** – może wybrać plan `client_free` (limit wysyłek do 2 stolarzy) lub `client_premium` (brak limitu). Informacje o planie i limicie są prezentowane po zalogowaniu.

Supabase przechowuje powyższe informacje w `user_metadata`, dzięki czemu można je wykorzystywać w politykach RLS lub automatyzacji w bazie.

## Integracja z bazą danych

Dashboard korzysta z Prisma i łączy się z bazą (np. Supabase Postgres). Po skonfigurowaniu zmiennej `DATABASE_URL` i wykonaniu migracji:

```bash
npx prisma migrate deploy
```

dane zaczną być pobierane bezpośrednio z bazy. Do momentu migracji panel prezentuje dane przykładowe.

## Kolejne kroki

1. **Zaproszenia e-mail** – po ustawieniu `SUPABASE_SERVICE_ROLE_KEY` dodaj akcję serwerową wykorzystującą `supabase.auth.admin.inviteUserByEmail`, aby stolarze mogli wysyłać zaproszenia bezpośrednio z panelu.
2. **Płatności** – podłącz wybrany procesor (np. Stripe) i aktualizuj `user_metadata.subscriptionPlan` po zmianie planu.
3. **Uprawnienia RLS** – na podstawie pola `role` zdefiniuj polityki bezpieczeństwa w tabelach Supabase.

Dokumentacja Supabase: https://supabase.com/docs

