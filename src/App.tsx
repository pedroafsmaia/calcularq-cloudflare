import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastProvider } from './components/ui/ToastProvider'

const Home = lazy(() => import('./pages/Home'))
const Calculator = lazy(() => import('./pages/Calculator'))
const Manual = lazy(() => import('./pages/Manual'))
const Login = lazy(() => import('./pages/Login'))
const Payment = lazy(() => import('./pages/Payment'))
const PaymentClose = lazy(() => import('./pages/PaymentClose'))
const BudgetsHistory = lazy(() => import('./pages/BudgetsHistory'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Router>
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
          <Routes>
            <Route element={
              <Layout>
                <Outlet />
              </Layout>
            }>
            <Route path="/" element={<Home />} />
            <Route
              path="/calculator"
              element={
                <ProtectedRoute requirePayment={true}>
                  <Calculator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manual"
              element={
                <ProtectedRoute requirePayment={true}>
                  <Manual />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment/close" element={<PaymentClose />} />
            <Route
              path="/budgets"
              element={
                <ProtectedRoute requirePayment={true}>
                  <BudgetsHistory />
                </ProtectedRoute>
              }
            />
            </Route>
          </Routes>
        </Suspense>
      </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
