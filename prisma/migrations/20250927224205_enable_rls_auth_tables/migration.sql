-- Enable and enforce row level security on Prisma auth tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_access_user" ON "User";
CREATE POLICY "service_role_all_access_user"
    ON "User"
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_access_session" ON "Session";
CREATE POLICY "service_role_all_access_session"
    ON "Session"
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Mirror the same protections on the lower-case public tables used by manual SQL scripts
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_access_public_users ON public.users;
CREATE POLICY service_role_all_access_public_users
    ON public.users
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_access_public_sessions ON public.sessions;
CREATE POLICY service_role_all_access_public_sessions
    ON public.sessions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
