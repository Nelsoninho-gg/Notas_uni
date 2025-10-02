// Servicio para manejar materias y notas en Firestore
import { db, getCurrentUser } from './AuthService.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    doc, 
    updateDoc, 
    deleteDoc,
    getDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class SubjectsService {
    constructor() {
        this.currentUser = null;
    }

    // Inicializar el servicio
    init() {
        this.currentUser = getCurrentUser();
    }

    // Obtener referencia de la colección de materias del usuario
    getUserSubjectsCollection() {
        if (!this.currentUser) {
            throw new Error('Usuario no autenticado');
        }
        return collection(db, `users/${this.currentUser.uid}/subjects`);
    }

    // Obtener referencia de la colección de notas de una materia
    getSubjectNotesCollection(subjectId) {
        if (!this.currentUser) {
            throw new Error('Usuario no autenticado');
        }
        return collection(db, `users/${this.currentUser.uid}/subjects/${subjectId}/notes`);
    }

    // Crear nueva materia
    async createSubject(name) {
        try {
            const subjectsRef = this.getUserSubjectsCollection();
            const docRef = await addDoc(subjectsRef, {
                name: name.trim(),
                createdAt: serverTimestamp(),
                notesCount: 0,
                averageGrade: 0
            });
            
            console.log('Materia creada con ID:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error al crear materia:', error);
            return { success: false, error: 'Error al guardar la materia' };
        }
    }

    // Obtener todas las materias del usuario
    async getSubjects() {
        try {
            const subjectsRef = this.getUserSubjectsCollection();
            const q = query(subjectsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            const subjects = [];
            querySnapshot.forEach((doc) => {
                subjects.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                });
            });
            
            return { success: true, subjects };
        } catch (error) {
            console.error('Error al obtener materias:', error);
            return { success: false, error: 'Error al cargar las materias' };
        }
    }

    // Verificar si existe una materia con el mismo nombre
    async subjectExists(name) {
        try {
            const subjectsRef = this.getUserSubjectsCollection();
            const q = query(subjectsRef, where('name', '==', name.trim()));
            const querySnapshot = await getDocs(q);
            
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error al verificar materia:', error);
            return false;
        }
    }

    // Eliminar materia
    async deleteSubject(subjectId) {
        try {
            const subjectRef = doc(db, `users/${this.currentUser.uid}/subjects`, subjectId);
            await deleteDoc(subjectRef);
            
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar materia:', error);
            return { success: false, error: 'Error al eliminar la materia' };
        }
    }

    // Crear nueva nota en una materia
    async createNote(subjectId, note, percentage) {
        try {
            const notesRef = this.getSubjectNotesCollection(subjectId);
            const docRef = await addDoc(notesRef, {
                note: parseFloat(note),
                percentage: parseFloat(percentage),
                createdAt: serverTimestamp()
            });

            // Actualizar el contador de notas y promedio
            await this.updateSubjectStats(subjectId);
            
            console.log('Nota creada con ID:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error al crear nota:', error);
            return { success: false, error: 'Error al guardar la nota' };
        }
    }

    // Obtener todas las notas de una materia
    async getNotes(subjectId) {
        try {
            const notesRef = this.getSubjectNotesCollection(subjectId);
            const q = query(notesRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            const notes = [];
            querySnapshot.forEach((doc) => {
                notes.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                });
            });
            
            return { success: true, notes };
        } catch (error) {
            console.error('Error al obtener notas:', error);
            return { success: false, error: 'Error al cargar las notas' };
        }
    }

    // Actualizar estadísticas de la materia (contador de notas y promedio)
    async updateSubjectStats(subjectId) {
        try {
            const notesResult = await this.getNotes(subjectId);
            if (!notesResult.success) return;

            const notes = notesResult.notes;
            const notesCount = notes.length;
            
            // Calcular promedio ponderado
            let totalWeightedScore = 0;
            let totalPercentage = 0;
            
            notes.forEach(note => {
                totalWeightedScore += note.note * (note.percentage / 100);
                totalPercentage += note.percentage;
            });
            
            const averageGrade = totalPercentage > 0 ? (totalWeightedScore / totalPercentage) * 100 : 0;
            
            // Actualizar documento de la materia
            const subjectRef = doc(db, `users/${this.currentUser.uid}/subjects`, subjectId);
            await updateDoc(subjectRef, {
                notesCount: notesCount,
                averageGrade: Math.round(averageGrade * 100) / 100 // Redondear a 2 decimales
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
            return { success: false, error: 'Error al actualizar estadísticas' };
        }
    }

    // Eliminar nota
    async deleteNote(subjectId, noteId) {
        try {
            const noteRef = doc(db, `users/${this.currentUser.uid}/subjects/${subjectId}/notes`, noteId);
            await deleteDoc(noteRef);
            
            // Actualizar estadísticas
            await this.updateSubjectStats(subjectId);
            
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar nota:', error);
            return { success: false, error: 'Error al eliminar la nota' };
        }
    }

    // Obtener información de una materia específica
    async getSubject(subjectId) {
        try {
            const subjectRef = doc(db, `users/${this.currentUser.uid}/subjects`, subjectId);
            const docSnap = await getDoc(subjectRef);
            
            if (docSnap.exists()) {
                return {
                    success: true,
                    subject: {
                        id: docSnap.id,
                        ...docSnap.data(),
                        createdAt: docSnap.data().createdAt?.toDate() || new Date()
                    }
                };
            } else {
                return { success: false, error: 'Materia no encontrada' };
            }
        } catch (error) {
            console.error('Error al obtener materia:', error);
            return { success: false, error: 'Error al cargar la materia' };
        }
    }

    // Validar nota y porcentaje
    validateNote(note, percentage) {
        const errors = [];
        
        if (!note || isNaN(note) || note < 1.0 || note > 7.0) {
            errors.push('La nota debe ser un número entre 1.0 y 7.0');
        }
        
        if (!percentage || isNaN(percentage) || percentage <= 0 || percentage > 100) {
            errors.push('El porcentaje debe ser un número entre 1 y 100');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Crear instancia singleton
export const subjectsService = new SubjectsService();