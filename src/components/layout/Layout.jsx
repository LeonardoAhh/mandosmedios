import { useState, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Layout.css'

// Nav items RH (estáticos, fuera del componente para evitar recreación)
const RH_NAV_ITEMS = [
    {
        path: '/rh',
        label: 'Dashboard',
        end: true,
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
            </svg>
        )
    },
    {
        path: '/rh/encuestas',
        label: 'Encuestas',
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7 3H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M7 3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M7 3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        path: '/rh/usuarios',
        label: 'Usuarios',
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M14 17v-2a4 4 0 0 0-4-4H4a4 4 0 0 0-4 4v2M10 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 17v-2a4 4 0 0 0-3-3.87M14 1.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        path: '/rh/supervisores',
        label: 'Evaluados',
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M16 17v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM18 17v-1a3 3 0 0 0-2-2.83M14 3.17a3 3 0 0 1 0 5.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        path: '/rh/competencias',
        label: 'Preguntas',
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        )
    },
    {
        path: '/rh/progreso',
        label: 'Progreso',
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M2 10h4l3-6 4 12 3-6h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        path: '/rh/reportes',
        label: 'Reportes',
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M18 18H2V2M6 14V10M10 14V6M14 14v-4M18 14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
]

// Nav items operativo (estáticos)
const OPERATIVO_NAV_ITEMS = [
    {
        path: '/encuestas',
        label: 'Mis Encuestas',
        end: true,
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7 3H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M7 3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M7 3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
]

const Layout = ({ children }) => {
    const { profile, logout } = useAuth()
    const navigate = useNavigate()
    const isRH = profile?.rol === 'rh'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navItems = isRH ? RH_NAV_ITEMS : OPERATIVO_NAV_ITEMS

    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev)
    }, [])

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false)
    }, [])

    const handleLogout = useCallback(async () => {
        await logout()
        navigate('/login')
    }, [logout, navigate])

    return (
        <div className="layout">
            {/* Hamburger Button para Tablet */}
            <button
                className="mobile-menu-toggle"
                onClick={toggleMobileMenu}
                aria-label={isMobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="sidebar-nav"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {/* Overlay para tablet */}
            {isMobileMenuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Desktop */}
            <aside
                id="sidebar-nav"
                className={`sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}
                aria-label="Navegación principal"
            >
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon" aria-hidden="true">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect x="4" y="4" width="24" height="24" rx="4" fill="url(#gradient)" />
                                <path d="M16 10v12M10 16h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="gradient" x1="4" y1="4" x2="28" y2="28">
                                        <stop offset="0%" stopColor="var(--primary, #3b82f6)" />
                                        <stop offset="100%" stopColor="var(--primary-dark, #2563eb)" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="logo-text">
                            <span className="logo-title">Evaluación</span>
                            <span className="logo-subtitle">ViñoPlastic</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav" aria-label="Menú principal">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end || false}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'nav-item-active' : ''}`
                            }
                            aria-current={({ isActive }) => isActive ? 'page' : undefined}
                            onClick={closeMobileMenu}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer" role="contentinfo">
                    <div className="user-card">
                        <div className="user-avatar" aria-hidden="true">
                            {profile?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{profile?.nombre || 'Usuario'}</span>
                            <span className="user-role">
                                {isRH ? 'Recursos Humanos' : 'Personal'}
                            </span>
                        </div>
                    </div>
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        aria-label="Cerrar sesión"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M7 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M13 13l4-4-4-4M17 9H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="content-wrapper">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-nav" aria-label="Navegación móvil">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end || false}
                        className={({ isActive }) =>
                            `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`
                        }
                        aria-current={({ isActive }) => isActive ? 'page' : undefined}
                    >
                        <span className="mobile-nav-icon">{item.icon}</span>
                        <span className="mobile-nav-label">{item.label}</span>
                    </NavLink>
                ))}
                <button
                    className="mobile-nav-item"
                    onClick={handleLogout}
                    aria-label="Cerrar sesión"
                >
                    <span className="mobile-nav-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M7 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M13 13l4-4-4-4M17 9H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <span className="mobile-nav-label">Salir</span>
                </button>
            </nav>
        </div>
    )
}

export default Layout
