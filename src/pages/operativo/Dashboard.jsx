import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSurveys, getUsersByNivel, NIVELES } from '../../config/firebase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const Dashboard = () => {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [surveys, setSurveys] = useState([])
    const [loading, setLoading] = useState(true)
    const [evaluados, setEvaluados] = useState([])

    useEffect(() => {
        loadData()
    }, [profile])

    const loadData = async () => {
        if (!profile) return

        try {
            // Obtener encuestas activas para el nivel del usuario
            const nivelConfig = NIVELES.find(n => n.id === profile.nivel)
            const nivelAEvaluar = nivelConfig?.evalua

            // Cargar TODAS las encuestas activas y filtrar en cliente
            // (evita problemas de índices compuestos en Firestore)
            const surveysResult = await getSurveys({ activa: true })

            if (surveysResult.success) {
                // Filtrar encuestas que coincidan con el nivel del usuario
                const filteredSurveys = surveysResult.data.filter(survey =>
                    survey.nivelEvaluador === profile.nivel
                )
                console.log('Encuestas encontradas:', surveysResult.data)
                console.log('Nivel usuario:', profile.nivel)
                console.log('Encuestas filtradas:', filteredSurveys)
                setSurveys(filteredSurveys)
            }

            if (nivelAEvaluar) {
                // Cargar posibles evaluados (mandos superiores)
                const evaluadosResult = await getUsersByNivel(nivelAEvaluar)
                if (evaluadosResult.success) {
                    setEvaluados(evaluadosResult.data)
                }
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <Loader fullScreen message="Cargando encuestas..." />
    }

    const nivelConfig = NIVELES.find(n => n.id === profile?.nivel)

    return (
        <div className="operativo-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">
                        ¡Hola, {profile?.nombre?.split(' ')[0]}! 👋
                    </h1>
                    <p className="dashboard-subtitle">
                        Tu opinión es confidencial y ayuda a mejorar el liderazgo
                    </p>
                </div>
            </header>

            {/* Info Card */}
            <Card variant="outline" className="info-card">
                <div className="info-content">
                    <span className="info-icon">🔒</span>
                    <div>
                        <h3>100% Anónimo y Confidencial</h3>
                        <p>Tus respuestas no pueden ser rastreadas. Responde con honestidad.</p>
                    </div>
                </div>
            </Card>

            {/* Encuestas activas */}
            <section className="surveys-section">
                <h2 className="section-title">
                    📋 Encuestas Pendientes
                </h2>

                {surveys.length === 0 ? (
                    <Card>
                        <div className="empty-state">
                            <span className="empty-icon">✅</span>
                            <h3>No hay encuestas pendientes</h3>
                            <p>Te notificaremos cuando haya nuevas evaluaciones disponibles.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="surveys-grid">
                        {surveys.map((survey) => (
                            <Card
                                key={survey.id}
                                className="survey-card"
                                onClick={() => navigate(`/encuestas/${survey.id}`)}
                            >
                                <div className="survey-header">
                                    <span className="survey-badge">Nueva</span>
                                    <h3 className="survey-title">{survey.titulo}</h3>
                                </div>
                                <p className="survey-description">{survey.descripcion}</p>
                                <div className="survey-meta">
                                    <span>📊 {survey.competencias?.length || 10} competencias</span>
                                    <span>⏱️ ~5 min</span>
                                </div>
                                <Button fullWidth variant="primary">
                                    Iniciar Evaluación
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Si hay evaluados disponibles pero no encuestas formales */}
            {surveys.length === 0 && evaluados.length > 0 && (
                <section className="quick-eval-section">
                    <h2 className="section-title">
                        👥 Evaluar a tu {nivelConfig?.evalua === 'mando_medio' ? 'Mando Medio' :
                            nivelConfig?.evalua === 'jefe_directo' ? 'Jefe Directo' : 'Superior'}
                    </h2>
                    <p className="section-description">
                        Puedes evaluar a tus superiores directos usando la evaluación estándar.
                    </p>
                    <div className="evaluados-grid">
                        {evaluados.map((evaluado) => (
                            <Card
                                key={evaluado.id}
                                className="evaluado-card"
                                onClick={() => navigate(`/encuestas/evaluar/${evaluado.id}`)}
                            >
                                <div className="evaluado-avatar">
                                    {evaluado.nombre?.charAt(0) || '?'}
                                </div>
                                <div className="evaluado-info">
                                    <span className="evaluado-name">{evaluado.nombre}</span>
                                    <span className="evaluado-role">
                                        {NIVELES.find(n => n.id === evaluado.nivel)?.nombre || evaluado.nivel}
                                    </span>
                                </div>
                                <span className="evaluado-arrow">→</span>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

export default Dashboard
