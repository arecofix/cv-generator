export class StorageService {
    static getStorageKey(email) {
        return email ? `cv_master_profile_${email}` : 'cv_master_profile';
    }

    static loadProfile(email) {
        const key = this.getStorageKey(email);
        const saved = localStorage.getItem(key);
        if (!saved) return { experiences: [], educations: [] };
        try {
            return JSON.parse(saved);
        } catch (e) {
            return { experiences: [], educations: [] };
        }
    }

    static saveProfile(email, profileData) {
        const key = this.getStorageKey(email);
        localStorage.setItem(key, JSON.stringify(profileData));
    }
}
