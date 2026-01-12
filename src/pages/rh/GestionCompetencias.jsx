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
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        nivel: 'operativo',
        orden: 1
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [initMessage, setInitMessage] = useState('')

    useEffect(() => {
        loadCompetencias()
    }, [])

    const loadCompetencias = async () => {
        try {
            const result = await getAllCompetencias()
            if (result.success) {
                setCompetencias(result.data)
            }
        } catch (error) {
            console.error('Error loading competencias:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleInitialize = async () => {
        setSubmitting(true)
        try {
            const result = await initializeDefaultCompetencias()
            if (result.success) {
                setInitMessage(result.message + ` (${result.count})`)
                loadCompetencias()
            }
        } catch (error) {
            setInitMessage('Error al inicializar')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            let result
            if (editingId) {
                result = await updateCompetencia(editingId, formData)
            } else {
                result = await createCompetencia(formData)
            }

            if (result.success) {
                setShowModal(false)
                setEditingId(null)
                setFormData({ nombre: '', descripcion: '', nivel: 'operativo', orden: 1 })
                loadCompetencias()
            } else {
                setError(result.error)
            }
        } catch (error) {
            setError('Error al guardar competencia')
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
        setShowModal(true)
    }

    const handleDelete = async (compId) => {
        if (!confirm('¿Estás seguro de eliminar esta competencia?')) return

        try {
            await deleteCompetencia(compId)
            loadCompetencias()
        } catch (error) {
            console.error('Error deleting competencia:', error)
        }
    }

    const openNewModal = () => {
        setEditingId(null)
        setFormData({ nombre: '', descripcion: '', nivel: filterNivel !== 'all' ? filterNivel : 'operativo', orden: 1 })
        setShowModal(true)
    }

    const filteredCompetencias = competencias.filter(c =>
        filterNivel === 'all' || c.nivel === filterNivel
    ).sort((a, b) => (a.orden || 0) - (b.orden || 0))

    const nivelLabels = {
        'operativo': 'Operativo → Mando Medio',
        'mando_medio': 'Mando Medio → Jefe Directo',
        'jefe_directo': 'Jefe Directo → Gerente'
    }

    if (loading) {
        return <Loader fullScreen message="Cargando competencias..." />
    }

    return (
        <div className="gestion-competencias">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">Gestión de Competencias</h1>
                    <p className="page-subtitle">
                        Administra las preguntas de evaluación por nivel
                    </p>
                </div>
                <div className="header-actions">
                    {competencias.length === 0 && (
                        <Button
                            variant="secondary"
                            onClick={handleInitialize}
                            loading={submitting}
                        >
                            🔄 Inicializar Predeterminadas
                        </Button>
                    )}
                    <Button onClick={openNewModal}>
                        ➕ Nueva Competencia
                    </Button>
                </div>
            </header>

            {initMessage && (
                <Card variant="success" className="init-message">
                    ✅ {initMessage}
                </Card>
            )}

            {/* Filters */}
            <div className="filters">
                <button
                    className={`filter-btn ${filterNivel === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterNivel('all')}
                >
                    Todas ({competencias.length})
                </button>
                {['operativo', 'mando_medio', 'jefe_directo'].map(nivel => (
                    <button
                        key={nivel}
                        className={`filter-btn ${filterNivel === nivel ? 'active' : ''}`}
                        onClick={() => setFilterNivel(nivel)}
                    >
                        {nivelLabels[nivel]} ({competencias.filter(c => c.nivel === nivel).length})
                    </button>
                ))}
            </div>

            {/* Competencias List */}
            <div className="competencias-list">
                {filteredCompetencias.length === 0 ? (
                    <Card>
                        <div className="empty-state">
                            <span>📋</span>
                            <h3>No hay competencias</h3>
                            <p>Haz clic en "Inicializar Predeterminadas" o agrega competencias manualmente.</p>
                        </div>
                    </Card>
                ) : (
                    filteredCompetencias.map((comp) => (
                        <Card key={comp.id} className="competencia-card">
                            <div className="competencia-orden">
                                #{comp.orden || '-'}
                            </div>
                            <div className="competencia-info">
                                <span className="competencia-nombre">{comp.nombre}</span>
                                <span className="competencia-descripcion">{comp.descripcion}</span>
                            </div>
                            <span className={`competencia-nivel nivel-${comp.nivel}`}>
                                {nivelLabels[comp.nivel]?.split(' → ')[0]}
                            </span>
                            <div className="competencia-actions">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(comp)}
                                >
                                    ✏️ Editar
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(comp.id)}
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
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Editar Competencia' : 'Nueva Competencia'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {error && <div className="form-error">{error}</div>}

                            <Input
                                label="Nombre de la competencia"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Trato respetuoso"
                                required
                            />

                            <div className="input-group">
                                <label className="input-label">Descripción</label>
                                <textarea
                                    className="textarea-input"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Descripción de la competencia"
                                    rows={2}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label className="input-label">Nivel (quién evalúa)</label>
                                    <select
                                        className="select-input"
                                        value={formData.nivel}
                                        onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                                    >
                                        <option value="operativo">Operativo → Mando Medio</option>
                                        <option value="mando_medio">Mando Medio → Jefe Directo</option>
                                        <option value="jefe_directo">Jefe Directo → Gerente</option>
                                    </select>
                                </div>

                                <Input
                                    label="Orden"
                                    type="number"
                                    min="1"
                                    value={formData.orden}
                                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 1 })}
                                />
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
                                    {editingId ? 'Guardar Cambios' : 'Crear Competencia'}
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
