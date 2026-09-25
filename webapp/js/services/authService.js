import { CONFIG } from '../config.js';

export class AuthService {
    constructor(onAuthChange) {
        this.supabase = null;
        this.currentUser = null;
        this.onAuthChange = onAuthChange;
    }

    async init() {
        if (!window.supabase) {
            console.error("Supabase script not loaded");
            return;
        }

        // Resilient storage adapter to bypass Tracking Prevention blocks (Brave/Edge)
        let storageAdapter;
        try {
            window.localStorage.setItem('__storage_test__', '1');
            window.localStorage.removeItem('__storage_test__');
            storageAdapter = window.localStorage;
        } catch (e) {
            console.warn("LocalStorage bloqueado por el navegador (Tracking Prevention). Usando almacenamiento en memoria.");
            const memoryMap = {};
            storageAdapter = {
                getItem: (key) => memoryMap[key] || null,
                setItem: (key, value) => { memoryMap[key] = value; },
                removeItem: (key) => { delete memoryMap[key]; }
            };
        }

        this.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY, {
            auth: {
                storage: storageAdapter,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        
        // Listen to auth changes (login, logout)
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                this.currentUser = session.user;
                this._notifyAuthChange(true);
            } else {
                this.currentUser = null;
                this._notifyAuthChange(false);
            }
        });

        // Initial session check
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            this._notifyAuthChange(true);
        } else {
            this._notifyAuthChange(false);
        }
    }

    _notifyAuthChange(isAuthenticated) {
        if (!this.onAuthChange) return;
        
        if (isAuthenticated && this.currentUser) {
            const meta = this.currentUser.user_metadata || {};
            this.onAuthChange({
                isAuthenticated: true,
                email: this.currentUser.email,
                name: meta.full_name || meta.name || '',
                picture: meta.avatar_url || meta.picture || ''
            });
        } else {
            this.onAuthChange({ isAuthenticated: false });
        }
    }

    async signInWithGoogle() {
        if (!this.supabase) return;
        // This will redirect to Supabase which handles Google OAuth without local origin mismatch
        const { error } = await this.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href // return back here
            }
        });
        if (error) {
            alert('Error al conectar con Google: ' + error.message);
        }
    }

    async signInWithPassword(email, password) {
        if (!this.supabase) return;
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error) {
            alert('Error al iniciar sesión: ' + (error.message === 'Invalid login credentials' ? 'Credenciales inválidas' : error.message));
        } else {
            alert('Sesión iniciada con éxito');
        }
    }

    async signUp(email, password, fullName) {
        if (!this.supabase) return;
        const { data, error } = await this.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        
        if (error) {
            alert('Error al registrarse: ' + error.message);
        } else {
            // Check if email confirmation is needed
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                 alert('Este email ya está registrado. Intenta iniciar sesión.');
            } else if (data.session === null) {
                 alert('Registro exitoso. Por favor revisa tu correo para confirmar la cuenta (si está configurado), o intenta iniciar sesión.');
            } else {
                 alert('Registro exitoso. ¡Bienvenido!');
            }
        }
    }

    async signOut() {
        if (!this.supabase) return;
        await this.supabase.auth.signOut();
    }

    getCurrentUserEmail() {
        return this.currentUser ? this.currentUser.email : null;
    }
}
