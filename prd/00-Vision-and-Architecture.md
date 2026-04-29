# ClubMoney2 — Vision and Global Architecture

> **Type:** Lean PRD | **Version:** 1.0 | **Last updated:** 2026-04-29
> **Optimized for LLM consumption:** No marketing. Exact references to code, tables, and components.

---

## 1. Product Definition

**ClubMoney2** is a microfinance operations panel that replaces manual notebook-based lending workflows with a digitized, role-based system covering the full credit lifecycle: origination → formalization → daily field collection → reconciliation → delinquency management.

### Technical Identity

| Property | Value |
|---|---|
| Name | ClubMoney2 |
| Repository | https://github.com/jocas-1conecta/clubmoney2.git |
| Production | TBD (Cloudflare Pages) |
| Application type | SPA (Single Page Application) |
| Target users | Loan advisors, field collectors, supervisors, treasury, admin staff, management |

---

## 2. Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework with server component readiness |
| Vite | 8.0 | Build tool and dev server |
| TypeScript | 5.9 | Type safety |
| Tailwind CSS | 4.2 | Utility-first styling via `@tailwindcss/vite` |
| React Router DOM | 7.13 | Client-side routing |
| Lucide React | 1.7 | Icon system |
| Recharts | 3.8 | Dashboard charts and data visualization |
| Supabase SSR | 0.9 | Server-side Supabase client |
| Supabase JS | 2.100 | Client-side Supabase SDK |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Supabase (PostgreSQL) | — | Database, Auth, Storage, Realtime |
| RLS Policies | — | Row-Level Security with `has_role()` helpers |
| Supabase Auth | — | PKCE-flow authentication |
| Supabase Storage | — | File storage (documents, evidence, vouchers) |

### Infrastructure

| Service | Purpose |
|---|---|
| Cloudflare Pages | Hosting and CI/CD (automatic deploy on push to `main`) |
| Supabase Cloud | BaaS — DB, Auth, Storage, Realtime |
| GitHub | Source control and collaboration |

---

## 3. Base Security Model

### Authentication
- **Provider:** Supabase Auth with PKCE flow
- **Client:** `createBrowserClient()` in `web/src/utils/supabase/client.ts`
- **Hook:** `useAuth()` in `web/src/hooks/useAuth.tsx` — provides `session`, `user`, `profile`, `roles`, `signIn()`, `signOut()`, `hasRole()`
- **Guard:** `<ProtectedRoute>` in `web/src/components/auth/ProtectedRoute.tsx` — supports `allowedRoles` prop

### Authorization (RBAC + Granular Overrides)
- **6 roles:** ASESOR_COMERCIAL, COBRADOR_VERIFICADOR, SUPERVISOR, TESORERIA, ASESOR_ADMINISTRATIVO, GERENCIA
- **Permission model:** `(∪ role permissions) + (individual grants) − (individual denials)`
- **RLS enforcement:** All 43 tables have RLS enabled with `has_role()` and `get_user_zona_ids()` SECURITY DEFINER functions
- **Zone-based access:** Collectors see only clients/routes in their assigned zones

### Exceptions
| Exception | File | Reason |
|---|---|---|
| Navigator locks bypass | `web/src/utils/supabase/client.ts` | GoTrue lock causes hangs in React Strict Mode |

---

## 4. PRD Structure (Domain-Driven Design)

```
prd/
├── 00-Vision-and-Architecture.md    ← This file
├── core/
│   └── 01-Auth-and-Security.md
└── modules/
    ├── clients/
    │   └── 01-Clients.md
    ├── origination/
    │   └── 01-Loan-Applications.md
    ├── formalization/
    │   └── 01-Loans-and-Disbursements.md
    ├── collection/
    │   └── 01-Daily-Collection.md
    ├── consolidation/
    │   └── 01-Payment-Reconciliation.md
    ├── delinquency/
    │   └── 01-Delinquency-Management.md
    ├── configuration/
    │   └── 01-System-Configuration.md
    └── dashboard/
        └── 01-Dashboard.md
```

---

## 5. Module Map

### Core

| # | PRD | Status | Epics | Features |
|---|---|---|---|---|
| C1 | [Auth and Security](core/01-Auth-and-Security.md) | ✅ Completed | 3 | 8 |

### Business Modules

| # | Domain | PRD | Status | Epics | Features |
|---|---|---|---|---|---|
| M1 | Clients | [Clients](modules/clients/01-Clients.md) | ✅ Completed | 2 | 6 |
| M2 | Origination | [Loan Applications](modules/origination/01-Loan-Applications.md) | ✅ Completed | 3 | 10 |
| M3 | Formalization | [Loans & Disbursements](modules/formalization/01-Loans-and-Disbursements.md) | ✅ Completed | 2 | 5 |
| M4 | Collection | [Daily Collection](modules/collection/01-Daily-Collection.md) | ✅ Completed | 2 | 5 |
| M5 | Consolidation | [Payment Reconciliation](modules/consolidation/01-Payment-Reconciliation.md) | 📋 Planned | 2 | 4 |
| M6 | Delinquency | [Delinquency Management](modules/delinquency/01-Delinquency-Management.md) | ✅ Completed | 2 | 5 |
| M7 | Configuration | [System Configuration](modules/configuration/01-System-Configuration.md) | ✅ Completed | 2 | 5 |
| M8 | Dashboard | [Dashboard](modules/dashboard/01-Dashboard.md) | ✅ Completed | 1 | 4 |

---

## 6. Current Database

| Table | Owner Domain | Type |
|---|---|---|
| `perfiles` | Foundation | Master Data |
| `roles` | Foundation | Catalog |
| `permisos` | Foundation | Catalog |
| `rol_permisos` | Foundation | Mapping |
| `usuario_roles` | Foundation | Mapping |
| `usuario_permisos` | Foundation | Mapping |
| `zonas` | Foundation | Catalog |
| `asignaciones_zona` | Foundation | Transactional |
| `configuracion_sistema` | Foundation | Configuration |
| `clientes` | Clients | Master Data |
| `solicitudes_prestamo` | Origination | Transactional |
| `documentos_solicitud` | Origination | Transactional |
| `seeker_resultados` | Origination | Transactional |
| `visitas_presenciales` | Origination | Transactional |
| `evidencias` | Origination | Transactional |
| `referencias_entorno` | Origination | Transactional |
| `revisiones_supervisor` | Origination | Transactional |
| `prestamos` | Formalization | Transactional |
| `cuotas_programadas` | Formalization | Transactional |
| `contratos` | Formalization | Transactional |
| `recepcion_pagares` | Formalization | Transactional |
| `desembolsos` | Formalization | Transactional |
| `rutas_cobranza` | Collection | Transactional |
| `ruta_clientes` | Collection | Transactional |
| `pagos` | Collection | Transactional |
| `registro_billetes` | Collection | Transactional |
| `vouchers` | Collection | Transactional |
| `cuadernos_cliente` | Collection | Transactional |
| `registros_cuaderno` | Collection | Transactional |
| `movimientos_bancarios` | Consolidation | Transactional |
| `conciliaciones` | Consolidation | Transactional |
| `conciliacion_detalle` | Consolidation | Transactional |
| `inconsistencias_pago` | Consolidation | Transactional |
| `casos_morosidad` | Delinquency | Transactional |
| `acciones_morosidad` | Delinquency | Transactional |
| `novaciones` | Delinquency | Transactional |
| `chats` | Communication | Transactional |
| `chat_participantes` | Communication | Mapping |
| `mensajes_chat` | Communication | Transactional |
| `notificaciones` | Communication | Transactional |
| `reglas_comision` | Commissions | Configuration |
| `comisiones` | Commissions | Transactional |
| `audit_logs` | Audit | Transactional (Immutable) |

### New Table Conventions

- Name in `snake_case` plural
- RLS enabled mandatorily
- Create interface in `src/types/`
- Document in AGENTS.md

---

## 7. Deployment

### CI/CD Flow

```
Developer → git push main → Cloudflare Pages CI → Build (tsc -b && vite build) → Deploy to Production
```

### Environment Variables

| Variable | Type | Configure In |
|---|---|---|
| `VITE_SUPABASE_URL` | Public | Cloudflare Pages env, `.env` |
| `VITE_SUPABASE_ANON_KEY` | Public | Cloudflare Pages env, `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Cloudflare Pages env (never frontend) |
| `DATABASE_URL` | Secret | Cloudflare Pages env (never frontend) |
