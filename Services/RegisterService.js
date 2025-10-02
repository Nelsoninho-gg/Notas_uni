// Servicio de UI para el formulario de Registro
import { registerUser } from './AuthService.js';

export class RegisterService {
    constructor() {
        this.emailInput = null;
        this.passwordInput = null;
        this.confirmPasswordInput = null;
        this.errorMessage = null;
        this.successMessage = null;
        this.passwordMatch = null;
        this.registerForm = null;
        this.registerBtn = null;
    }

    // Inicializar el servicio con los elementos del DOM
    init() {
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.passwordMatch = document.getElementById('passwordMatch');
        this.registerForm = document.getElementById('registerForm');
        this.registerBtn = document.getElementById('registerBtn');

        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Event listener para el formulario
        this.registerForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Event listeners para validación en tiempo real
        this.passwordInput.addEventListener('input', () => {
            this.validatePasswordMatch();
            this.hideMessages();
        });

        this.confirmPasswordInput.addEventListener('input', () => {
            this.validatePasswordMatch();
            this.hideMessages();
        });

        this.emailInput.addEventListener('input', () => this.hideMessages());
    }

    // Validar coincidencia de contraseñas
    validatePasswordMatch() {
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;

        if (confirmPassword.length > 0) {
            if (password === confirmPassword) {
                this.passwordMatch.style.display = 'block';
                this.passwordMatch.textContent = 'Las contraseñas coinciden';
                this.passwordMatch.className = 'password-match success';
                this.confirmPasswordInput.classList.remove('error');
                this.confirmPasswordInput.classList.add('success');
            } else {
                this.passwordMatch.style.display = 'block';
                this.passwordMatch.textContent = 'Las contraseñas no coinciden';
                this.passwordMatch.className = 'password-match error';
                this.confirmPasswordInput.classList.remove('success');
                this.confirmPasswordInput.classList.add('error');
            }
        } else {
            this.passwordMatch.style.display = 'none';
            this.confirmPasswordInput.classList.remove('error', 'success');
        }
    }

    // Validar contraseña
    isPasswordValid(password) {
        return password.length > 6;
    }

    // Ocultar mensajes
    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }

    // Mostrar mensaje de error
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
    }

    // Mostrar mensaje de éxito
    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
    }

    // Establecer estado de carga
    setLoading(loading) {
        this.registerBtn.disabled = loading;
        this.registerBtn.textContent = loading ? 'Creando cuenta...' : 'Crear Cuenta';
    }

    // Validar formulario
    validateForm(email, password, confirmPassword) {
        if (!email || !password || !confirmPassword) {
            this.showError('Por favor, completa todos los campos.');
            return false;
        }

        if (!this.isPasswordValid(password)) {
            this.showError('La contraseña debe tener más de 6 caracteres.');
            return false;
        }

        if (password !== confirmPassword) {
            this.showError('Las contraseñas no coinciden.');
            return false;
        }

        return true;
    }

    // Limpiar formulario
    clearForm() {
        this.registerForm.reset();
        this.confirmPasswordInput.classList.remove('error', 'success');
        this.passwordMatch.style.display = 'none';
    }

    // Manejar envío del formulario
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;

        // Validar formulario
        if (!this.validateForm(email, password, confirmPassword)) {
            return;
        }

        this.setLoading(true);
        this.hideMessages();

        try {
            // Registrar usuario en Firebase
            const result = await registerUser(email, password);

            if (result.success) {
                this.showSuccess('¡Cuenta creada exitosamente! Redirigiendo al login...');
                
                // Limpiar formulario
                this.clearForm();
                
                // Redireccionar al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Error inesperado. Por favor, intenta de nuevo.');
            console.error('Error en registro:', error);
        } finally {
            this.setLoading(false);
        }
    }
}

// Función para inicializar el servicio cuando se carga la página
export function initRegisterPage() {
    const registerService = new RegisterService();
    registerService.init();
    return registerService;
}