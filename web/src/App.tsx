import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastContainer } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import OnboardingProvider from '@/components/onboarding/OnboardingProvider'
import OnboardingButton from '@/components/onboarding/OnboardingButton'
import TourGuidePanel from '@/components/onboarding/TourGuidePanel'

import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ClientesPage from '@/pages/ClientesPage'
import ClienteDetallePage from '@/pages/ClienteDetallePage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import SolicitudesPage from '@/pages/SolicitudesPage'
import SolicitudDetallePage from '@/pages/SolicitudDetallePage'
import PrestamosPage from '@/pages/PrestamosPage'
import CobranzaPage from '@/pages/CobranzaPage'
import MorosidadPage from '@/pages/MorosidadPage'
import ConfiguracionPage from '@/pages/ConfiguracionPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sin-acceso" element={<UnauthorizedPage />} />

            {/* Protected routes (any authenticated user) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />

                {/* Modules */}
                <Route path="clientes" element={<ClientesPage />} />
                <Route path="clientes/:id" element={<ClienteDetallePage />} />

                {/* Placeholder routes — se implementarán por módulo */}
                <Route path="solicitudes" element={<SolicitudesPage />} />
                <Route path="solicitudes/:id" element={<SolicitudDetallePage />} />
                <Route path="prestamos" element={<PrestamosPage />} />
                <Route path="cobranza" element={<CobranzaPage />} />
                <Route path="morosidad" element={<MorosidadPage />} />
                <Route path="configuracion" element={<ConfiguracionPage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<PlaceholderPage title="404 — Página no encontrada" />} />
          </Routes>

          {/* Global Onboarding UI (visible only on protected routes) */}
          <OnboardingButton />
          <TourGuidePanel />

          <ToastContainer />
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

/** Temporary placeholder for future module pages */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Este módulo está en desarrollo.
        </p>
      </div>
    </div>
  )
}

