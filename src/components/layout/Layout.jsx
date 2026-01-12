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
        { path: '/rh', label: 'Dashboard', icon: '📊' },
        { path: '/rh/encuestas', label: 'Encuestas', icon: '📋' },
        { path: '/rh/usuarios', label: 'Usuarios', icon: '👥' },
        { path: '/rh/competencias', label: 'Competencias', icon: '⚙️' },
        { path: '/rh/reportes', label: 'Reportes', icon: '📈' }
    ] : [
        { path: '/encuestas', label: 'Mis Encuestas', icon: '📋' }
    ]

    return (
        <div className="layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon">📊</span>
                        <div className="logo-text">
                            <span className="logo-title">Evaluación</span>
                            <span className="logo-subtitle">Viño Plastic</span>
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
                    <div className="user-info">
                        <div className="user-avatar">
                            {profile?.nombre?.charAt(0) || 'U'}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{profile?.nombre || 'Usuario'}</span>
                            <span className="user-role">
                                {isRH ? 'Recursos Humanos' : 'Personal'}
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                    >
                        Salir
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>

            {/* Mobile Bottom Nav */}
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
            </nav>
        </div>
    )
}

export default Layout
