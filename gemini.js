const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
const modelo = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const ai = new GoogleGenAI({
    apiKey
});

async function preguntarGemini(pregunta) {
    try {
        console.log('🤖 Pregunta:', pregunta);
        console.log('🧠 Modelo:', modelo);
        console.log('🔑 API configurada:', Boolean(apiKey));

        const respuesta = await ai.models.generateContent({
            model: modelo,
            contents: pregunta
        });

        console.log('✅ Gemini respondió.');

        return respuesta.text;

    } catch (error) {

        console.error('❌ ERROR COMPLETO DE GEMINI');

        console.error(
            JSON.stringify(
                error,
                Object.getOwnPropertyNames(error),
                2
            )
        );

        console.error('Nombre:', error?.name);
        console.error('Mensaje:', error?.message);
        console.error('Status:', error?.status);
        console.error('Código:', error?.code);

        throw error;
    }
}

module.exports = {
    preguntarGemini,
    modelo
};
