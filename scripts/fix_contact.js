const fs = require('fs');
let data = JSON.parse(fs.readFileSync('n8n_workflow_cv.json', 'utf8'));
const n = data.nodes.find(x => x.name === 'Ensamblaje HTML');
if(n) {
    let js = n.parameters.jsCode;
    
    // Completely rewrite the persona and contact logic
    const newLogic = `const webhookBody = $('Webhook').first().json?.body || {};
const userProfile = webhookBody.profile || {};

// We only fallback name/email/city if completely empty, 
// but we leave social links empty if the user didn't provide them.
const persona = {
  nombre_completo: userProfile.name || 'Ezequiel Enrico Areco',
  ciudad: userProfile.location || '',
  email: userProfile.email || 'ezequielenrico15@gmail.com',
  telefono: userProfile.phone || '',
  linkedin_url: userProfile.linkedin || '',
  github_url: userProfile.github || '',
  portfolio_url: userProfile.portfolio || ''
};

const cleanUrl = (url) => (url || '').replace(/^https?:\\/\\//, '').replace(/\\/$/, '').toLowerCase();

let contactLinks = [];
if (persona.ciudad) contactLinks.push(persona.ciudad);
if (persona.telefono) contactLinks.push(persona.telefono);
if (persona.email) contactLinks.push(\`<a href="mailto:\${persona.email}">\${persona.email}</a>\`);

const ln = cleanUrl(persona.linkedin_url);
if (ln) contactLinks.push(\`<a href="https://\${ln}">\${ln}</a>\`);

const gh = cleanUrl(persona.github_url);
if (gh) contactLinks.push(\`<a href="https://\${gh}">\${gh}</a>\`);

const pf = cleanUrl(persona.portfolio_url);
if (pf && pf !== gh && pf !== ln) contactLinks.push(\`<a href="https://\${pf}">\${pf}</a>\`);

let contactHtml = contactLinks.join(' - ');`;

    // Replace everything from `const webhookBody = ...` up to `let contactHtml = ... join(' - ');`
    js = js.replace(/const webhookBody = \$\('Webhook'\)[\s\S]*?let contactHtml = contactLinks\.join\(' - '\);/m, newLogic);
    
    n.parameters.jsCode = js;
}
fs.writeFileSync('n8n_workflow_cv.json', JSON.stringify(data, null, 2));
console.log('Fixed contact links logic');
