const fs = require('fs');
let data = JSON.parse(fs.readFileSync('n8n_workflow_cv.json', 'utf8'));
const n = data.nodes.find(x => x.name === 'Ensamblaje HTML');
if(n) {
    let js = n.parameters.jsCode;
    
    // Add CSS properties for dates and company to prevent clipping/squishing
    js = js.replace(/\.dates \{([^}]+)\}/g, '.dates { $1 white-space: nowrap; flex-shrink: 0; text-align: right; }');
    js = js.replace(/\.experience-header \.company \{([^}]+)\}/g, '.experience-header .company { $1 flex: 1; margin-right: 15px; }');
    js = js.replace(/\.education-header \.inst \{([^}]+)\}/g, '.education-header .inst { $1 flex: 1; margin-right: 15px; }');
    
    // Fix github duplication logic
    const contactLogic = `const gitClean = (persona.github_url || '').replace(/^https?:\\/\\//, '').replace(/\\/$/, '').toLowerCase();
const portClean = (persona.portfolio_url || '').replace(/^https?:\\/\\//, '').replace(/\\/$/, '').toLowerCase();

let contactLinks = [];
if (gitClean) contactLinks.push(\`<a href="https://\${gitClean}">\${gitClean}</a>\`);
if (persona.ciudad) contactLinks.push(persona.ciudad);
if (persona.email) contactLinks.push(\`<a href="mailto:\${persona.email}">\${persona.email}</a>\`);
if (portClean && portClean !== gitClean && portClean !== 'github.com/arecofix') contactLinks.push(\`<a href="https://\${portClean}">\${portClean}</a>\`);

let contactHtml = contactLinks.join`;

    js = js.replace(/(const persona = \{[\s\S]*?\};)[\s\S]*?let contactHtml = contactLinks\.join/m, `$1\n\n${contactLogic}`);
    
    // Fix dates truncation regex (remove the regex that filters characters)
    js = js.replace(/\(exp\.fechas \|\| ''\)\.replace\([^)]+\)\.substring\(0,25\)/g, "(exp.fechas || '').substring(0,40)");
    
    n.parameters.jsCode = js;
}
fs.writeFileSync('n8n_workflow_cv.json', JSON.stringify(data, null, 2));
console.log('Fixed github and dates');
