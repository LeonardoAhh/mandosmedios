import { useState, useEffect, useMemo, useCallback } from 'react'
import { getAllUsers, getAllResponses, getAllSupervisores } from '../../config/firebase'
import './EmployeeProgress.css'

const EmployeeProgress = () => {
    const [employees, setEmployees] = useState([])
    const [responses, setResponses] = useState([])
    const [supervisores, setSupervisores] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Filtros
    const [selectedDepartment, setSelectedDepartment] = useState('todos')
    const [selectedShift, setSelectedShift] = useState('todos')

    // ✅ OPTIMIZACIÓN 1: useCallback en loadData evita recrear la función en cada render
    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const [usersResult, responsesResult, supervisoresResult] = await Promise.all([
                getAllUsers(),
                getAllResponses(),
                getAllSupervisores()
            ])

            if (!usersResult.success) throw new Error(usersResult.error)
            if (!responsesResult.success) throw new Error(responsesResult.error)
            if (!supervisoresResult.success) throw new Error(supervisoresResult.error)

            setEmployees(usersResult.data || [])
            setResponses(responsesResult.data || [])
            setSupervisores(supervisoresResult.data || [])
        } catch (err) {
            console.error('Error cargando datos:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, []) // Sin dependencias: solo se crea una vez

    useEffect(() => {
        loadData()
    }, [loadData])

    // ✅ OPTIMIZACIÓN 2: Pre-computar índices como Maps para O(1) en lugar de O(n) por búsqueda
    // responsesByEvaluador: { [evaluadorId]: count }
    const responsesByEvaluador = useMemo(() => {
        const map = {}
        for (const response of responses) {
            if (response.evaluadorId) {
                map[response.evaluadorId] = (map[response.evaluadorId] || 0) + 1
            }
        }
        return map
    }, [responses])

    // supervisoresByDeptShift: { [`${dept}-${shift}`]: count }
    const supervisoresByDeptShift = useMemo(() => {
        const map = {}
        for (const sup of supervisores) {
            const key = `${sup.department}-${sup.currentShift}`
            map[key] = (map[key] || 0) + 1
        }
        return map
    }, [supervisores])

    // ✅ OPTIMIZACIÓN 3: useCallback para getEvaluationProgress usando los Maps precalculados
    // Ahora es O(1) en lugar de O(n) supervisores + O(n) responses por cada empleado
    const getEvaluationProgress = useCallback((employee) => {
        const key = `${employee.departamento}-${employee.turnoFijo}`
        const totalToEvaluate = supervisoresByDeptShift[key] || 0
        const evaluationsCompleted = responsesByEvaluador[employee.id] || 0

        return {
            completed: evaluationsCompleted,
            total: totalToEvaluate,
            percentage: totalToEvaluate > 0 ? (evaluationsCompleted / totalToEvaluate) * 100 : 0,
            isComplete: totalToEvaluate > 0 && evaluationsCompleted >= totalToEvaluate
        }
    }, [supervisoresByDeptShift, responsesByEvaluador])

    // ✅ OPTIMIZACIÓN 4: Listas de filtros memoizadas, solo se recalculan si employees cambia
    const departments = useMemo(() => (
        ['todos', ...new Set(employees.map(emp => emp.departamento).filter(Boolean))]
    ), [employees])

    const shifts = useMemo(() => (
        ['todos', ...Array.from(new Set(employees.map(emp => emp.turnoFijo).filter(Boolean))).sort((a, b) => a - b)]
    ), [employees])

    // ✅ OPTIMIZACIÓN 5: filteredEmployees memoizado, solo recalcula si cambian filtros o empleados
    const filteredEmployees = useMemo(() => (
        employees.filter(emp => {
            const matchDepartment = selectedDepartment === 'todos' || emp.departamento === selectedDepartment
            const matchShift = selectedShift === 'todos' || emp.turnoFijo === parseInt(selectedShift)
            return matchDepartment && matchShift
        })
    ), [employees, selectedDepartment, selectedShift])

    // ✅ OPTIMIZACIÓN 6: Progreso pre-calculado para TODOS los empleados filtrados de una sola pasada
    // Evita llamar getEvaluationProgress dos veces por empleado (stats + render de fila)
    const progressMap = useMemo(() => {
        const map = {}
        for (const emp of filteredEmployees) {
            map[emp.id] = getEvaluationProgress(emp)
        }
        return map
    }, [filteredEmployees, getEvaluationProgress])

    // ✅ OPTIMIZACIÓN 7: Estadísticas derivadas del progressMap, sin recorrer empleados de nuevo
    const stats = useMemo(() => {
        const total = filteredEmployees.length
        const completed = filteredEmployees.filter(emp => progressMap[emp.id]?.isComplete).length
        const pending = total - completed
        const percentage = total > 0 ? ((completed / total) * 100).toFixed(1) : 0
        return { total, completed, pending, percentage }
    }, [filteredEmployees, progressMap])

    // ✅ OPTIMIZACIÓN 8: Handlers memoizados para evitar re-renders innecesarios en los selects
    const handleDepartmentChange = useCallback((e) => setSelectedDepartment(e.target.value), [])
    const handleShiftChange = useCallback((e) => setSelectedShift(e.target.value), [])

    if (loading) {
        return (
            <div className="employee-progress-container">
                <div className="loading-message">
                    <div className="spinner"></div>
                    <p>Cargando datos de empleados...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="employee-progress-container">
                <div className="error-message">
                    <p>❌ Error al cargar datos: {error}</p>
                    <button onClick={loadData} className="retry-button">
                        Reintentar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="employee-progress-container">
            <div className="progress-header">
                <h1>📊 Progreso de Encuestas</h1>
                <p className="subtitle">Monitoreo de completado por empleados</p>
            </div>

            {/* Estadísticas — ahora usa stats memoizado */}
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Empleados</div>
                    </div>
                </div>
                <div className="stat-card completed">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.completed}</div>
                        <div className="stat-label">Completados</div>
                    </div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">Pendientes</div>
                    </div>
                </div>
                <div className="stat-card percentage">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.percentage}%</div>
                        <div className="stat-label">Progreso</div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="filters-section">
                <div className="filter-group">
                    <label htmlFor="department-filter">🏢 Departamento:</label>
                    <select
                        id="department-filter"
                        value={selectedDepartment}
                        onChange={handleDepartmentChange}
                        className="filter-select"
                    >
                        {departments.map(dept => (
                            <option key={dept} value={dept}>
                                {dept === 'todos' ? 'Todos los departamentos' : dept}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="shift-filter">🕐 Turno:</label>
                    <select
                        id="shift-filter"
                        value={selectedShift}
                        onChange={handleShiftChange}
                        className="filter-select"
                    >
                        <option value="todos">Todos los turnos</option>
                        {shifts.filter(s => s !== 'todos').map(shift => (
                            <option key={shift} value={shift}>
                                Turno {shift}
                            </option>
                        ))}
                    </select>
                </div>

                <button onClick={loadData} className="refresh-button" title="Actualizar datos">
                    🔄 Actualizar
                </button>
            </div>

            {/* Tabla de empleados */}
            <div className="table-container">
                <div className="table-wrapper">
                    <table className="employees-table">
                        <thead>
                            <tr>
                                <th>N° Empleado</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Departamento</th>
                                <th>Turno</th>
                                <th>Progreso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="no-data">
                                        No se encontraron empleados con los filtros seleccionados
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map(employee => {
                                    // ✅ OPTIMIZACIÓN 9: Leer del progressMap en lugar de recalcular
                                    const progress = progressMap[employee.id]
                                    const statusClass = progress.isComplete ? 'completed-row' :
                                        progress.completed > 0 ? 'progress-row' : 'pending-row'
                                    return (
                                        <tr key={employee.id} className={statusClass}>
                                            <td>{employee.employeeNumber || '-'}</td>
                                            <td className="name-cell">{employee.nombre || '-'}</td>
                                            <td className="email-cell">{employee.email || '-'}</td>
                                            <td>{employee.departamento || '-'}</td>
                                            <td className="shift-cell">Turno {employee.turnoFijo || '-'}</td>
                                            <td className="progress-cell">
                                                <div className="progress-info">
                                                    <div className="progress-text">
                                                        {progress.isComplete ? (
                                                            <span className="status-badge completed">
                                                                ✅ {progress.completed}/{progress.total}
                                                            </span>
                                                        ) : progress.completed > 0 ? (
                                                            <span className="status-badge in-progress">
                                                                🔄 {progress.completed}/{progress.total}
                                                            </span>
                                                        ) : (
                                                            <span className="status-badge not-started">
                                                                ⏳ {progress.completed}/{progress.total}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {progress.total > 0 && (
                                                        <div className="progress-bar-container">
                                                            <div
                                                                className="progress-bar-fill"
                                                                style={{ width: `${progress.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default EmployeeProgress