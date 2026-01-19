import { readFileSync, writeFileSync } from 'fs'
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore'

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

// Función para generar contraseña aleatoria
function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

// Función principal
async function loadEmployees() {
    try {
        // Leer archivo JSON
        const jsonData = readFileSync('./empleados.json', 'utf-8')
        const employees = JSON.parse(jsonData)

        console.log(`📋 Total de registros en JSON: ${employees.length}`)

        // Eliminar duplicados por email (mantener el primero)
        const uniqueEmployees = []
        const seenEmails = new Set()

        employees.forEach(emp => {
            if (!seenEmails.has(emp.email)) {
                seenEmails.add(emp.email)
                uniqueEmployees.push(emp)
            }
        })

        console.log(`✅ Empleados únicos (sin duplicados): ${uniqueEmployees.length}`)
        console.log(`🗑️  Duplicados eliminados: ${employees.length - uniqueEmployees.length}`)
        console.log('\n🚀 Iniciando carga de empleados...\n')

        let successCount = 0
        let errorCount = 0
        const errors = []
        const credentialsList = [] // Array para guardar todas las credenciales

        for (let i = 0; i < uniqueEmployees.length; i++) {
            const emp = uniqueEmployees[i]
            const password = generatePassword()

            try {
                // Crear usuario en Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    emp.email,
                    password
                )
                const user = userCredential.user

                // Crear documento en Firestore con la estructura especificada
                const userData = {
                    createdAt: Timestamp.now(),
                    credentials: {
                        generatedAt: Timestamp.now(),
                        password: password
                    },
                    departamento: emp.department,
                    email: emp.email,
                    employeeNumber: emp.emp,
                    nivel: 'operativo',
                    nombre: emp.name,
                    rol: 'operativo',
                    turnoActual: parseInt(emp.shift),
                    turnoFijo: parseInt(emp.shift)
                }

                await setDoc(doc(db, 'users', user.uid), userData)

                // Guardar credenciales en el array
                credentialsList.push({
                    employeeNumber: emp.emp,
                    nombre: emp.name,
                    email: emp.email,
                    password: password,
                    departamento: emp.department,
                    turno: emp.shift
                })

                successCount++
                console.log(`✅ [${successCount}/${uniqueEmployees.length}] ${emp.name} (${emp.email}) - Password: ${password}`)

                // Pequeña pausa para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 100))

            } catch (error) {
                errorCount++
                const errorMsg = `❌ Error con ${emp.name} (${emp.email}): ${error.message}`
                console.error(errorMsg)
                errors.push({ employee: emp, error: error.message })
            }
        }

        console.log('\n' + '='.repeat(60))
        console.log('📊 RESUMEN DE CARGA')
        console.log('='.repeat(60))
        console.log(`✅ Usuarios creados exitosamente: ${successCount}`)
        console.log(`❌ Errores: ${errorCount}`)
        console.log(`📋 Total procesado: ${uniqueEmployees.length}`)

        if (errors.length > 0) {
            console.log('\n⚠️  ERRORES DETALLADOS:')
            errors.forEach((err, idx) => {
                console.log(`${idx + 1}. ${err.employee.name}: ${err.error}`)
            })
        }

        // Generar archivo CSV con todas las credenciales
        if (credentialsList.length > 0) {
            const csvHeader = 'Número Empleado,Nombre,Email,Contraseña,Departamento,Turno\n'
            const csvRows = credentialsList.map(cred =>
                `${cred.employeeNumber},${cred.nombre},${cred.email},${cred.password},${cred.departamento},${cred.turno}`
            ).join('\n')

            const csvContent = csvHeader + csvRows
            const csvFilename = `credenciales-empleados-${Date.now()}.csv`

            writeFileSync(csvFilename, csvContent, 'utf-8')
            console.log(`\n📄 Archivo de credenciales generado: ${csvFilename}`)
            console.log('   Este archivo contiene todas las contraseñas para distribución.')
        }

        console.log('\n✨ Proceso completado!')
        process.exit(0)

    } catch (error) {
        console.error('💥 Error fatal:', error)
        process.exit(1)
    }
}

// Ejecutar
loadEmployees()
