const fs = require('fs');
let data = JSON.parse(fs.readFileSync('n8n_workflow_cv.json', 'utf8'));

const ensamblajeNode = data.nodes.find(n => n.name === 'Ensamblaje HTML');
if (ensamblajeNode) {
    let jsCode = ensamblajeNode.parameters.jsCode;
    jsCode = jsCode.replace("font-size: 8.5pt;", "font-size: 11pt;");
    jsCode = jsCode.replace("font-size: 16pt;", "font-size: 22pt;");
    jsCode = jsCode.replace("font-size: 9pt;", "font-size: 11.5pt;");
    jsCode = jsCode.replace("font-size: 9.5pt;", "font-size: 13pt;");
    jsCode = jsCode.replace("font-size: 11pt;", "font-size: 13pt;");
    jsCode = jsCode.replace(/font-size: 10\.5pt;/g, "font-size: 11.5pt;");
    jsCode = jsCode.replace("font-size: 10pt;", "font-size: 11pt;");
    jsCode = jsCode.replace("margin: 0.6cm;", "margin: 1.2cm;");
    
    // Line height adjustments to give it breathing room
    jsCode = jsCode.replace("line-height: 1.35;", "line-height: 1.5;");
    
    ensamblajeNode.parameters.jsCode = jsCode;
}

// Ensure Unificar CV prompt also tells it to not go crazy long if the font is bigger
const unificarNode = data.nodes.find(n => n.name === 'Unificar CV');
if (unificarNode) {
    unificarNode.parameters.jsCode = unificarNode.parameters.jsCode.replace(
        'REGLA 1 (LONGITUD EXACTA): El CV final DEBE ocupar lo máximo posible dentro de UNA (1) sola carilla A4. No lo hagas corto. Extiende y detalla los logros en los bullets de las experiencias (3 a 5 bullets extensos) para demostrar valor, pero asegúrate de no generar más de 1 página.', 
        'REGLA 1 (LONGITUD EXACTA): El CV final DEBE ocupar UNA (1) sola carilla A4, sin excederse. Como la fuente ahora es más grande para facilitar la lectura, usa 2 a 3 bullets sustanciales por experiencia para demostrar valor, pero sin pasarte de 1 página.'
    );
}

fs.writeFileSync('n8n_workflow_cv.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Font sizes and margins increased in n8n_workflow_cv.json');
