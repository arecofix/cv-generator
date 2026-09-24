const fs = require('fs');
let data = JSON.parse(fs.readFileSync('n8n_workflow_cv.json', 'utf8'));

data.nodes.forEach(node => {
  if (node.name === 'Ensamblaje HTML') {
    let jsCode = node.parameters.jsCode;
    
    // We want to replace the whole try...catch block
    const startIndex = jsCode.indexOf('try {');
    const catchEndIndex = jsCode.indexOf('    };\n}', startIndex);
    
    if (startIndex !== -1 && catchEndIndex !== -1) {
        const before = jsCode.substring(0, startIndex);
        const after = jsCode.substring(catchEndIndex + 7);
        
        const newParseLogic = `try {
    let rawText = '';
    if (nodeData.candidates && nodeData.candidates[0].content && nodeData.candidates[0].content.parts) {
        rawText = nodeData.candidates[0].content.parts[0].text;
    } else if (nodeData.result && nodeData.result.response) {
        rawText = nodeData.result.response;
    } else if (nodeData.choices && nodeData.choices[0] && nodeData.choices[0].message) {
        rawText = nodeData.choices[0].message.content;
    } else if (nodeData.response) {
        rawText = nodeData.response;
    } else {
        rawText = JSON.stringify(nodeData);
    }
    
    cvData = extractCvData(rawText);
    if (!cvData.experiencias) throw new Error('No se encontraron experiencias en el JSON');
} catch (error) {
    console.error('Error parseando JSON de IA:', error);
    cvData = {
        titulo_adaptado: 'Software Developer',
        resumen_perfil: 'Profesional IT.',
        experiencias: [],
        educacion: [],
        skills_agrupadas: ''
    };
}`;
        
        node.parameters.jsCode = before + newParseLogic + after;
    }
  }
});

fs.writeFileSync('n8n_workflow_cv.json', JSON.stringify(data, null, 2));
