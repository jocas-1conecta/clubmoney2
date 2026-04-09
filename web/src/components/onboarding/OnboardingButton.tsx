import { useRef, useEffect } from 'react'
import { GraduationCap, ChevronRight, CheckCircle2, X } from 'lucide-react'
import { useOnboarding, TOUR_REGISTRY } from './OnboardingProvider'

/**
 * Floating "Centro de Ayuda" button — bottom-left corner.
 *
 * Opens a popover listing available guided tours.
 * Clicking a tour starts the state-driven guide panel.
 */
export default function OnboardingButton() {
  const { menuOpen, toggleMenu, closeMenu, startTour, completedTours } = useOnboarding()
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen, closeMenu])

  return (
    <>
      {/* ═══ FAB ═══ */}
      <button
        ref={buttonRef}
        className="onboarding-fab"
        onClick={toggleMenu}
        aria-label="Centro de Ayuda — Onboarding"
        aria-expanded={menuOpen}
        id="onboarding-fab"
      >
        <GraduationCap size={20} strokeWidth={2} />
        <span className="onboarding-fab__label">Onboarding</span>
        <span className="onboarding-fab__pulse" />
      </button>

      {/* ═══ POPOVER ═══ */}
      {menuOpen && (
        <div ref={popoverRef} className="onboarding-popover" role="dialog" aria-label="Recorridos disponibles">
          {/* Header */}
          <div className="onboarding-popover__header">
            <div>
              <h3 className="onboarding-popover__title">Centro de Ayuda</h3>
              <p className="onboarding-popover__subtitle">Recorridos guiados interactivos</p>
            </div>
            <button className="onboarding-popover__close" onClick={closeMenu} aria-label="Cerrar menú">
              <X size={16} />
            </button>
          </div>

          {/* Tour list */}
          <div className="onboarding-popover__body">
            <span className="onboarding-popover__section-label">Procesos disponibles</span>
            <ul className="onboarding-popover__list">
              {TOUR_REGISTRY.map((tour) => {
                const done = completedTours.has(tour.id)
                return (
                  <li key={tour.id}>
                    <button
                      className={`onboarding-popover__item ${done ? 'onboarding-popover__item--done' : ''}`}
                      onClick={() => startTour(tour.id)}
                    >
                      <div className="onboarding-popover__item-icon">{tour.icon}</div>
                      <div className="onboarding-popover__item-text">
                        <span className="onboarding-popover__item-title">{tour.title}</span>
                        <span className="onboarding-popover__item-desc">{tour.description}</span>
                      </div>
                      <div className="onboarding-popover__item-action">
                        {done ? (
                          <CheckCircle2 size={16} style={{ color: 'var(--color-accent)' }} />
                        ) : (
                          <ChevronRight size={16} style={{ color: 'var(--color-text-3)' }} />
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Footer */}
          <div className="onboarding-popover__footer">
            <span>
              {completedTours.size} / {TOUR_REGISTRY.length} completados
            </span>
          </div>
        </div>
      )}
    </>
  )
}
