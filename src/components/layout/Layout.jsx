import { useState, useCallback, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Layout.css'

// Nav items RH
const RH_NAV_ITEMS = [
    { path: '/rh', label: 'Inicio', end: true, icon: 'M3 9l7-7 7 7M5 8v8a1 1 0 0 0 1 1h3v-5h2v5h3a1 1 0 0 0 1-1V8' },
    { path: '/rh/encuestas', label: 'Encuestas', icon: 'M8 4H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 9h4M8 12h2' },
    { path: '/rh/usuarios', label: 'Usuarios', icon: 'M9 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 17v-1a3 3 0 0 0-3-3h-1M5 17v-1a3 3 0 0 1 3-3h1' },
    { path: '/rh/supervisores', label: 'Evaluados', icon: 'M14 16v-1a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v1M10 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
    { path: '/rh/competencias', label: 'Competencias', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4l2 2' },
    { path: '/rh/progreso', label: 'Progreso', icon: 'M2 14l4-8 4 4 6-8M18 14H2' },
    { path: '/rh/reportes', label: 'Reportes', icon: 'M3 3h14v14H3zM7 7h6M7 11h4M7 15h5' }
]

// Nav items operativo
const OPERATIVO_NAV_ITEMS = [
    { path: '/encuestas', label: 'Evaluaciones', end: true, icon: 'M9 11l3 3L20 6M4 16V6a2 2 0 0 1 2-2h12v12a2 2 0 0 1-2 2H6' }
]

const NavIcon = ({ d }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
)

const Layout = ({ children }) => {
    const { profile, logout } = useAuth()
    const navigate = useNavigate()
    const isRH = profile?.rol === 'rh'
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    const navItems = isRH ? RH_NAV_ITEMS : OPERATIVO_NAV_ITEMS

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 769)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [sidebarOpen])

    const toggleSidebar = useCallback(() => setSidebarOpen(p => !p), [])
    const closeSidebar = useCallback(() => setSidebarOpen(false), [])

    const handleLogout = useCallback(async () => {
        await logout()
        navigate('/login')
    }, [logout, navigate])

    return (
        <div className="layout">
            {/* Hamburger */}
            <button className={`hamburger ${sidebarOpen ? 'open' : ''}`} onClick={toggleSidebar} aria-label="Menu">
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Overlay */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar} />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="2" width="20" height="20" rx="4" fill="url(#logoGrad)"/>
                                <path d="M12 7v10M7 12h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                <defs>
                                    <linearGradient id="logoGrad" x1="2" y1="2" x2="22" y2="22">
                                        <stop offset="0%" stopColor="#3b82f6"/>
                                        <stop offset="100%" stopColor="#8b5cf6"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className="logo-text">Evaluación</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item, i) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end || false}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            <span className="nav-icon"><NavIcon d={item.icon} /></span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar">{profile?.nombre?.charAt(0)?.toUpperCase() || 'U'}</div>
                        <div className="user-info">
                            <span className="user-name">{profile?.nombre || 'Usuario'}</span>
                            <span className="user-role">{isRH ? 'Recursos Humanos' : 'Personal'}</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                        </svg>
                        <span>Salir</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="main-content">
                <div className="content-wrapper">{children}</div>
            </main>
        </div>
    )
}

export default Layout
