import { ESCALA } from '../../config/firebase'
import './RatingScale.css'

const RatingScale = ({
    value,
    onChange,
    competencia,
    disabled = false
}) => {
    return (
        <div className="rating-scale">
            <div className="rating-question">
                <h4 className="rating-competencia">{competencia.nombre}</h4>
                <p className="rating-descripcion">{competencia.descripcion}</p>
            </div>

            <div className="rating-options">
                {ESCALA.map((opcion) => (
                    <button
                        key={opcion.valor}
                        type="button"
                        className={`rating-option ${value === opcion.valor ? 'rating-option-selected' : ''}`}
                        onClick={() => !disabled && onChange(opcion.valor)}
                        disabled={disabled}
                        style={{
                            '--option-color': opcion.color
                        }}
                    >
                        <span className="rating-value">{opcion.valor}</span>
                        <span className="rating-label">{opcion.etiqueta}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default RatingScale
