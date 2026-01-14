import jsPDF from 'jspdf'

// Colores corporativos
const COLORS = {
    primary: [59, 130, 246],      // #3b82f6
    primaryDark: [37, 99, 235],   // #2563eb
    success: [16, 185, 129],      // #10b981
    warning: [245, 158, 11],      // #f59e0b
    danger: [239, 68, 68],        // #ef4444
    dark: [26, 26, 26],           // #1a1a1a
    gray: [107, 114, 128],        // #6b7280
    lightGray: [243, 244, 246],   // #f3f4f6
    white: [255, 255, 255]
}

// Configuración de página
const PAGE = {
    width: 210,
    height: 297,
    margin: 20,
    contentWidth: 170
}

/**
 * Genera un reporte PDF ejecutivo para un supervisor
 */
export const generateSupervisorReport = (reportData) => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    let y = PAGE.margin

    // === ENCABEZADO ===
    y = drawHeader(pdf, reportData, y)

    // === RESUMEN EJECUTIVO ===
    y = drawExecutiveSummary(pdf, reportData, y)

    // === RESULTADOS POR COMPETENCIA ===
    y = drawCompetenciasChart(pdf, reportData, y)

    // === FORTALEZAS Y ÁREAS DE MEJORA ===
    y = drawInsights(pdf, reportData, y)

    // === COMENTARIOS ===
    if (reportData.comentarios?.length > 0) {
        y = drawComments(pdf, reportData, y)
    }

    // === PIE DE PÁGINA ===
    drawFooter(pdf)

    // Guardar PDF
    const fileName = `Reporte_${reportData.supervisor?.name?.replace(/\s+/g, '_') || 'Supervisor'}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

    return { success: true, fileName }
}

// === FUNCIONES DE DIBUJO ===

function drawHeader(pdf, data, y) {
    // Barra superior azul
    pdf.setFillColor(...COLORS.primary)
    pdf.rect(0, 0, PAGE.width, 45, 'F')

    // Logo/Nombre de la empresa
    pdf.setTextColor(...COLORS.white)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('VINOPLASTIC', PAGE.margin, 15)

    // Título del reporte
    pdf.setFontSize(22)
    pdf.text('Reporte de Evaluación de Liderazgo', PAGE.margin, 30)

    // Fecha
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    const fecha = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    pdf.text(fecha, PAGE.width - PAGE.margin - pdf.getTextWidth(fecha), 15)

    y = 55

    // Información del supervisor
    pdf.setTextColor(...COLORS.dark)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(data.supervisor?.name || 'Supervisor', PAGE.margin, y)
    y += 8

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...COLORS.gray)
    pdf.text(data.supervisor?.position || '', PAGE.margin, y)
    y += 6

    pdf.text(`${data.supervisor?.department || ''} · Turno ${data.supervisor?.currentShift || 1}`, PAGE.margin, y)
    y += 12

    return y
}

function drawExecutiveSummary(pdf, data, y) {
    // Título de sección
    y = drawSectionTitle(pdf, 'Resumen Ejecutivo', y)

    // Cards de métricas
    const cardWidth = PAGE.contentWidth / 3 - 5
    const cardHeight = 30
    const startX = PAGE.margin

    // Card 1: Total evaluaciones
    drawMetricCard(pdf, startX, y, cardWidth, cardHeight, {
        value: data.totalRespuestas?.toString() || '0',
        label: 'Evaluaciones',
        color: COLORS.primary
    })

    // Card 2: Promedio general
    const promedioColor = data.promedioGeneral >= 4 ? COLORS.success :
        data.promedioGeneral >= 3 ? COLORS.warning : COLORS.danger
    drawMetricCard(pdf, startX + cardWidth + 7.5, y, cardWidth, cardHeight, {
        value: data.promedioGeneral?.toFixed(1) || '0.0',
        label: 'Promedio General',
        color: promedioColor
    })

    // Card 3: Escala
    drawMetricCard(pdf, startX + (cardWidth + 7.5) * 2, y, cardWidth, cardHeight, {
        value: '1-5',
        label: 'Escala',
        color: COLORS.gray
    })

    y += cardHeight + 15

    // Estadísticas por turno (si existen)
    if (data.porTurno && Object.keys(data.porTurno).length > 0) {
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...COLORS.dark)
        pdf.text('Evaluaciones por turno:', PAGE.margin, y)
        y += 6

        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...COLORS.gray)
        const turnoText = Object.entries(data.porTurno)
            .map(([turno, count]) => `Turno ${turno}: ${count}`)
            .join('  •  ')
        pdf.text(turnoText, PAGE.margin, y)
        y += 12
    }

    return y
}

function drawCompetenciasChart(pdf, data, y) {
    // Verificar espacio, crear nueva página si es necesario
    if (y > PAGE.height - 100) {
        pdf.addPage()
        y = PAGE.margin
    }

    y = drawSectionTitle(pdf, 'Resultados por Competencia', y)

    if (!data.promedios || Object.keys(data.promedios).length === 0) {
        pdf.setFontSize(10)
        pdf.setTextColor(...COLORS.gray)
        pdf.text('No hay datos de competencias disponibles.', PAGE.margin, y)
        return y + 10
    }

    const competencias = Object.entries(data.promedios).map(([id, val]) => ({
        nombre: data.competencias?.find(c => c.id === id)?.nombre || id,
        promedio: val.promedio
    })).sort((a, b) => b.promedio - a.promedio)

    const barHeight = 8
    const maxBarWidth = 100
    const labelWidth = 60

    competencias.forEach((comp, i) => {
        const barY = y + (i * (barHeight + 5))
        const percentage = (comp.promedio / 5) * 100
        const barWidth = (percentage / 100) * maxBarWidth

        // Nombre de la competencia
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...COLORS.dark)
        pdf.text(comp.nombre.substring(0, 30), PAGE.margin, barY + 5)

        // Barra de fondo
        pdf.setFillColor(...COLORS.lightGray)
        pdf.roundedRect(PAGE.margin + labelWidth, barY, maxBarWidth, barHeight, 2, 2, 'F')

        // Barra de progreso
        const color = comp.promedio >= 4 ? COLORS.success :
            comp.promedio >= 3 ? COLORS.warning : COLORS.danger
        pdf.setFillColor(...color)
        pdf.roundedRect(PAGE.margin + labelWidth, barY, barWidth, barHeight, 2, 2, 'F')

        // Valor
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...COLORS.dark)
        pdf.text(comp.promedio.toFixed(1), PAGE.margin + labelWidth + maxBarWidth + 5, barY + 5)
    })

    y += competencias.length * (barHeight + 5) + 10

    return y
}

function drawInsights(pdf, data, y) {
    // Verificar espacio
    if (y > PAGE.height - 80) {
        pdf.addPage()
        y = PAGE.margin
    }

    const colWidth = PAGE.contentWidth / 2 - 5

    // Fortalezas
    if (data.fortalezas?.length > 0) {
        y = drawSectionTitle(pdf, 'Fortalezas', y)

        pdf.setFillColor(240, 253, 244) // Verde claro
        pdf.roundedRect(PAGE.margin, y, colWidth, 45, 3, 3, 'F')

        let insightY = y + 8
        data.fortalezas.slice(0, 3).forEach((f, i) => {
            pdf.setFontSize(9)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(...COLORS.dark)
            pdf.text(`${i + 1}. ${f.nombre?.substring(0, 25) || ''}`, PAGE.margin + 5, insightY)

            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(...COLORS.success)
            pdf.text(f.promedio?.toFixed(1) || '', PAGE.margin + colWidth - 15, insightY)
            insightY += 12
        })
    }

    // Áreas de mejora
    if (data.oportunidades?.length > 0) {
        pdf.setFillColor(255, 251, 235) // Amarillo claro
        pdf.roundedRect(PAGE.margin + colWidth + 10, y, colWidth, 45, 3, 3, 'F')

        // Título
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...COLORS.warning)
        pdf.text('Áreas de Mejora', PAGE.margin + colWidth + 15, y - 3)

        let insightY = y + 8
        data.oportunidades.slice(0, 3).forEach((o, i) => {
            pdf.setFontSize(9)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(...COLORS.dark)
            pdf.text(`${i + 1}. ${o.nombre?.substring(0, 25) || ''}`, PAGE.margin + colWidth + 15, insightY)

            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(...COLORS.warning)
            pdf.text(o.promedio?.toFixed(1) || '', PAGE.margin + PAGE.contentWidth - 10, insightY)
            insightY += 12
        })
    }

    y += 55

    return y
}

function drawComments(pdf, data, y) {
    // Verificar espacio
    if (y > PAGE.height - 60) {
        pdf.addPage()
        y = PAGE.margin
    }

    y = drawSectionTitle(pdf, 'Comentarios Anónimos', y)

    data.comentarios.slice(0, 3).forEach((comment, i) => {
        if (y > PAGE.height - 30) {
            pdf.addPage()
            y = PAGE.margin
        }

        pdf.setFillColor(...COLORS.lightGray)
        const commentHeight = Math.ceil(comment.length / 80) * 5 + 10
        pdf.roundedRect(PAGE.margin, y, PAGE.contentWidth, commentHeight, 2, 2, 'F')

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(...COLORS.gray)

        const lines = pdf.splitTextToSize(`"${comment}"`, PAGE.contentWidth - 10)
        pdf.text(lines, PAGE.margin + 5, y + 7)

        y += commentHeight + 5
    })

    return y
}

function drawSectionTitle(pdf, title, y) {
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...COLORS.primary)
    pdf.text(title, PAGE.margin, y)

    // Línea decorativa
    pdf.setDrawColor(...COLORS.primary)
    pdf.setLineWidth(0.5)
    pdf.line(PAGE.margin, y + 2, PAGE.margin + 40, y + 2)

    return y + 10
}

function drawMetricCard(pdf, x, y, width, height, options) {
    // Fondo de la card
    pdf.setFillColor(...COLORS.white)
    pdf.setDrawColor(...options.color)
    pdf.setLineWidth(0.5)
    pdf.roundedRect(x, y, width, height, 3, 3, 'FD')

    // Barra de color superior
    pdf.setFillColor(...options.color)
    pdf.rect(x, y, width, 3, 'F')

    // Valor
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...options.color)
    pdf.text(options.value, x + width / 2, y + 15, { align: 'center' })

    // Label
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...COLORS.gray)
    pdf.text(options.label, x + width / 2, y + 23, { align: 'center' })
}

function drawFooter(pdf) {
    const pageCount = pdf.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)

        // Línea separadora
        pdf.setDrawColor(...COLORS.lightGray)
        pdf.setLineWidth(0.5)
        pdf.line(PAGE.margin, PAGE.height - 15, PAGE.width - PAGE.margin, PAGE.height - 15)

        // Texto del pie
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...COLORS.gray)

        pdf.text('Sistema de Evaluación de Liderazgo - VINOPLASTIC', PAGE.margin, PAGE.height - 10)
        pdf.text(`Página ${i} de ${pageCount}`, PAGE.width - PAGE.margin - 20, PAGE.height - 10)

        // Confidencial
        pdf.setFont('helvetica', 'italic')
        pdf.text('Documento confidencial', PAGE.width / 2, PAGE.height - 10, { align: 'center' })
    }
}

/**
 * Genera un reporte PDF consolidado de todos los supervisores
 */
export const generateConsolidatedReport = (supervisores, responses, competencias) => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    let y = PAGE.margin

    // Encabezado
    pdf.setFillColor(...COLORS.primary)
    pdf.rect(0, 0, PAGE.width, 40, 'F')

    pdf.setTextColor(...COLORS.white)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('VINOPLASTIC', PAGE.margin, 15)

    pdf.setFontSize(20)
    pdf.text('Reporte Consolidado de Evaluaciones', PAGE.margin, 28)

    const fecha = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(fecha, PAGE.width - PAGE.margin - pdf.getTextWidth(fecha), 15)

    y = 55

    // Tabla de supervisores
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...COLORS.dark)
    pdf.text('Resumen por Supervisor', PAGE.margin, y)
    y += 10

    // Encabezados de tabla
    const colWidths = [60, 35, 25, 25, 25]
    const headers = ['Supervisor', 'Departamento', 'Turno', 'Evaluaciones', 'Promedio']

    pdf.setFillColor(...COLORS.primary)
    pdf.rect(PAGE.margin, y, PAGE.contentWidth, 8, 'F')

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...COLORS.white)

    let x = PAGE.margin + 2
    headers.forEach((header, i) => {
        pdf.text(header, x, y + 5.5)
        x += colWidths[i]
    })

    y += 10

    // Filas de datos
    supervisores.forEach((sup, index) => {
        if (y > PAGE.height - 30) {
            pdf.addPage()
            y = PAGE.margin
        }

        const supResponses = responses.filter(r => r.evaluadoId === sup.id)
        const promedio = supResponses.length > 0
            ? supResponses.reduce((acc, r) => {
                const valores = Object.values(r.respuestas || {}).filter(v => typeof v === 'number')
                return acc + (valores.reduce((a, b) => a + b, 0) / valores.length)
            }, 0) / supResponses.length
            : 0

        // Fondo alternado
        if (index % 2 === 0) {
            pdf.setFillColor(...COLORS.lightGray)
            pdf.rect(PAGE.margin, y - 4, PAGE.contentWidth, 8, 'F')
        }

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...COLORS.dark)

        x = PAGE.margin + 2
        pdf.text(sup.name?.substring(0, 28) || '', x, y)
        x += colWidths[0]
        pdf.text(sup.department || '', x, y)
        x += colWidths[1]
        pdf.text(sup.currentShift?.toString() || '', x, y)
        x += colWidths[2]
        pdf.text(supResponses.length.toString(), x, y)
        x += colWidths[3]

        // Promedio con color
        const promedioColor = promedio >= 4 ? COLORS.success :
            promedio >= 3 ? COLORS.warning : COLORS.danger
        pdf.setTextColor(...promedioColor)
        pdf.setFont('helvetica', 'bold')
        pdf.text(promedio > 0 ? promedio.toFixed(1) : '-', x, y)

        y += 8
    })

    // Pie de página
    drawFooter(pdf)

    const fileName = `Reporte_Consolidado_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

    return { success: true, fileName }
}
