/**
 * Script para cargar las preguntas del archivo cuestions.json a Firebase
 * Carga las mismas preguntas para TODOS los niveles (operativo, mando_medio, jefe_directo)
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
    getFirestore,
    collection,
    getDocs,
    deleteDoc,
    addDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAOUPXaG0x4ZiUkhh26671iFesHYQ6aWKA",
    authDomain: "encuestamds-6a0ef.firebaseapp.com",
    projectId: "encuestamds-6a0ef",
    storageBucket: "encuestamds-6a0ef.firebasestorage.app",
    messagingSenderId: "837318747078",
    appId: "1:837318747078:web:94b64a6089e24fe37748c7"
};

// Credenciales de usuario RH
const EMAIL = "capacitacionqro@vinoplastic.com";
const PASSWORD = "cap2026*";

// Niveles a cargar
const NIVELES = ['operativo', 'mando_medio', 'jefe_directo'];

console.log('🔧 Conectando a Firebase...');
console.log('   Project ID:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function cargarPreguntas() {
    try {
        // Autenticación
        console.log('\n🔐 Autenticando...');
        const userCredential = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
        console.log(`   ✅ Autenticado como: ${userCredential.user.email}`);

        // 1. Leer el archivo cuestions.json
        const jsonPath = path.join(__dirname, '..', 'cuestions.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const preguntas = JSON.parse(rawData);

        console.log(`\n📄 Archivo leído: ${preguntas.length} preguntas encontradas`);
        console.log(`📋 Se cargarán para ${NIVELES.length} niveles: ${NIVELES.join(', ')}`);

        // 2. Eliminar TODAS las competencias existentes
        console.log('\n🗑️  Eliminando TODAS las competencias actuales...');

        const snapshot = await getDocs(collection(db, 'competencias'));
        console.log(`   Encontradas: ${snapshot.docs.length} competencias a eliminar`);

        for (const docSnap of snapshot.docs) {
            await deleteDoc(doc(db, 'competencias', docSnap.id));
        }
        console.log('   ✅ Competencias eliminadas');

        // 3. Cargar las nuevas preguntas para CADA nivel
        console.log('\n📤 Cargando nuevas preguntas para todos los niveles...');

        let totalCargadas = 0;

        for (const nivel of NIVELES) {
            console.log(`\n   📁 Nivel: ${nivel}`);
            let orden = 1;

            for (const pregunta of preguntas) {
                const nombreCorto = pregunta.Preguntas.length > 50
                    ? pregunta.Preguntas.substring(0, 47) + '...'
                    : pregunta.Preguntas;

                const competenciaData = {
                    nombre: nombreCorto,
                    descripcion: pregunta.Preguntas,
                    punto: pregunta.Punto,
                    nivel: nivel,
                    orden: orden,
                    createdAt: serverTimestamp()
                };

                await addDoc(collection(db, 'competencias'), competenciaData);
                orden++;
                totalCargadas++;
            }
            console.log(`      ✅ ${preguntas.length} preguntas cargadas`);
        }

        console.log(`\n🎉 ¡Listo! Se cargaron ${totalCargadas} preguntas en total`);
        console.log(`   (${preguntas.length} preguntas × ${NIVELES.length} niveles)`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

cargarPreguntas();
