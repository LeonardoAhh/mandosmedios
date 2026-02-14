import './Semaforo.css'

const Semaforo = ({ valor, showLabel = true, size = 'md' }) => {
    const getStatus = () => {
        if (valor < 3.0) return { color: 'danger', label: 'Riesgo' }
        if (valor < 4.0) return { color: 'warning', label: 'Área de mejora' }
        return { color: 'success', label: 'Fortaleza' }
    }

    const status = getStatus()

    return (
        <div
            className={`semaforo semaforo-${status.color} semaforo-${size}`}
            role="status"
            aria-label={`Calificación: ${valor.toFixed(1)} — ${status.label}`}
        >
            <div className="semaforo-indicator">
                <span className="semaforo-value">{valor.toFixed(1)}</span>
            </div>
            {showLabel && <span className="semaforo-label" aria-hidden="true">{status.label}</span>}
        </div>
    )
}

export default Semaforo
