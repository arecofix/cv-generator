const fs = require('fs');
let lines = fs.readFileSync('webapp/index.html', 'utf8').split(/\r?\n/);

// Line 659: const saved = localStorage.getItem('cv_master_profile');
lines[658] = "            const storageKey = currentUserEmail ? 'cv_master_profile_' + currentUserEmail : 'cv_master_profile';";
lines.splice(659, 0, "            const saved = localStorage.getItem(storageKey);");

// Now indices shift by 1.
// Original 688:             }
lines[688] = "            } finally {";
lines.splice(689, 0, "                document.getElementById('generateBtn').disabled = false;");
lines.splice(690, 0, "                document.getElementById('generateText').innerText = 'Generar CV Optimizado (1 Pág)';");
lines.splice(691, 0, "            }");

fs.writeFileSync('webapp/index.html', lines.join('\r\n'), 'utf8');
console.log('Fixed lines via script');
