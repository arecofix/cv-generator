const fs = require('fs');
let data = JSON.parse(fs.readFileSync('n8n_workflow_cv.json', 'utf8'));

data.nodes.forEach(node => {
  if (node.name === 'Unificar CV') {
    let jsCode = node.parameters.jsCode;
    
    // Replace the entire JS code in Unificar CV to properly merge webhookBody.profile and use a better prompt
    const newJsCode = `// ============ DATOS DE SUPABASE (FALLBACK) ============\n` +
      `const experiencia = $('Supabase Experiencia').all().map(i => i.json).filter(i => i && i.id);\n` +
      `const educacion_raw = $('Supabase Educacion').all().map(i => i.json).filter(i => i && i.id);\n\n` +
      
      `let finalExperiencias = [...new Map(experiencia.map(item => {\n` +
      `  const s = item.fecha_inicio ? item.fecha_inicio.substring(0,4) : '';\n` +
      `  const e = (!item.fecha_fin || item.fecha_fin === 'null') ? 'Actualidad' : item.fecha_fin.substring(0,4);\n` +
      `  return { id: item.id, empresa: item.empresa, puesto: item.puesto_base, fechas: s + ' - ' + e, bullets: item.bullet_points || [] };\n` +
      `})).values()];\n\n` +

      `const uniqueEducacionRaw = [...new Map(educacion_raw.map(item => [item.id, item])).values()];\n` +
      `let educacion = uniqueEducacionRaw.filter(e => e.tipo === 'educacion').map(e => {\n` +
      `  const s = e.detalles && e.detalles.fecha_inicio ? e.detalles.fecha_inicio.substring(0,4) : '';\n` +
      `  const f = e.detalles && e.detalles.fecha_fin ? e.detalles.fecha_fin.substring(0,4) : (e.detalles && e.detalles.fechas ? e.detalles.fechas : 'Actualidad');\n` +
      `  return { titulo: e.titulo, institucion_y_anio: e.institucion + ' | ' + (s ? s + '-' + f : f), detalles: e.detalles?.proyectos || '' };\n` +
      `});\n` +
      `const skillsRaw = uniqueEducacionRaw.filter(e => e.tipo === 'skill');\n` +
      `const certRaw = uniqueEducacionRaw.filter(e => e.tipo === 'certificacion');\n\n` +
      
      `let skillsStr = skillsRaw.map(s => JSON.stringify(s.detalles)).join(' | ');\n` +
      `let certStr = certRaw.map(c => c.titulo).join(', ');\n\n` +

      `// ============ DATOS DEL FRONTEND (SOBREESCRIBEN SUPABASE) ============\n` +
      `const webhookBody = $('Webhook').first().json?.body || {};\n` +
      `const userProfile = webhookBody.profile || null;\n\n` +
      
      `if (userProfile) {\n` +
      `  if (userProfile.experiences && userProfile.experiences.length > 0) {\n` +
      `    finalExperiencias = userProfile.experiences.map((exp, i) => {\n` +
      `      const startYear = exp.start ? exp.start.toString().substring(0,4) : '';\n` +
      `      const endYear = (!exp.end || exp.end === 'null' || exp.end === '') ? 'Actualidad' : exp.end.toString().substring(0,4);\n` +
      `      return { empresa: exp.company, puesto: exp.role, fechas: startYear + ' - ' + endYear, bullets: [exp.description] };\n` +
      `    });\n` +
      `  }\n` +
      `  if (userProfile.educations && userProfile.educations.length > 0) {\n` +
      `    educacion = userProfile.educations.map((edu, i) => {\n` +
      `      const startYear = edu.start ? edu.start.toString().substring(0,4) : '';\n` +
      `      const endYear = (!edu.end || edu.end === 'null' || edu.end === '') ? 'Actualidad' : edu.end.toString().substring(0,4);\n` +
      `      return { titulo: edu.degree, institucion_y_anio: edu.institution + ' | ' + startYear + '-' + endYear, detalles: '' };\n` +
      `    });\n` +
      `  }\n` +
      `  if (userProfile.skills || userProfile.languages) {\n` +
      `    skillsStr = (userProfile.skills || '') + ' | Idiomas: ' + (userProfile.languages || '');\n` +
      `  }\n` +
      `}\n\n` +

      `// ============ MASTER CV FINAL ============\n` +
      `const master_cv = {\n` +
      `  experiencia_laboral: finalExperiencias,\n` +
      `  educacion: educacion,\n` +
      `  skills: skillsStr,\n` +
      `  certificaciones: certStr\n` +
      `};\n\n` +

      `const job_description = webhookBody.job_description || 'Desarrollador de Software';\n\n` +

      `// ============ PROMPT MEGA-ESTRICTO ============\n` +
      `const systemPrompt = 'Eres un experto en ATS. DEBES generar un objeto JSON. ESTÁ PROHIBIDO GENERAR MÁS DE UNA PÁGINA DE CONTENIDO.';\n\n` +

      `const userPrompt = [\n` +
      `  'Adapta mi perfil a la oferta laboral bajo pena de fallo si incumples alguna regla:',\n` +
      `  'REGLA 1 (LONGITUD EXTREMA): El CV final será impreso en UNA (1) sola carilla A4. Por lo tanto, los bullets de las experiencias deben ser MÁXIMO 1 o 2 líneas. Si te pasas, arruinarás el diseño.',\n` +
      `  'REGLA 2 (PALABRAS CLAVE): DEBES leer las tecnologías requeridas en la Oferta de Trabajo e incluirlas explícitamente en el "resumen_perfil" y en "skills_agrupadas" (ej: Rust, React, etc.) SÓLO si tienen relación con mi perfil.',\n` +
      `  'REGLA 3 (MANTENER EXPERIENCIAS Y EDUCACIÓN): Incluye TODAS las (' + finalExperiencias.length + ') experiencias y TODAS las (' + educacion.length + ') educaciones pasadas en el JSON. No descartes la Tecnicatura ni nada, simplemente haz sus detalles muy cortos.',\n` +
      `  'REGLA 4 (IDENTIDAD): Nombre: Ezequiel Enrico Areco. No cambies nombres de empresas ni fechas.',\n` +
      `  'FORMATO DE SALIDA (JSON PURO):',\n` +
      `  '{',\n` +
      `  '  "titulo_adaptado": "TÍTULO EXACTO DE LA OFERTA",',\n` +
      `  '  "resumen_perfil": "Resumen ultracorto (max 2 oraciones) usando las palabras clave principales de la oferta.",',\n` +
      `  '  "experiencias": [ { "empresa": "...", "fechas": "...", "puesto": "...", "bullets": ["bullet corto 1"] } ],',\n` +
      `  '  "educacion": [ { "titulo": "...", "institucion_y_anio": "...", "detalles": "..." } ],',\n` +
      `  '  "skills_agrupadas": "Skills estratégicas incluyendo las de la oferta laboral (Frontend:... Backend:...)"',\n` +
      `  '}',\n` +
      `  '=== OFERTA ===',\n` +
      `  job_description,\n` +
      `  '=== MASTER CV ===',\n` +
      `  JSON.stringify(master_cv)\n` +
      `].join('\\n');\n\n` +

      `const ai_payload = {\n` +
      `  messages: [\n` +
      `    { role: 'system', content: systemPrompt },\n` +
      `    { role: 'user', content: userPrompt }\n` +
      `  ],\n` +
      `  max_tokens: 3000,\n` +
      `  temperature: 0.1,\n` +
      `  response_format: { type: 'json_object' }\n` +
      `};\n\n` +

      `return { json: { master_cv, job_description, ai_payload } };`;

    node.parameters.jsCode = newJsCode;
  }
  
  if (node.name === 'Ensamblaje HTML') {
    let jsCode = node.parameters.jsCode;
    
    // Inject persona dynamically from webhookBody
    const personaLogic = `
const webhookBody = $('Webhook').first().json?.body || {};
const userProfile = webhookBody.profile || {};
const persona = {
  nombre_completo: userProfile.name || 'Ezequiel Enrico Areco',
  ciudad: userProfile.location || 'Marcos Paz, Buenos Aires, Argentina',
  email: userProfile.email || 'ezequielenrico15@gmail.com',
  telefono: userProfile.phone || '+54 11 1234-5678',
  linkedin_url: userProfile.linkedin || 'https://www.linkedin.com/in/ezequiel-areco',
  github_url: userProfile.github || 'github.com/arecofix',
  portfolio_url: userProfile.portfolio || 'https://portfolio.arecofix.com.ar'
};`;

    jsCode = jsCode.replace(/const persona = \{[\s\S]*?\};/, personaLogic.trim());
    
    // Make CSS smaller to definitely fit on one page
    jsCode = jsCode.replace(/margin: 1\.5cm;/, 'margin: 1cm;');
    jsCode = jsCode.replace(/font-size: 10\.5pt;/, 'font-size: 9.5pt;');
    jsCode = jsCode.replace(/margin-bottom: 15px;/, 'margin-bottom: 10px;');
    jsCode = jsCode.replace(/margin-bottom: 12px;/, 'margin-bottom: 8px;');
    jsCode = jsCode.replace(/font-size: 20pt;/, 'font-size: 17pt;');
    
    node.parameters.jsCode = jsCode;
  }
});

fs.writeFileSync('n8n_workflow_cv.json', JSON.stringify(data, null, 2));
