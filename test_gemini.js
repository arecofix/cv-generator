

async function test() {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=AQ.Ab8RN6JALdg3PN6-t0hlwP2IytcDCE0eaajnL2QpNDTim7RpbA', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Eres un Analista de Adquisición de Talento Técnico. Analiza la siguiente descripción de puesto (Job Description) y extrae la información en un formato JSON estricto.\nEstructura requerida:\n{\n\"titulo_puesto_exacto\": \"...\",\n\"tecnologias_requeridas\": [\"...\"],\n\"soft_skills\": [\"...\"],\n\"palabras_clave_principales\": [\"...\", \"...\", \"...\"]\n}\n\nJob Description: Buscamos un Desarrollador Fullstack con experiencia en React, Node.js y Supabase."
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}

test();
