// Configuración centralizada de Firebase
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase

export const firebaseConfig = {
  apiKey: "AIzaSyD32gqEQeklOxc0V40lnjFw2H7l8HN3Sd4",
  authDomain: "uninotas-a57ce.firebaseapp.com",
  projectId: "uninotas-a57ce",
  storageBucket: "uninotas-a57ce.firebasestorage.app",
  messagingSenderId: "655355443111",
  appId: "1:655355443111:web:9f3dac3fcd99fa0bdfe882",
  measurementId: "G-56EEYB5EGV"
};

// URLs de redirección (puedes modificar según tus necesidades)
export const routes = {
    login: '/Vistas/login.html',
    register: '/Vistas/register.html',
    mainPage: '/Vistas/paginaPrincipal.html',
    subjectNotes: '/Vistas/subjectNotes.html'
};

// Configuración de validación
export const validation = {
    minPasswordLength: 6,
    passwordErrorMessage: 'La contraseña debe tener más de 6 caracteres.',
    minNoteValue: 1.0,
    maxNoteValue: 7.0,
    noteErrorMessage: 'La nota debe ser un número entre 1.0 y 7.0'
};