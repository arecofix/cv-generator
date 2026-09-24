const fs = require('fs');

const data = JSON.parse(fs.readFileSync('c:/Users/ezequ/Desktop/Utilidades/Trabajo/apps/cvyou/master_cv.json', 'utf8'));

// We must use localhost:8000 on the VPS via SSH to insert, or we can use the studio public URL.
// But earlier `Invoke-RestMethod` to studio.arecofix.com.ar gave a 404. Let's just do it directly on the VPS.
