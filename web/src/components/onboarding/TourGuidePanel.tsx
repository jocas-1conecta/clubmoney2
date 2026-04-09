import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useOnboarding } from './OnboardingProvider'

/**
 * TourGuidePanel — Non-blocking floating guide card + spotlight overlay
 *
 * - When spotlight=true, renders a visual-only SVG overlay (pointer-events: none)
 *   that darkens everything except the target element.
 * - Always renders a fixed-position guide card in the bottom-left corner,
 *   ABOVE the Onboarding FAB, showing the current step instructions.
 * - The card NEVER overlaps modals — it stays in the bottom-left corner.
 * - No "Next" buttons — advancement is fully state-driven.
 */
export default function TourGuidePanel() {
  const { isActive, currentStep, totalSteps, currentStepConfig, activeTour, exitTour } = useOnboarding()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  /* ── Track target element position for spotlight ── */
  const updateTargetRect = useCallback(() => {
    if (!currentStepConfig) {
      setTargetRect(null)
      return
    }
    const el = document.querySelector(currentStepConfig.target)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
    } else {
      setTargetRect(null)
    }
  }, [currentStepConfig])

  useEffect(() => {
    if (!isActive) return
    updateTargetRect()
    const interval = setInterval(updateTargetRect, 300)
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [isActive, updateTargetRect])

  if (!isActive || !currentStepConfig || !activeTour) return null

  const showSpotlight = currentStepConfig.spotlight && targetRect

  return createPortal(
    <>
      {/* ═══ SPOTLIGHT OVERLAY (visual only, pointer-events: none) ═══ */}
      {showSpotlight && targetRect && (
        <div className="tour-spotlight" aria-hidden="true">
          <svg width="100%" height="100%">
            <defs>
              <mask id="tour-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  ry="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(6, 10, 19, 0.7)"
              mask="url(#tour-spotlight-mask)"
            />
          </svg>
          {/* Pulsing beacon ring around the target */}
          <div
            className="tour-spotlight__beacon"
            style={{
              left: targetRect.left - 8,
              top: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        </div>
      )}

      {/* ═══ GUIDE PANEL — fixed bottom-left, never overlaps modals ═══ */}
      <div className="tour-guide" role="status" aria-live="polite">
        {/* Progress bar */}
        <div className="tour-guide__progress">
          <div
            className="tour-guide__progress-fill"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step counter */}
        <div className="tour-guide__step-badge">
          {activeTour.title} · {currentStep + 1}/{totalSteps}
        </div>

        {/* Title */}
        <h4 className="tour-guide__title">{currentStepConfig.title}</h4>

        {/* Description with HTML support */}
        <p
          className="tour-guide__description"
          dangerouslySetInnerHTML={{ __html: currentStepConfig.description }}
        />

        {/* Waiting indicator */}
        <div className="tour-guide__waiting">
          <span className="tour-guide__waiting-dot" />
          Esperando tu acción...
        </div>

        {/* Exit */}
        <button className="tour-guide__exit" onClick={exitTour}>
          Salir del tour
        </button>
      </div>
    </>,
    document.body,
  )
}
