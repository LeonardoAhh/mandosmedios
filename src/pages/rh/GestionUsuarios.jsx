import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    getAllUsers,
    registerUser,
    updateUser,
    deleteUser,
    generateUserCredentials,
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
import Modal from '../../components/ui/Modal'
import './GestionUsuarios.css'

const INITIAL_FORM = {
    nombre: '',
    email: '',
    password: '',
    rol: 'operativo',
    nivel: 'operativo',
    departamento: '',
    puesto: '',
    evaluaA: '',
    turnoFijo: 1
}

const GestionUsuarios = () => {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [formData, setFormData] = useState(INITIAL_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [showCredentialsModal, setShowCredentialsModal] = useState(false)
    const [generatedCredentials, setGeneratedCredentials] = useState(null)
    const [useAutoCredentials, setUseAutoCredentials] = useState(true)
    const [employeeNumber, setEmployeeNumber] = useState('')
    const [actionError, setActionError] = useState('')

    const puestosDisponibles = useMemo(() =>
        formData.departamento
            ? getPuestosByDepartamento(formData.departamento)
            : CATALOGO_PUESTOS,
        [formData.departamento]
    )

    useEffect(() => {
        loadUsers()
    }, [])

    // Auto-dismiss action errors
    useEffect(() => {
        if (!actionError) return
        const timer = setTimeout(() => setActionError(''), 6000)
        return () => clearTimeout(timer)
    }, [actionError])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const result = await getAllUsers()
            if (result.success) {
                setUsers(result.data)
            }
        } catch (err) {
            console.error('Error loading users:', err)
            setActionError('Error al cargar usuarios')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM)
        setEditingUser(null)
        setError('')
        setEmployeeNumber('')
        setUseAutoCredentials(true)
    }, [])

    const handleCloseModal = useCallback(() => {
        setShowModal(false)
        resetForm()
    }, [resetForm])

    const handleCloseCredentials = useCallback(() => {
        setShowCredentialsModal(false)
        setGeneratedCredentials(null)
    }, [])

    const handleDepartamentoChange = useCallback((departamento) => {
        setFormData(prev => ({
            ...prev,
            departamento,
            puesto: '',
            evaluaA: ''
        }))
    }, [])

    const handlePuestoChange = useCallback((puesto) => {
        const info = getPuestoInfo(puesto)
        if (info) {
            setFormData(prev => ({
                ...prev,
                puesto,
                nivel: info.nivel,
                evaluaA: info.evalua || '',
                departamento: info.departamento
            }))
        }
    }, [])

    const handleFieldChange = useCallback((field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }, [])

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            let email = formData.email.trim()
            let password = formData.password

            if (useAutoCredentials && employeeNumber) {
                const creds = generateUserCredentials(employeeNumber)
                email = creds.email
                password = creds.password
            }

            if (!email || !password) {
                setError('Email y contraseña son requeridos')
                setSubmitting(false)
                return
            }

            const userData = {
                nombre: formData.nombre.trim(),
                rol: formData.rol,
                nivel: formData.nivel,
                departamento: formData.departamento,
                puesto: formData.puesto,
                evaluaA: formData.evaluaA,
                turnoFijo: parseInt(formData.turnoFijo) || 1,
                turnoActual: parseInt(formData.turnoFijo) || 1,
                employeeNumber: employeeNumber || null,
                credentials: useAutoCredentials ? {
                    password: password,
                    generatedAt: new Date().toISOString()
                } : null
            }

            const result = await registerUser(email, password, userData)

            if (result.success) {
                setGeneratedCredentials({
                    nombre: formData.nombre,
                    email: email,
                    password: password,
                    employeeNumber: employeeNumber
                })
                setShowModal(false)
                setShowCredentialsModal(true)
                resetForm()
                await loadUsers()
            } else {
                setError(result.error || 'Error al crear usuario')
            }
        } catch (err) {
            console.error('Error creating user:', err)
            setError('Error al crear usuario. Por favor intenta de nuevo.')
        } finally {
            setSubmitting(false)
        }
    }, [formData, useAutoCredentials, employeeNumber, resetForm])

    const handleCopyCredentials = useCallback(() => {
        if (generatedCredentials) {
            const text = `Email: ${generatedCredentials.email}\nContraseña: ${generatedCredentials.password}`
            navigator.clipboard.writeText(text)
        }
    }, [generatedCredentials])

    const handleRoleChange = useCallback(async (userId, newRol) => {
        try {
            const result = await updateUser(userId, { rol: newRol })
            if (result.success) {
                await loadUsers()
            } else {
                setActionError('Error al actualizar rol: ' + result.error)
            }
        } catch (err) {
            console.error('Error updating role:', err)
            setActionError('Error al actualizar rol')
        }
    }, [])

    const handleDeleteUser = useCallback(async (userId, userName) => {
        const confirmed = window.confirm(
            `¿Estás seguro de eliminar a "${userName}"?\n\nEsta acción no se puede deshacer.`
        )

        if (!confirmed) return

        try {
            const result = await deleteUser(userId)
            if (result.success) {
                await loadUsers()
            } else {
                setActionError('Error al eliminar usuario: ' + result.error)
            }
        } catch (err) {
            console.error('Error deleting user:', err)
            setActionError('Error al eliminar usuario')
        }
    }, [])

    const handleSearchChange = useCallback((e) => setSearchTerm(e.target.value), [])
    const handleClearSearch = useCallback(() => setSearchTerm(''), [])

    // Filtrado de usuarios
    const filteredUsers = useMemo(() => users.filter(user => {
        const matchesFilter =
            filter === 'all' ||
            (filter === 'rh' && user.rol === 'rh') ||
            user.nivel === filter

        const matchesSearch =
            !searchTerm ||
            user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.departamento?.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesFilter && matchesSearch
    }), [users, filter, searchTerm])

    if (loading) {
        return <Loader fullScreen message="Cargando usuarios..." />
    }

    return (
        <div className="gestion-usuarios">
            {/* Action error banner */}
            {actionError && (
                <div className="gu-action-error" role="alert">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                        <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>{actionError}</span>
                    <button onClick={() => setActionError('')} className="gu-action-error-close" aria-label="Cerrar aviso">×</button>
                </div>
            )}

            {/* Header */}
            <header className="gu-header" aria-label="Gestión de usuarios">
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
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>Nuevo Usuario</span>
                </button>
            </header>

            {/* Barra de búsqueda */}
            <div className="gu-controls">
                <div className="gu-search-container">
                    <svg className="gu-search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                        type="text"
                        className="gu-search-input"
                        placeholder="Buscar por nombre, email, puesto..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        aria-label="Buscar usuarios"
                    />
                    {searchTerm && (
                        <button
                            className="gu-search-clear"
                            onClick={handleClearSearch}
                            aria-label="Limpiar búsqueda"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Lista de Usuarios */}
            <div className="gu-users-container" role="list" aria-label="Lista de usuarios">
                {filteredUsers.length === 0 ? (
                    <div className="gu-empty">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
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
                            <div key={user.id} className="gu-user-card" role="listitem">
                                <div className="gu-user-header">
                                    <div className="gu-user-avatar" aria-hidden="true">
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
                                        aria-label={user.rol === 'rh' ? `Quitar privilegios de admin a ${user.nombre}` : `Hacer admin a ${user.nombre}`}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        {user.rol === 'rh' ? 'Quitar Admin' : 'Hacer Admin'}
                                    </button>
                                    <button
                                        className="gu-action-btn gu-action-delete"
                                        onClick={() => handleDeleteUser(user.id, user.nombre)}
                                        aria-label={`Eliminar a ${user.nombre}`}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
            <Modal isOpen={showModal} onClose={handleCloseModal} title="Crear Nuevo Usuario" size="lg">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="gu-form-error" role="alert">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
                                onChange={handleFieldChange('nombre')}
                                required
                                placeholder="Ej: Juan Pérez González"
                            />
                        </div>

                        {/* Toggle credenciales automáticas */}
                        <div className="gu-form-group">
                            <label className="gu-toggle-label">
                                <input
                                    type="checkbox"
                                    checked={useAutoCredentials}
                                    onChange={(e) => setUseAutoCredentials(e.target.checked)}
                                />
                                <span>Generar credenciales automáticas</span>
                            </label>
                            <p className="gu-form-help">
                                {useAutoCredentials
                                    ? 'Se generará email y contraseña basados en el número de empleado'
                                    : 'Ingresa email y contraseña manualmente'
                                }
                            </p>
                        </div>

                        {useAutoCredentials ? (
                            <div className="gu-form-group">
                                <Input
                                    label="Número de empleado"
                                    value={employeeNumber}
                                    onChange={(e) => setEmployeeNumber(e.target.value)}
                                    required
                                    placeholder="Ej: 12345"
                                />
                                {employeeNumber && (
                                    <p className="gu-preview-email">
                                        Email generado: <strong>operativo{employeeNumber}@vinoplastic.local</strong>
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="gu-form-row">
                                <div className="gu-form-group">
                                    <Input
                                        label="Correo electrónico"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleFieldChange('email')}
                                        required
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                                <div className="gu-form-group">
                                    <Input
                                        label="Contraseña"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleFieldChange('password')}
                                        required
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="gu-form-section">
                        <h3 className="gu-form-section-title">Información Organizacional</h3>

                        <div className="gu-form-row">
                            <div className="gu-form-group">
                                <label htmlFor="gu-departamento" className="gu-form-label">Departamento</label>
                                <select
                                    id="gu-departamento"
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
                                <label htmlFor="gu-puesto" className="gu-form-label">Puesto</label>
                                <select
                                    id="gu-puesto"
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
                            <label htmlFor="gu-rol" className="gu-form-label">Rol en el sistema</label>
                            <select
                                id="gu-rol"
                                className="gu-form-select"
                                value={formData.rol}
                                onChange={handleFieldChange('rol')}
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
                            <label htmlFor="gu-turno" className="gu-form-label">Turno Fijo</label>
                            <select
                                id="gu-turno"
                                className="gu-form-select"
                                value={formData.turnoFijo}
                                onChange={handleFieldChange('turnoFijo')}
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
            </Modal>

            {/* Modal de Credenciales Generadas */}
            <Modal isOpen={showCredentialsModal} onClose={handleCloseCredentials} title="✅ Usuario Creado">
                {generatedCredentials && (
                    <div className="gu-credentials-content">
                        <p className="gu-credentials-name">
                            <strong>{generatedCredentials.nombre}</strong>
                        </p>

                        <div className="gu-credentials-box" role="group" aria-label="Credenciales generadas">
                            <div className="gu-credential-row">
                                <span className="gu-credential-label">Email:</span>
                                <span className="gu-credential-value">{generatedCredentials.email}</span>
                            </div>
                            <div className="gu-credential-row">
                                <span className="gu-credential-label">Contraseña:</span>
                                <span className="gu-credential-value gu-password">{generatedCredentials.password}</span>
                            </div>
                            {generatedCredentials.employeeNumber && (
                                <div className="gu-credential-row">
                                    <span className="gu-credential-label">No. Empleado:</span>
                                    <span className="gu-credential-value">{generatedCredentials.employeeNumber}</span>
                                </div>
                            )}
                        </div>

                        <div className="gu-credentials-warning" role="alert">
                            ⚠️ Guarda estas credenciales. La contraseña no se puede recuperar después.
                        </div>

                        <div className="gu-credentials-actions">
                            <Button onClick={handleCopyCredentials} ariaLabel="Copiar credenciales al portapapeles">
                                📋 Copiar Credenciales
                            </Button>
                            <Button variant="secondary" onClick={handleCloseCredentials}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default GestionUsuarios
