import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import './Layout.css'

const Layout = ({ children }) => {
    const { profile, logout } = useAuth()
    const navigate = useNavigate()
    const isRH = profile?.rol === 'rh'

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const navItems = isRH ? [
        {
            path: '/rh',
            label: 'Dashboard',
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 3H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M7 3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M7 3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            path: '/rh/usuarios',
            label: 'Usuarios',
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M14 17v-2a4 4 0 0 0-4-4H4a4 4 0 0 0-4 4v2M10 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 17v-2a4 4 0 0 0-3-3.87M14 1.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            path: '/rh/supervisores',
            label: 'Evaluados',
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M16 17v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM18 17v-1a3 3 0 0 0-2-2.83M14 3.17a3 3 0 0 1 0 5.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            path: '/rh/competencias',
            label: 'Preguntas',
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )
        },
        {
            path: '/rh/reportes',
            label: 'Reportes',
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M18 18H2V2M6 14V10M10 14V6M14 14v-4M18 14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }
    ] : [
        {
            path: '/encuestas',
            label: 'Mis Encuestas',
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 3H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M7 3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M7 3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }
    ]

    return (
        <div className="layout">
            {/* Sidebar Desktop */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect x="4" y="4" width="24" height="24" rx="4" fill="url(#gradient)" />
                                <path d="M16 10v12M10 16h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="gradient" x1="4" y1="4" x2="28" y2="28">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#2563eb" />
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

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/rh' || item.path === '/encuestas'}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'nav-item-active' : ''}`
                            }
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar">
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
                        title="Cerrar sesión"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
            <nav className="mobile-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/rh' || item.path === '/encuestas'}
                        className={({ isActive }) =>
                            `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`
                        }
                    >
                        <span className="mobile-nav-icon">{item.icon}</span>
                        <span className="mobile-nav-label">{item.label}</span>
                    </NavLink>
                ))}
                <button
                    className="mobile-nav-item"
                    onClick={handleLogout}
                    title="Cerrar sesión"
                >
                    <span className="mobile-nav-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
