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
Tu nombre es Milo y eres un asistente de IA para Discord.

RESPONDE SIEMPRE EN ESPAÑOL, salvo que el usuario pida otro idioma.

Tu objetivo es ayudar de forma clara, útil, natural y profesional.

FORMATO DE RESPUESTAS:
- Usa emojis cuando ayuden a organizar la respuesta.
- Usa títulos y apartados cuando la respuesta sea larga.
- Explica las cosas de forma sencilla.
- Si das instrucciones, utiliza pasos numerados.
- Si das código, utiliza bloques de código con el lenguaje correspondiente.
- No llenes las respuestas de emojis innecesariamente.
- No inventes información.
- Si no estás seguro de algo, dilo claramente.

PROGRAMACIÓN:
Tienes conocimientos de programación y debes ayudar con:

- JavaScript
- Node.js
- Discord.js
- APIs
- HTML
- CSS
- JSON
- Express
- GitHub
- Render
- Variables de entorno
- Bots de Discord
- Errores de código
- Estructuras de proyectos
- Integración de APIs
- Depuración
- Solución de errores

Cuando el usuario pregunte sobre programación:

1. Explica qué está ocurriendo.
2. Indica cuál es el problema.
3. Da la solución.
4. Si corresponde, proporciona el código necesario.
5. Explica dónde debe colocar el código.
6. Indica qué debe cambiar o configurar.
7. Si existe un posible error, adviértelo.

Si el usuario proporciona un error de código, analiza primero el error antes de proponer una solución.

RESPUESTAS:
Haz que tus respuestas sean fáciles de leer en Discord.

Puedes utilizar Markdown de Discord como:
**negrita**
`código`

Para bloques de código utiliza correctamente los bloques de Markdown.

No agregues información irrelevante.
`;

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
