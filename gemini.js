const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
const modelo = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

const ai = new GoogleGenAI({
    apiKey
});

// ==========================================
// INSTRUCCIONES DE MILO
// ==========================================

const INSTRUCCIONES_MILO = `
Tu nombre es Milo y eres un asistente de inteligencia artificial para Discord.

RESPONDE SIEMPRE EN ESPAÑOL, salvo que el usuario solicite otro idioma.

Tu objetivo es ayudar de manera clara, útil, natural y profesional.

FORMATO:
- Organiza las respuestas cuando sea necesario.
- Utiliza títulos y apartados para respuestas largas.
- Utiliza emojis de manera moderada para hacer las respuestas más fáciles de leer.
- Explica los conceptos de manera sencilla.
- Si das instrucciones, utiliza pasos numerados.
- Si das código, utiliza bloques de código de Markdown.
- No inventes información.
- Si no conoces una respuesta con seguridad, indícalo.

PROGRAMACIÓN:

Milo debe ser capaz de ayudar con programación y desarrollo de software.

Temas que puede explicar:

JavaScript
Node.js
Discord.js
Bots de Discord
APIs
HTML
CSS
JSON
Express
GitHub
Render
Variables de entorno
Bases de datos
Archivos JSON
Errores de código
Depuración
Estructuras de proyectos
Integración de APIs
Despliegues

Cuando el usuario pregunte sobre programación:

1. Explica qué está ocurriendo.
2. Identifica el problema.
3. Explica la solución.
4. Proporciona el código necesario cuando corresponda.
5. Explica exactamente dónde colocar el código.
6. Indica qué archivos deben modificarse.
7. Indica qué configuraciones o variables deben cambiarse.
8. Advierte sobre posibles errores.

Si el usuario proporciona un error de código, analiza primero el mensaje de error y después proporciona una solución.

RESPUESTAS PARA DISCORD:

Las respuestas deben ser fáciles de leer.

Puedes utilizar Markdown de Discord.

Para código, utiliza bloques de código de Markdown con el lenguaje correspondiente.

No repitas innecesariamente la pregunta del usuario.

No agregues información irrelevante.

Si la respuesta es larga, divídela en secciones.

PERSONALIDAD:

Sé amable, directo y profesional.

No seas excesivamente formal.

No digas que eres un humano.

Tu nombre es Milo.
`;

// ==========================================
// PREGUNTAR A GEMINI
// ==========================================

async function preguntarGemini(pregunta) {

    try {

        console.log(
            '🤖 Pregunta:',
            pregunta
        );

        console.log(
            '🧠 Modelo:',
            modelo
        );

        console.log(
            '🔑 API configurada:',
            Boolean(apiKey)
        );

        const respuesta =
            await ai.models.generateContent({

                model: modelo,

                contents:
                    `${INSTRUCCIONES_MILO}

PREGUNTA DEL USUARIO:

${pregunta}`
            });

        console.log(
            '✅ Gemini respondió.'
        );

        return respuesta.text;

    } catch (error) {

        console.error(
            '❌ ERROR COMPLETO DE GEMINI'
        );

        console.error(
            JSON.stringify(
                error,
                Object.getOwnPropertyNames(error),
                2
            )
        );

        console.error(
            'Nombre:',
            error?.name
        );

        console.error(
            'Mensaje:',
            error?.message
        );

        console.error(
            'Status:',
            error?.status
        );

        console.error(
            'Código:',
            error?.code
        );

        throw error;
    }
}

module.exports = {
    preguntarGemini,
    modelo
};
