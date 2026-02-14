import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    getAllSupervisores,
    createSupervisor,
    updateSupervisorShift,
    updateSupervisor,
    deleteSupervisor,
    initializeSupervisores
} from '../../config/firebase'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import Modal from '../../components/ui/Modal'
import './GestionSupervisores.css'

// Datos de data.json para migración inicial
const DATA_JSON = [
    { name: "GUTIÉRREZ LÓPEZ GUADALUPE", position: "SUPERVISOR DE ACABADOS - GP12", deparment: "CALIDAD", role: "2" },
    { name: "BIBIANO GARCÍA FLOR", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "1" },
    { name: "ARIAS AGUILAR SALMA LIZETH", position: "SUPERVISOR DE ACABADOS - GP12", deparment: "CALIDAD", role: "1" },
    { name: "VALDIVIA FRANCO CARLOS ALAIN", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "2" },
    { name: "MARTÍNEZ COBOS OMAR", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "3" },
    { name: "VÁZQUEZ FLORES ERICK", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "4" },
    { name: "OCHOA ORTUÑO JOSÉ MA.", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "3" },
    { name: "FLORES IBARRA VICTOR MANUEL", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "5" },
    { name: "ORTIZ OLVERA JUAN FIDEL", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "2" },
    { name: "PÉREZ SAMANIEGO ISRAEL", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "2" },
    { name: "VILLAMAR HINOJOSA DEISY", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "4" },
    { name: "DÍAZ GUTIÉRREZ JOSÉ GUADALUPE", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "1" },
    { name: "SIXTOS PINEDA LUIS ÁNGEL", position: "SUPERVISOR DE PRODUCCIÓN", deparment: "PRODUCCIÓN", role: "5" }
]

const INITIAL_FORM = {
    name: '',
    position: '',
    department: 'PRODUCCIÓN',
    currentShift: 1
}

const GestionSupervisores = () => {
    const [supervisores, setSupervisores] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingSupervisor, setEditingSupervisor] = useState(null)
    const [formData, setFormData] = useState(INITIAL_FORM)
    const [filter, setFilter] = useState({ department: '', shift: '', position: '' })
    const [migrating, setMigrating] = useState(false)
    const [actionError, setActionError] = useState('')

    useEffect(() => {
        loadSupervisores()
    }, [])

    // Auto-dismiss error
    useEffect(() => {
        if (!actionError) return
        const timer = setTimeout(() => setActionError(''), 6000)
        return () => clearTimeout(timer)
    }, [actionError])

    const loadSupervisores = async () => {
        setLoading(true)
        const result = await getAllSupervisores()
        if (result.success) {
            setSupervisores(result.data)
        }
        setLoading(false)
    }

    const handleMigrate = useCallback(async () => {
        setMigrating(true)
        const result = await initializeSupervisores(DATA_JSON)
        if (result.success) {
            loadSupervisores()
        } else {
            setActionError('Error: ' + result.error)
        }
        setMigrating(false)
    }, [])

    const handleShiftChange = useCallback(async (supervisorId, newShift) => {
        const result = await updateSupervisorShift(supervisorId, parseInt(newShift))
        if (result.success) {
            setSupervisores(prev =>
                prev.map(s => s.id === supervisorId ? { ...s, currentShift: parseInt(newShift) } : s)
            )
        } else {
            setActionError('Error al cambiar turno: ' + result.error)
        }
    }, [])

    const handleOpenModal = useCallback((supervisor = null) => {
        if (supervisor) {
            setEditingSupervisor(supervisor)
            setFormData({
                name: supervisor.name,
                position: supervisor.position,
                department: supervisor.department,
                currentShift: supervisor.currentShift
            })
        } else {
            setEditingSupervisor(null)
            setFormData(INITIAL_FORM)
        }
        setShowModal(true)
    }, [])

    const handleCloseModal = useCallback(() => {
        setShowModal(false)
        setEditingSupervisor(null)
        setFormData(INITIAL_FORM)
    }, [])

    const handleFieldChange = useCallback((field) => (e) => {
        const value = field === 'currentShift' ? parseInt(e.target.value) : e.target.value
        if (field === 'department') {
            setFormData(prev => ({ ...prev, department: value, currentShift: 1 }))
        } else {
            setFormData(prev => ({ ...prev, [field]: value }))
        }
    }, [])

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()

        if (editingSupervisor) {
            const result = await updateSupervisor(editingSupervisor.id, formData)
            if (result.success) {
                loadSupervisores()
                handleCloseModal()
            } else {
                setActionError('Error: ' + result.error)
            }
        } else {
            const result = await createSupervisor(formData)
            if (result.success) {
                loadSupervisores()
                handleCloseModal()
            } else {
                setActionError('Error: ' + result.error)
            }
        }
    }, [editingSupervisor, formData, handleCloseModal])

    const handleDelete = useCallback(async (supervisorId) => {
        if (!confirm('¿Estás seguro de eliminar este supervisor?')) return

        const result = await deleteSupervisor(supervisorId)
        if (result.success) {
            setSupervisores(prev => prev.filter(s => s.id !== supervisorId))
        } else {
            setActionError('Error: ' + result.error)
        }
    }, [])

    const handleFilterChange = useCallback((field) => (e) => {
        setFilter(prev => ({ ...prev, [field]: e.target.value }))
    }, [])

    // Obtener posiciones únicas para el filtro
    const uniquePositions = useMemo(
        () => [...new Set(supervisores.map(s => s.position))].sort(),
        [supervisores]
    )

    const filteredSupervisores = useMemo(() => supervisores.filter(s => {
        if (filter.department && s.department !== filter.department) return false
        if (filter.shift && s.currentShift !== parseInt(filter.shift)) return false
        if (filter.position && s.position !== filter.position) return false
        return true
    }), [supervisores, filter])

    const maxShifts = useCallback((dept) => dept === 'CALIDAD' ? 2 : 5, [])

    if (loading) {
        return <Loader fullScreen message="Cargando supervisores..." />
    }

    return (
        <div className="gestion-supervisores">
            {/* Error Banner */}
            {actionError && (
                <div className="gs-error-banner" role="alert">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                        <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>{actionError}</span>
                    <button onClick={() => setActionError('')} className="gs-error-close" aria-label="Cerrar aviso">×</button>
                </div>
            )}

            {/* Header */}
            <header className="gs-header" aria-label="Gestión de evaluadores">
                <div className="gs-header-content">
                    <h1 className="gs-title">Gestión de Evaluadores</h1>
                    <p className="gs-subtitle">Administra los evaluadores (Supervisores, Auxiliares, etc.) y sus turnos</p>
                </div>
                <div className="gs-header-actions">
                    {supervisores.length === 0 && (
                        <Button
                            variant="secondary"
                            onClick={handleMigrate}
                            loading={migrating}
                            ariaLabel="Migrar datos iniciales"
                        >
                            Migrar data.json
                        </Button>
                    )}
                    <Button onClick={() => handleOpenModal()} ariaLabel="Crear nuevo evaluador">
                        + Nuevo Evaluador
                    </Button>
                </div>
            </header>

            {/* Filtros */}
            <div className="gs-filters" role="group" aria-label="Filtros de supervisores">
                <select
                    className="gs-filter-select"
                    value={filter.position}
                    onChange={handleFilterChange('position')}
                    aria-label="Filtrar por posición"
                >
                    <option value="">Todas las posiciones</option>
                    {uniquePositions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                    ))}
                </select>
                <select
                    className="gs-filter-select"
                    value={filter.department}
                    onChange={handleFilterChange('department')}
                    aria-label="Filtrar por departamento"
                >
                    <option value="">Todos los departamentos</option>
                    <option value="PRODUCCIÓN">Producción</option>
                    <option value="CALIDAD">Calidad</option>
                </select>
                <select
                    className="gs-filter-select"
                    value={filter.shift}
                    onChange={handleFilterChange('shift')}
                    aria-label="Filtrar por turno"
                >
                    <option value="">Todos los turnos</option>
                    <option value="1">Turno 1</option>
                    <option value="2">Turno 2</option>
                    <option value="3">Turno 3</option>
                    <option value="4">Turno 4</option>
                    <option value="5">Turno 5</option>
                </select>
            </div>


            {/* Tabla */}
            <div className="gs-table-container">
                <table className="gs-table" aria-label="Lista de supervisores">
                    <thead>
                        <tr>
                            <th scope="col">Nombre</th>
                            <th scope="col">Posición</th>
                            <th scope="col">Departamento</th>
                            <th scope="col">Turno Actual</th>
                            <th scope="col">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSupervisores.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="gs-empty">
                                    No hay supervisores registrados
                                </td>
                            </tr>
                        ) : (
                            filteredSupervisores.map(supervisor => (
                                <tr key={supervisor.id}>
                                    <td>
                                        <div className="gs-supervisor-name">
                                            <div className="gs-avatar" aria-hidden="true">
                                                {supervisor.name?.charAt(0)}
                                            </div>
                                            <span>{supervisor.name}</span>
                                        </div>
                                    </td>
                                    <td>{supervisor.position}</td>
                                    <td>
                                        <span className={`gs-badge gs-badge-${supervisor.department === 'PRODUCCIÓN' ? 'prod' : 'cal'}`}>
                                            {supervisor.department}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            className="gs-turno-select"
                                            value={supervisor.currentShift}
                                            onChange={(e) => handleShiftChange(supervisor.id, e.target.value)}
                                            aria-label={`Turno de ${supervisor.name}`}
                                        >
                                            {Array.from({ length: maxShifts(supervisor.department) }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>Turno {i + 1}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <div className="gs-actions">
                                            <button
                                                className="gs-action-btn gs-edit"
                                                onClick={() => handleOpenModal(supervisor)}
                                                aria-label={`Editar a ${supervisor.name}`}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="gs-action-btn gs-delete"
                                                onClick={() => handleDelete(supervisor.id)}
                                                aria-label={`Eliminar a ${supervisor.name}`}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingSupervisor ? 'Editar Evaluador' : 'Nuevo Evaluador'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="gs-form-group">
                        <label htmlFor="gs-nombre">Nombre completo</label>
                        <input
                            id="gs-nombre"
                            type="text"
                            value={formData.name}
                            onChange={handleFieldChange('name')}
                            required
                        />
                    </div>
                    <div className="gs-form-group">
                        <label htmlFor="gs-posicion">Posición</label>
                        <input
                            id="gs-posicion"
                            type="text"
                            value={formData.position}
                            onChange={handleFieldChange('position')}
                            required
                        />
                    </div>
                    <div className="gs-form-row">
                        <div className="gs-form-group">
                            <label htmlFor="gs-departamento">Departamento</label>
                            <select
                                id="gs-departamento"
                                value={formData.department}
                                onChange={handleFieldChange('department')}
                            >
                                <option value="PRODUCCIÓN">Producción</option>
                                <option value="CALIDAD">Calidad</option>
                            </select>
                        </div>
                        <div className="gs-form-group">
                            <label htmlFor="gs-turno">Turno actual</label>
                            <select
                                id="gs-turno"
                                value={formData.currentShift}
                                onChange={handleFieldChange('currentShift')}
                            >
                                {Array.from({ length: maxShifts(formData.department) }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Turno {i + 1}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="gs-modal-actions">
                        <Button variant="secondary" type="button" onClick={handleCloseModal}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingSupervisor ? 'Guardar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default GestionSupervisores
