const fs = require('fs');
let data = JSON.parse(fs.readFileSync('n8n_workflow_cv.json', 'utf8'));

const unificarCvCode = `const webhookBody = $('Webhook').first().json?.body || {};
const userProfile = webhookBody.profile || null;

const experiencia = $('Supabase Experiencia').all().map(i => i.json).filter(i => i && i.id);
const educacion_raw = $('Supabase Educacion').all().map(i => i.json).filter(i => i && i.id);
const uniqueExperiencia = [...new Map(experiencia.map(item => [item.id, item])).values()];
const uniqueEducacionRaw = [...new Map(educacion_raw.map(item => [item.id, item])).values()];
const educacion = uniqueEducacionRaw.filter(e => e.tipo === 'educacion');
const skills = uniqueEducacionRaw.filter(e => e.tipo === 'skill');

let finalExperiencias = uniqueExperiencia;
let finalEducacion = educacion;
let finalSkills = skills.map(s => s.detalles || {});

if (userProfile) {
  if (userProfile.experiences && userProfile.experiences.length > 0) {
    finalExperiencias = userProfile.experiences.map((exp, i) => ({ id: 'u-exp'+i, empresa: exp.company, puesto: exp.role, fechas: exp.start + ' - ' + exp.end, descripcion: exp.description }));
  }
  if (userProfile.educations && userProfile.educations.length > 0) {
    finalEducacion = userProfile.educations.map((edu, i) => ({ id: 'u-edu'+i, titulo: edu.degree, institucion: edu.institution, fechas: edu.start + ' - ' + edu.end }));
  }
  if (userProfile.skills || userProfile.languages) {
    finalSkills = userProfile.skills + ' | Idiomas: ' + userProfile.languages;
  }
}

const master_cv = { experiencia_laboral: finalExperiencias, educacion: finalEducacion, skills: finalSkills };
const job_description = webhookBody.job_description || 'Desarrollador';

const systemPrompt = 'Eres un experto en optimización de CVs para sistemas ATS. DEBES devolver ÚNICAMENTE un objeto JSON válido.';
const userPrompt = [
  'Adapta el Master CV a la Oferta de Trabajo con estas REGLAS ESTRICTAS:',
  'REGLA 1 - INCLUIR TODAS LAS EXPERIENCIAS: Usa las ' + finalExperiencias.length + ' experiencias.',
  'REGLA 2 - FECHAS CORTAS: Extrae SOLO EL AÑO de las fechas (Ej: "2020 - 2023"). NUNCA meses ni días.',
  'REGLA 3 - LONGITUD (1 PÁGINA): Usa máximo 1 o 2 bullets por experiencia. Muy breves.',
  'FORMATO DE SALIDA (JSON ESTRICTO):',
  '{ "titulo_adaptado": "...", "resumen_perfil": "...", "experiencias": [ { "empresa": "...", "fechas": "SÓLO AÑO", "puesto": "...", "bullets": ["..."] } ], "educacion": [ { "titulo": "...", "institucion_y_anio": "...", "detalles": "..." } ], "skills_agrupadas": "..." }',
  '=== OFERTA ===', job_description, '=== MASTER CV ===', JSON.stringify(master_cv)
].join('\\n');

const ai_payload = { messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ], max_tokens: 4096, temperature: 0.15, response_format: { type: 'json_object' } };

return { json: { master_cv, job_description, ai_payload } };`;

const ensamblajeCode = `let template = \`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CV - {{nombre_completo}} | {{titulo_adaptado}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        @page { size: A4; margin: 1cm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Montserrat', sans-serif; font-size: 9pt; line-height: 1.3; color: #111; background-color: #fff; }
        h1 { font-size: 16pt; text-align: center; font-weight: 700; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 1px; }
        .contact-info { text-align: center; font-size: 8.5pt; margin-bottom: 8px; color: #444; }
        .contact-info a { color: #0056b3; text-decoration: none; }
        h2 { font-size: 10.5pt; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 8px; margin-bottom: 5px; padding-bottom: 2px; color: #222; }
        .experience-item { margin-bottom: 6px; }
        .experience-header, .experience-subheader { display: flex; justify-content: space-between; align-items: baseline; }
        .experience-header { font-weight: 700; }
        .experience-subheader { font-style: italic; margin-bottom: 2px; font-weight: 600; color: #444; }
        ul { list-style-type: disc; padding-left: 15px; }
        li { margin-bottom: 2px; }
        .education-item { margin-bottom: 4px; }
        .education-header { display: flex; justify-content: space-between; align-items: baseline; font-weight: 700; }
        .education-subheader { font-style: italic; font-size: 8.5pt; color: #555; }
        .skills-section p { margin-bottom: 2px; line-height: 1.4; }
    </style>
</head>
<body>
    <h1>{{nombre_completo}}</h1>
    <div class="contact-info">
        {{ciudad}} | <a href="mailto:{{email}}">{{email}}</a> | <a href="{{linkedin_url}}">LinkedIn</a> | <a href="{{portfolio_url}}">Portfolio</a>
    </div>
    <h2>Perfil Profesional</h2>
    <p>{{resumen_perfil}}</p>
    <h2>Experiencia Profesional</h2>
    {{experiencias_html}}
    <h2>Educación y Certificaciones</h2>
    {{educacion_html}}
    <h2>Habilidades Técnicas</h2>
    <div class="skills-section">
        <p>{{skills_html}}</p>
    </div>
</body>
</html>\`;

function extractCvData(input) {
    if (input && typeof input === 'object' && !Array.isArray(input)) return input;
    if (typeof input === 'string') {
        let s = input.replace(/\\\`json/gi, '').replace(/\\\`/gi, '').trim();
        const fb = s.indexOf('{');
        const lb = s.lastIndexOf('}');
        if (fb !== -1 && lb !== -1 && lb > fb) s = s.substring(fb, lb + 1);
        return JSON.parse(s);
    }
    throw new Error('Tipo no soportado');
}

let cvData = null;
const nodeData = $input.first().json;

try {
    if (nodeData.result && nodeData.result.response) {
        cvData = extractCvData(nodeData.result.response);
    } else if (nodeData.choices && nodeData.choices[0] && nodeData.choices[0].message) {
        cvData = extractCvData(nodeData.choices[0].message.content);
    } else if (nodeData.response) {
        cvData = extractCvData(nodeData.response);
    } else {
        cvData = nodeData;
    }
    if (!cvData.experiencias) throw new Error('Fallback');
} catch (error) {
    cvData = {
        titulo_adaptado: 'Software Developer',
        resumen_perfil: 'Profesional IT.',
        experiencias: [],
        educacion: [],
        skills_agrupadas: ''
    };
}

const webhookBody = $('Webhook').first().json?.body || {};
const userProfile = webhookBody.profile || {};

const persona = {
  nombre_completo: userProfile.name || 'Ezequiel Enrico Areco',
  ciudad: userProfile.location || 'Marcos Paz, Buenos Aires, Argentina',
  email: userProfile.email || 'ezequielenrico15@gmail.com',
  telefono: userProfile.phone || '+54 11 1234-5678',
  linkedin_url: userProfile.linkedin || 'https://www.linkedin.com/in/ezequiel-areco',
  portfolio_url: userProfile.portfolio || 'https://portfolio.arecofix.com.ar'
};

let expHtml = '';
if (Array.isArray(cvData.experiencias)) {
    cvData.experiencias.forEach(exp => {
        const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
        const bulletsHtml = bullets.map(b => \`<li>\${b}</li>\`).join('');
        expHtml += \`<div class="experience-item"><div class="experience-header"><span>\${exp.empresa || ''}</span><span>\${exp.fechas || ''}</span></div><div class="experience-subheader"><span>\${exp.puesto || ''}</span></div><ul>\${bulletsHtml}</ul></div>\`;
    });
}

let eduHtml = '';
if (Array.isArray(cvData.educacion)) {
    cvData.educacion.forEach(edu => {
        eduHtml += \`<div class="education-item"><div class="education-header"><span>\${edu.titulo || ''}</span><span>\${edu.institucion_y_anio || ''}</span></div><div class="education-subheader">\${edu.detalles || ''}</div></div>\`;
    });
}

template = template.replace('{{titulo_adaptado}}', cvData.titulo_adaptado || '');
template = template.replace('{{resumen_perfil}}', cvData.resumen_perfil || '');
template = template.replace('{{experiencias_html}}', expHtml);
template = template.replace('{{educacion_html}}', eduHtml);
template = template.replace('{{skills_html}}', cvData.skills_agrupadas || '');

template = template.replace(/{{nombre_completo}}/g, persona.nombre_completo);
template = template.replace(/{{ciudad}}/g, persona.ciudad);
template = template.replace(/{{email}}/g, persona.email);
template = template.replace(/{{telefono}}/g, persona.telefono);
template = template.replace(/{{linkedin_url}}/g, persona.linkedin_url);
template = template.replace(/{{portfolio_url}}/g, persona.portfolio_url);

const buffer = Buffer.from(template, 'utf-8');
const tituloSlug = (cvData.titulo_adaptado || 'CV').replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

return {
  json: {
    html_final: template,
    file_name: \`Ezequiel_Enrico_\${tituloSlug}_CV.pdf\`
  },
  binary: {
    data: {
      data: buffer.toString('base64'),
      mimeType: 'text/html',
      fileName: 'index.html'
    }
  }
};`;

data.nodes.forEach(node => {
  if (node.name === 'Unificar CV') node.parameters.jsCode = unificarCvCode;
  if (node.name === 'Ensamblaje HTML') node.parameters.jsCode = ensamblajeCode;
});

fs.writeFileSync('n8n_workflow_cv.json', JSON.stringify(data, null, 2));
