// Servicio de UI para el formulario de Login
import { loginUser } from './AuthService.js';

export class LoginService {
    constructor() {
        this.emailInput = null;
        this.passwordInput = null;
        this.errorMessage = null;
        this.loginForm = null;
        this.loginBtn = null;
    }

    // Inicializar el servicio con los elementos del DOM
    init() {
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.errorMessage = document.getElementById('errorMessage');
        this.loginForm = document.getElementById('loginForm');
        this.loginBtn = document.getElementById('loginBtn');

        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Event listener para el formulario
        this.loginForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Event listeners para limpiar errores al escribir
        this.emailInput.addEventListener('input', () => this.hideError());
        this.passwordInput.addEventListener('input', () => this.hideError());
    }

    // Ocultar mensaje de error
    hideError() {
        this.errorMessage.style.display = 'none';
    }

    // Mostrar mensaje de error
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    // Establecer estado de carga
    setLoading(loading) {
        this.loginBtn.disabled = loading;
        this.loginBtn.textContent = loading ? 'Iniciando sesión...' : 'Iniciar Sesión';
    }

    // Validar formulario
    validateForm(email, password) {
        if (!email || !password) {
            this.showError('Por favor, completa todos los campos.');
            return false;
        }

        if (password.length < 6) {
            this.showError('La contraseña debe tener al menos 6 caracteres.');
            return false;
        }

        return true;
    }

    // Manejar envío del formulario
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        
        // Validar formulario
        if (!this.validateForm(email, password)) {
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            // Iniciar sesión con Firebase
            const result = await loginUser(email, password);

            if (result.success) {
                // Redireccionar a página principal
                window.location.href = 'paginaPrincipal.html';
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Error inesperado. Por favor, intenta de nuevo.');
            console.error('Error en login:', error);
        } finally {
            this.setLoading(false);
        }
    }
}

// Función para inicializar el servicio cuando se carga la página
export function initLoginPage() {
    const loginService = new LoginService();
    loginService.init();
    return loginService;
}