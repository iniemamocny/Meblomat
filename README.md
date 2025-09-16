# System logowania i subskrypcji dla stolarzy

Monorepo aplikacji webowej do projektowania ścian/korpusów, kosztorysów i subskrypcji (login+hasło, weryfikacja e-mail).

## Konfiguracja środowiska

1. Skopiuj plik `.env.example` do `.env.local`.
2. Uzupełnij zmienne `NEXT_PUBLIC_SUPABASE_URL` oraz `NEXT_PUBLIC_SUPABASE_ANON_KEY` danymi swojej instancji Supabase.
3. Nie commituj prawdziwych danych uwierzytelniających — pliki `.env*` są ignorowane przez git i powinny pozostać tylko lokalnie.
