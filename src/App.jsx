import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import Loader from './components/ui/Loader'

import LoginPage from './pages/LoginPage'
import OperativoDashboard from './pages/operativo/Dashboard'
import EncuestaPage from './pages/operativo/EncuestaPage'
import RHDashboard from './pages/rh/Dashboard'
import GestionEncuestas from './pages/rh/GestionEncuestas'
import GestionUsuarios from './pages/rh/GestionUsuarios'
import GestionCompetencias from './pages/rh/GestionCompetencias'
import Reportes from './pages/rh/Reportes'

// Componente para redirigir según rol
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
                <Routes>
                    {/* Login */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Redirect root */}
                    <Route path="/" element={<RoleRedirect />} />

                    {/* Portal Operativo */}
                    <Route
                        path="/encuestas"
                        element={
                            <ProtectedRoute requiredRole="operativo">
                                <Layout>
                                    <OperativoDashboard />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/encuestas/:surveyId"
                        element={
                            <ProtectedRoute requiredRole="operativo">
                                <Layout>
                                    <EncuestaPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/encuestas/evaluar/:evaluadoId"
                        element={
                            <ProtectedRoute requiredRole="operativo">
                                <Layout>
                                    <EncuestaPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Portal RH */}
                    <Route
                        path="/rh"
                        element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout>
                                    <RHDashboard />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rh/encuestas"
                        element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout>
                                    <GestionEncuestas />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rh/encuestas/nueva"
                        element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout>
                                    <GestionEncuestas />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rh/usuarios"
                        element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout>
                                    <GestionUsuarios />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rh/usuarios/nuevo"
                        element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout>
                                    <GestionUsuarios />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rh/reportes"
                        element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout>
                                    <Reportes />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rh/competencias"
                        element={
                            <ProtectedRoute requiredRole="rh">
                                <Layout>
                                    <GestionCompetencias />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* 404 - Redirigir a inicio */}
                    <Route path="*" element={<RoleRedirect />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
