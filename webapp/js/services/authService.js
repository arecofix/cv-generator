import { CONFIG } from '../config.js';
import { StorageService } from './storageService.js';

export class AuthService {
    constructor(onAuthChange) {
        this.currentUserEmail = null;
        this.onAuthChange = onAuthChange;
    }

    init() {
        this.tryInitGoogle();
    }

    tryInitGoogle() {
        if (this._googleInitialized) return true;
        if (window.google && window.google.accounts) {
            google.accounts.id.initialize({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                callback: this.handleCredentialResponse.bind(this)
            });
            this._googleInitialized = true;
            return true;
        } else {
            console.warn("Google Accounts script not loaded yet");
            return false;
        }
    }

    handleCredentialResponse(response) {
        try {
            const payload = this.decodeJwtResponse(response.credential);
            this.currentUserEmail = payload.email;
            
            if (this.onAuthChange) {
                this.onAuthChange({
                    isAuthenticated: true,
                    email: payload.email,
                    name: payload.name,
                    given_name: payload.given_name,
                    picture: payload.picture
                });
            }
        } catch (error) {
            console.error("Error parsing Google JWT", error);
        }
    }

    decodeJwtResponse(token) {
        let base64Url = token.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    signIn() {
        if (this.tryInitGoogle()) {
            google.accounts.id.prompt();
        } else {
            console.error("Google accounts library not loaded yet.");
            alert("El servicio de Google aún se está cargando. Por favor, intenta de nuevo en unos segundos.");
        }
    }

    signOut() {
        this.currentUserEmail = null;
        if (window.google && window.google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        if (this.onAuthChange) {
            this.onAuthChange({ isAuthenticated: false });
        }
    }

    getCurrentUserEmail() {
        return this.currentUserEmail;
    }
}
