import { initializeApp } from 'firebase/app'
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    orderBy,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore'

// Configuración de Firebase desde variables de entorno
// En desarrollo, crea un archivo .env.local con las credenciales
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// =====================
// AUTENTICACIÓN
// =====================

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        return { success: true, user: userCredential.user }
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error.code) }
    }
}

export const registerUser = async (email, password, userData) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Crear documento de usuario en Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            nombre: userData.nombre,
            rol: userData.rol || 'operativo',
            nivel: userData.nivel || 'operativo',
            area: userData.area || '',
            evaluaA: userData.evaluaA || null,
            createdAt: serverTimestamp()
        })

        return { success: true, user }
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error.code) }
    }
}

export const logoutUser = async () => {
    try {
        await signOut(auth)
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getUserProfile = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
            return { success: true, data: { id: userDoc.id, ...userDoc.data() } }
        }
        return { success: false, error: 'Usuario no encontrado' }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// =====================
// ENCUESTAS
// =====================

export const getSurveys = async (filters = {}) => {
    try {
        let q = collection(db, 'surveys')
        const constraints = []

        if (filters.activa !== undefined) {
            constraints.push(where('activa', '==', filters.activa))
        }

        // Aplicar constraints sin orderBy para evitar necesitar índices compuestos
        if (constraints.length > 0) {
            q = query(q, ...constraints)
        }

        const snapshot = await getDocs(q)
        let surveys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        // Ordenar en cliente
        surveys.sort((a, b) => {
            const dateA = a.fechaCreacion?.toDate?.() || new Date(0)
            const dateB = b.fechaCreacion?.toDate?.() || new Date(0)
            return dateB - dateA
        })

        return { success: true, data: surveys }
    } catch (error) {
        console.error('Error en getSurveys:', error)
        return { success: false, error: error.message }
    }
}

export const getSurveyById = async (surveyId) => {
    try {
        const surveyDoc = await getDoc(doc(db, 'surveys', surveyId))
        if (surveyDoc.exists()) {
            return { success: true, data: { id: surveyDoc.id, ...surveyDoc.data() } }
        }
        return { success: false, error: 'Encuesta no encontrada' }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const createSurvey = async (surveyData) => {
    try {
        const docRef = await addDoc(collection(db, 'surveys'), {
            ...surveyData,
            activa: true,
            fechaCreacion: serverTimestamp()
        })
        return { success: true, id: docRef.id }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const updateSurvey = async (surveyId, updates) => {
    try {
        await updateDoc(doc(db, 'surveys', surveyId), updates)
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const deleteSurvey = async (surveyId) => {
    try {
        await deleteDoc(doc(db, 'surveys', surveyId))
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// =====================
// RESPUESTAS (ANÓNIMAS)
// =====================

export const submitResponse = async (responseData) => {
    try {
        // IMPORTANTE: No guardamos el ID del evaluador para mantener anonimato
        const docRef = await addDoc(collection(db, 'responses'), {
            surveyId: responseData.surveyId,
            evaluadoId: responseData.evaluadoId,
            respuestas: responseData.respuestas,
            comentario: responseData.comentario || '',
            fecha: serverTimestamp()
            // NO incluimos evaluadorId para anonimato
        })
        return { success: true, id: docRef.id }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getResponsesBySurvey = async (surveyId) => {
    try {
        const q = query(
            collection(db, 'responses'),
            where('surveyId', '==', surveyId)
        )
        const snapshot = await getDocs(q)
        const responses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return { success: true, data: responses }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getResponsesByEvaluado = async (evaluadoId) => {
    try {
        const q = query(
            collection(db, 'responses'),
            where('evaluadoId', '==', evaluadoId)
        )
        const snapshot = await getDocs(q)
        const responses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return { success: true, data: responses }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// =====================
// USUARIOS (GESTIÓN RH)
// =====================

export const getAllUsers = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'users'))
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return { success: true, data: users }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getUsersByRole = async (rol) => {
    try {
        const q = query(collection(db, 'users'), where('rol', '==', rol))
        const snapshot = await getDocs(q)
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return { success: true, data: users }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const getUsersByNivel = async (nivel) => {
    try {
        const q = query(collection(db, 'users'), where('nivel', '==', nivel))
        const snapshot = await getDocs(q)
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return { success: true, data: users }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const updateUser = async (userId, updates) => {
    try {
        await updateDoc(doc(db, 'users', userId), updates)
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export const deleteUser = async (userId) => {
    try {
        await deleteDoc(doc(db, 'users', userId))
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// =====================
// COMPETENCIAS DINÁMICAS
// =====================

// Obtener competencias por nivel desde Firestore
export const getCompetenciasDinamicas = async (nivel) => {
    try {
        const q = query(
            collection(db, 'competencias'),
            where('nivel', '==', nivel)
        )
        const snapshot = await getDocs(q)
        const competencias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        // Ordenar por orden si existe
        competencias.sort((a, b) => (a.orden || 0) - (b.orden || 0))

        return { success: true, data: competencias }
    } catch (error) {
        console.error('Error getting competencias:', error)
        return { success: false, error: error.message }
    }
}

// Crear nueva competencia
export const createCompetencia = async (competenciaData) => {
    try {
        const docRef = await addDoc(collection(db, 'competencias'), {
            ...competenciaData,
            createdAt: serverTimestamp()
        })
        return { success: true, id: docRef.id }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Actualizar competencia
export const updateCompetencia = async (competenciaId, updates) => {
    try {
        await updateDoc(doc(db, 'competencias', competenciaId), updates)
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Eliminar competencia
export const deleteCompetencia = async (competenciaId) => {
    try {
        await deleteDoc(doc(db, 'competencias', competenciaId))
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Obtener todas las competencias (para admin)
export const getAllCompetencias = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'competencias'))
        const competencias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        return { success: true, data: competencias }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Inicializar competencias por defecto en Firestore (ejecutar una vez)
export const initializeDefaultCompetencias = async () => {
    try {
        // Verificar si ya existen competencias
        const existing = await getDocs(collection(db, 'competencias'))
        if (existing.docs.length > 0) {
            return { success: true, message: 'Competencias ya existen', count: existing.docs.length }
        }

        // Competencias por nivel
        const competenciasDefault = [
            // Operativo -> Mando Medio
            { nivel: 'operativo', nombre: 'Trato respetuoso', descripcion: 'Trata a las personas con respeto', orden: 1 },
            { nivel: 'operativo', nombre: 'Escucha antes de decidir', descripcion: 'Escucha antes de decidir', orden: 2 },
            { nivel: 'operativo', nombre: 'Calma bajo presión', descripcion: 'Mantiene la calma bajo presión', orden: 3 },
            { nivel: 'operativo', nombre: 'Corrige sin humillar', descripcion: 'Corrige sin humillar', orden: 4 },
            { nivel: 'operativo', nombre: 'Explica claramente', descripcion: 'Explica claramente lo que espera', orden: 5 },
            { nivel: 'operativo', nombre: 'Apoya en problemas', descripcion: 'Apoya cuando hay problemas', orden: 6 },
            { nivel: 'operativo', nombre: 'Es justo con todos', descripcion: 'Es justo con todos', orden: 7 },
            { nivel: 'operativo', nombre: 'Da ejemplo con su actitud', descripcion: 'Da ejemplo con su actitud', orden: 8 },

            // Mando Medio -> Jefe Directo
            { nivel: 'mando_medio', nombre: 'Lineamientos claros', descripcion: 'Da lineamientos claros', orden: 1 },
            { nivel: 'mando_medio', nombre: 'Escucha al equipo', descripcion: 'Escucha al equipo', orden: 2 },
            { nivel: 'mando_medio', nombre: 'Defiende al equipo', descripcion: 'Defiende al equipo ante presión', orden: 3 },
            { nivel: 'mando_medio', nombre: 'Maneja conflictos', descripcion: 'Maneja conflictos adecuadamente', orden: 4 },
            { nivel: 'mando_medio', nombre: 'Decisiones justas', descripcion: 'Toma decisiones justas', orden: 5 },
            { nivel: 'mando_medio', nombre: 'Promueve desarrollo', descripcion: 'Promueve desarrollo', orden: 6 },
            { nivel: 'mando_medio', nombre: 'Retroalimentación constructiva', descripcion: 'Da retroalimentación constructiva', orden: 7 },
            { nivel: 'mando_medio', nombre: 'Coherencia', descripcion: 'Mantiene coherencia entre discurso y acción', orden: 8 },

            // Jefe Directo -> Gerente
            { nivel: 'jefe_directo', nombre: 'Inspira confianza', descripcion: 'Inspira confianza', orden: 1 },
            { nivel: 'jefe_directo', nombre: 'Visión clara', descripcion: 'Comunica visión clara', orden: 2 },
            { nivel: 'jefe_directo', nombre: 'Escucha niveles inferiores', descripcion: 'Escucha niveles inferiores', orden: 3 },
            { nivel: 'jefe_directo', nombre: 'Maneja presión', descripcion: 'Maneja presión organizacional', orden: 4 },
            { nivel: 'jefe_directo', nombre: 'Cultura de respeto', descripcion: 'Promueve cultura de respeto', orden: 5 },
            { nivel: 'jefe_directo', nombre: 'Decisiones equilibradas', descripcion: 'Toma decisiones equilibradas', orden: 6 },
            { nivel: 'jefe_directo', nombre: 'Apoya a sus líderes', descripcion: 'Apoya a sus líderes', orden: 7 },
            { nivel: 'jefe_directo', nombre: 'Actúa con coherencia', descripcion: 'Actúa con coherencia', orden: 8 }
        ]

        // Crear todas las competencias
        for (const comp of competenciasDefault) {
            await addDoc(collection(db, 'competencias'), {
                ...comp,
                createdAt: serverTimestamp()
            })
        }

        return { success: true, message: 'Competencias inicializadas', count: competenciasDefault.length }
    } catch (error) {
        console.error('Error initializing competencias:', error)
        return { success: false, error: error.message }
    }
}

// =====================
// HELPERS
// =====================

const getAuthErrorMessage = (code) => {
    const errors = {
        'auth/invalid-email': 'Correo electrónico inválido',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/user-not-found': 'No existe una cuenta con este correo',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/email-already-in-use': 'Este correo ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/invalid-credential': 'Credenciales inválidas'
    }
    return errors[code] || 'Error de autenticación'
}

// =====================
// COMPETENCIAS POR NIVEL
// =====================

// A) Operativos → Mandos Medios (Comportamiento diario en piso)
export const COMPETENCIAS_OPERATIVO = [
    { id: 'trato_respeto', nombre: 'Trato respetuoso', descripcion: 'Trata a las personas con respeto' },
    { id: 'escucha_decision', nombre: 'Escucha antes de decidir', descripcion: 'Escucha antes de decidir' },
    { id: 'calma_presion', nombre: 'Calma bajo presión', descripcion: 'Mantiene la calma bajo presión' },
    { id: 'corrige_humillar', nombre: 'Corrige sin humillar', descripcion: 'Corrige sin humillar' },
    { id: 'explica_claro', nombre: 'Explica claramente', descripcion: 'Explica claramente lo que espera' },
    { id: 'apoya_problemas', nombre: 'Apoya en problemas', descripcion: 'Apoya cuando hay problemas' },
    { id: 'justo_todos', nombre: 'Es justo con todos', descripcion: 'Es justo con todos' },
    { id: 'ejemplo_actitud', nombre: 'Da ejemplo con su actitud', descripcion: 'Da ejemplo con su actitud' }
]

// B) Mandos Medios → Jefes Directos (Liderazgo, soporte y toma de decisiones)
export const COMPETENCIAS_MANDO_MEDIO = [
    { id: 'lineamientos_claros', nombre: 'Lineamientos claros', descripcion: 'Da lineamientos claros' },
    { id: 'escucha_equipo', nombre: 'Escucha al equipo', descripcion: 'Escucha al equipo' },
    { id: 'defiende_equipo', nombre: 'Defiende al equipo', descripcion: 'Defiende al equipo ante presión' },
    { id: 'maneja_conflictos', nombre: 'Maneja conflictos', descripcion: 'Maneja conflictos adecuadamente' },
    { id: 'decisiones_justas', nombre: 'Decisiones justas', descripcion: 'Toma decisiones justas' },
    { id: 'promueve_desarrollo', nombre: 'Promueve desarrollo', descripcion: 'Promueve desarrollo' },
    { id: 'retroalimentacion', nombre: 'Retroalimentación constructiva', descripcion: 'Da retroalimentación constructiva' },
    { id: 'coherencia', nombre: 'Coherencia', descripcion: 'Mantiene coherencia entre discurso y acción' }
]

// C) Jefes Directos → Gerente de Área (Liderazgo estratégico y humano)
export const COMPETENCIAS_JEFE_DIRECTO = [
    { id: 'inspira_confianza', nombre: 'Inspira confianza', descripcion: 'Inspira confianza' },
    { id: 'vision_clara', nombre: 'Visión clara', descripcion: 'Comunica visión clara' },
    { id: 'escucha_inferiores', nombre: 'Escucha niveles inferiores', descripcion: 'Escucha niveles inferiores' },
    { id: 'maneja_presion', nombre: 'Maneja presión', descripcion: 'Maneja presión organizacional' },
    { id: 'cultura_respeto', nombre: 'Cultura de respeto', descripcion: 'Promueve cultura de respeto' },
    { id: 'decisiones_equilibradas', nombre: 'Decisiones equilibradas', descripcion: 'Toma decisiones equilibradas' },
    { id: 'apoya_lideres', nombre: 'Apoya a sus líderes', descripcion: 'Apoya a sus líderes' },
    { id: 'actua_coherencia', nombre: 'Actúa con coherencia', descripcion: 'Actúa con coherencia' }
]

// Función helper para obtener competencias según nivel evaluador
export const getCompetenciasByNivel = (nivelEvaluador) => {
    switch (nivelEvaluador) {
        case 'operativo':
            return COMPETENCIAS_OPERATIVO
        case 'mando_medio':
            return COMPETENCIAS_MANDO_MEDIO
        case 'jefe_directo':
            return COMPETENCIAS_JEFE_DIRECTO
        default:
            return COMPETENCIAS_OPERATIVO
    }
}

// Preguntas abiertas por nivel
export const PREGUNTA_ABIERTA = {
    operativo: '¿Qué debería mejorar este mando medio para apoyar mejor al equipo?',
    mando_medio: '¿Qué debería cambiar para mejorar su liderazgo?',
    jefe_directo: '¿Qué acciones del gerente impactan más positiva o negativamente al área?'
}

// COMPETENCIAS genéricas (para retrocompatibilidad)
export const COMPETENCIAS = COMPETENCIAS_OPERATIVO

// Niveles organizacionales
export const NIVELES = [
    { id: 'operativo', nombre: 'Personal Operativo', evalua: 'mando_medio' },
    { id: 'mando_medio', nombre: 'Mando Medio', evalua: 'jefe_directo' },
    { id: 'jefe_directo', nombre: 'Jefe Directo', evalua: 'gerente' },
    { id: 'gerente', nombre: 'Gerente de Área', evalua: null }
]

// Escala de respuestas
export const ESCALA = [
    { valor: 1, etiqueta: 'Nunca', color: 'var(--danger)' },
    { valor: 2, etiqueta: 'Rara vez', color: 'var(--warning)' },
    { valor: 3, etiqueta: 'A veces', color: 'var(--warning)' },
    { valor: 4, etiqueta: 'Casi siempre', color: 'var(--success)' },
    { valor: 5, etiqueta: 'Siempre', color: 'var(--success)' }
]
