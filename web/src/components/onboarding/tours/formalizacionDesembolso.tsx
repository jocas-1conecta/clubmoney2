import { Stamp } from 'lucide-react'
import type { TourConfig } from './types'

/**
 * Tour: Formalización, Desembolso y Control Administrativo — State-Driven
 *
 * This tour guides users through the post-approval formalization process:
 * 1. Navigate to a solicitud in EN_FORMALIZACION state
 * 2. Open the Formalización tab
 * 3. Sign contracts
 * 4. Validate contracts (Tesorería)
 * 5. Register disbursement
 * 6. Confirm pagaré reception
 *
 * Each step auto-advances when its advanceWhen() condition is met.
 */
export const formalizacionDesembolsoTour: TourConfig = {
  id: 'formalizacion-desembolso',
  title: 'Flujo: Formalización y Desembolso',
  description: 'Aprende a firmar contratos, desembolsar y custodiar pagarés.',
  icon: <Stamp size={18} />,
  steps: [
    /* ──────────────────────────────────────────────────────────
     * PASO 1 — Abrir una solicitud en formalizacion
     * Avanza cuando el usuario navega al detalle de una solicitud.
     * ────────────────────────────────────────────────────────── */
    {
      id: 'abrir-solicitud-formalizacion',
      target: '[data-onboarding="tabla-solicitudes"]',
      title: 'Paso 1 · Abrir una solicitud aprobada',
      description:
        'Ve a <strong>Solicitudes</strong> y haz clic en una solicitud que esté en estado ' +
        '<strong>EN_FORMALIZACION</strong>. ' +
        'Si no tienes ninguna, primero aprueba una solicitud desde el tab Dictamen.',
      advanceWhen: () =>
        // User navigated to the detail page (URL contains /solicitudes/ with an ID)
        window.location.pathname.match(/\/solicitudes\/[a-f0-9-]+/) !== null,
      spotlight: true,
    },

    /* ──────────────────────────────────────────────────────────
     * PASO 2 — Clic en el tab "Formalización"
     * Avanza cuando la sección de contratos aparece en el DOM.
     * ────────────────────────────────────────────────────────── */
    {
      id: 'click-tab-formalizacion',
      target: '[data-onboarding="tab-formalizacion"]',
      title: 'Paso 2 · Abrir tab Formalización',
      description:
        'Haz clic en el tab <strong>"🔖 Formalización"</strong> para ver los contratos generados, ' +
        'el formulario de desembolso y el estado de los pagarés. Este tab solo aparece cuando la ' +
        'solicitud está en estado <strong>EN_FORMALIZACION</strong>, <strong>DESEMBOLSADA</strong> o <strong>ACTIVA</strong>.',
      advanceWhen: () =>
        document.querySelector('[data-onboarding="seccion-contratos"]') !== null,
      spotlight: false,
    },

    /* ──────────────────────────────────────────────────────────
     * PASO 3 — Firmar un contrato
     * Avanza cuando al menos un contrato tiene estado FIRMADO.
     * ────────────────────────────────────────────────────────── */
    {
      id: 'firmar-contrato',
      target: '[data-onboarding="seccion-contratos"]',
      title: 'Paso 3 · Firmar el contrato',
      description:
        'Cada contrato empieza en estado <strong>GENERADO</strong>. Haz clic en ' +
        '<strong>"Firmar"</strong> para marcarlo como firmado. ' +
        'En producción, aquí subirías la foto del contrato firmado por el cliente. ' +
        'El contrato pasará a estado <strong>FIRMADO</strong>.',
      advanceWhen: () => {
        const badges = document.querySelectorAll('[data-onboarding="seccion-contratos"] .cm-badge')
        return Array.from(badges).some((b) => b.textContent?.includes('FIRMADO'))
      },
      spotlight: false,
    },

    /* ──────────────────────────────────────────────────────────
     * PASO 4 — Validar contrato (Tesorería)
     * Avanza cuando al menos un contrato tiene estado VALIDADO.
     * ────────────────────────────────────────────────────────── */
    {
      id: 'validar-contrato',
      target: '[data-onboarding="seccion-contratos"]',
      title: 'Paso 4 · Validar contrato (Tesorería)',
      description:
        'Como Tesorería, revisa visualmente que la foto del contrato sea <strong>legible</strong>, ' +
        '<strong>firmada</strong> y coincida con el DNI. Si todo está bien, haz clic en ' +
        '<strong>"Validar"</strong>. Si no, <strong>"Devolver"</strong> con motivo. ' +
        'El botón solo aparece para roles con permisos de Tesorería.',
      advanceWhen: () => {
        const badges = document.querySelectorAll('[data-onboarding="seccion-contratos"] .cm-badge')
        return Array.from(badges).some((b) => b.textContent?.includes('Validado'))
      },
      spotlight: false,
    },

    /* ──────────────────────────────────────────────────────────
     * PASO 5 — Registrar desembolso
     * Avanza cuando aparece el card de desembolso completado.
     * ────────────────────────────────────────────────────────── */
    {
      id: 'registrar-desembolso',
      target: '[data-onboarding="seccion-desembolso"]',
      title: 'Paso 5 · Registrar el desembolso',
      description:
        'Con todos los contratos validados, completa el formulario de desembolso: ' +
        '<strong>medio de pago</strong>, <strong>banco destino</strong>, <strong>cuenta</strong> y ' +
        '<strong>número de operación</strong>. Luego haz clic en <strong>"Registrar Desembolso"</strong>. ' +
        'El préstamo pasará a estado <strong>ACTIVO</strong> y se generará la ruta de cobranza.',
      advanceWhen: () => {
        const el = document.querySelector('[data-onboarding="seccion-desembolso"]')
        if (!el) return false
        return el.textContent?.includes('COMPLETADO') ?? false
      },
      spotlight: false,
    },

    /* ──────────────────────────────────────────────────────────
     * PASO 6 — Confirmar recepción de pagaré
     * Avanza cuando aparece un pagaré en estado RECIBIDO.
     * ────────────────────────────────────────────────────────── */
    {
      id: 'recibir-pagare',
      target: '[data-onboarding="seccion-pagares"]',
      title: 'Paso 6 · Confirmar recepción del pagaré',
      description:
        'Al cierre del día, el Administrador recibe el <strong>pagaré físico</strong> del asesor. ' +
        'Haz clic en <strong>"Confirmar Recepción"</strong> solo cuando tengas el documento en mano. ' +
        'Esto <strong>desbloquea las comisiones</strong> del asesor. ' +
        '¡No marques como recibido un pagaré que no has verificado!',
      advanceWhen: () => {
        const el = document.querySelector('[data-onboarding="seccion-pagares"]')
        if (!el) return false
        return el.textContent?.includes('RECIBIDO') ?? false
      },
      spotlight: false,
    },
  ],
}
