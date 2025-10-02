// Servicio para la página de notas de una materia
import { logoutUser, getCurrentUser, onAuthStateChanged } from './AuthService.js';
import { subjectsService } from './SubjectsService.js';

export class SubjectNotesService {
    constructor() {
        this.currentSubject = null;
        this.notes = [];
        
        // Elementos del DOM
        this.userEmailSpan = null;
        this.logoutBtn = null;
        this.backBtn = null;
        this.subjectTitle = null;
        this.totalNotesSpan = null;
        this.averageGradeSpan = null;
        this.totalPercentageSpan = null;
        this.addNoteBtn = null;
        this.modalOverlay = null;
        this.addNoteForm = null;
        this.noteValueInput = null;
        this.notePercentageInput = null;
        this.cancelBtn = null;
        this.saveBtn = null;
        this.errorMessage = null;
        this.notesContainer = null;
        this.emptyState = null;
    }

    // Inicializar el servicio
    init() {
        this.initializeElements();
        this.loadCurrentSubject();
        this.setupAuthStateListener();
        this.setupEventListeners();
    }

    // Inicializar elementos del DOM
    initializeElements() {
        this.userEmailSpan = document.getElementById('userEmail');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.backBtn = document.getElementById('backBtn');
        this.subjectTitle = document.getElementById('subjectTitle');
        this.totalNotesSpan = document.getElementById('totalNotes');
        this.averageGradeSpan = document.getElementById('averageGrade');
        this.totalPercentageSpan = document.getElementById('totalPercentage');
        this.addNoteBtn = document.getElementById('addNoteBtn');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.addNoteForm = document.getElementById('addNoteForm');
        this.noteValueInput = document.getElementById('noteValue');
        this.notePercentageInput = document.getElementById('notePercentage');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.notesContainer = document.getElementById('notesContainer');
        this.emptyState = document.getElementById('emptyState');
    }

    // Cargar información de la materia actual
    loadCurrentSubject() {
        const subjectData = sessionStorage.getItem('currentSubject');
        if (!subjectData) {
            // No hay materia seleccionada, redirigir a página principal
            window.location.href = 'paginaPrincipal.html';
            return;
        }

        this.currentSubject = JSON.parse(subjectData);
        this.subjectTitle.textContent = this.currentSubject.name;
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botón volver
        this.backBtn.addEventListener('click', () => {
            window.location.href = 'paginaPrincipal.html';
        });

        // Botón logout
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Modal de agregar nota
        this.addNoteBtn.addEventListener('click', () => this.openModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.closeModal();
            }
        });
        
        // Formulario de nota
        this.addNoteForm.addEventListener('submit', (e) => this.handleAddNote(e));
        
        // Limpiar errores al escribir
        this.noteValueInput.addEventListener('input', () => this.hideError());
        this.notePercentageInput.addEventListener('input', () => this.hideError());
    }

    // Configurar listener para cambios en el estado de autenticación
    setupAuthStateListener() {
        onAuthStateChanged((user) => {
            if (user) {
                this.displayUserInfo(user);
                subjectsService.init();
                this.loadNotes();
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // Mostrar información del usuario
    displayUserInfo(user) {
        this.userEmailSpan.textContent = user.email;
    }

    // Abrir modal
    openModal() {
        this.modalOverlay.classList.add('active');
        this.noteValueInput.focus();
        this.hideError();
    }

    // Cerrar modal
    closeModal() {
        this.modalOverlay.classList.remove('active');
        this.addNoteForm.reset();
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

    // Establecer estado de carga para el botón de guardar
    setSaveLoading(loading) {
        this.saveBtn.disabled = loading;
        this.saveBtn.textContent = loading ? 'Guardando...' : 'Guardar';
    }

    // Establecer estado de carga para el botón de logout
    setLogoutLoading(loading) {
        this.logoutBtn.disabled = loading;
        this.logoutBtn.textContent = loading ? 'Cerrando sesión...' : 'Cerrar Sesión';
    }

    // Manejar agregar nota
    async handleAddNote(e) {
        e.preventDefault();
        
        const noteValue = parseFloat(this.noteValueInput.value);
        const percentage = parseFloat(this.notePercentageInput.value);
        
        // Validar datos
        const validation = subjectsService.validateNote(noteValue, percentage);
        if (!validation.isValid) {
            this.showError(validation.errors.join(' '));
            return;
        }

        // Verificar que el porcentaje total no exceda 100%
        const currentTotalPercentage = this.calculateTotalPercentage();
        if (currentTotalPercentage + percentage > 100) {
            this.showError(`El porcentaje total excedería 100%. Disponible: ${100 - currentTotalPercentage}%`);
            return;
        }

        this.setSaveLoading(true);
        this.hideError();

        try {
            const result = await subjectsService.createNote(this.currentSubject.id, noteValue, percentage);
            
            if (result.success) {
                this.closeModal();
                await this.loadNotes();
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Error inesperado al crear la nota.');
            console.error('Error al crear nota:', error);
        } finally {
            this.setSaveLoading(false);
        }
    }

    // Cargar notas de la materia
    async loadNotes() {
        try {
            const result = await subjectsService.getNotes(this.currentSubject.id);
            
            if (result.success) {
                this.notes = result.notes;
                this.renderNotes();
                this.updateStats();
            } else {
                console.error('Error al cargar notas:', result.error);
                this.notes = [];
                this.renderNotes();
                this.updateStats();
            }
        } catch (error) {
            console.error('Error inesperado al cargar notas:', error);
            this.notes = [];
            this.renderNotes();
            this.updateStats();
        }
    }

    // Eliminar nota
    async deleteNote(noteId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
            return;
        }

        try {
            const result = await subjectsService.deleteNote(this.currentSubject.id, noteId);
            
            if (result.success) {
                await this.loadNotes();
            } else {
                alert('Error al eliminar la nota: ' + result.error);
            }
        } catch (error) {
            alert('Error inesperado al eliminar la nota.');
            console.error('Error al eliminar nota:', error);
        }
    }

    // Renderizar lista de notas
    renderNotes() {
        this.notesContainer.innerHTML = '';

        if (this.notes.length === 0) {
            this.notesContainer.appendChild(this.emptyState);
        } else {
            this.notes.forEach(note => {
                const noteCard = this.createNoteCard(note);
                this.notesContainer.appendChild(noteCard);
            });
        }
    }

    // Crear tarjeta de nota
    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        
        // Determinar color del borde según la nota (sistema chileno 1.0-7.0)
        let borderColor = '#28a745'; // Verde por defecto para notas buenas
        if (note.note < 4.0) {
            borderColor = '#dc3545'; // Rojo para notas reprobadas (< 4.0)
        } else if (note.note < 5.5) {
            borderColor = '#ffc107'; // Amarillo para notas regulares (4.0-5.4)
        }
        
        card.style.borderLeftColor = borderColor;

        const createdDate = note.createdAt instanceof Date ? 
            note.createdAt.toLocaleDateString() : 
            new Date(note.createdAt).toLocaleDateString();

        card.innerHTML = `
            <div class="note-info">
                <div class="note-value">${note.note}</div>
                <div class="note-details">
                    <div class="note-percentage">${note.percentage}%</div>
                    <div class="note-date">${createdDate}</div>
                </div>
            </div>
            <div class="note-actions">
                <button class="btn-delete" onclick="subjectNotesService.deleteNote('${note.id}')">
                    🗑️
                </button>
            </div>
        `;

        return card;
    }

    // Actualizar estadísticas
    updateStats() {
        const totalNotes = this.notes.length;
        const totalPercentage = this.calculateTotalPercentage();
        const averageGrade = this.calculateWeightedAverage();

        this.totalNotesSpan.textContent = totalNotes;
        this.totalPercentageSpan.textContent = `${totalPercentage}%`;
        this.averageGradeSpan.textContent = averageGrade > 0 ? averageGrade.toFixed(2) : '0';
    }

    // Calcular porcentaje total
    calculateTotalPercentage() {
        return this.notes.reduce((total, note) => total + note.percentage, 0);
    }

    // Calcular promedio ponderado
    calculateWeightedAverage() {
        if (this.notes.length === 0) return 0;
        
        let totalWeightedScore = 0;
        let totalPercentage = 0;
        
        this.notes.forEach(note => {
            totalWeightedScore += note.note * (note.percentage / 100);
            totalPercentage += note.percentage;
        });
        
        return totalPercentage > 0 ? (totalWeightedScore / totalPercentage) * 100 : 0;
    }

    // Manejar cierre de sesión
    async handleLogout() {
        this.setLogoutLoading(true);
        
        try {
            const result = await logoutUser();
            
            if (result.success) {
                window.location.href = 'login.html';
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
}

// Variable global para acceso desde HTML
let subjectNotesService;

// Función para inicializar el servicio
export function initSubjectNotesPage() {
    subjectNotesService = new SubjectNotesService();
    subjectNotesService.init();
    
    // Hacer disponible globalmente para los botones de eliminar
    window.subjectNotesService = subjectNotesService;
    
    return subjectNotesService;
}