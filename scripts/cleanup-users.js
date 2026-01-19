import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

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
const db = getFirestore(app)

const KEEP_EMAIL = 'capacitacionqro@vinoplastic.com'

async function cleanupFirestore() {
    try {
        console.log('🧹 Limpiando colección "users" en Firestore...\n')

        // Obtener todos los documentos de la colección users
        const usersSnapshot = await getDocs(collection(db, 'users'))

        let deletedCount = 0
        let keptCount = 0
        let errors = 0

        console.log(`📋 Total de documentos encontrados: ${usersSnapshot.docs.length}\n`)

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data()

            // Verificar si es el usuario a mantener
            if (userData.email === KEEP_EMAIL) {
                console.log(`✅ CONSERVANDO: ${userData.email} (ID: ${userDoc.id})`)
                keptCount++
            } else {
                try {
                    await deleteDoc(doc(db, 'users', userDoc.id))
                    console.log(`🗑️  Eliminado: ${userData.email || 'Sin email'} (ID: ${userDoc.id})`)
                    deletedCount++

                    // Pequeña pausa para evitar rate limiting
                    await new Promise(resolve => setTimeout(resolve, 50))
                } catch (error) {
                    console.error(`❌ Error eliminando ${userData.email}: ${error.message}`)
                    errors++
                }
            }
        }

        console.log('\n' + '='.repeat(60))
        console.log('📊 RESUMEN DE LIMPIEZA - FIRESTORE')
        console.log('='.repeat(60))
        console.log(`✅ Usuario conservado: ${keptCount}`)
        console.log(`🗑️  Documentos eliminados: ${deletedCount}`)
        console.log(`❌ Errores: ${errors}`)

        console.log('\n' + '⚠'.repeat(60))
        console.log('⚠️  IMPORTANTE: Limpieza de Firebase Authentication')
        console.log('⚠'.repeat(60))
        console.log('\n🔥 Para limpiar Firebase Authentication:')
        console.log('\n1. Ve a: https://console.firebase.google.com/')
        console.log('2. Selecciona el proyecto: encuestamds-6a0ef')
        console.log('3. Ve a "Authentication" → "Users"')
        console.log('4. Selecciona todos los usuarios EXCEPTO: capacitacionqro@vinoplastic.com')
        console.log('5. Haz clic en "Delete users" (botón de 3 puntos)')
        console.log('\n✨ También puedes usar Firebase CLI para esto:')
        console.log('   firebase auth:delete --force --all-users\n')

        process.exit(0)

    } catch (error) {
        console.error('💥 Error fatal:', error)
        process.exit(1)
    }
}

cleanupFirestore()
