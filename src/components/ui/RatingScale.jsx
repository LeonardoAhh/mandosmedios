import { ESCALA } from '../../config/firebase'
import './RatingScale.css'

const RatingScale = ({
    value,
    onChange,
    competencia,
    disabled = false,
    questionNumber
}) => {
    const isAnswered = value !== undefined && value !== null
    const competenciaLabel = competencia.descripcion || competencia.nombre

    return (
        <div className={`rating-scale ${isAnswered ? 'answered' : ''}`}>
            <div className="rating-question">
                <h4 className="rating-competencia" id={`comp-${competencia.id}`}>
                    {questionNumber && <span className="question-num">{questionNumber}. </span>}
                    {competenciaLabel}
                </h4>
            </div>

            <div
                className="rating-options"
                role="radiogroup"
                aria-labelledby={`comp-${competencia.id}`}
            >
                {ESCALA.map((opcion) => (
                    <button
                        key={opcion.valor}
                        type="button"
                        role="radio"
                        aria-checked={value === opcion.valor}
                        aria-label={`${opcion.valor} - ${opcion.etiqueta}`}
                        className={`rating-option ${value === opcion.valor ? 'rating-option-selected' : ''}`}
                        onClick={() => !disabled && onChange(opcion.valor)}
                        disabled={disabled}
                        style={{
                            '--option-color': opcion.color
                        }}
                    >
                        <span className="rating-value" aria-hidden="true">{opcion.valor}</span>
                        <span className="rating-label" aria-hidden="true">{opcion.etiqueta}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default RatingScale
