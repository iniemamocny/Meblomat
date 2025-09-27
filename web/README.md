# Meblomat – panel warsztatu bez logowania

Interfejs Next.js do zarządzania warsztatem stolarskim. Dashboard ładuje
się od razu po uruchomieniu — jeśli Prisma nie może połączyć się z bazą,
wyświetla zestaw demonstracyjny, aby można było projektować widoki bez
konfigurowania logowania czy uwierzytelniania.

## Zmienne środowiskowe

Panel w katalogu `web/` nie wymaga dodatkowych zmiennych. Aby podpiąć
prawdziwe dane, ustaw `DATABASE_URL` w głównym pliku `.env` i uruchom
migracje Prisma z katalogu repozytorium:

```bash
npx prisma migrate deploy
```

## Uruchamianie projektu

```bash
npm run dev
```

Aplikacja nasłuchuje na porcie `3000`. Po wejściu na
`http://localhost:3000` zobaczysz dashboard z danymi z bazy (jeśli
połączenie działa) lub informacją o trybie demonstracyjnym z przykładową
treścią.

## Dane i workflow

- Podstawowe metryki (zlecenia, klienci, zespół) zaciągane są z Prisma.
- W przypadku błędu połączenia generowany jest zestaw danych
  przykładowych; UI informuje o tym w nagłówku i karcie statusu bazy.
- Interfejs nie zawiera widoków logowania ani zewnętrznych akcji
  uwierzytelniających — wszystkie sekcje są dostępne bez konta
  użytkownika.

## Kolejne kroki

1. Skonfiguruj zmienną `DATABASE_URL` i uruchom migracje w katalogu
   głównym (`prisma/migrate.sh` lub `npx prisma migrate deploy`).
2. Dodaj dane startowe do tabel (np. przez Prisma Studio lub import
   SQL).
3. Rozbuduj API w `web/src/app/api`, aby obsługiwać tworzenie i edycję
   zleceń z poziomu panelu.

## Manual QA

- [x] Uruchom aplikację bez ustawionego `DATABASE_URL`. Strona główna
      wyświetla tryb demonstracyjny z komunikatem o przykładowych
      danych.
