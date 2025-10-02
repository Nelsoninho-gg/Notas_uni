// Servicio para la página principal
import { logoutUser, getCurrentUser, onAuthStateChanged } from './AuthService.js';
import { subjectsService } from './SubjectsService.js';

export class MainPageService {
    constructor() {
        this.userEmailSpan = null;
        this.logoutBtn = null;
        this.addSubjectBtn = null;
        this.modalOverlay = null;
        this.addSubjectForm = null;
        this.subjectNameInput = null;
        this.cancelBtn = null;
        this.saveBtn = null;
        this.errorMessage = null;
        this.subjectsContainer = null;
        this.emptyState = null;
        this.subjects = []; // Array para almacenar las materias
    }

    // Inicializar el servicio con los elementos del DOM
    init() {
        this.userEmailSpan = document.getElementById('userEmail');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.addSubjectBtn = document.getElementById('addSubjectBtn');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.addSubjectForm = document.getElementById('addSubjectForm');
        this.subjectNameInput = document.getElementById('subjectName');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.subjectsContainer = document.getElementById('subjectsContainer');
        this.emptyState = document.getElementById('emptyState');

        this.setupAuthStateListener();
        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Event listener para el botón de logout
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Event listeners para el modal
        this.addSubjectBtn.addEventListener('click', () => this.openModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.closeModal();
            }
        });
        
        // Event listener para el formulario
        this.addSubjectForm.addEventListener('submit', (e) => this.handleAddSubject(e));
        
        // Limpiar error al escribir
        this.subjectNameInput.addEventListener('input', () => this.hideError());
    }

    // Configurar listener para cambios en el estado de autenticación
    setupAuthStateListener() {
        // Verificar si el usuario está autenticado
        onAuthStateChanged((user) => {
            if (user) {
                // Usuario está logueado
                this.displayUserInfo(user);
                subjectsService.init(); // Inicializar servicio de materias
                this.loadSubjects(); // Cargar materias desde Firestore
            } else {
                // Usuario no está logueado, redirigir al login
                this.redirectToLogin();
            }
        });
    }

    // Mostrar información del usuario
    displayUserInfo(user) {
        this.userEmailSpan.textContent = user.email;
    }

    // Redirigir al login
    redirectToLogin() {
        window.location.href = 'login.html';
    }

    // Abrir modal
    openModal() {
        this.modalOverlay.classList.add('active');
        this.subjectNameInput.focus();
        this.hideError();
    }

    // Cerrar modal
    closeModal() {
        this.modalOverlay.classList.remove('active');
        this.addSubjectForm.reset();
        this.hideError();
    }

    // Mostrar error
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    // Ocultar error
    hideError() {
        this.errorMessage.style.display = 'none';
    }

    // Establecer estado de carga para el botón de logout
    setLogoutLoading(loading) {
        this.logoutBtn.disabled = loading;
        this.logoutBtn.textContent = loading ? 'Cerrando sesión...' : 'Cerrar Sesión';
    }

    // Establecer estado de carga para el botón de guardar
    setSaveLoading(loading) {
        this.saveBtn.disabled = loading;
        this.saveBtn.textContent = loading ? 'Guardando...' : 'Guardar';
    }

    // Validar nombre de materia
    async validateSubjectName(name) {
        if (!name || name.trim().length === 0) {
            this.showError('Por favor, ingresa un nombre para la materia.');
            return false;
        }

        if (name.trim().length < 2) {
            this.showError('El nombre debe tener al menos 2 caracteres.');
            return false;
        }

        // Verificar si ya existe una materia con ese nombre en Firestore
        const exists = await subjectsService.subjectExists(name);
        if (exists) {
            this.showError('Ya existe una materia con ese nombre.');
            return false;
        }

        return true;
    }

    // Manejar agregar materia
    async handleAddSubject(e) {
        e.preventDefault();
        
        const subjectName = this.subjectNameInput.value.trim();
        
        if (!(await this.validateSubjectName(subjectName))) {
            return;
        }

        this.setSaveLoading(true);
        this.hideError();

        try {
            // Crear materia en Firestore
            const result = await subjectsService.createSubject(subjectName);
            
            if (result.success) {
                this.closeModal();
                await this.loadSubjects(); // Recargar lista de materias
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Error inesperado al crear la materia.');
            console.error('Error al crear materia:', error);
        } finally {
            this.setSaveLoading(false);
        }
    }

    // Cargar materias desde Firestore
    async loadSubjects() {
        try {
            const result = await subjectsService.getSubjects();
            
            if (result.success) {
                this.subjects = result.subjects;
                this.renderSubjects();
            } else {
                console.error('Error al cargar materias:', result.error);
                this.subjects = [];
                this.renderSubjects();
            }
        } catch (error) {
            console.error('Error inesperado al cargar materias:', error);
            this.subjects = [];
            this.renderSubjects();
        }
    }

    // Renderizar lista de materias
    renderSubjects() {
        this.subjectsContainer.innerHTML = '';

        if (this.subjects.length === 0) {
            this.subjectsContainer.appendChild(this.emptyState);
        } else {
            this.subjects.forEach(subject => {
                const subjectCard = this.createSubjectCard(subject);
                this.subjectsContainer.appendChild(subjectCard);
            });
        }
    }

    // Crear tarjeta de materia
    createSubjectCard(subject) {
        const card = document.createElement('div');
        card.className = 'subject-card';
        
        const createdDate = subject.createdAt instanceof Date ? 
            subject.createdAt.toLocaleDateString() : 
            new Date(subject.createdAt).toLocaleDateString();
            
        const averageGrade = subject.averageGrade > 0 ? 
            `Promedio: ${subject.averageGrade}` : 
            'Sin promedio';

        card.innerHTML = `
            <div class="subject-name">${subject.name}</div>
            <div class="subject-info">
                Creada: ${createdDate}<br>
                Notas: ${subject.notesCount || 0}<br>
                ${averageGrade}
            </div>
        `;

        card.addEventListener('click', () => {
            // Navegar a la página de notas de la materia
            this.openSubjectNotes(subject);
        });

        return card;
    }

    // Abrir página de notas de una materia
    openSubjectNotes(subject) {
        // Guardar el ID de la materia en sessionStorage para la siguiente página
        sessionStorage.setItem('currentSubject', JSON.stringify({
            id: subject.id,
            name: subject.name
        }));
        
        // Redirigir a la página de notas (la crearemos después)
        window.location.href = 'subjectNotes.html';
    }

    // Manejar cierre de sesión
    async handleLogout() {
        this.setLogoutLoading(true);
        
        try {
            const result = await logoutUser();
            
            if (result.success) {
                // La redirección se manejará automáticamente por onAuthStateChanged
                this.redirectToLogin();
            } else {
                alert('Error al cerrar sesión: ' + result.error);
                this.setLogoutLoading(false);
            }
        } catch (error) {
            alert('Error inesperado al cerrar sesión.');
            console.error('Error en logout:', error);
            this.setLogoutLoading(false);
        }
    }

    // Verificar si hay un usuario autenticado (método auxiliar)
    getCurrentUser() {
        return getCurrentUser();
    }
}

// Función para inicializar el servicio cuando se carga la página
export function initMainPage() {
    const mainPageService = new MainPageService();
    mainPageService.init();
    return mainPageService;
}