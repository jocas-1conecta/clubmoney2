# Module Formalization: Loans and Disbursements — Technical PRD

> **Domain:** formalization | **Status:** ✅ Completed
> **Last updated:** 2026-04-29
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | Formalization |
| DB Tables | `prestamos`, `cuotas_programadas`, `contratos`, `recepcion_pagares`, `desembolsos`, `cuadernos_cliente`, `registros_cuaderno` |
| TypeScript Interfaces | `Prestamo`, `PrestamoEstado` → `src/types/prestamos.ts` |
| Pages/Components | `PrestamosPage.tsx` |
| Routes | `/prestamos` (protected) |
| RLS | Active — role + zone-based filtering |

## Epic 1: Loan Management
### Feature 1.1: Loan Listing
- [x] Loan list with status badges and financial summaries — `web/src/pages/PrestamosPage.tsx`
- [x] Loan data fetching hook — `web/src/hooks/usePrestamos.ts`
- [x] Full loan type with all financial fields (capital, interest, total, balance, rate) — `web/src/types/prestamos.ts:L1-L29`

### Feature 1.2: Loan State Machine
- [x] 6-state lifecycle: PENDIENTE_DESEMBOLSO → ACTIVO → CANCELADO / CANCELADO_POR_REFINANCIACION / VENCIDO / EN_MORA — `web/src/types/prestamos.ts:L31-L37`

### Feature 1.3: Schedule Types
- [x] Triple schedule support (FIJO/FLEXIBLE/HIBRIDO) with daily installment and suggested minimum — `web/src/types/prestamos.ts:L16-L17`

## Epic 2: Formalization Workflow
### Feature 2.1: Loan Creation from Application
- [x] Formalization hook bridging solicitud → préstamo creation — `web/src/hooks/useFormalizacion.ts`
- [x] Credit group ID assignment and novation chain tracking — `web/src/types/prestamos.ts:L8-L9`

### Feature 2.2: Contract State Machine
- [x] Contract CRUD in formalization hook — `web/src/hooks/useFormalizacion.ts`
- [ ] **Contract return cycle (DEVUELTO):** Tesorería returns contract with `motivo_devolucion` → Activity Feed notification to advisor → advisor re-uploads photo → same `contratos` record updated (no new record) → `validado_por_tesoreria=FALSE`, `estado→FIRMADO` (reset) → Tesorería re-validates. No limit on return cycles. — `docs/03_originacion:L361-L393`

### Feature 2.3: Desembolso Blocking Rules
- [ ] **Contract validation gate:** System MUST block desembolso if ANY contract has `estado != 'VALIDADO'`. Treasury cannot proceed without signed+validated document. — `docs/03_originacion:L342-L343` (AF-05)
- [ ] **Promissory note custody gate:** If `recepcion_pagares.recibido=FALSE`, system MUST block commission calculation for the advisor (`comisiones.estado` cannot advance to `CALCULADA`). — `docs/03_originacion:L436` (AF-06)

## Epic 3: Post-Desembolso Handoff
### Feature 3.1: Automatic Cobranza Activation
- [ ] On successful desembolso, system auto-executes: loan state → `ACTIVO` + `fecha_desembolso=HOY` — `docs/03_originacion:L417`
- [ ] Auto-create `cuadernos_cliente` if not exists, with `saldo_actual = monto_total_pagar` — `docs/03_originacion:L418`
- [ ] Auto-insert client into `ruta_clientes` for the collector of their zone, starting next day — `docs/03_originacion:L419`
- [ ] Auto-send client notification (WhatsApp/SMS) confirming desembolso, amount, and first payment date — `docs/03_originacion:L420`
- [ ] Auto-create first `registros_cuaderno` entry: `tipo_registro='NOTA_CAMPO'`, "Préstamo activado — Desembolso de S/ X" — `docs/03_originacion:L421`

### Feature 3.2: Promissory Note Custody Chain
- [ ] `recepcion_pagares` record auto-created at loan formalization with `recibido=FALSE`, `estado='PENDIENTE'` — `docs/03_originacion:L321`
- [ ] Admin validates physical reception: `recibido=TRUE`, `recibido_por`, `fecha_recepcion`, `estado='RECIBIDO'` — `docs/03_originacion:L433`
- [ ] Commission unlock triggered by pagaré reception — `docs/03_originacion:L436`

## Downstream Dependencies
| Consumer Module | Relationship |
|---|---|
| Collection | `pagos.prestamo_id` FK, `ruta_clientes.prestamo_id` FK |
| Delinquency | `casos_morosidad.prestamo_id` FK |
| Consolidation | via `pagos` reconciliation |

> [!WARNING]
> **Tech Debt:** Loan detail page is not implemented. `PrestamosPage.tsx` only shows a list view. No route exists for `/prestamos/:id`.

## Roadmap (v2 — pending)
- [ ] Loan detail page with payment history, schedule, and contract status
- [ ] PDF contract generation from template
- [ ] Digital signature support (biometric or e-signature)
- [ ] Disbursement recording with bank details and screenshot upload
- [ ] Loan restructuring (novation) UI
