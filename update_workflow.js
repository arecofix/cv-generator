const fs = require('fs');

const data = JSON.parse(fs.readFileSync('n8n_workflow_cv.json', 'utf8'));

const ensamblajeNode = data.nodes.find(n => n.name === 'Ensamblaje HTML');
if(ensamblajeNode) { 
    ensamblajeNode.parameters.jsCode = ensamblajeNode.parameters.jsCode.replace(
        '<a href="https://{{github_url}}">{{github_url}}</a> - {{ciudad}} - <a href="mailto:{{email}}">{{email}}</a> - <a href="{{portfolio_url}}">{{portfolio_url}}</a>', 
        '{{contacto_html}}'
    );
    
    if(!ensamblajeNode.parameters.jsCode.includes('let contactLinks = [];')) {
        ensamblajeNode.parameters.jsCode = ensamblajeNode.parameters.jsCode.replace(
            '// ===================== ARMADO DE HTML =====================',
            `let contactLinks = [];
if (persona.github_url) contactLinks.push(\`<a href="\${persona.github_url.startsWith('http') ? persona.github_url : 'https://' + persona.github_url}">\${persona.github_url.replace('https://', '')}</a>\`);
if (persona.ciudad) contactLinks.push(persona.ciudad);
if (persona.email) contactLinks.push(\`<a href="mailto:\${persona.email}">\${persona.email}</a>\`);
if (persona.portfolio_url && persona.portfolio_url !== persona.github_url) contactLinks.push(\`<a href="\${persona.portfolio_url.startsWith('http') ? persona.portfolio_url : 'https://' + persona.portfolio_url}">\${persona.portfolio_url.replace('https://', '')}</a>\`);

let contactHtml = contactLinks.join(' - ');
template = template.replace('{{contacto_html}}', contactHtml);

// ===================== ARMADO DE HTML =====================`
        );
    }
}

const unificarNode = data.nodes.find(n => n.name === 'Unificar CV');
if(unificarNode) {
    unificarNode.parameters.jsCode = unificarNode.parameters.jsCode.replace(
        'REGLA 1 (LONGITUD EXTREMA): El CV final será impreso en UNA (1) sola carilla A4. Por lo tanto, los bullets de las experiencias deben ser MÁXIMO 1 o 2 líneas. Si te pasas, arruinarás el diseño.', 
        'REGLA 1 (LONGITUD EXACTA): El CV final DEBE ocupar lo máximo posible dentro de UNA (1) sola carilla A4. No lo hagas corto. Extiende y detalla los logros en los bullets de las experiencias (3 a 5 bullets extensos) para demostrar valor, pero asegúrate de no generar más de 1 página.'
    );
    unificarNode.parameters.jsCode = unificarNode.parameters.jsCode.replace(
        'REGLA 3 (MANTENER EXPERIENCIAS Y EDUCACIÓN): Incluye TODAS las (\' + finalExperiencias.length + \') experiencias y TODAS las (\' + educacion.length + \') educaciones pasadas en el JSON. No descartes la Tecnicatura ni nada, simplemente haz sus detalles muy cortos.', 
        'REGLA 3 (MANTENER EXPERIENCIAS Y EDUCACIÓN): Incluye TODAS las (\' + finalExperiencias.length + \') experiencias y TODAS las (\' + educacion.length + \') educaciones pasadas en el JSON. Usa el espacio disponible para darles buen nivel de detalle.'
    );
}

fs.writeFileSync('n8n_workflow_cv.json', JSON.stringify(data, null, 2));
console.log('n8n_workflow_cv.json updated successfully');
