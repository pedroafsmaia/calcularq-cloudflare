import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Calculator from './pages/Calculator'
import Manual from './pages/Manual'
import Login from './pages/Login'
import Payment from './pages/Payment'
import BudgetsHistory from './pages/BudgetsHistory'
import ResetPassword from './pages/ResetPassword'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  )
}

export default App
