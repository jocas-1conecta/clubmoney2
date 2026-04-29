# Module Origination: Loan Applications — Technical PRD

> **Domain:** origination | **Status:** ✅ Completed
> **Last updated:** 2026-04-29
> **Format:** Lean PRD optimized for LLM

## Metadata
| Field | Value |
|---|---|
| Owner | Origination |
| DB Tables | `solicitudes_prestamo`, `documentos_solicitud`, `seeker_resultados`, `visitas_presenciales`, `evidencias`, `referencias_entorno`, `revisiones_supervisor` |
| TypeScript Interfaces | `Solicitud`, `SolicitudEstado`, `SolicitudFormData` → `src/types/solicitudes.ts` |
| Pages/Components | `SolicitudesPage.tsx`, `SolicitudDetallePage.tsx`, `NuevaSolicitudModal.tsx`, `DocumentUploader.tsx` |
| Routes | `/solicitudes` (protected), `/solicitudes/:id` (protected) |
| RLS | Active — advisor sees own, supervisor/management sees all |

## Epic 1: Application Pipeline
### Feature 1.1: Application Listing
- [x] Filterable/searchable application list — `web/src/pages/SolicitudesPage.tsx`
- [x] Application data fetching hook — `web/src/hooks/useSolicitudes.ts`
- [x] Status-based filtering (7 states: INGRESADA → EN_FORMALIZACION) — `web/src/types/solicitudes.ts:L23-L30`

### Feature 1.2: New Application Creation
- [x] New application modal form — `web/src/components/solicitudes/NuevaSolicitudModal.tsx`
- [x] Client selection + financial parameters (amount, term, rate, schedule type) — `web/src/types/solicitudes.ts:L32-L40`
- [x] Renewal flag with previous loan reference — `web/src/types/solicitudes.ts:L9-L10`

### Feature 1.3: Application Detail View
- [x] Comprehensive detail page with state machine visualization — `web/src/pages/SolicitudDetallePage.tsx`
- [x] Detail data fetching hook — `web/src/hooks/useSolicitudDetalle.ts`
- [x] Client info display with DNI, photo, phone — `web/src/types/solicitudes.ts:L19`

## Epic 2: Document Management
### Feature 2.1: Document Upload
- [x] Multi-type document uploader (DNI front/back, utility bill, selfie, etc.) — `web/src/components/solicitudes/DocumentUploader.tsx`
- [x] Upload to Supabase Storage — `web/src/components/solicitudes/DocumentUploader.tsx`

## Epic 3: Evaluation and Approval
### Feature 3.1: State Transitions
- [x] Full state machine: INGRESADA → EN_EVALUACION → VERIFICACION_CAMPO → APROBADA/RECHAZADA/OBSERVADA → EN_FORMALIZACION — `web/src/types/solicitudes.ts:L23-L30`
- [x] State transition logic in detail hook — `web/src/hooks/useSolicitudDetalle.ts`

### Feature 3.2: Renewal Express Bypass
- [ ] When `es_renovacion=TRUE` + `calificacion_interna='EXCELENTE'` + no moras >3 days: set `requiere_verificacion_campo=FALSE` and skip VERIFICACION_CAMPO (transition directly `EN_EVALUACION→APROBADA`) — `docs/03_originacion:L62,L168-L176`

### Feature 3.3: Formalization Flow
- [x] Formalization hook with contract generation — `web/src/hooks/useFormalizacion.ts`
- [x] Transition from application to loan creation — `web/src/hooks/useFormalizacion.ts`

## Epic 4: Identity Validation (Anti-Fraud)
### Feature 4.1: Biometric Verification
- [ ] RENIEC API integration — validate DNI exists and extract legal name
- [ ] Biometric proof-of-life (Metamap/Veriff) — compare selfie against RENIEC photo
- [ ] `validacion_biometrica_ok=FALSE` → automatic irreversible rejection (AF-01)

### Feature 4.2: Credit Bureau Score
- [ ] Seeker API integration — fetch credit score and structured debt summary
- [ ] Auto-reject when score ≤ configurable threshold (AF-02)
- [ ] Auto-reject when client has active loans in `EN_MORA` status (AF-03)

### Feature 4.3: Field Verification with GPS
- [ ] GPS distance validation: compare check-in coordinates vs. declared address (AF-04)
- [ ] Alert to Supervisor + `audit_logs` entry when distance exceeds threshold
- [ ] Field verification workflow with evidence upload (photos, references form)

## Anti-Fraud Rules Index

| Code | Rule | Stage | Action |
|---|---|---|---|
| AF-01 | Biometric validation failed | Solicitud | Automatic irreversible rejection |
| AF-02 | Seeker score below minimum threshold | Evaluación | Automatic rejection + notification |
| AF-03 | Internal history with "payment problems" | Evaluación | Risk alert before sending to field |
| AF-04 | GPS distance vs. declared address | Verificación | Alert to Supervisor + audit log |
| AF-05 | Blurry/mismatched contract photo | Formalización | Return to advisor, block desembolso |
| AF-06 | Promissory note not delivered at EOD | Formalización | Block advisor commissions |

## Downstream Dependencies
| Consumer Module | Relationship |
|---|---|
| Formalization | `prestamos.solicitud_id` FK — loan created from approved application |
| Clients | `solicitudes_prestamo.cliente_id` FK |

## Roadmap (v2 — pending)
- [ ] Supervisor decision dashboard (score + photos + GPS map + references + history in one screen)
- [ ] Automatic notifications on approval/rejection (WhatsApp/SMS via `notificaciones`)
- [ ] Image quality pre-validation (reject blurry documents before accepting)
