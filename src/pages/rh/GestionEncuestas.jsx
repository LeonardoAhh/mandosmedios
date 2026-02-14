import { useState, useEffect, useCallback } from 'react'
import {
    getSurveys,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    getCompetenciasByNivel,
    NIVELES
} from '../../config/firebase'
import { formatDate } from '../../utils/formatters'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loader from '../../components/ui/Loader'
import Modal from '../../components/ui/Modal'
import './GestionEncuestas.css'

const INITIAL_FORM = {
    titulo: '',
    descripcion: '',
    nivelEvaluador: 'operativo',
    nivelEvaluado: 'mando_medio',
    fechaInicio: '',
    fechaFin: ''
}

const GestionEncuestas = () => {
    const [loading, setLoading] = useState(true)
    const [surveys, setSurveys] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState(INITIAL_FORM)
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
        } catch (err) {
            console.error('Error loading surveys:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = useCallback(() => setShowModal(true), [])
    const handleCloseModal = useCallback(() => {
        setShowModal(false)
        setFormData(INITIAL_FORM)
        setError('')
    }, [])

    const handleFieldChange = useCallback((field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }, [])

    const handleSubmit = useCallback(async (e) => {
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
                handleCloseModal()
                loadSurveys()
            } else {
                setError(result.error)
            }
        } catch {
            setError('Error al crear encuesta')
        } finally {
            setSubmitting(false)
        }
    }, [formData, handleCloseModal])

    const toggleActive = useCallback(async (surveyId, currentState) => {
        try {
            await updateSurvey(surveyId, { activa: !currentState })
            loadSurveys()
        } catch (err) {
            console.error('Error toggling survey:', err)
        }
    }, [])

    const handleDelete = useCallback(async (surveyId) => {
        if (!confirm('¿Estás seguro de eliminar esta encuesta?')) return

        try {
            await deleteSurvey(surveyId)
            loadSurveys()
        } catch (err) {
            console.error('Error deleting survey:', err)
        }
    }, [])

    if (loading) {
        return <Loader fullScreen message="Cargando encuestas..." />
    }

    return (
        <div className="gestion-encuestas">
            {/* Header */}
            <header className="page-header" aria-label="Encabezado de gestión de encuestas">
                <div className="page-header-content">
                    <h1 className="page-title">Encuestas</h1>
                    <p className="page-subtitle">
                        Gestiona los períodos de evaluación de liderazgo
                    </p>
                </div>
                <button
                    className="btn-new-survey"
                    onClick={handleOpenModal}
                    aria-label="Crear nueva encuesta"
                >
                    <span aria-hidden="true">+</span>
                    Nueva Encuesta
                </button>
            </header>

            {/* Lista de Encuestas */}
            <div className="surveys-grid" role="list" aria-label="Lista de encuestas">
                {surveys.length === 0 ? (
                    <Card>
                        <div className="empty-state">
                            <div className="empty-state-icon" aria-hidden="true">📋</div>
                            <h3>No hay encuestas</h3>
                            <p>Crea tu primera encuesta para comenzar a evaluar el liderazgo en tu organización.</p>
                            <button className="empty-state-btn" onClick={handleOpenModal}>
                                <span aria-hidden="true">+</span>
                                Crear Primera Encuesta
                            </button>
                        </div>
                    </Card>
                ) : (
                    surveys.map((survey) => (
                        <div key={survey.id} className="survey-card" role="listitem">
                            <div className="survey-card-header">
                                <span className={`status-badge ${survey.activa ? 'active' : 'inactive'}`}>
                                    <span className="status-dot" aria-hidden="true"></span>
                                    {survey.activa ? 'Activa' : 'Inactiva'}
                                </span>
                                <div className="survey-actions">
                                    <button
                                        className="action-btn-icon"
                                        onClick={() => toggleActive(survey.id, survey.activa)}
                                        aria-label={survey.activa ? `Desactivar ${survey.titulo}` : `Activar ${survey.titulo}`}
                                    >
                                        {survey.activa ? '⏸️' : '▶️'}
                                    </button>
                                    <button
                                        className="action-btn-icon danger"
                                        onClick={() => handleDelete(survey.id)}
                                        aria-label={`Eliminar ${survey.titulo}`}
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
            <Modal isOpen={showModal} onClose={handleCloseModal} title="Nueva Encuesta" size="lg">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="ge-form-error" role="alert">
                            <span aria-hidden="true">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="ge-form-section">
                        <Input
                            label="Título de la encuesta"
                            value={formData.titulo}
                            onChange={handleFieldChange('titulo')}
                            placeholder="Ej: Evaluación Q1 2024"
                            required
                        />

                        <div className="input-group">
                            <label htmlFor="ge-descripcion" className="input-label">Descripción</label>
                            <textarea
                                id="ge-descripcion"
                                className="ge-textarea"
                                value={formData.descripcion}
                                onChange={handleFieldChange('descripcion')}
                                placeholder="Describe el propósito de esta evaluación"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="ge-form-section">
                        <span className="ge-form-section-title">Configuración de Niveles</span>

                        <div className="ge-form-row">
                            <div className="input-group">
                                <label htmlFor="ge-evaluador" className="input-label">Quién evalúa</label>
                                <select
                                    id="ge-evaluador"
                                    className="ge-select"
                                    value={formData.nivelEvaluador}
                                    onChange={handleFieldChange('nivelEvaluador')}
                                >
                                    {NIVELES.filter(n => n.evalua).map(nivel => (
                                        <option key={nivel.id} value={nivel.id}>
                                            {nivel.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label htmlFor="ge-evaluado" className="input-label">A quién evalúa</label>
                                <select
                                    id="ge-evaluado"
                                    className="ge-select"
                                    value={formData.nivelEvaluado}
                                    onChange={handleFieldChange('nivelEvaluado')}
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

                    <div className="ge-competencias-preview">
                        <span className="ge-preview-label" aria-hidden="true">💡 Competencias automáticas</span>
                        <p className="ge-preview-note">
                            Las preguntas se asignarán automáticamente según el nivel seleccionado
                        </p>
                    </div>

                    <div className="ge-modal-actions">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={handleCloseModal}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" loading={submitting}>
                            Crear Encuesta
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default GestionEncuestas
