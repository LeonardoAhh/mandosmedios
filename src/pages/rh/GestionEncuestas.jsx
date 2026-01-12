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
            // Obtener competencias según el nivel evaluador seleccionado
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

    if (loading) {
        return <Loader fullScreen message="Cargando encuestas..." />
    }

    return (
        <div className="gestion-encuestas">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">Gestión de Encuestas</h1>
                    <p className="page-subtitle">
                        Crea y administra períodos de evaluación
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    ➕ Nueva Encuesta
                </Button>
            </header>

            {/* Encuestas List */}
            <div className="surveys-list">
                {surveys.length === 0 ? (
                    <Card>
                        <div className="empty-state">
                            <span>📋</span>
                            <h3>No hay encuestas</h3>
                            <p>Crea tu primera encuesta de evaluación de liderazgo.</p>
                            <Button onClick={() => setShowModal(true)}>
                                Crear Encuesta
                            </Button>
                        </div>
                    </Card>
                ) : (
                    surveys.map((survey) => (
                        <Card key={survey.id} className="survey-card">
                            <div className="survey-main">
                                <div className="survey-status">
                                    <span className={`status-badge ${survey.activa ? 'active' : 'inactive'}`}>
                                        {survey.activa ? '🟢 Activa' : '⚪ Inactiva'}
                                    </span>
                                </div>
                                <h3 className="survey-title">{survey.titulo}</h3>
                                <p className="survey-description">{survey.descripcion}</p>

                                <div className="survey-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Evaluadores:</span>
                                        <span className="meta-value">
                                            {NIVELES.find(n => n.id === survey.nivelEvaluador)?.nombre || survey.nivelEvaluador}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Evaluados:</span>
                                        <span className="meta-value">
                                            {NIVELES.find(n => n.id === survey.nivelEvaluado)?.nombre || survey.nivelEvaluado}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Creada:</span>
                                        <span className="meta-value">{formatDate(survey.fechaCreacion)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="survey-actions">
                                <Button
                                    variant={survey.activa ? 'secondary' : 'success'}
                                    size="sm"
                                    onClick={() => toggleActive(survey.id, survey.activa)}
                                >
                                    {survey.activa ? 'Desactivar' : 'Activar'}
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(survey.id)}
                                >
                                    Eliminar
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
                            <h2>Nueva Encuesta</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {error && <div className="form-error">{error}</div>}

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

                            <div className="competencias-preview">
                                <span className="preview-label">Competencias según nivel evaluador:</span>
                                <p className="preview-note">
                                    Las competencias se asignarán automáticamente según el nivel seleccionado
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
