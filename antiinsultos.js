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
    "mamon",
    "mamón",
    "gilipollas",
    "tarado",
    "tarada",
    "marica",
    "maricon",
    "maricón",
    "zorra",
    "perra",
    "puta",
    "puto"
];


// ========================================
// NORMALIZAR TEXTO
// ========================================

function normalizar(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}


// ========================================
// DETECTAR INSULTO
// ========================================

function detectarInsulto(texto) {

    if (
        !texto ||
        typeof texto !== "string"
    ) {
        return null;
    }

    const contenido =
        normalizar(texto);

    for (
        const insulto
        of INSULTOS
    ) {

        const palabra =
            normalizar(insulto);

        const expresion =
            new RegExp(
                `(^|\\s)${palabra}(?=\\s|$)`,
                "i"
            );

        if (
            expresion.test(
                contenido
            )
        ) {
            return insulto;
        }
    }

    return null;
}


// ========================================
// REGISTRAR INFRACCIÓN
// ========================================

const infracciones =
    new Map();

function registrarInfraccion(
    guildId,
    userId,
    insulto
) {

    const clave =
        `${guildId}:${userId}`;

    const actual =
        infracciones.get(clave) || 0;

    const nueva =
        actual + 1;

    infracciones.set(
        clave,
        nueva
    );

    console.log(
        `🛡️ Infracción ${nueva}: ${userId} → ${insulto}`
    );

    return nueva;
}


// ========================================
// OBTENER SANCIÓN
// ========================================

function obtenerSancion(
    numero
) {

    if (numero <= 1) {

        return {
            tipo: "advertencia"
        };
    }

    if (numero === 2) {

        return {
            tipo: "mute",
            duracion: 5 * 60 * 1000
        };
    }

    if (numero === 3) {

        return {
            tipo: "mute",
            duracion: 30 * 60 * 1000
        };
    }

    return {
        tipo: "ban"
    };
}


// ========================================
// EXPORTACIONES
// ========================================

module.exports = {

    INSULTOS,
    normalizar,
    detectarInsulto,
    registrarInfraccion,
    obtenerSancion

};
