/**
 * Formatea un timestamp de Firestore a fecha legible.
 * @param {import('firebase/firestore').Timestamp | null} timestamp
 * @returns {string} Fecha formateada (ej: "14 feb 2026") o "—" si es inválido
 */
export const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '—'

    try {
        return timestamp.toDate().toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    } catch {
        return '—'
    }
}
