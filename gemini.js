const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY NO EXISTE');
}

const ai = new GoogleGenAI({
    apiKey: apiKey
});

const modelo = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function preguntarGemini(pregunta) {

    try {

        console.log('🤖 Enviando pregunta a Gemini...');
        console.log('🧠 Modelo:', modelo);
        console.log('🔑 API configurada:', !!apiKey);

        const response = await ai.models.generateContent({
            model: modelo,
            contents: pregunta
        });

        console.log('✅ Gemini respondió correctamente.');

        return response.text;

    } catch (error) {

        console.error('================================');
        console.error('❌ ERROR DE GEMINI');
        console.error('================================');
        console.error('Nombre:', error.name);
        console.error('Mensaje:', error.message);
        console.error('Código:', error.status);
        console.error('Detalles:', error);
        console.error('================================');

        throw error;
    }
}

module.exports = {
    preguntarGemini,
    modelo
};
