document.addEventListener('DOMContentLoaded', () => {
    const cvForm = document.getElementById('cvForm');
    if (cvForm) {
        cvForm.addEventListener('submit', handleFormSubmit);
    }
});

async function handleFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    
    const btn = document.getElementById('submitBtn');
    const form = document.getElementById('cvForm');
    const loading = document.getElementById('loadingState');
    const result = document.getElementById('resultState');
    const errorDiv = document.getElementById('errorState');
    
    const jobTitleInput = document.getElementById('jobTitle');
    const jobDescriptionInput = document.getElementById('jobDescription');

    if (!jobTitleInput || !jobDescriptionInput) return;

    const jobTitle = jobTitleInput.value;
    const jobDescription = jobDescriptionInput.value;

    // Update UI
    if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    if (form) form.classList.add('hidden');
    if (result) result.classList.add('hidden');
    if (errorDiv) errorDiv.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');

    try {
        const webhookUrl = 'https://n8n.arecofix.com.ar/webhook/cv-generator';
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                job_description: `Título: ${jobTitle}\nJD: ${jobDescription}`
            })
        });

        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        
        const data = await response.json();
        
        if (data && data.url_pdf) {
            let pdfUrl = data.url_pdf;
            // Si la URL es un data URI (base64), convertirlo a Blob para evitar límites del navegador
            if (pdfUrl.startsWith('data:application/pdf;base64,')) {
                const res = await fetch(pdfUrl);
                const blob = await res.blob();
                pdfUrl = URL.createObjectURL(blob);
            }

            const downloadLink = document.getElementById('downloadLink');
            if (downloadLink) downloadLink.href = pdfUrl;
            
            if (loading) loading.classList.add('hidden');
            if (result) result.classList.remove('hidden');
        } else {
            throw new Error('El Webhook no devolvió la URL del PDF. Revisa n8n.');
        }
        
    } catch (error) {
        if (loading) loading.classList.add('hidden');
        if (errorDiv) errorDiv.classList.remove('hidden');
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) errorMsg.innerText = error.message;
        if (form) form.classList.remove('hidden');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

// For Jest testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { handleFormSubmit };
}
