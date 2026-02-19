import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import Loader from './components/ui/Loader'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const OperativoDashboard = lazy(() => import('./pages/operativo/Dashboard'))
const EncuestaPage = lazy(() => import('./pages/operativo/EncuestaPage'))
const RHDashboard = lazy(() => import('./pages/rh/Dashboard'))
const GestionEncuestas = lazy(() => import('./pages/rh/GestionEncuestas'))
const GestionUsuarios = lazy(() => import('./pages/rh/GestionUsuarios'))
const GestionCompetencias = lazy(() => import('./pages/rh/GestionCompetencias'))
const Reportes = lazy(() => import('./pages/rh/Reportes'))
const ReporteFinal = lazy(() => import('./pages/rh/ReporteFinal'))
const GestionSupervisores = lazy(() => import('./pages/rh/GestionSupervisores'))
const EmployeeProgress = lazy(() => import('./pages/rh/EmployeeProgress'))

const PageLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader fullScreen={false} message="Cargando..." />
    </div>
)

const RoleRedirect = () => {
    const { profile, loading } = useAuth()

    if (loading) {
        return <Loader fullScreen message="Cargando..." />
    }

    if (!profile) {
        return <Navigate to="/login" replace />
    }

    if (profile.rol === 'rh') {
        return <Navigate to="/rh" replace />
    }

    return <Navigate to="/encuestas" replace />
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={<RoleRedirect />} />

                        <Route path="/encuestas" element={
                            <ProtectedRoute requiredRole="operativo">
                                <Layout><OperativoDashboard /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/encuestas/:surveyId" element={
                            <ProtectedRoute requiredRole="operativo">
                                <Layout><EncuestaPage /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/encuestas/evaluar/:evaluadoId" element={
                            <ProtectedRoute requiredRole="operativo">
                                <Layout><EncuestaPage /></Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="/rh" element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout><RHDashboard /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/rh/encuestas" element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout><GestionEncuestas /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/rh/encuestas/nueva" element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout><GestionEncuestas /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/rh/usuarios" element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout><GestionUsuarios /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/rh/usuarios/nuevo" element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout><GestionUsuarios /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/rh/supervisores" element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout><GestionSupervisores /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/rh/reportes" element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout><Reportes /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/rh/reportes/final" element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout><ReporteFinal /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/rh/competencias" element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout><GestionCompetencias /></Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/rh/progreso" element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout><EmployeeProgress /></Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="*" element={<RoleRedirect />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
