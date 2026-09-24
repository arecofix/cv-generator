const fs = require('fs');
let data = JSON.parse(fs.readFileSync('n8n_workflow_cv.json', 'utf8'));

data.nodes.forEach(node => {
  if (node.name === 'Unificar CV') {
    let jsCode = node.parameters.jsCode;
    
    // Replace the date extraction logic to force years
    const replaceStr = `
  if (userProfile.experiences && userProfile.experiences.length > 0) {
    finalExperiencias = userProfile.experiences.map((exp, i) => {
      const startYear = exp.start ? exp.start.toString().substring(0,4) : '';
      const endYear = (!exp.end || exp.end === 'null' || exp.end === '') ? 'Actualidad' : exp.end.toString().substring(0,4);
      return { id: 'u-exp'+i, empresa: exp.company, puesto: exp.role, fechas: startYear + ' - ' + endYear, descripcion: exp.description };
    });
  }
  if (userProfile.educations && userProfile.educations.length > 0) {
    finalEducacion = userProfile.educations.map((edu, i) => {
      const startYear = edu.start ? edu.start.toString().substring(0,4) : '';
      const endYear = (!edu.end || edu.end === 'null' || edu.end === '') ? 'Actualidad' : edu.end.toString().substring(0,4);
      return { id: 'u-edu'+i, titulo: edu.degree, institucion: edu.institution, fechas: startYear + ' - ' + endYear };
    });
  }
`;

    // Also need to handle Supabase dates!
    jsCode = jsCode.replace(/const uniqueExperiencia = .*/, `const uniqueExperiencia = [...new Map(experiencia.map(item => {
      const s = item.fecha_inicio ? item.fecha_inicio.substring(0,4) : '';
      const e = (!item.fecha_fin || item.fecha_fin === 'null') ? 'Actualidad' : item.fecha_fin.substring(0,4);
      item.fechas_procesadas = s + ' - ' + e;
      return [item.id, item];
    })).values()];`);
    
    jsCode = jsCode.replace(/let finalExperiencias = uniqueExperiencia;/, `let finalExperiencias = uniqueExperiencia.map(e => ({ empresa: e.empresa, puesto: e.puesto_base, fechas: e.fechas_procesadas, bullets: e.bullet_points }));`);
    
    jsCode = jsCode.replace(/if \(userProfile\.experiences && userProfile\.experiences\.length > 0\) \{[\s\S]*?\}/, replaceStr.trim());
    
    node.parameters.jsCode = jsCode;
  }
  
  if (node.name === 'Ensamblaje HTML') {
    let jsCode = node.parameters.jsCode;
    
    // Make the CSS better and bigger to fill the page
    const newCss = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        @page { size: A4; margin: 1cm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Montserrat', sans-serif; font-size: 10.5pt; line-height: 1.5; color: #111; background-color: #fff; }
        
        /* Flex container for header with lines */
        .header-container { display: flex; align-items: center; text-align: center; margin-bottom: 12px; }
        .header-container::before, .header-container::after { content: ''; flex: 1; border-bottom: 2px solid #000; }
        .header-container::before { margin-right: 15px; }
        .header-container::after { margin-left: 15px; }
        
        h1 { font-size: 18pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; }
        
        .profile-desc { text-align: center; font-size: 10.5pt; font-style: italic; margin-bottom: 15px; padding: 0 10px; }
        
        .section-title { display: flex; align-items: center; text-align: center; margin-top: 15px; margin-bottom: 15px; }
        .section-title::before, .section-title::after { content: ''; flex: 1; border-bottom: 2px solid #000; }
        .section-title::before { margin-right: 15px; }
        .section-title::after { margin-left: 15px; }
        .section-title h2 { font-size: 14pt; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
        
        .contact-info { text-align: center; font-size: 10pt; font-weight: 600; margin-bottom: 10px; }
        .contact-info a { color: #0056b3; text-decoration: none; }
        
        .experience-item { margin-bottom: 12px; }
        .experience-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .experience-header .company { font-weight: 700; font-size: 11pt; }
        .experience-header .dates { font-size: 10.5pt; }
        .experience-subheader { font-weight: 600; margin-bottom: 6px; }
        
        ul { list-style-type: disc; padding-left: 20px; }
        li { margin-bottom: 4px; line-height: 1.5; }
        
        .education-item { margin-bottom: 10px; }
        .education-header { display: flex; justify-content: space-between; align-items: baseline; }
        .education-header .inst { font-weight: 600; }
        .education-header .dates { font-size: 10.5pt; }
        .education-subheader { font-weight: 700; margin-bottom: 4px; }
        .education-details { padding-left: 20px; font-size: 10pt; }
        
        .skills-section p { text-align: center; font-size: 10.5pt; line-height: 1.8; }
        .skills-section strong { font-weight: 700; }
    </style>`;
    
    jsCode = jsCode.replace(/<style>[\s\S]*?<\/style>/, newCss);
    
    // Also update the HTML structure to match the new CSS
    const newHtmlBody = `<body>
    <div class="header-container">
        <h1>{{nombre_completo}}</h1>
    </div>
    <div class="profile-desc">
        {{resumen_perfil}}
    </div>
    
    <div class="section-title"><h2>CONTACTO</h2></div>
    <div class="contact-info">
        <a href="https://{{github_url}}">{{github_url}}</a> - {{ciudad}} - <a href="mailto:{{email}}">{{email}}</a> - <a href="{{portfolio_url}}">{{portfolio_url}}</a>
    </div>
    
    <div class="section-title"><h2>EXPERIENCIA PROFESIONAL</h2></div>
    {{experiencias_html}}
    
    <div class="section-title"><h2>EDUCACIÓN</h2></div>
    {{educacion_html}}
    
    <div class="section-title"><h2>HABILIDADES Y TÉCNICAS</h2></div>
    <div class="skills-section">
        <p>{{skills_html}}</p>
    </div>
</body>`;

    jsCode = jsCode.replace(/<body>[\s\S]*?<\/body>/, newHtmlBody);
    
    // Ensure github_url is handled
    jsCode = jsCode.replace('const persona = {', 'const persona = {\n  github_url: userProfile.github || \'github.com/arecofix\',');
    jsCode = jsCode.replace('template = template.replace(/{{linkedin_url}}/g, persona.linkedin_url);', 'template = template.replace(/{{linkedin_url}}/g, persona.linkedin_url);\ntemplate = template.replace(/{{github_url}}/g, persona.github_url);');
    
    // Format experiences better
    const newExpHtml = `
    cvData.experiencias.forEach(exp => {
        const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
        const bulletsHtml = bullets.map(b => \`<li>\${b}</li>\`).join('');
        expHtml += \`<div class="experience-item">
            <div class="experience-header">
                <span class="company">\${exp.empresa || ''}</span>
                <span class="dates">\${exp.fechas || ''}</span>
            </div>
            <div class="experience-subheader">\${exp.puesto || ''}</div>
            <ul>\${bulletsHtml}</ul>
        </div>\`;
    });
`;
    jsCode = jsCode.replace(/cvData\.experiencias\.forEach\(exp => \{[\s\S]*?\}\);/, newExpHtml.trim());
    
    // Format education better
    const newEduHtml = `
    cvData.educacion.forEach(edu => {
        eduHtml += \`<div class="education-item">
            <div class="education-header">
                <span class="inst">\${edu.institucion_y_anio ? edu.institucion_y_anio.split('|')[0] : ''}</span>
                <span class="dates">\${edu.institucion_y_anio ? edu.institucion_y_anio.split('|')[1] : ''}</span>
            </div>
            <div class="education-subheader">\${edu.titulo || ''}</div>
            <div class="education-details">\${edu.detalles || ''}</div>
        </div>\`;
    });
`;
    jsCode = jsCode.replace(/cvData\.educacion\.forEach\(edu => \{[\s\S]*?\}\);/, newEduHtml.trim());
    
    // Make skills bold for categories
    jsCode = jsCode.replace('cvData.skills_agrupadas || \'\'', '(cvData.skills_agrupadas || \'\').replace(/(Frontend:|Backend:|DevOps:|Idiomas:|Languages:|Databases:)/g, \'<strong>$1</strong>\')');
    
    node.parameters.jsCode = jsCode;
  }
});

fs.writeFileSync('n8n_workflow_cv.json', JSON.stringify(data, null, 2));
