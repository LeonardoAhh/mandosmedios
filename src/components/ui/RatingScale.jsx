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
    const showDescription = competencia.descripcion &&
        competencia.descripcion !== competencia.nombre

    return (
        <div className={`rating-scale ${isAnswered ? 'answered' : ''}`}>
            <div className="rating-question">
                <h4 className="rating-competencia">
                    {questionNumber && <span className="question-num">{questionNumber}. </span>}
                    {competencia.descripcion || competencia.nombre}
                </h4>
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
