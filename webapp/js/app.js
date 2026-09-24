import { AuthService } from './services/authService.js';
import { StorageService } from './services/storageService.js';
import { CVService } from './services/cvService.js';
import { PdfParserService } from './services/pdfParserService.js';

let profileData = { experiences: [], educations: [] };
let authService;

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modal = document.getElementById('profileModal');
    const expList = document.getElementById('experienceList');
    const eduList = document.getElementById('educationList');
    const generatorForm = document.getElementById('generatorForm');

    // Init Auth
    authService = new AuthService(handleAuthChange);
    authService.init();

    // Event Listeners
    document.getElementById('openProfileBtn').onclick = () => { 
        loadProfileToForm(); 
        modal.classList.add('visible'); 
    };
    
    document.getElementById('closeProfileBtn').onclick = () => modal.classList.remove('visible');
    document.getElementById('cancelProfileBtn').onclick = () => modal.classList.remove('visible');
    
    // Auth listeners
    const googleBtn = document.getElementById('googleAuthBtn');
    if(googleBtn) googleBtn.onclick = () => authService.signInWithGoogle();
    
    const loginBtn = document.getElementById('loginBtn');
    if(loginBtn) loginBtn.onclick = () => {
        const email = document.getElementById('authEmail').value;
        const pass = document.getElementById('authPassword').value;
        if(email && pass) authService.signInWithPassword(email, pass);
        else alert('Por favor ingresa email y contraseña');
    };

    const registerBtn = document.getElementById('registerBtn');
    if(registerBtn) registerBtn.onclick = () => {
        const email = document.getElementById('authEmail').value;
        const pass = document.getElementById('authPassword').value;
        if(email && pass) authService.signUp(email, pass, email.split('@')[0]);
        else alert('Por favor ingresa email y contraseña');
    };
    
    document.getElementById('addExpBtn').onclick = () => addExperience();
    document.getElementById('addEduBtn').onclick = () => addEducation();
    
    document.getElementById('saveProfileBtn').onclick = () => saveProfile();
    
    document.getElementById('cvUpload').onchange = (e) => handlePDFUpload(e.target);

    generatorForm.addEventListener('submit', handleGenerateCV);

    // Initial load
    loadProfileToForm();

    // -- UI Functions --

    function handleAuthChange(state) {
        const authContainer = document.getElementById('authContainer');
        if (!authContainer) return;
        
        if (state.isAuthenticated) {
            authContainer.innerHTML = `
                <div style="background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${state.picture ? `<img src="${state.picture}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">` : ''}
                        <span>Conectado como <strong>${state.name || state.email}</strong></span>
                    </div>
                    <button type="button" id="signOutBtn" class="btn-secondary" style="border-color: #ef4444; color: #ef4444;">Cerrar Sesión</button>
                </div>
            `;
            setTimeout(() => {
                const soBtn = document.getElementById('signOutBtn');
                if (soBtn) soBtn.onclick = (e) => { e.stopPropagation(); authService.signOut(); };
            }, 0);

            // Auto-fill form
            const pName = document.getElementById('p_name');
            const pEmail = document.getElementById('p_email');
            if (pName && !pName.value && state.name) pName.value = state.name;
            if (pEmail && !pEmail.value && state.email) pEmail.value = state.email;
        } else {
            // Render manual login & google login form
            authContainer.innerHTML = `
                <div class="auth-box">
                    <input type="email" id="authEmail" placeholder="Tu Email">
                    <input type="password" id="authPassword" placeholder="Tu Contraseña">
                    <div style="display:flex; gap:10px; margin-top: 10px;">
                        <button type="button" class="btn-primary" id="loginBtn" style="flex:1">Iniciar Sesión</button>
                        <button type="button" class="btn-secondary" id="registerBtn" style="flex:1">Registrarse</button>
                    </div>
                    <hr style="border-color: var(--border); margin: 15px 0;">
                    <button type="button" class="btn-google" id="googleAuthBtn" style="width:100%; justify-content:center;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Continuar con Google
                    </button>
                </div>
            `;
            
            // Re-bind listeners for newly created elements
            document.getElementById('googleAuthBtn').onclick = () => authService.signInWithGoogle();
            document.getElementById('loginBtn').onclick = () => {
                const email = document.getElementById('authEmail').value;
                const pass = document.getElementById('authPassword').value;
                if(email && pass) authService.signInWithPassword(email, pass);
                else alert('Por favor ingresa email y contraseña');
            };
            document.getElementById('registerBtn').onclick = () => {
                const email = document.getElementById('authEmail').value;
                const pass = document.getElementById('authPassword').value;
                if(email && pass) authService.signUp(email, pass, email.split('@')[0]);
                else alert('Por favor ingresa email y contraseña');
            };
        }
        loadProfileToForm();
    }

    function addExperience(data = {}) {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <button type="button" class="remove-btn">&times;</button>
            <div class="flex-row">
                <div class="field"><label>Empresa</label><input type="text" class="exp-company" value="${data.company || ''}"></div>
                <div class="field"><label>Cargo</label><input type="text" class="exp-role" value="${data.role || ''}"></div>
            </div>
            <div class="flex-row">
                <div class="field"><label>Inicio</label><input type="text" class="exp-start" value="${data.start || ''}" placeholder="MM/YYYY"></div>
                <div class="field"><label>Fin</label><input type="text" class="exp-end" value="${data.end || ''}" placeholder="MM/YYYY o Actual"></div>
            </div>
            <div class="field">
                <label>Descripción y Logros</label>
                <textarea class="exp-desc">${data.description || ''}</textarea>
            </div>
        `;
        div.querySelector('.remove-btn').onclick = () => div.remove();
        expList.appendChild(div);
    }

    function addEducation(data = {}) {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <button type="button" class="remove-btn">&times;</button>
            <div class="flex-row">
                <div class="field"><label>Institución</label><input type="text" class="edu-inst" value="${data.institution || ''}"></div>
                <div class="field"><label>Carrera / Título</label><input type="text" class="edu-degree" value="${data.degree || ''}"></div>
            </div>
            <div class="flex-row">
                <div class="field"><label>Año Inicio</label><input type="text" class="edu-start" value="${data.start || ''}"></div>
                <div class="field"><label>Año Fin</label><input type="text" class="edu-end" value="${data.end || ''}"></div>
            </div>
        `;
        div.querySelector('.remove-btn').onclick = () => div.remove();
        eduList.appendChild(div);
    }

    function saveProfile() {
        profileData = {
            name: document.getElementById('p_name').value,
            email: document.getElementById('p_email').value,
            phone: document.getElementById('p_phone').value,
            location: document.getElementById('p_location').value,
            linkedin: document.getElementById('p_linkedin').value,
            portfolio: document.getElementById('p_portfolio').value,
            about: document.getElementById('p_about').value,
            skills: document.getElementById('p_skills').value,
            languages: document.getElementById('p_languages').value,
            experiences: [],
            educations: []
        };

        document.querySelectorAll('#experienceList .list-item').forEach(item => {
            profileData.experiences.push({
                company: item.querySelector('.exp-company').value,
                role: item.querySelector('.exp-role').value,
                start: item.querySelector('.exp-start').value,
                end: item.querySelector('.exp-end').value,
                description: item.querySelector('.exp-desc').value
            });
        });

        document.querySelectorAll('#educationList .list-item').forEach(item => {
            profileData.educations.push({
                institution: item.querySelector('.edu-inst').value,
                degree: item.querySelector('.edu-degree').value,
                start: item.querySelector('.edu-start').value,
                end: item.querySelector('.edu-end').value
            });
        });

        StorageService.saveProfile(authService.getCurrentUserEmail(), profileData);
        modal.classList.remove('visible');
        alert("Perfil guardado con éxito.");
    }

    function loadProfileToForm() {
        profileData = StorageService.loadProfile(authService.getCurrentUserEmail());
        
        document.getElementById('p_name').value = profileData.name || '';
        document.getElementById('p_email').value = profileData.email || '';
        document.getElementById('p_phone').value = profileData.phone || '';
        document.getElementById('p_location').value = profileData.location || '';
        document.getElementById('p_linkedin').value = profileData.linkedin || '';
        document.getElementById('p_portfolio').value = profileData.portfolio || '';
        document.getElementById('p_about').value = profileData.about || '';
        document.getElementById('p_skills').value = profileData.skills || '';
        document.getElementById('p_languages').value = profileData.languages || '';

        expList.innerHTML = '';
        (profileData.experiences || []).forEach(exp => addExperience(exp));
        
        eduList.innerHTML = '';
        (profileData.educations || []).forEach(edu => addEducation(edu));
    }

    async function handleGenerateCV(e) {
        e.preventDefault();
        
        const title = document.getElementById('jobTitle').value.trim();
        const desc = document.getElementById('jobDesc').value.trim();

        document.getElementById('generateBtn').disabled = true;
        document.getElementById('generateText').innerText = 'Generando...';
        document.getElementById('loadingState').classList.add('visible');
        document.getElementById('errorState').classList.remove('visible');
        document.getElementById('successState').classList.remove('visible');

        const currentProfile = StorageService.loadProfile(authService.getCurrentUserEmail());

        try {
            const data = await CVService.generateCV(title, desc, currentProfile);
            
            document.getElementById('loadingState').classList.remove('visible');
            document.getElementById('successState').classList.add('visible');
            document.getElementById('downloadBtn').href = data.url_pdf;
            document.getElementById('downloadBtn').download = data.file_name || 'CV_1_Pagina.pdf';
        } catch (err) {
            console.error(err);
            document.getElementById('loadingState').classList.remove('visible');
            document.getElementById('errorState').classList.add('visible');
        } finally {
            document.getElementById('generateBtn').disabled = false;
            document.getElementById('generateText').innerText = 'Generar CV Optimizado (1 Pág)';
        }
    }

    async function handlePDFUpload(input) {
        const file = input.files[0];
        if (!file) return;
        
        const btn = input.previousElementSibling;
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Analizando PDF...';
        btn.disabled = true;

        try {
            const fullText = await PdfParserService.extractText(file);
            const basicInfo = PdfParserService.extractBasicInfo(fullText);
            
            if (basicInfo.email) document.getElementById('p_email').value = basicInfo.email;
            if (basicInfo.phone) document.getElementById('p_phone').value = basicInfo.phone;
            if (basicInfo.linkedin) document.getElementById('p_linkedin').value = basicInfo.linkedin;
            if (!document.getElementById('p_name').value && basicInfo.name) {
                document.getElementById('p_name').value = basicInfo.name;
            }

            addExperience({
                company: "Extraído del CV",
                role: "Revisar",
                description: "Por favor revisa y corrige los datos extraídos del PDF. El parser automático mediante IA completa estará disponible pronto."
            });
            
            alert('Análisis preliminar completado. Por favor revisa y corrige los campos.');
        } catch (err) {
            console.error(err);
            alert('Error al leer el PDF. Asegúrate de que no esté encriptado.');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
            input.value = '';
        }
    }
});
