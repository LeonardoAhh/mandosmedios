import { readFileSync, writeFileSync } from 'fs'
import admin from 'firebase-admin'

// Leer las credenciales de servicio
const serviceAccount = JSON.parse(
    readFileSync('./firebase-admin-key.json', 'utf-8')
)

// Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()
const auth = admin.auth()

// Función para generar contraseña aleatoria
function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

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
        const credentialsList = []

        for (let i = 0; i < uniqueEmployees.length; i++) {
            const emp = uniqueEmployees[i]
            const password = generatePassword()

            try {
                // Crear usuario en Firebase Auth usando Admin SDK
                const userRecord = await auth.createUser({
                    email: emp.email,
                    password: password,
                    displayName: emp.name
                })

                // Crear documento en Firestore
                const userData = {
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    credentials: {
                        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
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

                await db.collection('users').doc(userRecord.uid).set(userData)

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
                await new Promise(resolve => setTimeout(resolve, 200))

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

loadEmployees()
