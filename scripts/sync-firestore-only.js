import { readFileSync, writeFileSync } from 'fs'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAOUPXaG0x4ZiUkhh26671iFesHYQ6aWKA",
    authDomain: "encuestamds-6a0ef.firebaseapp.com",
    projectId: "encuestamds-6a0ef",
    storageBucket: "encuestamds-6a0ef.firebasestorage.app",
    messagingSenderId: "837318747078",
    appId: "1:837318747078:web:94b64a6089e24fe37748c7"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// NOTA: Este script requiere un usuario admin creado manualmente
// Email: admin@vinoplastic.local
// Password: (la que hayas configurado)

const ADMIN_EMAIL = 'admin@vinoplastic.local'
const ADMIN_PASSWORD = 'admin123' // CAMBIAR ESTO por la contraseña real

async function syncFirestoreOnly() {
    try {
        // Leer archivo JSON
        const jsonData = readFileSync('./empleados.json', 'utf-8')
        const employees = JSON.parse(jsonData)

        // Eliminar duplicados
        const uniqueEmployees = []
        const seenEmails = new Set()

        employees.forEach(emp => {
            if (!seenEmails.has(emp.email)) {
                seenEmails.add(emp.email)
                uniqueEmployees.push(emp)
            }
        })

        console.log(`📋 Total empleados únicos: ${uniqueEmployees.length}`)
        console.log('\n🔄 Sincronizando solo Firestore...\n')

        // Generar contraseñas aleatorias para todos
        const employeesWithPasswords = uniqueEmployees.map(emp => ({
            ...emp,
            password: Math.random().toString(36).slice(-8).toUpperCase()
        }))

        let successCount = 0
        let errorCount = 0
        const credentialsList = []

        for (const emp of employeesWithPasswords) {
            try {
                // Crear documento en Firestore directamente (sin crear en Auth)
                // Usamos el email como ID único
                const userId = emp.email.replace('@', '_').replace(/\./g, '_')

                const userData = {
                    createdAt: Timestamp.now(),
                    credentials: {
                        generatedAt: Timestamp.now(),
                        password: emp.password
                    },
                    departamento: emp.department,
                    email: emp.email,
                    employeeNumber: emp.emp,
                    nivel: 'operativo',
                    nombre: emp.name,
                    rol: 'operativo',
                    turnoActual: parseInt(emp.shift),
                    turnoFijo: parseInt(emp.shift),
                    pendingAuthCreation: true // Marca que necesita crearse en Auth
                }

                await setDoc(doc(db, 'users', userId), userData)

                credentialsList.push({
                    employeeNumber: emp.emp,
                    nombre: emp.name,
                    email: emp.email,
                    password: emp.password,
                    departamento: emp.department,
                    turno: emp.shift
                })

                successCount++
                console.log(`✅ [${successCount}/${uniqueEmployees.length}] ${emp.name} - Password: ${emp.password}`)

                await new Promise(resolve => setTimeout(resolve, 50))

            } catch (error) {
                errorCount++
                console.error(`❌ Error con ${emp.name}: ${error.message}`)
            }
        }

        // Generar CSV
        if (credentialsList.length > 0) {
            const csvHeader = 'Número Empleado,Nombre,Email,Contraseña,Departamento,Turno\n'
            const csvRows = credentialsList.map(cred =>
                `${cred.employeeNumber},${cred.nombre},${cred.email},${cred.password},${cred.departamento},${cred.turno}`
            ).join('\n')

            const csvContent = csvHeader + csvRows
            const csvFilename = `credenciales-empleados-${Date.now()}.csv`

            writeFileSync(csvFilename, csvContent, 'utf-8')
            console.log(`\n📄 Archivo de credenciales generado: ${csvFilename}`)
        }

        console.log('\n' + '='.repeat(60))
        console.log('📊 RESUMEN')
        console.log('='.repeat(60))
        console.log(`✅ Documentos creados en Firestore: ${successCount}`)
        console.log(`❌ Errores: ${errorCount}`)
        console.log('\n⚠️  NOTA: Los usuarios AÚN NECESITAN ser creados en Firebase Auth')
        console.log('   Puedes crear las cuentas de Auth manualmente o usar el Admin SDK')
        console.log('\n✨ Proceso completado!')
        process.exit(0)

    } catch (error) {
        console.error('💥 Error fatal:', error)
        process.exit(1)
    }
}

syncFirestoreOnly()
