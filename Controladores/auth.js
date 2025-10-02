// Configuración de Firebase
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged as firebaseOnAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Funciones de autenticación

// Función para registrar un nuevo usuario
export async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Usuario registrado exitosamente:', user.email);
        return { success: true, user: user };
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// Función para iniciar sesión
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Usuario logueado exitosamente:', user.email);
        return { success: true, user: user };
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// Función para cerrar sesión
export async function logoutUser() {
    try {
        await signOut(auth);
        console.log('Usuario deslogueado exitosamente');
        return { success: true };
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// Función para obtener el usuario actual
export function getCurrentUser() {
    return auth.currentUser;
}

// Función para escuchar cambios en el estado de autenticación
export function onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, callback);
}

// Función para traducir códigos de error de Firebase
function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'Este correo electrónico ya está registrado.';
        case 'auth/invalid-email':
            return 'El correo electrónico no es válido.';
        case 'auth/operation-not-allowed':
            return 'La autenticación con correo/contraseña no está habilitada.';
        case 'auth/weak-password':
            return 'La contraseña es muy débil.';
        case 'auth/user-disabled':
            return 'Esta cuenta ha sido deshabilitada.';
        case 'auth/user-not-found':
            return 'No existe una cuenta con este correo electrónico.';
        case 'auth/wrong-password':
            return 'La contraseña es incorrecta.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos fallidos. Intenta más tarde.';
        case 'auth/network-request-failed':
            return 'Error de conexión. Verifica tu internet.';
        default:
            return 'Ha ocurrido un error inesperado.';
    }
}