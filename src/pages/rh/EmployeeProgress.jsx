import { useState, useEffect, useMemo, useCallback } from 'react'
import { getAllUsers, getAllResponses, getAllSupervisores } from '../../config/firebase'
import './EmployeeProgress.css'

const EmployeeProgress = () => {
    const [employees, setEmployees] = useState([])
    const [responses, setResponses] = useState([])
    const [supervisores, setSupervisores] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedDepartment, setSelectedDepartment] = useState('todos')
    const [selectedShift, setSelectedShift] = useState('todos')

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const [usersResult, responsesResult, supervisoresResult] = await Promise.all([
                getAllUsers(),
                getAllResponses(),
                getAllSupervisores()
            ])
            if (usersResult.success) setEmployees(usersResult.data || [])
            if (responsesResult.success) setResponses(responsesResult.data || [])
            if (supervisoresResult.success) setSupervisores(supervisoresResult.data || [])
        } catch (err) {
            console.error('Error:', err)
            setError('Error al cargar datos')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const responsesByEvaluador = useMemo(() => {
        const map = {}
        responses.forEach(r => {
            if (r.evaluadorId) map[r.evaluadorId] = (map[r.evaluadorId] || 0) + 1
        })
        return map
    }, [responses])

    const supervisoresByDeptShift = useMemo(() => {
        const map = {}
        supervisores.forEach(s => {
            const key = `${s.department}-${s.currentShift}`
            map[key] = (map[key] || 0) + 1
        })
        return map
    }, [supervisores])

    const getProgress = useCallback((emp) => {
        const key = `${emp.departamento}-${emp.turnoFijo}`
        const total = supervisoresByDeptShift[key] || 0
        const completed = responsesByEvaluador[emp.id] || 0
        return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0, isComplete: total > 0 && completed >= total }
    }, [supervisoresByDeptShift, responsesByEvaluador])

    const departments = useMemo(() => ['todos', ...new Set(employees.map(e => e.departamento).filter(Boolean))], [employees])
    const shifts = useMemo(() => ['todos', ...new Set(employees.map(e => e.turnoFijo).filter(Boolean)).sort((a, b) => a - b)], [employees])

    const filteredEmployees = useMemo(() => employees.filter(emp => {
        const matchDept = selectedDepartment === 'todos' || emp.departamento === selectedDepartment
        const matchShift = selectedShift === 'todos' || emp.turnoFijo === parseInt(selectedShift)
        return matchDept && matchShift
    }), [employees, selectedDepartment, selectedShift])

    const progressMap = useMemo(() => {
        const map = {}
        filteredEmployees.forEach(emp => { map[emp.id] = getProgress(emp) })
        return map
    }, [filteredEmployees, getProgress])

    const stats = useMemo(() => {
        const total = filteredEmployees.length
        const completed = filteredEmployees.filter(emp => progressMap[emp.id]?.isComplete).length
        const pending = total - completed
        return { total, completed, pending, percentage: total > 0 ? ((completed / total) * 100).toFixed(1) : 0 }
    }, [filteredEmployees, progressMap])

    if (loading) {
        return (
            <div className="prog-page">
                <div className="prog-loading">
                    <div className="prog-spinner"></div>
                    <p>Cargando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="prog-page">
            <header className="prog-header">
                <div className="prog-header-info">
                    <h1 className="prog-title">Progreso</h1>
                    <p className="prog-subtitle">Evaluaciones por empleado</p>
                </div>
                <button className="prog-refresh" onClick={loadData}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                </button>
            </header>

            {error && <div className="prog-error">{error}</div>}

            <div className="prog-stats">
                <div className="prog-stat">
                    <span className="prog-stat-value">{stats.total}</span>
                    <span className="prog-stat-label">Empleados</span>
                </div>
                <div className="prog-stat prog-stat-done">
                    <span className="prog-stat-value">{stats.completed}</span>
                    <span className="prog-stat-label">Completados</span>
                </div>
                <div className="prog-stat prog-stat-pending">
                    <span className="prog-stat-value">{stats.pending}</span>
                    <span className="prog-stat-label">Pendientes</span>
                </div>
                <div className="prog-stat prog-stat-percent">
                    <span className="prog-stat-value">{stats.percentage}%</span>
                    <span className="prog-stat-label">Progreso</span>
                </div>
            </div>

            <div className="prog-filters">
                <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                    {departments.map(d => <option key={d} value={d}>{d === 'todos' ? 'Todos los deptos' : d}</option>)}
                </select>
                <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)}>
                    <option value="todos">Todos los turnos</option>
                    {shifts.filter(s => s !== 'todos').map(s => <option key={s} value={s}>Turno {s}</option>)}
                </select>
            </div>

            <div className="prog-list">
                {filteredEmployees.length === 0 ? (
                    <div className="prog-empty">Sin empleados</div>
                ) : (
                    filteredEmployees.map(emp => {
                        const p = progressMap[emp.id]
                        return (
                            <div key={emp.id} className={`prog-card ${p.isComplete ? 'done' : p.completed > 0 ? 'progress' : ''}`}>
                                <div className="prog-card-avatar">{emp.nombre?.charAt(0) || '?'}</div>
                                <div className="prog-card-info">
                                    <span className="prog-card-name">{emp.nombre}</span>
                                    <span className="prog-card-meta">{emp.departamento} · T{emp.turnoFijo}</span>
                                </div>
                                <div className="prog-card-progress">
                                    <div className="prog-progress-text">
                                        {p.isComplete ? (
                                            <span className="prog-badge prog-badge-done">Completado</span>
                                        ) : p.completed > 0 ? (
                                            <span className="prog-badge prog-badge-progress">{p.completed}/{p.total}</span>
                                        ) : (
                                            <span className="prog-badge prog-badge-pending">Pendiente</span>
                                        )}
                                    </div>
                                    {p.total > 0 && (
                                        <div className="prog-bar">
                                            <div className="prog-bar-fill" style={{ width: `${p.percentage}%` }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default EmployeeProgress
