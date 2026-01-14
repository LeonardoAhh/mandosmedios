import questions from '../../cuestions.json'

/**
 * Obtener todas las preguntas
 */
export const getAllQuestions = () => {
    return questions
}

/**
 * Agrupar preguntas por Punto
 */
export const getQuestionsByPunto = () => {
    const grouped = {}
    questions.forEach(q => {
        if (!grouped[q.Punto]) {
            grouped[q.Punto] = []
        }
        grouped[q.Punto].push(q)
    })
    return grouped
}

/**
 * Obtener número total de preguntas
 */
export const getQuestionCount = () => {
    return questions.length
}
