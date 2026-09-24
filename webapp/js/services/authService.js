import { CONFIG } from '../config.js';
import { StorageService } from './storageService.js';

export class AuthService {
    constructor(onAuthChange) {
        this.currentUserEmail = null;
        this.onAuthChange = onAuthChange;
    }

    init() {
        if (window.google && window.google.accounts) {
            google.accounts.id.initialize({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                callback: this.handleCredentialResponse.bind(this)
            });
        } else {
            console.warn("Google Accounts script not loaded");
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
        if (window.google && window.google.accounts) {
            google.accounts.id.prompt();
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
