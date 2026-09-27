const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const modelo = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function preguntarGemini(pregunta) {

    if (!pregunta || !pregunta.trim()) {
        return '❌ Escribe una pregunta.';
    }

    try {

        const respuesta = await ai.models.generateContent({
            model: modelo,
            contents: pregunta
        });

        const texto = respuesta.text;

        if (!texto) {
            return '❌ Gemini no devolvió una respuesta.';
        }

        return texto;

    } catch (error) {

        console.error('Error de Gemini:', error);

        return '❌ Ocurrió un error al conectar con Gemini.';
    }
}

module.exports = {
    preguntarGemini,
    modelo
};
