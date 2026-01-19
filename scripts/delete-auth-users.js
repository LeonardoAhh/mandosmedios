import { readFileSync } from 'fs'
import admin from 'firebase-admin'

// Leer las credenciales de servicio
const serviceAccount = JSON.parse(
    readFileSync('./firebase-admin-key.json', 'utf-8')
)

// Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const KEEP_EMAIL = 'capacitacionqro@vinoplastic.com'

async function deleteAllAuthUsers() {
    try {
        console.log('🔥 Iniciando eliminación de usuarios en Firebase Authentication...\n')

        let deletedCount = 0
        let keptCount = 0
        let errors = 0
        let nextPageToken

        do {
            // Listar usuarios en lotes de 1000 (máximo permitido)
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken)

            console.log(`📋 Procesando ${listUsersResult.users.length} usuarios...\n`)

            for (const userRecord of listUsersResult.users) {
                // Verificar si es el usuario a mantener
                if (userRecord.email === KEEP_EMAIL) {
                    console.log(`✅ CONSERVANDO: ${userRecord.email} (UID: ${userRecord.uid})`)
                    keptCount++
                } else {
                    try {
                        await admin.auth().deleteUser(userRecord.uid)
                        console.log(`🗑️  Eliminado: ${userRecord.email || 'Sin email'} (UID: ${userRecord.uid})`)
                        deletedCount++

                        // Pequeña pausa para evitar rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100))
                    } catch (error) {
                        console.error(`❌ Error eliminando ${userRecord.email}: ${error.message}`)
                        errors++
                    }
                }
            }

            nextPageToken = listUsersResult.pageToken

        } while (nextPageToken)

        console.log('\n' + '='.repeat(60))
        console.log('📊 RESUMEN DE LIMPIEZA - FIREBASE AUTHENTICATION')
        console.log('='.repeat(60))
        console.log(`✅ Usuario conservado: ${keptCount}`)
        console.log(`🗑️  Usuarios eliminados: ${deletedCount}`)
        console.log(`❌ Errores: ${errors}`)
        console.log('\n✨ Proceso completado!')

        process.exit(0)

    } catch (error) {
        console.error('💥 Error fatal:', error)
        process.exit(1)
    }
}

deleteAllAuthUsers()
