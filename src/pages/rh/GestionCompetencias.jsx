import { useState, useEffect } from 'react'
import {
    getAllCompetencias,
    createCompetencia,
    updateCompetencia,
    deleteCompetencia,
    initializeDefaultCompetencias,
    migrateCompetenciasToMultiLevel,
    consolidateDuplicateCompetencias,
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
        niveles: ['operativo'], // Cambiado de 'nivel' a 'niveles' como array
        orden: 1
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [initMessage, setInitMessage] = useState('')

    const nivelLabels = {
        'operativo': 'Operativo',
        'mando_medio': 'Mando Medio',
        'jefe_directo': 'Jefe Directo'
    }

    const nivelColors = {
        'operativo': '#10b981',
        'mando_medio': '#f59e0b',
        'jefe_directo': '#8b5cf6'
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
            niveles: filterNivel !== 'all' ? [filterNivel] : ['operativo'],
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
            // Validar que al menos un nivel esté seleccionado
            if (!formData.niveles || formData.niveles.length === 0) {
                setError('Debes seleccionar al menos un nivel')
                setSubmitting(false)
                return
            }

            const dataToSave = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                niveles: formData.niveles, // Array de niveles
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
            niveles: comp.niveles || (comp.nivel ? [comp.nivel] : ['operativo']), // Soportar ambos formatos
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

    // Función para manejar migración de datos
    const handleMigrate = async () => {
        const confirmed = window.confirm(
            '¿Deseas migrar las competencias existentes al nuevo formato multi-nivel?\n\nEsto convertirá el campo "nivel" a "niveles" (array).'
        )

        if (!confirmed) return

        setSubmitting(true)
        setInitMessage('')

        try {
            const result = await migrateCompetenciasToMultiLevel()
            if (result.success) {
                setInitMessage(result.message)
                await loadCompetencias()
                setTimeout(() => setInitMessage(''), 5000)
            } else {
                setInitMessage('Error en la migración: ' + result.error)
            }
        } catch (error) {
            console.error('Error migrating:', error)
            setInitMessage('Error en la migración')
        } finally {
            setSubmitting(false)
        }
    }

    // Función para consolidar duplicados
    const handleConsolidate = async () => {
        const confirmed = window.confirm(
            '¿Deseas consolidar preguntas duplicadas?\n\nEsto fusionará competencias con el mismo nombre en una sola card con múltiples niveles.\n\n⚠️ Esta acción eliminará las cards duplicadas.'
        )

        if (!confirmed) return

        setSubmitting(true)
        setInitMessage('')

        try {
            const result = await consolidateDuplicateCompetencias()
            if (result.success) {
                setInitMessage(result.message)
                await loadCompetencias()
                setTimeout(() => setInitMessage(''), 8000)
            } else {
                setInitMessage('Error en la consolidación: ' + result.error)
            }
        } catch (error) {
            console.error('Error consolidating:', error)
            setInitMessage('Error en la consolidación')
        } finally {
            setSubmitting(false)
        }
    }

    // Función para alternar selección de nivel
    const toggleNivel = (nivel) => {
        setFormData(prev => {
            const niveles = prev.niveles || []
            if (niveles.includes(nivel)) {
                // Si ya está seleccionado, quitarlo (solo si no es el último)
                return niveles.length > 1
                    ? { ...prev, niveles: niveles.filter(n => n !== nivel) }
                    : prev // No permitir quitar el último
            } else {
                // Si no está seleccionado, agregarlo
                return { ...prev, niveles: [...niveles, nivel] }
            }
        })
    }

    // Filtrado de competencias
    const filteredCompetencias = competencias
        .filter(comp => {
            // Filtro por nivel - soportar ambos formatos
            let matchesNivel = filterNivel === 'all'
            if (filterNivel !== 'all') {
                // Formato nuevo: niveles es array
                if (comp.niveles && Array.isArray(comp.niveles)) {
                    matchesNivel = comp.niveles.includes(filterNivel)
                }
                // Formato antiguo: nivel es string
                else if (comp.nivel) {
                    matchesNivel = comp.nivel === filterNivel
                }
            }

            // Filtro por búsqueda
            const matchesSearch =
                !searchTerm ||
                comp.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                comp.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())

            return matchesNivel && matchesSearch
        })
        .sort((a, b) => (a.orden || 0) - (b.orden || 0))

    // Estadísticas - contar competencias por nivel (una competencia puede contar en múltiples)
    const stats = {
        total: competencias.length,
        operativo: competencias.filter(c =>
            (c.niveles && c.niveles.includes('operativo')) || c.nivel === 'operativo'
        ).length,
        mandoMedio: competencias.filter(c =>
            (c.niveles && c.niveles.includes('mando_medio')) || c.nivel === 'mando_medio'
        ).length,
        jefeDirecto: competencias.filter(c =>
            (c.niveles && c.niveles.includes('jefe_directo')) || c.nivel === 'jefe_directo'
        ).length
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

            {/* Barra de búsqueda */}
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
                                    <div className="gc-competencia-niveles">
                                        {/* Mostrar badges para cada nivel */}
                                        {(comp.niveles || (comp.nivel ? [comp.nivel] : [])).map(nivel => (
                                            <span
                                                key={nivel}
                                                className="gc-nivel-badge"
                                                style={{ backgroundColor: nivelColors[nivel] }}
                                            >
                                                {nivelLabels[nivel] || nivel}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="gc-competencia-body">
                                    <h3 className="gc-competencia-nombre">{comp.nombre}</h3>
                                    <p className="gc-competencia-descripcion">{comp.descripcion}</p>
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
                                        <label className="gc-form-label">
                                            Niveles (selecciona uno o más)
                                            <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>
                                        </label>
                                        <div className="gc-niveles-checkboxes">
                                            {Object.entries(nivelLabels).map(([nivel, label]) => (
                                                <label
                                                    key={nivel}
                                                    className={`gc-checkbox-label ${formData.niveles?.includes(nivel) ? 'checked' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.niveles?.includes(nivel) || false}
                                                        onChange={() => toggleNivel(nivel)}
                                                        className="gc-checkbox-input"
                                                    />
                                                    <span
                                                        className="gc-checkbox-badge"
                                                        style={{
                                                            backgroundColor: formData.niveles?.includes(nivel)
                                                                ? nivelColors[nivel]
                                                                : '#e5e7eb'
                                                        }}
                                                    >
                                                        {label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="gc-form-help">
                                            Selecciona los niveles donde aplicará esta competencia. Al editar la pregunta, se actualizará en todos los niveles seleccionados.
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
