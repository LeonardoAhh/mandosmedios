import { useState, useEffect } from 'react'
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

const GestionSupervisores = () => {
    const [supervisores, setSupervisores] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingSupervisor, setEditingSupervisor] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        department: 'PRODUCCIÓN',
        currentShift: 1
    })
    const [filter, setFilter] = useState({ department: '', shift: '', position: '' })
    const [migrating, setMigrating] = useState(false)

    useEffect(() => {
        loadSupervisores()
    }, [])

    const loadSupervisores = async () => {
        setLoading(true)
        const result = await getAllSupervisores()
        if (result.success) {
            setSupervisores(result.data)
        }
        setLoading(false)
    }

    const handleMigrate = async () => {
        setMigrating(true)
        const result = await initializeSupervisores(DATA_JSON)
        if (result.success) {
            alert(result.message + ` (${result.count} registros)`)
            loadSupervisores()
        } else {
            alert('Error: ' + result.error)
        }
        setMigrating(false)
    }

    const handleShiftChange = async (supervisorId, newShift) => {
        const result = await updateSupervisorShift(supervisorId, parseInt(newShift))
        if (result.success) {
            setSupervisores(prev =>
                prev.map(s => s.id === supervisorId ? { ...s, currentShift: parseInt(newShift) } : s)
            )
        } else {
            alert('Error al cambiar turno: ' + result.error)
        }
    }

    const handleOpenModal = (supervisor = null) => {
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
            setFormData({
                name: '',
                position: '',
                department: 'PRODUCCIÓN',
                currentShift: 1
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingSupervisor(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (editingSupervisor) {
            const result = await updateSupervisor(editingSupervisor.id, formData)
            if (result.success) {
                loadSupervisores()
                handleCloseModal()
            } else {
                alert('Error: ' + result.error)
            }
        } else {
            const result = await createSupervisor(formData)
            if (result.success) {
                loadSupervisores()
                handleCloseModal()
            } else {
                alert('Error: ' + result.error)
            }
        }
    }

    const handleDelete = async (supervisorId) => {
        if (!confirm('¿Estás seguro de eliminar este supervisor?')) return

        const result = await deleteSupervisor(supervisorId)
        if (result.success) {
            setSupervisores(prev => prev.filter(s => s.id !== supervisorId))
        } else {
            alert('Error: ' + result.error)
        }
    }

    // Obtener posiciones únicas para el filtro
    const uniquePositions = [...new Set(supervisores.map(s => s.position))].sort()

    const filteredSupervisores = supervisores.filter(s => {
        if (filter.department && s.department !== filter.department) return false
        if (filter.shift && s.currentShift !== parseInt(filter.shift)) return false
        if (filter.position && s.position !== filter.position) return false
        return true
    })

    const maxShifts = (dept) => dept === 'CALIDAD' ? 2 : 5

    if (loading) {
        return <Loader fullScreen message="Cargando supervisores..." />
    }

    return (
        <div className="gestion-supervisores">
            {/* Header */}
            <header className="gs-header">
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
                        >
                            Migrar data.json
                        </Button>
                    )}
                    <Button onClick={() => handleOpenModal()}>
                        + Nuevo Evaluador
                    </Button>
                </div>
            </header>

            {/* Filtros */}
            <div className="gs-filters">
                <select
                    className="gs-filter-select"
                    value={filter.position}
                    onChange={(e) => setFilter(prev => ({ ...prev, position: e.target.value }))}
                >
                    <option value="">Todas las posiciones</option>
                    {uniquePositions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                    ))}
                </select>
                <select
                    className="gs-filter-select"
                    value={filter.department}
                    onChange={(e) => setFilter(prev => ({ ...prev, department: e.target.value }))}
                >
                    <option value="">Todos los departamentos</option>
                    <option value="PRODUCCIÓN">Producción</option>
                    <option value="CALIDAD">Calidad</option>
                </select>
                <select
                    className="gs-filter-select"
                    value={filter.shift}
                    onChange={(e) => setFilter(prev => ({ ...prev, shift: e.target.value }))}
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
                <table className="gs-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Posición</th>
                            <th>Departamento</th>
                            <th>Turno Actual</th>
                            <th>Acciones</th>
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
                                            <div className="gs-avatar">
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
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="gs-action-btn gs-delete"
                                                onClick={() => handleDelete(supervisor.id)}
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
            {showModal && (
                <div className="gs-modal-overlay" onClick={handleCloseModal}>
                    <div className="gs-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="gs-modal-title">
                            {editingSupervisor ? 'Editar Evaluador' : 'Nuevo Evaluador'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="gs-form-group">
                                <label>Nombre completo</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="gs-form-group">
                                <label>Posición</label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="gs-form-row">
                                <div className="gs-form-group">
                                    <label>Departamento</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            department: e.target.value,
                                            currentShift: 1
                                        }))}
                                    >
                                        <option value="PRODUCCIÓN">Producción</option>
                                        <option value="CALIDAD">Calidad</option>
                                    </select>
                                </div>
                                <div className="gs-form-group">
                                    <label>Turno actual</label>
                                    <select
                                        value={formData.currentShift}
                                        onChange={(e) => setFormData(prev => ({ ...prev, currentShift: parseInt(e.target.value) }))}
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
                    </div>
                </div>
            )}
        </div>
    )
}

export default GestionSupervisores
