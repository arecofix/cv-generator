# Configuración del Workflow en n8n (v2)

## Arquitectura General

```
Webhook → IA Analista RRHH → [Supabase Experiencia] → Unificar CV → IA Matchmaker → Ensamblaje HTML → Gotenberg → Final Response
                           → [Supabase Educacion]  ↗
```

---

## Nodo 1: Webhook (Trigger)
- **Method:** `POST`
- **Path:** `cv-generator`
- **Respond:** `lastNode`
- **Body esperado:**
  ```json
  {
    "job_description": "Título: Senior React Developer\nJD: Buscamos..."
  }
  ```

---

## Nodo 2: IA - Analista de RRHH (HTTP Request → Gemini)
- **Model:** `gemini-2.0-flash-lite`
- **System Prompt:** Analiza el JD y extrae un JSON con:
  - `titulo_puesto_exacto`
  - `tecnologias_requeridas`
  - `soft_skills`
  - `palabras_clave_principales`
- **Input:** `$json.body.job_description`

---

## Nodo 3a: Supabase Experiencia (HTTP Request)
- **URL:** `http://kong:8000/rest/v1/experiencia_laboral?select=*`
- **Headers:** `apikey` y `Authorization` con el anon key de Supabase
- Se ejecuta **en paralelo** con el Nodo 3b

## Nodo 3b: Supabase Educacion (HTTP Request)
- **URL:** `http://kong:8000/rest/v1/educacion_y_skills?select=*`
- **Headers:** ídem anterior
- Se ejecuta **en paralelo** con el Nodo 3a

---

## Nodo 4: Unificar CV (Code Node)
Consolida las salidas de los dos nodos Supabase en un solo objeto:
```js
return {
  json: {
    master_cv: {
      experiencia_laboral: $('Supabase Experiencia').all().map(i => i.json),
      educacion_y_skills: $('Supabase Educacion').all().map(i => i.json)
    }
  }
};
```

---

## Nodo 5: IA - Matchmaker (HTTP Request → Gemini)
El nodo más crítico. Recibe el JSON del Analista (Nodo 2) + el Master CV consolidado (Nodo 4).

### Reglas del System Prompt:

**REGLA 1 - CERO ALUCINACIÓN:**
Prohibido inventar empresas, cargos, fechas o títulos universitarios.

**REGLA 2 - SKILL SWAPPING por categoría:**
| Oferta pide | CV dice | Acción |
|---|---|---|
| React | Angular | Reescribir bullets con "React" |
| C# / .NET | Python/Django | Reemplazar en bullets y skills |
| SQL Server | PostgreSQL | Reemplazo directo |
| Azure | AWS | Reemplazo directo |

**REGLA 3 - Máximo 4 bullets por experiencia** (priorizar relevancia).

**REGLA 4 - Preservar identidad:** Nombres de empresa, fechas y títulos educativos son intocables.

### JSON de salida (5 claves obligatorias):
```json
{
  "titulo_adaptado": "...",
  "resumen_perfil": "...",
  "experiencias_html": "...",
  "educacion_html": "...",
  "skills_html": "..."
}
```

---

## Nodo 6: Ensamblaje HTML (Code Node)
Lee el template HTML interno e inyecta los valores:
1. Los **5 placeholders dinámicos** del JSON de la IA
2. Los **6 datos personales** fijos de `datos_personales` en `master_cv.json` (actualmente hardcodeados en el nodo, ver nota abajo)

> **NOTA FUTURA:** Para hacerlo más reutilizable, agregar un Nodo Supabase adicional que lea de la tabla `datos_personales` y pasar esos valores al Code Node.

---

## Nodo 7: Gotenberg PDF (HTTP Request)
- **URL:** `http://gotenberg:3000/forms/chromium/convert/html`
- **Method:** `POST`
- **Body:** `multipart/form-data`
- **Binary field:** `data` → mapeado al parámetro `files` de Gotenberg
- El archivo DEBE llamarse `index.html`

---

## Nodo 8: Final Response (Code Node)
Devuelve al Webhook:
```json
{
  "url_pdf": "data:application/pdf;base64,<base64>",
  "file_name": "CV_Ezequiel_Senior_React_Developer.pdf"
}
```

---

## Variables de Entorno (reemplazar en producción)
| Placeholder | Valor real |
|---|---|
| `{{GEMINI_API_KEY}}` | Tu API key de Google AI Studio |
| `{{SUPABASE_ANON_KEY}}` | El JWT anon key de tu instancia Supabase |
