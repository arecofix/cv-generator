const fs = require('fs');

const path = 'n8n_workflow_cv.json';
let data = fs.readFileSync(path, 'utf8');
let json = JSON.parse(data);

const ensamblajeNode = json.nodes.find(n => n.name === 'Ensamblaje HTML');
if (ensamblajeNode) {
    let jsCode = ensamblajeNode.parameters.jsCode;
    
    // Reduce margins and font sizes to force 1 page
    jsCode = jsCode.replace('margin: 1cm;', 'margin: 0.6cm;');
    jsCode = jsCode.replace('font-size: 9.5pt;', 'font-size: 8.5pt;');
    jsCode = jsCode.replace('font-size: 18pt;', 'font-size: 16pt;');
    jsCode = jsCode.replace('font-size: 14pt;', 'font-size: 11pt;');
    jsCode = jsCode.replace('font-size: 10.5pt;', 'font-size: 9pt;');
    jsCode = jsCode.replace('font-size: 11pt;', 'font-size: 9.5pt;');
    jsCode = jsCode.replace('font-size: 10pt;', 'font-size: 8.5pt;');
    
    // Reduce padding and margins
    jsCode = jsCode.replace('margin-bottom: 12px;', 'margin-bottom: 6px;');
    jsCode = jsCode.replace('margin-bottom: 10px;', 'margin-bottom: 5px;');
    jsCode = jsCode.replace('margin-top: 15px;', 'margin-top: 8px;');
    jsCode = jsCode.replace('margin-bottom: 15px;', 'margin-bottom: 8px;');
    jsCode = jsCode.replace('margin-bottom: 8px;', 'margin-bottom: 4px;');
    jsCode = jsCode.replace('margin-bottom: 4px;', 'margin-bottom: 2px;');
    jsCode = jsCode.replace('margin-bottom: 6px;', 'margin-bottom: 3px;');
    jsCode = jsCode.replace('line-height: 1.5;', 'line-height: 1.35;');
    jsCode = jsCode.replace('line-height: 1.8;', 'line-height: 1.4;');

    ensamblajeNode.parameters.jsCode = jsCode;
}

const gotenbergNode = json.nodes.find(n => n.name === 'Gotenberg PDF');
if (gotenbergNode) {
    // Add Gotenberg parameters to minimize margins if CSS is ignored
    if (!gotenbergNode.parameters.bodyParameters) gotenbergNode.parameters.bodyParameters = { parameters: [] };
    
    const params = gotenbergNode.parameters.bodyParameters.parameters;
    
    const addParam = (name, value) => {
        if (!params.find(p => p.name === name)) {
            params.push({ name, value, parameterType: 'formStringData' });
        }
    };
    
    addParam('marginTop', '0.2');
    addParam('marginBottom', '0.2');
    addParam('marginLeft', '0.2');
    addParam('marginRight', '0.2');
}

fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log('n8n_workflow_cv.json updated for ultra-compact 1-page layout');
