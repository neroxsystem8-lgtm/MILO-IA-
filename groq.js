const Groq = require('groq-sdk');

const API_KEY = process.env.GROQ_API_KEY;
const MODELO = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

if (!API_KEY) {
    console.warn('⚠️ GROQ_API_KEY no está configurada.');
}

const groq = new Groq({
    apiKey: API_KEY
});

// =========================
// CONFIGURACIÓN DE MILO
// =========================

const INSTRUCCIONES_MILO = `
Tu nombre es Milo.

Eres una inteligencia artificial avanzada para Discord.

PERSONALIDAD:
- Sé amable.
- Sé natural.
- Sé profesional.
- Sé directo.
- No seas excesivamente formal.
- Utiliza emojis de forma moderada.
- No digas que eres humano.
- Tu nombre siempre es Milo.

IDIOMAS:
- Responde en español por defecto.
- Si el usuario escribe en otro idioma, responde en ese idioma.
- Respeta el idioma configurado del usuario.
- Puedes responder en múltiples idiomas.

CAPACIDADES:
- Preguntas generales.
- Educación.
- Matemáticas.
- Ciencia.
- Historia.
- Geografía.
- Tecnología.
- Programación.
- JavaScript.
- Node.js.
- Discord.js.
- Bots de Discord.
- APIs.
- HTML.
- CSS.
- JSON.
- Express.
- GitHub.
- Render.
- Variables de entorno.
- Depuración.
- Errores de código.
- Estructuras de proyectos.
- Redacción.
- Traducciones.
- Resúmenes.
- Explicaciones.
- Ideas.
- Cultura.
- Entretenimiento.

PROGRAMACIÓN:
Cuando ayudes con programación:

1. Explica el problema.
2. Identifica la causa.
3. Explica la solución.
4. Da el código completo cuando sea necesario.
5. Indica el archivo que debe modificarse.
6. Indica dónde colocar el código.
7. Indica las configuraciones necesarias.
8. Explica posibles errores.

RESPUESTAS:
- Usa Markdown cuando sea útil.
- Usa títulos y secciones para respuestas largas.
- Usa listas numeradas para procedimientos.
- Usa bloques de código para programación.
- No repitas innecesariamente la pregunta.
- No inventes información.
- Si no sabes algo, dilo claramente.

NSFW:
- No generes contenido sexual explícito o pornográfico.
- Si el usuario solicita contenido NSFW, recházalo brevemente.
- Ofrece una alternativa segura cuando corresponda.

SEGURIDAD:
- No ayudes a realizar actividades ilegales o peligrosas.
- Cuando una solicitud pueda causar daño, proporciona una alternativa segura y educativa.
`;

// =========================
// PREGUNTAR A GROQ
// =========================

async function preguntarGroq(pregunta, idioma = 'es') {

    if (!API_KEY) {
        throw new Error(
            'GROQ_API_KEY no está configurada.'
        );
    }

    if (!pregunta || !pregunta.trim()) {
        throw new Error(
            'La pregunta no puede estar vacía.'
        );
    }

    try {

        const respuesta = await groq.chat.completions.create({

            model: MODELO,

            messages: [

                {
                    role: 'system',
                    content: INSTRUCCIONES_MILO
                },

                {
                    role: 'system',
                    content:
                        `El idioma configurado del usuario es: ${idioma}.
Responde en ese idioma salvo que el usuario pida explícitamente otro idioma.`
                },

                {
                    role: 'user',
                    content: pregunta
                }

            ],

            temperature: 0.7,

            max_completion_tokens: 4096

        });

        const texto =
            respuesta?.choices?.[0]?.message?.content;

        if (!texto) {
            throw new Error(
                'Groq no devolvió ninguna respuesta.'
            );
        }

        return texto;

    } catch (error) {

        console.error('❌ ERROR DE GROQ');
        console.error(error);

        if (error?.status === 401) {
            throw new Error(
                'La API Key de Groq es inválida.'
            );
        }

        if (error?.status === 429) {
            throw new Error(
                'Groq alcanzó temporalmente el límite de solicitudes. Inténtalo nuevamente en unos segundos.'
            );
        }

        if (error?.status === 400) {
            throw new Error(
                'Groq rechazó la solicitud. Revisa el modelo y la configuración.'
            );
        }

        throw new Error(
            'No se pudo obtener una respuesta de Groq.'
        );
    }
}

// =========================
// EXPORTAR
// =========================

module.exports = {
    preguntarGroq,
    MODELO
};
