// ========================================
// 🛡️ MILO IA — SISTEMA ANTI-INSULTOS
// ========================================

const INSULTOS = [
    "idiota",
    "imbecil",
    "imbécil",
    "estupido",
    "estúpido",
    "pendejo",
    "pendeja",
    "cabron",
    "cabrón",
    "cabrona",
    "mamón",
    "mamon",
    "gilipollas",
    "tarado",
    "tarada",
    "estupida",
    "estúpida",
    "marica",
    "maricón",
    "maricon",
    "zorra",
    "perra",
    "puta",
    "puto"
];

// Normaliza el texto para detectar variaciones
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// Comprueba si el mensaje contiene un insulto
function contieneInsulto(texto) {
    if (!texto || typeof texto !== "string") {
        return false;
    }

    const contenido = normalizar(texto);

    return INSULTOS.some(insulto => {
        const palabra = normalizar(insulto);

        return new RegExp(`(^|\\s)${palabra}(?=\\s|$)`, "i")
            .test(contenido);
    });
}

// Obtiene el insulto detectado
function obtenerInsulto(texto) {
    if (!texto || typeof texto !== "string") {
        return null;
    }

    const contenido = normalizar(texto);

    return INSULTOS.find(insulto => {
        const palabra = normalizar(insulto);

        return new RegExp(`(^|\\s)${palabra}(?=\\s|$)`, "i")
            .test(contenido);
    }) || null;
}

// Respuesta de MILO
function respuestaAntiInsulto() {
    const respuestas = [
        "🤨 Vamos a mantener el respeto, ¿sí?",
        "🛡️ Prefiero que mantengamos una conversación con respeto.",
        "🙂 Podemos hablar sin insultos.",
        "⚠️ Ese tipo de lenguaje no es necesario. Sigamos con respeto.",
        "💙 Respeto ante todo. ¿En qué puedo ayudarte?"
    ];

    return respuestas[Math.floor(Math.random() * respuestas.length)];
}

module.exports = {
    INSULTOS,
    normalizar,
    contieneInsulto,
    obtenerInsulto,
    respuestaAntiInsulto
};
