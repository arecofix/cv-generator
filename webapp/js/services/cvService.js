import { CONFIG } from '../config.js';

export class CVService {
    static async generateCV(title, description, profileData) {
        const fullJD = `Título: ${title}\n\nJD:\n${description}\n\nREGLA ESTRICTA DE FORMATO: Todo el contenido del CV DEBE caber en UNA SOLA PÁGINA (1 hoja) de PDF. Sé extremadamente sintético y conciso, prioriza los logros más relevantes y recorta textos largos.`;
        
        const res = await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                job_description: fullJD,
                profile: profileData
            })
        });

        if (!res.ok) throw new Error('Error en el webhook');
        
        const data = await res.json();
        if (!data.url_pdf) throw new Error('No PDF URL in response');
        
        return data;
    }
}
