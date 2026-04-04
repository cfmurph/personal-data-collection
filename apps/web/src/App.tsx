import { useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import OnboardingWizard from './components/OnboardingWizard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import FinancePage from './pages/FinancePage'
import FitnessPage from './pages/FitnessPage'
import HabitsPage from './pages/HabitsPage'
import InsightsPage from './pages/InsightsPage'
import DataPage from './pages/DataPage'
import GoalsPage from './pages/GoalsPage'

const ONBOARDING_KEY = 'pdh_onboarding_complete'

// Wraps all authenticated pages — handles loading, auth check, and onboarding
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === 'done'
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />

  return (
    <Layout>
      {!onboardingDone && (
        <OnboardingWizard
          onComplete={() => {
            localStorage.setItem(ONBOARDING_KEY, 'done')
            setOnboardingDone(true)
          }}
        />
      )}
      {children}
    </Layout>
  )
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/dashboard" element={<AuthenticatedLayout><DashboardPage /></AuthenticatedLayout>} />
      <Route path="/finance" element={<AuthenticatedLayout><FinancePage /></AuthenticatedLayout>} />
      <Route path="/fitness" element={<AuthenticatedLayout><FitnessPage /></AuthenticatedLayout>} />
      <Route path="/habits" element={<AuthenticatedLayout><HabitsPage /></AuthenticatedLayout>} />
      <Route path="/goals" element={<AuthenticatedLayout><GoalsPage /></AuthenticatedLayout>} />
      <Route path="/insights" element={<AuthenticatedLayout><InsightsPage /></AuthenticatedLayout>} />
      <Route path="/data" element={<AuthenticatedLayout><DataPage /></AuthenticatedLayout>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '10px', background: '#1f2937', color: '#fff', fontSize: '14px' },
          }}
        />
      </AuthProvider>
    </Router>
  )
}
