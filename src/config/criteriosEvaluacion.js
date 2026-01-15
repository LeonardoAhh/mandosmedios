/**
 * Configuración de los Criterios de Evaluación
 * 
 * Los "12 Puntos del Jefe" se separan en sub-criterios específicos,
 * más las 6 categorías adicionales (total: ~12-15 criterios)
 */

// Definición de todos los criterios (12 puntos del jefe separados + 6 categorías adicionales)
export const CRITERIOS = [
    // SUB-CRITERIOS DE LOS 12 PUNTOS DEL JEFE
    {
        id: 'resultados_control',
        nombre: 'Resultados y Control',
        descripcion: 'Claridad en resultados, indicadores y reportes mensuales del área',
        icono: '📊',
        color: '#3b82f6',
        categoria: '12_puntos'
    },
    {
        id: 'herramientas_trabajo',
        nombre: 'Herramientas de Trabajo',
        descripcion: 'Proporciona herramientas adecuadas y simplifica tareas',
        icono: '🔧',
        color: '#6366f1',
        categoria: '12_puntos'
    },
    {
        id: 'objetivos_metas',
        nombre: 'Objetivos y Metas',
        descripcion: 'Asigna metas claras, realiza cierres mensuales y planes de trabajo',
        icono: '🎯',
        color: '#8b5cf6',
        categoria: '12_puntos'
    },
    {
        id: 'capacitacion',
        nombre: 'Capacitación',
        descripcion: 'Mantiene actualizado y capacitado al personal',
        icono: '📚',
        color: '#a855f7',
        categoria: '12_puntos'
    },
    {
        id: 'productividad',
        nombre: 'Productividad',
        descripcion: 'Evalúa y comunica ranking de productividad y avances',
        icono: '📈',
        color: '#d946ef',
        categoria: '12_puntos'
    },
    {
        id: 'reconocimiento',
        nombre: 'Reconocimiento',
        descripcion: 'Felicita y reconoce logros del equipo',
        icono: '🏅',
        color: '#ec4899',
        categoria: '12_puntos'
    },
    {
        id: 'comunicacion',
        nombre: 'Comunicación',
        descripcion: 'Escucha a su gente y mantiene contacto frecuente',
        icono: '💬',
        color: '#f43f5e',
        categoria: '12_puntos'
    },
    {
        id: 'mejores_practicas',
        nombre: 'Mejores Prácticas',
        descripcion: 'Aprovecha expertos y enseña mejores prácticas',
        icono: '⭐',
        color: '#f97316',
        categoria: '12_puntos'
    },
    {
        id: 'cumplimiento',
        nombre: 'Cumplimiento',
        descripcion: 'Cumple y hace cumplir políticas y filosofías de la empresa',
        icono: '✅',
        color: '#84cc16',
        categoria: '12_puntos'
    },
    {
        id: 'solucion_problemas',
        nombre: 'Solución de Problemas',
        descripcion: 'Permite hacer lo que mejor saben hacer y resuelve problemas',
        icono: '💡',
        color: '#22c55e',
        categoria: '12_puntos'
    },
    {
        id: 'desarrollo',
        nombre: 'Desarrollo',
        descripcion: 'Informa sobre oportunidades de crecimiento y apoya el desarrollo',
        icono: '🚀',
        color: '#14b8a6',
        categoria: '12_puntos'
    },

    // CATEGORÍAS ADICIONALES
    {
        id: 'nuestras_relaciones',
        nombre: 'Nuestras Relaciones',
        descripcion: 'Capacidad de construir y fortalecer relaciones en el equipo',
        icono: '🤝',
        color: '#06b6d4',
        categoria: 'adicional'
    },
    {
        id: 'exitos_compartidos',
        nombre: 'Éxitos Compartidos',
        descripcion: 'Fomento del trabajo en equipo y reconocimiento colectivo',
        icono: '🏆',
        color: '#0ea5e9',
        categoria: 'adicional'
    },
    {
        id: 'impulsar',
        nombre: 'Impulsar',
        descripcion: 'Motivación y apoyo al desarrollo del equipo',
        icono: '🔥',
        color: '#f59e0b',
        categoria: 'adicional'
    },
    {
        id: 'diversion',
        nombre: 'Diversión',
        descripcion: 'Ambiente laboral positivo y entusiasta',
        icono: '😊',
        color: '#eab308',
        categoria: 'adicional'
    },
    {
        id: 'individualidad',
        nombre: 'Individualidad',
        descripcion: 'Respeto por la diversidad y personalidad de cada integrante',
        icono: '👤',
        color: '#10b981',
        categoria: 'adicional'
    },
    {
        id: 'liderazgo',
        nombre: 'Liderazgo',
        descripcion: 'Cualidades de liderazgo, toma de decisiones y comunicación efectiva',
        icono: '👑',
        color: '#f59e0b',
        categoria: 'adicional'
    }
]

/**
 * Mapeo del campo "Punto" del cuestions.json a su criterio correspondiente
 * Usa palabras clave del texto largo para identificar el sub-criterio
 */
export const getCriterioFromPunto = (punto) => {
    if (!punto) return 'resultados_control'

    const puntoLower = punto.toLowerCase().trim()

    // Categorías cortas - match exacto
    if (puntoLower === 'nuestras relaciones') return 'nuestras_relaciones'
    if (puntoLower === 'éxitos compartidos') return 'exitos_compartidos'
    if (puntoLower === 'impulsar') return 'impulsar'
    if (puntoLower === 'diversión') return 'diversion'
    if (puntoLower === 'individualidad') return 'individualidad'
    if (puntoLower === 'liderazgo') return 'liderazgo'

    // 12 PUNTOS DEL JEFE - mapeo por palabras clave del texto largo

    // 1. Resultados y Control - "perfeccionista", "resultados", "indicadores", "factura mensual"
    if (puntoLower.includes('perfeccionista') || puntoLower.includes('indicadores por persona')) {
        return 'resultados_control'
    }

    // 2. Herramientas de Trabajo - "simplifica las tareas", "herramientas adecuadas"
    if (puntoLower.includes('simplifica las tareas') || puntoLower.includes('herramientas adecuadas')) {
        return 'herramientas_trabajo'
    }

    // 3. Objetivos y Metas - "objetivos y metas claras", "cierre de mes"
    if (puntoLower.includes('objetivos y metas') || puntoLower.includes('cierre de mes')) {
        return 'objetivos_metas'
    }

    // 4. Capacitación - "nunca deja de estudiar", "capacitado", "cursos"
    if (puntoLower.includes('nunca deja de estudiar') || puntoLower.includes('capacitado a todo su personal')) {
        return 'capacitacion'
    }

    // 5. Productividad - "califica periódicamente", "listado de su personal", "productivo"
    if (puntoLower.includes('califica periódicamente') || puntoLower.includes('más al menos productivo')) {
        return 'productividad'
    }

    // 6. Reconocimiento - "zanahorias", "reconoce el esfuerzo", "porras", "diplomas"
    if (puntoLower.includes('zanahorias') || puntoLower.includes('reconoce el esfuerzo')) {
        return 'reconocimiento'
    }

    // 7. Comunicación - "tiempo necesario para escuchar", "inquietudes", "operación"
    if (puntoLower.includes('tiempo necesario para escuchar') || puntoLower.includes('inquietudes de su primer nivel')) {
        return 'comunicacion'
    }

    // 8. Mejores Prácticas - "aprovecha a los expertos", "clones", "mejores prácticas"
    if (puntoLower.includes('aprovecha a los expertos') || puntoLower.includes('clones')) {
        return 'mejores_practicas'
    }

    // 9. Cumplimiento - "cumplir y hacer cumplir", "puntos de gestión", "códigos"
    if (puntoLower.includes('cumplir y hacer cumplir') || puntoLower.includes('puntos de gestión')) {
        return 'cumplimiento'
    }

    // 10. Solución de Problemas - "hacer diario lo que mejor sabe hacer", "reportar los problemas"
    if (puntoLower.includes('hacer diario lo que mejor sabe hacer') || puntoLower.includes('alternativas de solución')) {
        return 'solucion_problemas'
    }

    // 11. Desarrollo - "plan de crecimiento y desarrollo", "escalafón", "tabuladores"
    if (puntoLower.includes('plan de crecimiento') || puntoLower.includes('escalafón')) {
        return 'desarrollo'
    }

    // 12. Liderazgo (punto 12 original) - "impecable en su actuación", "ejemplo a seguir"
    if (puntoLower.includes('impecable en su actuación') || puntoLower.includes('bienestar del grupo')) {
        return 'liderazgo'
    }

    // Default
    return 'resultados_control'
}

/**
 * Obtiene el objeto criterio por su ID
 */
export const getCriterioById = (criterioId) => {
    return CRITERIOS.find(c => c.id === criterioId)
}

/**
 * Agrupa competencias de Firestore por criterio
 * Útil para los reportes que usan competencias dinámicas
 */
export const agruparCompetenciasPorCriterio = (competencias, respuestasMap) => {
    const grupos = {}

    // Inicializar grupos
    CRITERIOS.forEach(c => {
        grupos[c.id] = {
            criterio: c,
            valores: [],
            competencias: []
        }
    })

    // Agrupar competencias por su criterio (si tienen el campo) o por nombre
    competencias.forEach(comp => {
        // Determinar criterio: usar campo criterio si existe, sino inferir del nombre
        let criterioId = comp.criterio

        if (!criterioId) {
            // Inferir del nombre de la competencia usando palabras clave
            const nombre = (comp.nombre || '').toLowerCase()
            const descripcion = (comp.descripcion || '').toLowerCase()
            const texto = nombre + ' ' + descripcion

            // Categorías adicionales
            if (texto.includes('relacion') && texto.includes('equipo')) criterioId = 'nuestras_relaciones'
            else if (texto.includes('éxito') || texto.includes('nosotros')) criterioId = 'exitos_compartidos'
            else if (texto.includes('impulsa') || texto.includes('confía')) criterioId = 'impulsar'
            else if (texto.includes('sonríe') || texto.includes('alegría') || texto.includes('entusiasmo')) criterioId = 'diversion'
            else if (texto.includes('individual') || texto.includes('personalidad') || texto.includes('orgullo')) criterioId = 'individualidad'
            else if (texto.includes('ejemplo') || texto.includes('lider') || texto.includes('decisiones') || texto.includes('inspira')) criterioId = 'liderazgo'
            // Sub-criterios de 12 puntos
            else if (texto.includes('resultado') || texto.includes('indicador')) criterioId = 'resultados_control'
            else if (texto.includes('herramienta') || texto.includes('simple')) criterioId = 'herramientas_trabajo'
            else if (texto.includes('objetivo') || texto.includes('meta') || texto.includes('cierre')) criterioId = 'objetivos_metas'
            else if (texto.includes('capacita') || texto.includes('curso') || texto.includes('actualiz')) criterioId = 'capacitacion'
            else if (texto.includes('productiv') || texto.includes('ranking') || texto.includes('avance')) criterioId = 'productividad'
            else if (texto.includes('felicit') || texto.includes('reconoc') || texto.includes('logro')) criterioId = 'reconocimiento'
            else if (texto.includes('escucha') || texto.includes('contacto') || texto.includes('reun')) criterioId = 'comunicacion'
            else if (texto.includes('tutor') || texto.includes('clon') || texto.includes('práctica')) criterioId = 'mejores_practicas'
            else if (texto.includes('cumpl') || texto.includes('política') || texto.includes('filosofía')) criterioId = 'cumplimiento'
            else if (texto.includes('libertad') || texto.includes('problema') || texto.includes('solucio')) criterioId = 'solucion_problemas'
            else if (texto.includes('crecimiento') || texto.includes('oportunidad') || texto.includes('desarrollo')) criterioId = 'desarrollo'
            else criterioId = 'resultados_control' // Default
        }

        const valor = respuestasMap[comp.id]?.promedio
        if (valor !== undefined && valor !== null) {
            grupos[criterioId].valores.push(valor)
            grupos[criterioId].competencias.push(comp)
        }
    })

    // Calcular promedios (solo para criterios con valores)
    const resultado = {}
    Object.entries(grupos).forEach(([criterioId, data]) => {
        if (data.valores.length > 0) {
            resultado[criterioId] = {
                criterio: data.criterio,
                promedio: data.valores.reduce((a, b) => a + b, 0) / data.valores.length,
                cantidadCompetencias: data.competencias.length
            }
        }
    })

    return resultado
}

export default CRITERIOS
