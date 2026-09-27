const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ Falta GEMINI_API_KEY en el archivo .env');
}

const ai = new GoogleGenAI({
    apiKey
});

const modelo =
    process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function preguntarGemini(pregunta) {

    try {

        const respuesta =
            await ai.models.generateContent({
                model: modelo,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: pregunta
                            }
                        ]
                    }
                ]
            });

        const texto =
            respuesta.text;

        if (!texto) {
            return '❌ Gemini no devolvió ninguna respuesta.';
        }

        return texto;

    } catch (error) {

        console.error(
            '❌ ERROR COMPLETO DE GEMINI:',
            error
        );

        return '❌ Ocurrió un error al conectar con Gemini.';
    }
}

module.exports = {
    preguntarGemini,
    modelo
};
