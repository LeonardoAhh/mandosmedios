import { useState, useEffect } from 'react'
import {
    getAllUsers,
    registerUser,
    updateUser,
    deleteUser,
    NIVELES
} from '../../config/firebase'
import {
    CATALOGO_PUESTOS,
    DEPARTAMENTOS,
    getPuestosByDepartamento,
    getPuestoInfo
} from '../../config/catalogoPuestos'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loader from '../../components/ui/Loader'
import './GestionUsuarios.css'

const GestionUsuarios = () => {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'operativo',
        nivel: 'operativo',
        departamento: '',
        puesto: '',
        evaluaA: '',
        turnoFijo: 1
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    const puestosDisponibles = formData.departamento
        ? getPuestosByDepartamento(formData.departamento)
        : CATALOGO_PUESTOS

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const result = await getAllUsers()
            if (result.success) {
                setUsers(result.data)
            }
        } catch (error) {
            console.error('Error loading users:', error)
            setError('Error al cargar usuarios')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            nombre: '',
            email: '',
            password: '',
            rol: 'operativo',
            nivel: 'operativo',
            departamento: '',
            puesto: '',
            evaluaA: '',
            turnoFijo: 1
        })
        setEditingUser(null)
        setError('')
    }

    const handleDepartamentoChange = (departamento) => {
        setFormData({
            ...formData,
            departamento,
            puesto: '',
            evaluaA: ''
        })
    }

    const handlePuestoChange = (puesto) => {
        const info = getPuestoInfo(puesto)
        if (info) {
            setFormData({
                ...formData,
                puesto,
                nivel: info.nivel,
                evaluaA: info.evalua || '',
                departamento: info.departamento
            })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const userData = {
                nombre: formData.nombre.trim(),
                rol: formData.rol,
                nivel: formData.nivel,
                departamento: formData.departamento,
                puesto: formData.puesto,
                evaluaA: formData.evaluaA,
                turnoFijo: parseInt(formData.turnoFijo) || 1,
                turnoActual: parseInt(formData.turnoFijo) || 1
            }

            const result = await registerUser(
                formData.email.trim(),
                formData.password,
                userData
            )

            if (result.success) {
                setShowModal(false)
                resetForm()
                await loadUsers()
            } else {
                setError(result.error || 'Error al crear usuario')
            }
        } catch (error) {
            console.error('Error creating user:', error)
            setError('Error al crear usuario. Por favor intenta de nuevo.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRoleChange = async (userId, newRol) => {
        try {
            const result = await updateUser(userId, { rol: newRol })
            if (result.success) {
                await loadUsers()
            } else {
                alert('Error al actualizar rol: ' + result.error)
            }
        } catch (error) {
            console.error('Error updating role:', error)
            alert('Error al actualizar rol')
        }
    }

    const handleDeleteUser = async (userId, userName) => {
        const confirmed = window.confirm(
            `¿Estás seguro de eliminar a "${userName}"?\n\nEsta acción no se puede deshacer.`
        )

        if (!confirmed) return

        try {
            const result = await deleteUser(userId)
            if (result.success) {
                await loadUsers()
            } else {
                alert('Error al eliminar usuario: ' + result.error)
            }
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Error al eliminar usuario')
        }
    }

    const handleCloseModal = () => {
        setShowModal(false)
        resetForm()
    }

    // Filtrado de usuarios
    const filteredUsers = users.filter(user => {
        // Filtro por categoría
        const matchesFilter =
            filter === 'all' ||
            (filter === 'rh' && user.rol === 'rh') ||
            user.nivel === filter

        // Filtro por búsqueda
        const matchesSearch =
            !searchTerm ||
            user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.departamento?.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesFilter && matchesSearch
    })

    // Estadísticas
    const stats = {
        total: users.length,
        rh: users.filter(u => u.rol === 'rh').length,
        operativo: users.filter(u => u.nivel === 'operativo').length,
        mandoMedio: users.filter(u => u.nivel === 'mando_medio').length
    }

    if (loading) {
        return <Loader fullScreen message="Cargando usuarios..." />
    }

    return (
        <div className="gestion-usuarios">
            {/* Header */}
            <header className="gu-header">
                <div className="gu-header-content">
                    <h1 className="gu-title">Gestión de Usuarios</h1>
                    <p className="gu-subtitle">
                        Administra los usuarios del sistema de evaluación
                    </p>
                </div>
                <button
                    className="gu-btn-new"
                    onClick={() => setShowModal(true)}
                    aria-label="Crear nuevo usuario"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>Nuevo Usuario</span>
                </button>
            </header>

            {/* Estadísticas */}
            <div className="gu-stats">
                <div className="gu-stat-card">
                    <div className="gu-stat-value">{stats.total}</div>
                    <div className="gu-stat-label">Total de Usuarios</div>
                </div>
                <div className="gu-stat-card gu-stat-admin">
                    <div className="gu-stat-value">{stats.rh}</div>
                    <div className="gu-stat-label">Administradores</div>
                </div>
                <div className="gu-stat-card">
                    <div className="gu-stat-value">{stats.operativo}</div>
                    <div className="gu-stat-label">Nivel Operativo</div>
                </div>
                <div className="gu-stat-card">
                    <div className="gu-stat-value">{stats.mandoMedio}</div>
                    <div className="gu-stat-label">Mandos Medios</div>
                </div>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="gu-controls">
                <div className="gu-search-container">
                    <svg className="gu-search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                        type="text"
                        className="gu-search-input"
                        placeholder="Buscar por nombre, email, puesto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            className="gu-search-clear"
                            onClick={() => setSearchTerm('')}
                            aria-label="Limpiar búsqueda"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="gu-filters">
                    <button
                        className={`gu-filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Todos
                    </button>
                    <button
                        className={`gu-filter-btn ${filter === 'rh' ? 'active' : ''}`}
                        onClick={() => setFilter('rh')}
                    >
                        Administradores
                    </button>
                    {NIVELES.map(nivel => (
                        <button
                            key={nivel.id}
                            className={`gu-filter-btn ${filter === nivel.id ? 'active' : ''}`}
                            onClick={() => setFilter(nivel.id)}
                        >
                            {nivel.nombre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Usuarios */}
            <div className="gu-users-container">
                {filteredUsers.length === 0 ? (
                    <div className="gu-empty">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="24" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M16 48c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <h3>No se encontraron usuarios</h3>
                        <p>
                            {searchTerm
                                ? 'Intenta con otros términos de búsqueda'
                                : 'No hay usuarios en esta categoría'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="gu-users-grid">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="gu-user-card">
                                <div className="gu-user-header">
                                    <div className="gu-user-avatar">
                                        {user.nombre?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="gu-user-info">
                                        <h3 className="gu-user-name">{user.nombre || 'Sin nombre'}</h3>
                                        <p className="gu-user-email">{user.email}</p>
                                    </div>
                                </div>

                                {(user.puesto || user.departamento) && (
                                    <div className="gu-user-details">
                                        {user.puesto && (
                                            <div className="gu-detail-item">
                                                <span className="gu-detail-label">Puesto</span>
                                                <span className="gu-detail-value">{user.puesto}</span>
                                            </div>
                                        )}
                                        {user.departamento && (
                                            <div className="gu-detail-item">
                                                <span className="gu-detail-label">Departamento</span>
                                                <span className="gu-detail-value">{user.departamento}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="gu-user-badges">
                                    <span className={`gu-badge gu-badge-${user.rol}`}>
                                        {user.rol === 'rh' ? 'Administrador' : 'Usuario'}
                                    </span>
                                    <span className="gu-badge gu-badge-nivel">
                                        {NIVELES.find(n => n.id === user.nivel)?.nombre || user.nivel}
                                    </span>
                                </div>

                                <div className="gu-user-actions">
                                    <button
                                        className="gu-action-btn gu-action-role"
                                        onClick={() => handleRoleChange(
                                            user.id,
                                            user.rol === 'rh' ? 'operativo' : 'rh'
                                        )}
                                        title={user.rol === 'rh' ? 'Quitar privilegios de administrador' : 'Hacer administrador'}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        {user.rol === 'rh' ? 'Quitar Admin' : 'Hacer Admin'}
                                    </button>
                                    <button
                                        className="gu-action-btn gu-action-delete"
                                        onClick={() => handleDeleteUser(user.id, user.nombre)}
                                        title="Eliminar usuario"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Nuevo Usuario */}
            {showModal && (
                <div className="gu-modal-overlay" onClick={handleCloseModal}>
                    <div className="gu-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="gu-modal-header">
                            <h2 className="gu-modal-title">Crear Nuevo Usuario</h2>
                            <button
                                className="gu-modal-close"
                                onClick={handleCloseModal}
                                aria-label="Cerrar modal"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="gu-modal-form">
                            {error && (
                                <div className="gu-form-error">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                                        <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="gu-form-section">
                                <h3 className="gu-form-section-title">Información Personal</h3>

                                <div className="gu-form-group">
                                    <Input
                                        label="Nombre completo"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        required
                                        placeholder="Ej: Juan Pérez González"
                                    />
                                </div>

                                <div className="gu-form-row">
                                    <div className="gu-form-group">
                                        <Input
                                            label="Correo electrónico"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                    <div className="gu-form-group">
                                        <Input
                                            label="Contraseña"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="gu-form-section">
                                <h3 className="gu-form-section-title">Información Organizacional</h3>

                                <div className="gu-form-row">
                                    <div className="gu-form-group">
                                        <label className="gu-form-label">Departamento</label>
                                        <select
                                            className="gu-form-select"
                                            value={formData.departamento}
                                            onChange={(e) => handleDepartamentoChange(e.target.value)}
                                        >
                                            <option value="">Seleccionar departamento...</option>
                                            {DEPARTAMENTOS.map(depto => (
                                                <option key={depto} value={depto}>
                                                    {depto}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="gu-form-group">
                                        <label className="gu-form-label">Puesto</label>
                                        <select
                                            className="gu-form-select"
                                            value={formData.puesto}
                                            onChange={(e) => handlePuestoChange(e.target.value)}
                                            disabled={!formData.departamento}
                                        >
                                            <option value="">Seleccionar puesto...</option>
                                            {puestosDisponibles.map(p => (
                                                <option key={p.puesto} value={p.puesto}>
                                                    {p.puesto}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {formData.puesto && (
                                    <div className="gu-puesto-info">
                                        <div className="gu-info-item">
                                            <span className="gu-info-label">Nivel asignado:</span>
                                            <span className="gu-info-value">
                                                {NIVELES.find(n => n.id === formData.nivel)?.nombre || 'N/A'}
                                            </span>
                                        </div>
                                        {formData.evaluaA && (
                                            <div className="gu-info-item">
                                                <span className="gu-info-label">Evaluará a:</span>
                                                <span className="gu-info-value">{formData.evaluaA}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="gu-form-section">
                                <h3 className="gu-form-section-title">Permisos del Sistema</h3>

                                <div className="gu-form-group">
                                    <label className="gu-form-label">Rol en el sistema</label>
                                    <select
                                        className="gu-form-select"
                                        value={formData.rol}
                                        onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                    >
                                        <option value="operativo">Usuario estándar</option>
                                        <option value="rh">Administrador (RH)</option>
                                    </select>
                                    <p className="gu-form-help">
                                        {formData.rol === 'rh'
                                            ? 'Tendrá acceso completo al sistema de gestión'
                                            : 'Podrá realizar y ver evaluaciones asignadas'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="gu-form-section">
                                <h3 className="gu-form-section-title">Turno de Trabajo</h3>

                                <div className="gu-form-group">
                                    <label className="gu-form-label">Turno Fijo</label>
                                    <select
                                        className="gu-form-select"
                                        value={formData.turnoFijo}
                                        onChange={(e) => setFormData({ ...formData, turnoFijo: e.target.value })}
                                    >
                                        <option value="1">Turno 1</option>
                                        <option value="2">Turno 2</option>
                                        {formData.departamento !== 'CALIDAD' && (
                                            <>
                                                <option value="3">Turno 3</option>
                                                <option value="4">Turno 4</option>
                                            </>
                                        )}
                                    </select>
                                    <p className="gu-form-help">
                                        Este es el turno asignado al operador. Podrá cambiarlo temporalmente al iniciar sesión.
                                    </p>
                                </div>
                            </div>

                            <div className="gu-modal-actions">
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={submitting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    loading={submitting}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Creando...' : 'Crear Usuario'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GestionUsuarios
