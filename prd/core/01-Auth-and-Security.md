# Module Core: Auth and Security — Technical PRD

> **Domain:** core | **Status:** ✅ Completed
> **Last updated:** 2026-04-29
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | Core / Security |
| DB Tables | `perfiles`, `roles`, `permisos`, `rol_permisos`, `usuario_roles`, `usuario_permisos` |
| TypeScript Interfaces | `UserRole`, `UserProfile`, `UserRoleRecord` → `src/types/auth.ts` |
| Pages/Components | `LoginPage.tsx`, `ProtectedRoute.tsx`, `UnauthorizedPage.tsx` |
| Routes | `/login` (public), `/sin-acceso` (public) |
| RLS | Active on all auth-related tables |

## Epic 1: Authentication
### Feature 1.1: Email/Password Login
- [x] Supabase Auth PKCE flow — `web/src/utils/supabase/client.ts`
- [x] Login form with email + password — `web/src/pages/LoginPage.tsx`
- [x] Session persistence via `persistSession: true` — `web/src/utils/supabase/client.ts:L30`
- [x] Auth state listener (onAuthStateChange) — `web/src/hooks/useAuth.tsx:L107-L131`
- [x] Session timeout handling (5s failsafe) — `web/src/hooks/useAuth.tsx:L78-L83`

### Feature 1.2: Session Management
- [x] AuthProvider context wrapping entire app — `web/src/hooks/useAuth.tsx:L29-L151`
- [x] `useAuth()` hook exposing session, user, profile, roles — `web/src/hooks/useAuth.tsx:L154-L160`
- [x] Navigator locks bypass (single-tab safe) — `web/src/utils/supabase/client.ts:L19-L25`
- [x] Sign out function — `web/src/hooks/useAuth.tsx:L138-L140`

## Epic 2: Authorization (RBAC)
### Feature 2.1: Role-Based Access Control
- [x] 6 system roles defined as TypeScript union type — `web/src/types/auth.ts:L1-L7`
- [x] Roles fetched on login via `usuario_roles` join — `web/src/hooks/useAuth.tsx:L47-L49`
- [x] `hasRole()` helper on auth context — `web/src/hooks/useAuth.tsx:L142-L145`

### Feature 2.2: Route Protection
- [x] `<ProtectedRoute>` component with `allowedRoles` prop — `web/src/components/auth/ProtectedRoute.tsx`
- [x] Redirect to `/login` if unauthenticated — `web/src/components/auth/ProtectedRoute.tsx:L38-L40`
- [x] Redirect to `/sin-acceso` if role mismatch — `web/src/components/auth/ProtectedRoute.tsx:L42-L47`
- [x] Loading spinner during auth check — `web/src/components/auth/ProtectedRoute.tsx:L18-L36`

### Feature 2.3: Unauthorized Page
- [x] Dedicated 403 page — `web/src/pages/UnauthorizedPage.tsx`

## Epic 3: Row-Level Security
### Feature 3.1: RLS Policies
- [x] RLS enabled on all 43 tables — `supabase/migrations/20260330073723_12_rls_policies.sql`
- [x] `has_role()` SECURITY DEFINER helper function — `supabase/migrations/20260330073720_07b_funciones_rls.sql`
- [x] `get_user_zona_ids()` SECURITY DEFINER helper — `supabase/migrations/20260330073720_07b_funciones_rls.sql`
- [x] Role-specific SELECT policies for all critical tables — `supabase/migrations/20260330073723_12_rls_policies.sql`
- [x] Extended INSERT policies for origination flow — `supabase/migrations/20260407141200_15_rls_insert_originacion.sql`
- [x] Zone-based RLS refinements — `supabase/migrations/20260407143500_16_zonas_rls_fase23.sql`
- [x] Phase 4 closure policies — `supabase/migrations/20260407151700_17_rls_fase4_cierre.sql`

## Downstream Dependencies
| Consumer Module | Relationship |
|---|---|
| All modules | Every module depends on `useAuth()` for session and role checks |
| All modules | Every table depends on RLS policies for data access control |

## Roadmap (v2 — pending)
- [ ] Per-user permission overrides UI (grant/deny management page)
- [ ] Role management admin panel (currently seeded via SQL)
- [ ] Session refresh token rotation
- [ ] Multi-factor authentication (MFA)
- [ ] Segregation of Duties (SOD) matrix enforcement — 8 risk controls: who initiates vs. who validates for each process (credit approval, cash flow, reconciliation, custody) — `docs/02_permisos:L106-L118`
- [ ] Data masking for sensitive fields — bank accounts and phone numbers shown partially hidden (e.g., `***-***-1234`) for roles that don't require full data access — `docs/02_permisos:L125`

