import type { ReactNode } from 'react'

/* ─── Tour Step — State-Driven (no "Next" buttons) ────────── */

export interface TourStep {
  /** Unique step ID for debugging */
  id: string
  /** CSS selector of the DOM element to highlight/pulse */
  target: string
  /** Title shown in the guide panel */
  title: string
  /** Instructional text for the user */
  description: string
  /**
   * Condition that must be TRUE for the tour to auto-advance.
   * This function is polled every 500ms.
   * It receives NO React state — it must query the DOM directly.
   */
  advanceWhen: () => boolean
  /**
   * Whether to show a full-screen spotlight (dark overlay with cutout).
   * Use TRUE only when the target is on the main page (not inside a modal).
   * Use FALSE when inside a modal — a CSS pulse highlight is used instead.
   */
  spotlight: boolean
}

/* ─── Tour Configuration ──────────────────────────────────── */

export interface TourConfig {
  /** Unique tour ID (used as localStorage key) */
  id: string
  /** Display title in the onboarding menu */
  title: string
  /** Short description shown in the menu */
  description: string
  /** Icon shown next to the tour title */
  icon: ReactNode
  /** Ordered list of state-driven steps */
  steps: TourStep[]
}

/* ─── Onboarding Context ──────────────────────────────────── */

export interface OnboardingContextValue {
  /** Start a tour by its ID */
  startTour: (tourId: string) => void
  /** Exit the current tour */
  exitTour: () => void
  /** Set of completed tour IDs */
  completedTours: Set<string>
  /** Whether a tour is currently active */
  isActive: boolean
  /** Current step index (if active) */
  currentStep: number
  /** Total steps in active tour */
  totalSteps: number
  /** Current step config (if active) */
  currentStepConfig: TourStep | null
  /** Active tour config (if active) */
  activeTour: TourConfig | null
  /** Whether the menu popover is open */
  menuOpen: boolean
  /** Toggle the menu */
  toggleMenu: () => void
  /** Close the menu */
  closeMenu: () => void
}
