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
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loader from '../../components/ui/Loader'
import './GestionUsuarios.css'

const GestionUsuarios = () => {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'operativo',
        nivel: 'operativo',
        departamento: '',
        puesto: '',
        evaluaA: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('all')

    // Puestos filtrados por departamento seleccionado
    const puestosDisponibles = formData.departamento
        ? getPuestosByDepartamento(formData.departamento)
        : CATALOGO_PUESTOS

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            const result = await getAllUsers()
            if (result.success) {
                setUsers(result.data)
            }
        } catch (error) {
            console.error('Error loading users:', error)
        } finally {
            setLoading(false)
        }
    }

    // Cuando cambia el departamento, resetear puesto
    const handleDepartamentoChange = (departamento) => {
        setFormData({
            ...formData,
            departamento,
            puesto: '',
            evaluaA: ''
        })
    }

    // Cuando cambia el puesto, autocompletar nivel y evalúa a
    const handlePuestoChange = (puesto) => {
        const info = getPuestoInfo(puesto)
        if (info) {
            setFormData({
                ...formData,
                puesto,
                nivel: info.nivel,
                evaluaA: info.evalua,
                departamento: info.departamento
            })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const result = await registerUser(
                formData.email,
                formData.password,
                {
                    nombre: formData.nombre,
                    rol: formData.rol,
                    nivel: formData.nivel,
                    departamento: formData.departamento,
                    puesto: formData.puesto,
                    evaluaA: formData.evaluaA
                }
            )

            if (result.success) {
                setShowModal(false)
                setFormData({
                    nombre: '',
                    email: '',
                    password: '',
                    rol: 'operativo',
                    nivel: 'operativo',
                    departamento: '',
                    puesto: '',
                    evaluaA: ''
                })
                loadUsers()
            } else {
                setError(result.error)
            }
        } catch (error) {
            setError('Error al crear usuario')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRoleChange = async (userId, newRol) => {
        try {
            await updateUser(userId, { rol: newRol })
            loadUsers()
        } catch (error) {
            console.error('Error updating role:', error)
        }
    }

    const handleDeleteUser = async (userId, userName) => {
        if (!confirm(`¿Estás seguro de eliminar a "${userName}"? Esta acción no se puede deshacer.`)) return

        try {
            const result = await deleteUser(userId)
            if (result.success) {
                loadUsers()
            } else {
                alert('Error al eliminar usuario: ' + result.error)
            }
        } catch (error) {
            console.error('Error deleting user:', error)
        }
    }

    const filteredUsers = users.filter(u => {
        if (filter === 'all') return true
        if (filter === 'rh') return u.rol === 'rh'
        return u.nivel === filter
    })

    if (loading) {
        return <Loader fullScreen message="Cargando usuarios..." />
    }

    return (
        <div className="gestion-usuarios">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">Gestión de Usuarios</h1>
                    <p className="page-subtitle">
                        Administra los usuarios del sistema de evaluación
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    ➕ Nuevo Usuario
                </Button>
            </header>

            {/* Filters */}
            <div className="filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Todos ({users.length})
                </button>
                <button
                    className={`filter-btn ${filter === 'rh' ? 'active' : ''}`}
                    onClick={() => setFilter('rh')}
                >
                    RH ({users.filter(u => u.rol === 'rh').length})
                </button>
                {NIVELES.map(nivel => (
                    <button
                        key={nivel.id}
                        className={`filter-btn ${filter === nivel.id ? 'active' : ''}`}
                        onClick={() => setFilter(nivel.id)}
                    >
                        {nivel.nombre} ({users.filter(u => u.nivel === nivel.id).length})
                    </button>
                ))}
            </div>

            {/* Users List */}
            <div className="users-list">
                {filteredUsers.length === 0 ? (
                    <Card>
                        <div className="empty-state">
                            <span>👥</span>
                            <p>No hay usuarios en esta categoría</p>
                        </div>
                    </Card>
                ) : (
                    filteredUsers.map((user) => (
                        <Card key={user.id} className="user-card">
                            <div className="user-avatar">
                                {user.nombre?.charAt(0) || '?'}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user.nombre}</span>
                                <span className="user-email">{user.email}</span>
                                {user.puesto && (
                                    <span className="user-puesto">{user.puesto}</span>
                                )}
                            </div>
                            <div className="user-badges">
                                <span className={`badge badge-${user.rol}`}>
                                    {user.rol === 'rh' ? 'RH' : 'Operativo'}
                                </span>
                                <span className="badge badge-nivel">
                                    {NIVELES.find(n => n.id === user.nivel)?.nombre || user.nivel}
                                </span>
                                {user.departamento && (
                                    <span className="badge badge-depto">
                                        {user.departamento}
                                    </span>
                                )}
                            </div>
                            <div className="user-actions">
                                {user.rol !== 'rh' ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRoleChange(user.id, 'rh')}
                                    >
                                        Hacer RH
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRoleChange(user.id, 'operativo')}
                                    >
                                        Quitar RH
                                    </Button>
                                )}
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id, user.nombre)}
                                >
                                    🗑️
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nuevo Usuario</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {error && <div className="form-error">{error}</div>}

                            <div className="form-section">
                                <h3>📋 Datos Personales</h3>
                                <Input
                                    label="Nombre completo"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />

                                <div className="form-row">
                                    <Input
                                        label="Correo electrónico"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />

                                    <Input
                                        label="Contraseña"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>🏢 Puesto y Departamento</h3>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Departamento</label>
                                        <select
                                            className="select-input"
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

                                    <div className="input-group">
                                        <label className="input-label">Puesto</label>
                                        <select
                                            className="select-input"
                                            value={formData.puesto}
                                            onChange={(e) => handlePuestoChange(e.target.value)}
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
                                    <div className="puesto-info">
                                        <div className="info-item">
                                            <span className="info-label">Nivel:</span>
                                            <span className="info-value">
                                                {NIVELES.find(n => n.id === formData.nivel)?.nombre}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Evalúa a:</span>
                                            <span className="info-value">{formData.evaluaA || 'N/A'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-section">
                                <h3>⚙️ Rol en el Sistema</h3>
                                <div className="input-group">
                                    <label className="input-label">Rol</label>
                                    <select
                                        className="select-input"
                                        value={formData.rol}
                                        onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                    >
                                        <option value="operativo">Operativo (evalúa líderes)</option>
                                        <option value="rh">Recursos Humanos (administrador)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" loading={submitting}>
                                    Crear Usuario
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
