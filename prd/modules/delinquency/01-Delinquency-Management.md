# Module Delinquency: Delinquency Management — Technical PRD

> **Domain:** delinquency | **Status:** ✅ Completed
> **Last updated:** 2026-04-29
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | Delinquency |
| DB Tables | `casos_morosidad`, `acciones_morosidad`, `novaciones` |
| TypeScript Interfaces | `CasoMorosidad`, `CategoriaMora`, `MorosidadEstado`, `AccionMorosidad` → `src/types/morosidad.ts` |
| Pages/Components | `MorosidadPage.tsx` |
| Routes | `/morosidad` (protected) |
| RLS | Active — assigned agent sees own, supervisor/admin/management sees all |

## Epic 1: Delinquency Case Management
### Feature 1.1: Case Listing
- [x] Delinquency case list with severity categorization — `web/src/pages/MorosidadPage.tsx`
- [x] Case data fetching hook — `web/src/hooks/useMorosidad.ts`
- [x] 4-tier mora classification (MORA_TEMPRANA / MORA_MEDIA / MORA_GRAVE / PREJURIDICO) — `web/src/types/morosidad.ts:L22`

### Feature 1.2: Case Data Model
- [x] Full case type with days overdue, overdue amount, assignment, payment promises — `web/src/types/morosidad.ts:L1-L20`
- [x] 6-state lifecycle: ABIERTO → EN_GESTION → RECUPERADO / REFINANCIADO / ESCALADO_CAMPO / CASTIGO — `web/src/types/morosidad.ts:L24-L30`
- [x] Client, assigned agent, and loan join fields — `web/src/types/morosidad.ts:L17-L19`

### Feature 1.3: Automatic Case Generation
- [ ] Daily batch at 6:00 AM: scan `prestamos` + `pagos`, auto-create/update `casos_morosidad` — `docs/06_morosidad:L4-L6`
- [ ] Auto-calculate `dias_sin_pago` based on last payment date vs. scheduled payment — `docs/06_morosidad:L6`
- [ ] Auto-assign initial severity category based on days overdue — `docs/06_morosidad:L6`
- [ ] Early alert: if tolerance days exceeded during route, open case immediately (don't wait for nightly batch) — `docs/04_cobranza:L33`

## Epic 2: Collection Actions
### Feature 2.1: Action Log
- [x] Action record type with type, description, result, and next action date — `web/src/types/morosidad.ts:L32-L43`
- [x] Action types: LLAMADA / WHATSAPP / SMS / EMAIL / VISITA_CAMPO / NOTIFICACION_EMBARGO — DB schema

### Feature 2.2: Payment Promise Tracking
- [ ] Register "Payment Promise" with specific date in `acciones_morosidad` — `docs/06_morosidad:L12`
- [ ] If promise date arrives and no payment in `pagos`: trigger immediate alert to agent — `docs/06_morosidad:L12`

### Feature 2.3: 7 Omnichannel Alerts
- [ ] 7 alert types sent via 3 channels (Email + WhatsApp + SMS) — `docs/06_morosidad:L14`
- [ ] Content: inform debtor of payment progress (amount paid vs. amount pending) — `docs/06_morosidad:L14`
- [ ] Triggered at configurable intervals based on `dias_sin_pago` — `docs/06_morosidad:L14`

### Feature 2.4: Automatic Route Insertion (Field Escalation)
- [ ] When remote management fails: auto-insert delinquent client into `ruta_clientes` — `docs/06_morosidad:L20`
- [ ] High priority `orden_visita` to ensure visit — `docs/06_morosidad:L21`
- [ ] Specific instruction visible to collector: "Recovery / Seizure Notice" based on `acciones_morosidad` history — `docs/06_morosidad:L22`

## Epic 3: Resolution and Restructuring
### Feature 3.1: Payment Recovery
- [ ] Case detail page with full action timeline — not yet implemented
- [ ] Full/partial payment closes case automatically: `estado→RECUPERADO` — `docs/06_morosidad:L27`

### Feature 3.2: Novation (Refinancing)
- [ ] Supervisor defines new terms for refinancing — `docs/06_morosidad:L28`
- [ ] **Accounting bridge (critical rule):** NEVER overwrite original loan — `docs/06_morosidad:L29`
  - Old loan → `CANCELADO_POR_REFINANCIACION` (frozen for vintage statistics) — `docs/06_morosidad:L30`
  - New loan created with new amount/schedule, linked via `novaciones` bridge table — `docs/06_morosidad:L31`
  - Enables accurate risk measurement (true vintage) without "masking" delinquent portfolio — `docs/06_morosidad:L32`

## Downstream Dependencies
| Consumer Module | Relationship |
|---|---|
| Formalization | `novaciones.prestamo_original_id` / `prestamo_nuevo_id` FK |
| Collection | Delinquency cases generated from missed payments |
| Communication | Delinquency-linked chat threads and notifications |

> [!WARNING]
> **Tech Debt:** The delinquency page is a list view only. No case detail page, no action recording UI, no novation/refinancing workflow UI exists yet.
