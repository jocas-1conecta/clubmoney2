import { FileText } from 'lucide-react'
import type { TourConfig } from './types'

/**
 * Tour: Originación de Crédito — State-Driven
 *
 * Each step auto-advances when its advanceWhen() condition is met.
 * No "Next" buttons — the user's real interactions drive progression.
 */
export const originacionCreditoTour: TourConfig = {
  id: 'originacion-credito',
  title: 'Flujo: Originación de Crédito',
  description: 'Aprende el ciclo completo creando una solicitud real, paso a paso.',
  icon: <FileText size={18} />,
  steps: [
    /* ──────────────────────────────────────────────────────────
     * PASO 1 — Haz clic en "+ Nueva Solicitud"
     * El tour avanza cuando el modal de App se abre.
     * ────────────────────────────────────────────────────────── */
    {
      id: 'click-nueva-solicitud',
      target: '[data-onboarding="nueva-solicitud"]',
      title: 'Paso 1 · Nueva Solicitud',
      description:
        'Haz clic en <strong>"+ Nueva Solicitud"</strong> para iniciar el proceso de originación. ' +
        'El sistema abrirá un formulario de 3 fases: Cliente, Condiciones y Documentos.',
      advanceWhen: () => document.querySelector('.cm-modal-overlay') !== null,
      spotlight: true,
    },

    /* ──────────────────────────────────────────────────────────
     * PASO 2 — Buscar cliente por DNI
     * Avanza cuando la tarjeta de cliente aparece (encontrado o nuevo).
     * ────────────────────────────────────────────────────────── */
    {
      id: 'buscar-dni',
      target: '[data-onboarding="dni-search"]',
      title: 'Paso 2 · Buscar Cliente',
      description:
        'Ingresa los <strong>8 dígitos del DNI</strong> y haz clic en "Buscar". ' +
        'El sistema detectará si es un cliente nuevo o recurrente (deduplicación inteligente). ' +
        'Si no existe, podrás registrarlo en línea.',
      advanceWhen: () =>
        document.querySelector('.cm-client-card') !== null ||
        document.querySelector('.cm-new-client-form') !== null ||
        document.querySelector('.cm-client-notfound') !== null,
      spotlight: false,
    },

    /* ──────────────────────────────────────────────────────────
     * PASO 3 — Avanzar a Condiciones
     * Avanza cuando el paso del modal cambia a "condiciones".
     * ────────────────────────────────────────────────────────── */
    {
      id: 'avanzar-condiciones',
      target: '[data-onboarding="modal-siguiente"]',
      title: 'Paso 3 · Avanzar a Condiciones',
      description:
        'Con el cliente seleccionado, haz clic en <strong>"Siguiente"</strong> para pasar a las condiciones del préstamo. ' +
        'Aquí definirás monto, plazo, tasa de interés y tipo de cronograma.',
      advanceWhen: () =>
        document.querySelector('[data-onboarding="condiciones-form"]') !== null,
      spotlight: false,
    },

    /* ──────────────────────────────────────────────────────────
     * PASO 4 — Crear solicitud
     * Avanza cuando se abren los documentos (solicitud creada).
     * ────────────────────────────────────────────────────────── */
    {
      id: 'crear-solicitud',
      target: '[data-onboarding="condiciones-form"]',
      title: 'Paso 4 · Condiciones del Préstamo',
      description:
        'Llena el monto y las condiciones, luego haz clic en <strong>"Crear Solicitud"</strong>. ' +
        'Se generará el expediente digital y pasarás a la carga de documentos obligatorios.',
      advanceWhen: () =>
        document.querySelector('[data-onboarding="doc-uploader"]') !== null,
      spotlight: false,
    },

    /* ──────────────────────────────────────────────────────────
     * PASO 5 — Documentos y Finalizar
     * Avanza cuando el modal se cierra (usuario finalizó).
     * ────────────────────────────────────────────────────────── */
    {
      id: 'subir-documentos',
      target: '[data-onboarding="doc-uploader"]',
      title: 'Paso 5 · Documentos y Cierre',
      description:
        'Sube los documentos obligatorios: <strong>DNI frontal/reverso, recibo, selfie</strong>. ' +
        'Cuando termines, haz clic en <strong>"Finalizar"</strong> para cerrar el expediente. ' +
        '¡La solicitud quedará registrada en el pipeline!',
      advanceWhen: () => document.querySelector('.cm-modal-overlay') === null,
      spotlight: false,
    },
  ],
}
