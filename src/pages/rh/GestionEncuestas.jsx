import { useState, useEffect } from 'react'
import {
    getSurveys,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    getCompetenciasByNivel,
    NIVELES
} from '../../config/firebase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loader from '../../components/ui/Loader'
import './GestionEncuestas.css'

const GestionEncuestas = () => {
    const [loading, setLoading] = useState(true)
    const [surveys, setSurveys] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        nivelEvaluador: 'operativo',
        nivelEvaluado: 'mando_medio',
        fechaInicio: '',
        fechaFin: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        loadSurveys()
    }, [])

    const loadSurveys = async () => {
        try {
            const result = await getSurveys()
            if (result.success) {
                setSurveys(result.data)
            }
        } catch (error) {
            console.error('Error loading surveys:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const competencias = getCompetenciasByNivel(formData.nivelEvaluador)
            const result = await createSurvey({
                ...formData,
                competencias: competencias.map(c => c.id)
            })

            if (result.success) {
                setShowModal(false)
                setFormData({
                    titulo: '',
                    descripcion: '',
                    nivelEvaluador: 'operativo',
                    nivelEvaluado: 'mando_medio',
                    fechaInicio: '',
                    fechaFin: ''
                })
                loadSurveys()
            } else {
                setError(result.error)
            }
        } catch (error) {
            setError('Error al crear encuesta')
        } finally {
            setSubmitting(false)
        }
    }

    const toggleActive = async (surveyId, currentState) => {
        try {
            await updateSurvey(surveyId, { activa: !currentState })
            loadSurveys()
        } catch (error) {
            console.error('Error toggling survey:', error)
        }
    }

    const handleDelete = async (surveyId) => {
        if (!confirm('¿Estás seguro de eliminar esta encuesta?')) return

        try {
            await deleteSurvey(surveyId)
            loadSurveys()
        } catch (error) {
            console.error('Error deleting survey:', error)
        }
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return '-'
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    // Estadísticas rápidas
    const totalSurveys = surveys.length
    const activeSurveys = surveys.filter(s => s.activa).length

    if (loading) {
        return <Loader fullScreen message="Cargando encuestas..." />
    }

    return (
        <div className="gestion-encuestas">
            {/* Header Moderno */}
            <header className="page-header">
                <div className="page-header-content">
                    <h1 className="page-title">Encuestas</h1>
                    <p className="page-subtitle">
                        Gestiona los períodos de evaluación de liderazgo
                    </p>
                </div>
                <button className="btn-new-survey" onClick={() => setShowModal(true)}>
                    <span>+</span>
                    Nueva Encuesta
                </button>
            </header>

            {/* Estadísticas Rápidas */}
            {surveys.length > 0 && (
                <div className="quick-stats">
                    <div className="stat-card">
                        <div className="stat-value">{totalSurveys}</div>
                        <div className="stat-label">Total Encuestas</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value highlight">{activeSurveys}</div>
                        <div className="stat-label">Activas</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{totalSurveys - activeSurveys}</div>
                        <div className="stat-label">Inactivas</div>
                    </div>
                </div>
            )}

            {/* Lista de Encuestas */}
            <div className="surveys-grid">
                {surveys.length === 0 ? (
                    <Card>
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <h3>No hay encuestas</h3>
                            <p>Crea tu primera encuesta para comenzar a evaluar el liderazgo en tu organización.</p>
                            <button className="empty-state-btn" onClick={() => setShowModal(true)}>
                                <span>+</span>
                                Crear Primera Encuesta
                            </button>
                        </div>
                    </Card>
                ) : (
                    surveys.map((survey) => (
                        <div key={survey.id} className="survey-card">
                            <div className="survey-card-header">
                                <span className={`status-badge ${survey.activa ? 'active' : 'inactive'}`}>
                                    <span className="status-dot"></span>
                                    {survey.activa ? 'Activa' : 'Inactiva'}
                                </span>
                                <div className="survey-actions">
                                    <button
                                        className="action-btn-icon"
                                        onClick={() => toggleActive(survey.id, survey.activa)}
                                        title={survey.activa ? 'Desactivar' : 'Activar'}
                                    >
                                        {survey.activa ? '⏸️' : '▶️'}
                                    </button>
                                    <button
                                        className="action-btn-icon danger"
                                        onClick={() => handleDelete(survey.id)}
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className="survey-card-body">
                                <h3 className="survey-title">{survey.titulo}</h3>
                                <p className="survey-description">{survey.descripcion || 'Sin descripción'}</p>

                                <div className="survey-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Evaluadores</span>
                                        <span className="meta-value">
                                            {NIVELES.find(n => n.id === survey.nivelEvaluador)?.nombre || survey.nivelEvaluador}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Evaluados</span>
                                        <span className="meta-value">
                                            {NIVELES.find(n => n.id === survey.nivelEvaluado)?.nombre || survey.nivelEvaluado}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Creada</span>
                                        <span className="meta-value">{formatDate(survey.fechaCreacion)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Nueva Encuesta */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nueva Encuesta</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {error && (
                                <div className="form-error">
                                    <span>⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div className="form-section">
                                <Input
                                    label="Título de la encuesta"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    placeholder="Ej: Evaluación Q1 2024"
                                    required
                                />

                                <div className="input-group">
                                    <label className="input-label">Descripción</label>
                                    <textarea
                                        className="textarea-input"
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        placeholder="Describe el propósito de esta evaluación"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <span className="form-section-title">Configuración de Niveles</span>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Quién evalúa</label>
                                        <select
                                            className="select-input"
                                            value={formData.nivelEvaluador}
                                            onChange={(e) => setFormData({ ...formData, nivelEvaluador: e.target.value })}
                                        >
                                            {NIVELES.filter(n => n.evalua).map(nivel => (
                                                <option key={nivel.id} value={nivel.id}>
                                                    {nivel.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">A quién evalúa</label>
                                        <select
                                            className="select-input"
                                            value={formData.nivelEvaluado}
                                            onChange={(e) => setFormData({ ...formData, nivelEvaluado: e.target.value })}
                                        >
                                            {NIVELES.filter(n => n.id !== 'operativo').map(nivel => (
                                                <option key={nivel.id} value={nivel.id}>
                                                    {nivel.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="competencias-preview">
                                <span className="preview-label">💡 Competencias automáticas</span>
                                <p className="preview-note">
                                    Las preguntas se asignarán automáticamente según el nivel seleccionado
                                </p>
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
                                    Crear Encuesta
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GestionEncuestas
