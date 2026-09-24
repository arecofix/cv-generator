const fs = require('fs');

const path = 'n8n_workflow_cv.json';
let data = fs.readFileSync(path, 'utf8');
let json = JSON.parse(data);

const gotenbergNode = json.nodes.find(n => n.name === 'Gotenberg PDF');
if (gotenbergNode && gotenbergNode.parameters.bodyParameters) {
    let params = gotenbergNode.parameters.bodyParameters.parameters;
    // Filter out the margin parameters that broke Gotenberg
    params = params.filter(p => !['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].includes(p.name));
    gotenbergNode.parameters.bodyParameters.parameters = params;
}

fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log('n8n_workflow_cv.json reverted Gotenberg margins');
