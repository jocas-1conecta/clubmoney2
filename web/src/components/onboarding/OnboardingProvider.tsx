import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { OnboardingContextValue, TourConfig, TourStep } from './tours/types'
import { originacionCreditoTour } from './tours/originacionCredito'

/* ─── Registry ───────────────────────────────────────────── */

const TOUR_REGISTRY: TourConfig[] = [
  originacionCreditoTour,
]

/* ─── LocalStorage ───────────────────────────────────────── */

const STORAGE_KEY = 'cm_completed_tours'

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveCompleted(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

/* ─── Context ────────────────────────────────────────────── */

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within <OnboardingProvider>')
  return ctx
}

/* ─── Provider ───────────────────────────────────────────── */

export default function OnboardingProvider({ children }: { children: ReactNode }) {
  const [completedTours, setCompletedTours] = useState<Set<string>>(loadCompleted)
  const [menuOpen, setMenuOpen] = useState(false)

  // Tour state
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const isActive = activeTour !== null
  const totalSteps = activeTour?.steps.length ?? 0
  const currentStepConfig: TourStep | null = activeTour?.steps[currentStep] ?? null

  // Ref to avoid stale closures in the poller
  const stepRef = useRef(currentStep)
  const tourRef = useRef(activeTour)
  stepRef.current = currentStep
  tourRef.current = activeTour

  /* ── Mark complete ── */
  const markComplete = useCallback((tourId: string) => {
    setCompletedTours((prev) => {
      const next = new Set(prev)
      next.add(tourId)
      saveCompleted(next)
      return next
    })
  }, [])

  /* ── Start tour ── */
  const startTour = useCallback((tourId: string) => {
    const tour = TOUR_REGISTRY.find((t) => t.id === tourId)
    if (!tour) return
    setMenuOpen(false)
    setCurrentStep(0)
    setActiveTour(tour)
  }, [])

  /* ── Exit tour ── */
  const exitTour = useCallback(() => {
    if (tourRef.current) {
      markComplete(tourRef.current.id)
    }
    setActiveTour(null)
    setCurrentStep(0)
  }, [markComplete])

  /* ── Advance step ── */
  const advanceStep = useCallback(() => {
    const tour = tourRef.current
    const step = stepRef.current
    if (!tour) return
    if (step + 1 >= tour.steps.length) {
      // Tour finished
      markComplete(tour.id)
      setActiveTour(null)
      setCurrentStep(0)
    } else {
      setCurrentStep(step + 1)
    }
  }, [markComplete])

  /* ══════════════════════════════════════════════════════════
   * STATE POLLER — checks advanceWhen() every 500ms
   * ══════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!activeTour) return

    const interval = setInterval(() => {
      const tour = tourRef.current
      const step = stepRef.current
      if (!tour) return
      const stepConfig = tour.steps[step]
      if (!stepConfig) return

      try {
        if (stepConfig.advanceWhen()) {
          advanceStep()
        }
      } catch {
        // advanceWhen failed (element not found, etc) — ignore
      }
    }, 500)

    return () => clearInterval(interval)
  }, [activeTour, advanceStep])

  /* ── Highlight pulsing on target element (inside modals) ── */
  useEffect(() => {
    if (!currentStepConfig || currentStepConfig.spotlight) return

    const tryHighlight = () => {
      const el = document.querySelector(currentStepConfig.target) as HTMLElement | null
      if (el) {
        el.classList.add('onboarding-highlight')
        return () => el.classList.remove('onboarding-highlight')
      }
      return null
    }

    // Try immediately, then retry after a short delay (element might not be in DOM yet)
    let cleanup = tryHighlight()
    let retryTimeout: ReturnType<typeof setTimeout> | null = null

    if (!cleanup) {
      retryTimeout = setTimeout(() => {
        cleanup = tryHighlight()
      }, 600)
    }

    return () => {
      if (cleanup) cleanup()
      if (retryTimeout) clearTimeout(retryTimeout)
      // Clean up any lingering highlights
      document.querySelectorAll('.onboarding-highlight').forEach((el) => {
        el.classList.remove('onboarding-highlight')
      })
    }
  }, [currentStepConfig])

  /* ── Menu ── */
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const value = useMemo<OnboardingContextValue>(
    () => ({
      startTour,
      exitTour,
      completedTours,
      isActive,
      currentStep,
      totalSteps,
      currentStepConfig,
      activeTour,
      menuOpen,
      toggleMenu,
      closeMenu,
    }),
    [startTour, exitTour, completedTours, isActive, currentStep, totalSteps, currentStepConfig, activeTour, menuOpen, toggleMenu, closeMenu],
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export { TOUR_REGISTRY }
