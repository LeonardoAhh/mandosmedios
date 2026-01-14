import { useState, useEffect } from 'react'
import {
    getAllCompetencias,
    createCompetencia,
    updateCompetencia,
    deleteCompetencia,
    initializeDefaultCompetencias,
    NIVELES
} from '../../config/firebase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loader from '../../components/ui/Loader'
import './GestionCompetencias.css'

const GestionCompetencias = () => {
    const [loading, setLoading] = useState(true)
    const [competencias, setCompetencias] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [filterNivel, setFilterNivel] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        nivel: 'operativo',
        orden: 1
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [initMessage, setInitMessage] = useState('')

    const nivelLabels = {
        'operativo': 'Operativo → Mando Medio',
        'mando_medio': 'Mando Medio → Jefe Directo',
        'jefe_directo': 'Jefe Directo → Gerente'
    }

    useEffect(() => {
        loadCompetencias()
    }, [])

    const loadCompetencias = async () => {
        try {
            setLoading(true)
            const result = await getAllCompetencias()
            if (result.success) {
                setCompetencias(result.data)
            }
        } catch (error) {
            console.error('Error loading competencias:', error)
            setError('Error al cargar competencias')
        } finally {
            setLoading(false)
        }
    }

    const handleInitialize = async () => {
        const confirmed = window.confirm(
            '¿Deseas cargar las competencias predeterminadas?\n\nEsto agregará las competencias estándar del sistema.'
        )

        if (!confirmed) return

        setSubmitting(true)
        setInitMessage('')

        try {
            const result = await initializeDefaultCompetencias()
            if (result.success) {
                setInitMessage(`${result.message} (${result.count} competencias agregadas)`)
                await loadCompetencias()
                setTimeout(() => setInitMessage(''), 5000)
            } else {
                setInitMessage('Error al inicializar competencias')
            }
        } catch (error) {
            console.error('Error initializing:', error)
            setInitMessage('Error al inicializar competencias')
        } finally {
            setSubmitting(false)
        }
    }

    const resetForm = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            nivel: filterNivel !== 'all' ? filterNivel : 'operativo',
            orden: 1
        })
        setEditingId(null)
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const dataToSave = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                nivel: formData.nivel,
                orden: parseInt(formData.orden) || 1
            }

            let result
            if (editingId) {
                result = await updateCompetencia(editingId, dataToSave)
            } else {
                result = await createCompetencia(dataToSave)
            }

            if (result.success) {
                setShowModal(false)
                resetForm()
                await loadCompetencias()
            } else {
                setError(result.error || 'Error al guardar competencia')
            }
        } catch (error) {
            console.error('Error saving competencia:', error)
            setError('Error al guardar competencia. Por favor intenta de nuevo.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (comp) => {
        setEditingId(comp.id)
        setFormData({
            nombre: comp.nombre,
            descripcion: comp.descripcion,
            nivel: comp.nivel,
            orden: comp.orden || 1
        })
        setError('')
        setShowModal(true)
    }

    const handleDelete = async (compId, compNombre) => {
        const confirmed = window.confirm(
            `¿Estás seguro de eliminar "${compNombre}"?\n\nEsta acción no se puede deshacer.`
        )

        if (!confirmed) return

        try {
            const result = await deleteCompetencia(compId)
            if (result.success) {
                await loadCompetencias()
            } else {
                alert('Error al eliminar competencia: ' + result.error)
            }
        } catch (error) {
            console.error('Error deleting competencia:', error)
            alert('Error al eliminar competencia')
        }
    }

    const handleCloseModal = () => {
        setShowModal(false)
        resetForm()
    }

    const openNewModal = () => {
        resetForm()
        setShowModal(true)
    }

    // Filtrado de competencias
    const filteredCompetencias = competencias
        .filter(comp => {
            // Filtro por nivel
            const matchesNivel = filterNivel === 'all' || comp.nivel === filterNivel

            // Filtro por búsqueda
            const matchesSearch =
                !searchTerm ||
                comp.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                comp.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())

            return matchesNivel && matchesSearch
        })
        .sort((a, b) => (a.orden || 0) - (b.orden || 0))

    // Estadísticas
    const stats = {
        total: competencias.length,
        operativo: competencias.filter(c => c.nivel === 'operativo').length,
        mandoMedio: competencias.filter(c => c.nivel === 'mando_medio').length,
        jefeDirecto: competencias.filter(c => c.nivel === 'jefe_directo').length
    }

    if (loading) {
        return <Loader fullScreen message="Cargando competencias..." />
    }

    return (
        <div className="gestion-competencias">
            {/* Header */}
            <header className="gc-header">
                <div className="gc-header-content">
                    <h1 className="gc-title">Competencias de Evaluación</h1>
                    <p className="gc-subtitle">
                        Administra las preguntas de evaluación por nivel organizacional
                    </p>
                </div>
                <div className="gc-header-actions">
                    {competencias.length === 0 && (
                        <button
                            className="gc-btn-init"
                            onClick={handleInitialize}
                            disabled={submitting}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Cargar Predeterminadas</span>
                        </button>
                    )}
                    <button
                        className="gc-btn-new"
                        onClick={openNewModal}
                        aria-label="Crear nueva competencia"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>Nueva Competencia</span>
                    </button>
                </div>
            </header>

            {/* Mensaje de inicialización */}
            {initMessage && (
                <div className="gc-init-message">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" fill="#10b981" opacity="0.2" />
                        <path d="M7 10l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{initMessage}</span>
                </div>
            )}

            {/* Estadísticas */}
            <div className="gc-stats">
                <div className="gc-stat-card">
                    <div className="gc-stat-value">{stats.total}</div>
                    <div className="gc-stat-label">Total de Competencias</div>
                </div>
                <div className="gc-stat-card gc-stat-operativo">
                    <div className="gc-stat-value">{stats.operativo}</div>
                    <div className="gc-stat-label">Operativo</div>
                </div>
                <div className="gc-stat-card gc-stat-mando">
                    <div className="gc-stat-value">{stats.mandoMedio}</div>
                    <div className="gc-stat-label">Mando Medio</div>
                </div>
                <div className="gc-stat-card gc-stat-jefe">
                    <div className="gc-stat-value">{stats.jefeDirecto}</div>
                    <div className="gc-stat-label">Jefe Directo</div>
                </div>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="gc-controls">
                <div className="gc-search-container">
                    <svg className="gc-search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                        type="text"
                        className="gc-search-input"
                        placeholder="Buscar competencias..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            className="gc-search-clear"
                            onClick={() => setSearchTerm('')}
                            aria-label="Limpiar búsqueda"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="gc-filters">
                    <button
                        className={`gc-filter-btn ${filterNivel === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterNivel('all')}
                    >
                        Todas
                    </button>
                    {Object.entries(nivelLabels).map(([nivel, label]) => (
                        <button
                            key={nivel}
                            className={`gc-filter-btn ${filterNivel === nivel ? 'active' : ''}`}
                            onClick={() => setFilterNivel(nivel)}
                        >
                            {label.split(' → ')[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Competencias */}
            <div className="gc-competencias-container">
                {filteredCompetencias.length === 0 ? (
                    <div className="gc-empty">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <rect x="12" y="8" width="40" height="48" rx="4" stroke="currentColor" strokeWidth="2" />
                            <line x1="20" y1="20" x2="44" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <line x1="20" y1="36" x2="36" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <h3>No se encontraron competencias</h3>
                        <p>
                            {searchTerm
                                ? 'Intenta con otros términos de búsqueda'
                                : competencias.length === 0
                                    ? 'Haz clic en "Cargar Predeterminadas" o crea competencias manualmente'
                                    : 'No hay competencias en esta categoría'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="gc-competencias-grid">
                        {filteredCompetencias.map((comp) => (
                            <div key={comp.id} className="gc-competencia-card">
                                <div className="gc-competencia-header">
                                    <div className="gc-competencia-orden">
                                        <span className="gc-orden-label">Orden</span>
                                        <span className="gc-orden-value">#{comp.orden || '-'}</span>
                                    </div>
                                    <span className={`gc-competencia-nivel gc-nivel-${comp.nivel}`}>
                                        {nivelLabels[comp.nivel]?.split(' → ')[0] || comp.nivel}
                                    </span>
                                </div>

                                <div className="gc-competencia-body">
                                    <h3 className="gc-competencia-nombre">{comp.nombre}</h3>
                                    <p className="gc-competencia-descripcion">{comp.descripcion}</p>
                                </div>

                                <div className="gc-competencia-flow">
                                    <span className="gc-flow-text">
                                        {nivelLabels[comp.nivel] || 'N/A'}
                                    </span>
                                </div>

                                <div className="gc-competencia-actions">
                                    <button
                                        className="gc-action-btn gc-action-edit"
                                        onClick={() => handleEdit(comp)}
                                        title="Editar competencia"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Editar
                                    </button>
                                    <button
                                        className="gc-action-btn gc-action-delete"
                                        onClick={() => handleDelete(comp.id, comp.nombre)}
                                        title="Eliminar competencia"
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

            {/* Modal */}
            {showModal && (
                <div className="gc-modal-overlay" onClick={handleCloseModal}>
                    <div className="gc-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="gc-modal-header">
                            <h2 className="gc-modal-title">
                                {editingId ? 'Editar Competencia' : 'Nueva Competencia'}
                            </h2>
                            <button
                                className="gc-modal-close"
                                onClick={handleCloseModal}
                                aria-label="Cerrar modal"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="gc-modal-form">
                            {error && (
                                <div className="gc-form-error">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                                        <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="gc-form-section">
                                <h3 className="gc-form-section-title">Información de la Competencia</h3>

                                <div className="gc-form-group">
                                    <Input
                                        label="Nombre de la competencia"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Ej: Trato respetuoso y comunicación efectiva"
                                        required
                                    />
                                </div>

                                <div className="gc-form-group">
                                    <label className="gc-form-label">Descripción</label>
                                    <textarea
                                        className="gc-form-textarea"
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        placeholder="Describe qué evalúa esta competencia..."
                                        rows={3}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="gc-form-section">
                                <h3 className="gc-form-section-title">Configuración</h3>

                                <div className="gc-form-row">
                                    <div className="gc-form-group">
                                        <label className="gc-form-label">Nivel (quién evalúa)</label>
                                        <select
                                            className="gc-form-select"
                                            value={formData.nivel}
                                            onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                                        >
                                            <option value="operativo">Operativo → Mando Medio</option>
                                            <option value="mando_medio">Mando Medio → Jefe Directo</option>
                                            <option value="jefe_directo">Jefe Directo → Gerente</option>
                                        </select>
                                        <p className="gc-form-help">
                                            Define qué nivel organizacional utilizará esta competencia
                                        </p>
                                    </div>

                                    <div className="gc-form-group">
                                        <Input
                                            label="Orden de aparición"
                                            type="number"
                                            min="1"
                                            value={formData.orden}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                orden: parseInt(e.target.value) || 1
                                            })}
                                        />
                                        <p className="gc-form-help">
                                            Controla el orden en que aparece en las evaluaciones
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="gc-modal-actions">
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
                                    {submitting
                                        ? (editingId ? 'Guardando...' : 'Creando...')
                                        : (editingId ? 'Guardar Cambios' : 'Crear Competencia')
                                    }
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GestionCompetencias
