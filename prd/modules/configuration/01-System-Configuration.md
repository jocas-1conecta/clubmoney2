# Module Configuration: System Configuration — Technical PRD

> **Domain:** configuration | **Status:** ✅ Completed
> **Last updated:** 2026-04-29
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | Configuration |
| DB Tables | `configuracion_sistema`, `zonas`, `roles`, `permisos`, `rol_permisos`, `usuario_roles` |
| Pages/Components | `ConfiguracionPage.tsx` |
| Routes | `/configuracion` (protected) |
| RLS | Active — read for all, write for GERENCIA |

## Epic 1: System Parameters
### Feature 1.1: Configuration Management
- [x] Tabbed configuration page — `web/src/pages/ConfiguracionPage.tsx`
- [x] Config data hook — `web/src/hooks/useConfiguracion.ts`

### Feature 1.2: Zone Management
- [x] Zone CRUD — `web/src/pages/ConfiguracionPage.tsx`

## Epic 2: User & Role Management
### Feature 2.1: User Administration
- [x] User listing and role assignment — `web/src/pages/ConfiguracionPage.tsx`

## Roadmap (v2 — pending)
- [ ] Per-user permission override UI
- [ ] Config change audit log viewer
- [ ] Commission rules configuration UI
