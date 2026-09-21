// Obtenemos el template HTML (suponiendo que lo leíste en un nodo anterior o está hardcodeado)
let template = $items("Read HTML Template")[0].json.data;

// Datos generados por la IA en el Nodo 4
const cvData = $input.item.json; 

// Reemplazo dinámico
template = template.replace('{{titulo_adaptado}}', cvData.titulo_adaptado);
template = template.replace('{{resumen_perfil}}', cvData.resumen_perfil);
template = template.replace('{{experiencias_html}}', cvData.experiencias_html);

// Devolvemos el HTML procesado como binario para Gotenberg
const buffer = Buffer.from(template, 'utf-8');

return {
  json: {
    html_final: template,
    file_name: `CV_Ezequiel_Areco_${cvData.titulo_adaptado.replace(/\s+/g, '_')}.html`
  },
  binary: {
    data: {
      data: buffer.toString('base64'),
      mimeType: 'text/html',
      fileName: 'index.html'
    }
  }
};
