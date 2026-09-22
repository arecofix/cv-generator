const fs = require('fs');

// 1. Lee el archivo local
const data = JSON.parse(fs.readFileSync('/home/ubuntu/master_cv.json', 'utf8')).experiencia_laboral;

// 2. Envía los datos directamente al Webhook de tu n8n
fetch('https://n8n.arecofix.com.ar/webhook-test/cv-generator', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
        // Se eliminaron las contraseñas de Supabase porque n8n no las necesita
    },
    body: JSON.stringify({ experiencia_laboral: data })
})
    .then(res => res.text())
    .then(console.log)
    .catch(console.error);