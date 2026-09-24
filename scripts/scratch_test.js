(async () => {
    try {
        const response = await fetch('https://n8n.arecofix.com.ar/webhook/cv-generator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                job_description: "Título: Senior full stack developer\nJD: ruby"
            })
        });
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Data:", data);
    } catch (e) {
        console.error("Error:", e);
    }
})();
