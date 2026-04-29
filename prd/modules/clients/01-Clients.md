# Module Clients: Client Management — Technical PRD

> **Domain:** clients | **Status:** ✅ Completed
> **Last updated:** 2026-04-29
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | Clients |
| DB Tables | `clientes`, `zonas` |
| TypeScript Interfaces | `Cliente`, `ClienteFormData`, `ClienteEstado`, `CalificacionInterna`, `Zona` → `src/types/clientes.ts` |
| Pages/Components | `ClientesPage.tsx`, `ClienteDetallePage.tsx` |
| Routes | `/clientes` (protected), `/clientes/:id` (protected) |
| RLS | Active — zone-based + registrado_por filtering |

## Epic 1: Client Registry
### Feature 1.1: Client Listing
- [x] Paginated client list with search — `web/src/pages/ClientesPage.tsx`
- [x] Client data fetching hook — `web/src/hooks/useClientes.ts`
- [x] Status badge display (ACTIVO/INACTIVO/BLOQUEADO) — `web/src/pages/ClientesPage.tsx`
- [x] Zone-based filtering — `web/src/hooks/useClientes.ts`

### Feature 1.2: Client CRUD
- [x] Create new client form — `web/src/pages/ClientesPage.tsx`
- [x] Client form data validation (DNI 8-char, required fields) — `web/src/types/clientes.ts:L26-L37`
- [x] Edit client data — `web/src/hooks/useClientes.ts`

### Feature 1.3: Client Detail
- [x] Full client detail view — `web/src/pages/ClienteDetallePage.tsx`
- [x] Client detail data fetching hook — `web/src/hooks/useClienteDetalle.ts`
- [x] Related solicitudes/prestamos display — `web/src/pages/ClienteDetallePage.tsx`

## Epic 2: Client Classification
### Feature 2.1: Internal Rating
- [x] Rating system (EXCELENTE/BUENO/REGULAR/MALO) — `web/src/types/clientes.ts:L2`
- [x] Recurring client flag — `web/src/types/clientes.ts:L14`

### Feature 2.2: Zone Assignment
- [x] Zone catalog type — `web/src/types/clientes.ts:L39-L44`
- [x] Zone join in client queries — `web/src/types/clientes.ts:L22`

## Downstream Dependencies
| Consumer Module | Relationship |
|---|---|
| Origination | `solicitudes_prestamo.cliente_id` FK |
| Formalization | `prestamos.cliente_id` FK |
| Collection | `ruta_clientes.cliente_id` FK, `pagos.cliente_id` FK |
| Delinquency | `casos_morosidad.cliente_id` FK |

## Roadmap (v2 — pending)
- [ ] Client photo upload with camera integration
- [ ] Client merge/deduplication tool
- [ ] Client credit history timeline
- [ ] Bulk import from CSV
