const fs = require('fs');
let html = fs.readFileSync('webapp/index.html', 'utf8');

// Replace Supabase script with Google GSI
html = html.replace(
    '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>',
    '<script src="https://accounts.google.com/gsi/client" async defer></script>'
);

// Replace auth logic
const authStart = html.indexOf('        // Supabase Initialization');
const authEnd = html.indexOf('        // DOM Elements');
if (authStart !== -1 && authEnd !== -1) {
    const newAuth = `
        // Google Auth Integration
        const GOOGLE_CLIENT_ID = '106654865765-im8ahudl24ck24tt6l4g7955i1mhp1kc.apps.googleusercontent.com';
        let currentUserEmail = null;

        function handleCredentialResponse(response) {
            try {
                const responsePayload = decodeJwtResponse(response.credential);
                currentUserEmail = responsePayload.email;
                
                const googleBtn = document.getElementById('googleAuthBtn');
                if (googleBtn) {
                    googleBtn.innerHTML = \`
                        <img src="\${responsePayload.picture || ''}" style="width:20px; height:20px; border-radius:50%; margin-right:5px; object-fit:cover;">
                        Conectado como \${responsePayload.given_name || currentUserEmail.split('@')[0]}
                        <button type="button" onclick="signOut(event)" style="background:none; border:none; margin-left:10px; color:#ef4444; font-size:0.8rem; cursor:pointer;">(Cerrar Sesión)</button>
                    \`;
                }

                const pName = document.getElementById('p_name');
                const pEmail = document.getElementById('p_email');
                if (pName && !pName.value && responsePayload.name) pName.value = responsePayload.name;
                if (pEmail && !pEmail.value && responsePayload.email) pEmail.value = responsePayload.email;

                loadProfileToForm();
            } catch (error) {
                console.error("Error parsing Google JWT", error);
            }
        }

        function decodeJwtResponse(token) {
            let base64Url = token.split('.')[1];
            let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        }

        function signInWithGoogle() {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse
            });
            google.accounts.id.prompt();
        }

        function signOut(e) {
            if (e) e.stopPropagation();
            currentUserEmail = null;
            google.accounts.id.disableAutoSelect();
            
            const googleBtn = document.getElementById('googleAuthBtn');
            if (googleBtn) {
                googleBtn.innerHTML = \`
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Autocompletar con Google
                \`;
            }
            loadProfileToForm();
        }

        window.onload = function() {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse
            });
        };

`;
    html = html.substring(0, authStart) + newAuth + html.substring(authEnd);
}

// Modify saveProfile and loadProfileToForm to use currentUserEmail
html = html.replace(
    "localStorage.setItem('cv_master_profile', JSON.stringify(profileData));",
    "const storageKey = currentUserEmail ? 'cv_master_profile_' + currentUserEmail : 'cv_master_profile';\n            localStorage.setItem(storageKey, JSON.stringify(profileData));"
);
html = html.replace(
    "const saved = localStorage.getItem('cv_master_profile');",
    "const storageKey = currentUserEmail ? 'cv_master_profile_' + currentUserEmail : 'cv_master_profile';\n            const saved = localStorage.getItem(storageKey);"
);

// Fix generation logic in generatorForm submission
html = html.replace(
    "document.getElementById('generatorForm').style.display = 'none';",
    "// document.getElementById('generatorForm').style.display = 'none';\n            document.getElementById('generateBtn').disabled = true;\n            document.getElementById('generateText').innerText = 'Generando...';"
);

// We have instances of \`document.getElementById('generatorForm').style.display = 'block';\`, need to remove them
html = html.replace(
    "document.getElementById('generatorForm').style.display = 'block';",
    ""
);

// Add finally block to reset button
html = html.replace(
    "document.getElementById('errorState').classList.add('visible');\n            }",
    "document.getElementById('errorState').classList.add('visible');\n            } finally {\n                document.getElementById('generateBtn').disabled = false;\n                document.getElementById('generateText').innerText = 'Generar CV Optimizado (1 Pág)';\n            }"
);

// Fix dataToSend reading to use currentUserEmail
html = html.replace(
    "const saved = localStorage.getItem('cv_master_profile');\n            const dataToSend = saved ? JSON.parse(saved) : profileData;",
    "const storageKey = currentUserEmail ? 'cv_master_profile_' + currentUserEmail : 'cv_master_profile';\n            const saved = localStorage.getItem(storageKey);\n            const dataToSend = saved ? JSON.parse(saved) : profileData;"
);

fs.writeFileSync('webapp/index.html', html, 'utf8');
console.log('webapp/index.html updated successfully');
