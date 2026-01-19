import { useState, useEffect } from 'react'
import { getAllUsers, getAllResponses } from '../../config/firebase'
import './EmployeeProgress.css'

const EmployeeProgress = () => {
    const [employees, setEmployees] = useState([])
    const [responses, setResponses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Filtros
    const [selectedDepartment, setSelectedDepartment] = useState('todos')
    const [selectedShift, setSelectedShift] = useState('todos')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Cargar empleados y respuestas en paralelo
            const [usersResult, responsesResult] = await Promise.all([
                getAllUsers(),
                getAllResponses()
            ])

            if (!usersResult.success) {
                throw new Error(usersResult.error)
            }

            if (!responsesResult.success) {
                throw new Error(responsesResult.error)
            }

            setEmployees(usersResult.data || [])
            setResponses(responsesResult.data || [])
        } catch (err) {
            console.error('Error cargando datos:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Verificar si un empleado completó la encuesta
    const hasCompleted = (employeeId) => {
        return responses.some(response => response.evaluadorId === employeeId)
    }

    // Obtener lista única de departamentos
    const departments = ['todos', ...new Set(employees.map(emp => emp.departamento).filter(Boolean))]

    // Obtener lista única de turnos
    const shifts = ['todos', ...Array.from(new Set(employees.map(emp => emp.turnoFijo).filter(Boolean))).sort((a, b) => a - b)]

    // Filtrar empleados
    const filteredEmployees = employees.filter(emp => {
        const matchDepartment = selectedDepartment === 'todos' || emp.departamento === selectedDepartment
        const matchShift = selectedShift === 'todos' || emp.turnoFijo === parseInt(selectedShift)
        return matchDepartment && matchShift
    })

    // Calcular estadísticas
    const totalFiltered = filteredEmployees.length
    const completedCount = filteredEmployees.filter(emp => hasCompleted(emp.id)).length
    const pendingCount = totalFiltered - completedCount
    const completionPercentage = totalFiltered > 0 ? ((completedCount / totalFiltered) * 100).toFixed(1) : 0

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

            {/* Estadísticas */}
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-value">{totalFiltered}</div>
                        <div className="stat-label">Total Empleados</div>
                    </div>
                </div>
                <div className="stat-card completed">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{completedCount}</div>
                        <div className="stat-label">Completados</div>
                    </div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <div className="stat-value">{pendingCount}</div>
                        <div className="stat-label">Pendientes</div>
                    </div>
                </div>
                <div className="stat-card percentage">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <div className="stat-value">{completionPercentage}%</div>
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
                        onChange={(e) => setSelectedDepartment(e.target.value)}
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
                        onChange={(e) => setSelectedShift(e.target.value)}
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
                <table className="employees-table">
                    <thead>
                        <tr>
                            <th>N° Empleado</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Departamento</th>
                            <th>Turno</th>
                            <th>Estado</th>
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
                                const completed = hasCompleted(employee.id)
                                return (
                                    <tr key={employee.id} className={completed ? 'completed-row' : 'pending-row'}>
                                        <td>{employee.employeeNumber || '-'}</td>
                                        <td>{employee.nombre || '-'}</td>
                                        <td className="email-cell">{employee.email || '-'}</td>
                                        <td>{employee.departamento || '-'}</td>
                                        <td className="shift-cell">Turno {employee.turnoFijo || '-'}</td>
                                        <td className="status-cell">
                                            {completed ? (
                                                <span className="status-badge completed">
                                                    ✅ Completado
                                                </span>
                                            ) : (
                                                <span className="status-badge pending">
                                                    ⏳ Pendiente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default EmployeeProgress
