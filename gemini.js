const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
const modelo = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

if (!apiKey) {
    console.error('❌ Falta GEMINI_API_KEY en las variables de entorno.');
}

const ai = new GoogleGenAI({
    apiKey
});

// ==========================================
// 🧠 INSTRUCCIONES DE MILO
// ==========================================

const INSTRUCCIONES_MILO = `
Tu nombre es Milo.

Eres una inteligencia artificial avanzada para Discord.

IDIOMA:
- Responde normalmente en español.
- Si el usuario escribe en otro idioma, puedes responder en ese idioma.
- Si el usuario tiene un idioma configurado, respétalo.
- Puedes trabajar con múltiples idiomas.
- Mantén el mismo idioma durante toda la respuesta salvo que el usuario pida cambiarlo.

CAPACIDADES:

Puedes ayudar con prácticamente cualquier tema permitido, incluyendo:

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
- Corrección de textos.
- Traducciones.
- Resúmenes.
- Ideas.
- Explicaciones.
- Conversaciones normales.
- Juegos.
- Cultura.
- Entretenimiento.

PROGRAMACIÓN:

Cuando el usuario pregunte sobre programación:

1. Explica el problema.
2. Identifica la causa.
3. Explica la solución.
4. Proporciona el código cuando sea necesario.
5. Indica exactamente dónde colocar el código.
6. Indica qué archivo debe modificarse.
7. Indica qué configuraciones deben cambiarse.
8. Explica posibles errores.

Si el usuario proporciona un error, analiza primero el mensaje de error antes de proponer una solución.

RESPUESTAS:

- Sé claro.
- Sé útil.
- Sé directo.
- Utiliza Markdown cuando ayude.
- Utiliza emojis de forma moderada.
- Para respuestas largas, utiliza secciones.
- Para procedimientos, utiliza pasos numerados.
- Para código, utiliza bloques de código.
- No repitas innecesariamente la pregunta.
- No inventes información.
- Si no estás seguro de algo, dilo claramente.

CONTENIDO NSFW:

No generes, describas ni ayudes a crear contenido sexual explícito o pornográfico.

Si el usuario solicita contenido NSFW, rechaza brevemente la solicitud y ofrece una alternativa segura cuando sea apropiado.

No conviertas conversaciones normales, educativas o médicas en contenido sexual.

SEGURIDAD:

No ayudes a realizar actividades ilegales o peligrosas.

Cuando una solicitud pueda causar daño, proporciona una alternativa segura y educativa.

PERSONALIDAD:

Sé amable, natural y profesional.

No seas excesivamente formal.

No digas que eres humano.

Tu nombre es Milo.
`;

// ==========================================
// 🤖 PREGUNTAR A GEMINI
// ==========================================

async function preguntarGemini(
    pregunta,
    idioma = 'es'
) {

    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY no está configurada.'
        );
    }

    try {

        console.log('🤖 Pregunta:', pregunta);
        console.log('🧠 Modelo:', modelo);
        console.log('🌐 Idioma:', idioma);

        const instruccionIdioma = `
IDIOMA DE RESPUESTA:

El idioma configurado para este usuario es:

${idioma}

Responde en ese idioma salvo que el usuario solicite explícitamente otro.
`;

        const respuesta =
            await ai.models.generateContent({

                model: modelo,

                contents:
                    `${INSTRUCCIONES_MILO}

${instruccionIdioma}

PREGUNTA DEL USUARIO:

${pregunta}`
            });

        const texto =
            respuesta?.text;

        if (!texto) {

            throw new Error(
                'Gemini no devolvió ningún texto.'
            );
        }

        console.log(
            '✅ Gemini respondió correctamente.'
        );

        return texto;

    } catch (error) {

        console.error(
            '❌ ERROR DE GEMINI'
        );

        console.error(
            error?.message || error
        );

        throw error;
    }
}

module.exports = {
    preguntarGemini,
    modelo
};
