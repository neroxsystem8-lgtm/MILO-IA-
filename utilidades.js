const { calcular } = require('mathjs');
const { preguntarGemini } = require('./gemini');

/* =========================
   CALCULAR
========================= */

function calcularOperacion(operacion) {

    if (
        !operacion ||
        !operacion.trim()
    ) {
        throw new Error(
            'Debes proporcionar una operación.'
        );
    }

    try {

        const resultado =
            calcular(operacion);

        return String(resultado);

    } catch {

        throw new Error(
            'No pude calcular esa operación. Revisa la expresión.'
        );

    }

}

/* =========================
   TRADUCIR
========================= */

async function traducir(
    texto,
    idioma
) {

    if (
        !texto ||
        !texto.trim()
    ) {
        throw new Error(
            'Debes proporcionar el texto que quieres traducir.'
        );
    }

    if (
        !idioma ||
        !idioma.trim()
    ) {
        throw new Error(
            'Debes indicar el idioma de destino.'
        );
    }

    return await preguntarGemini(
        `Traduce el siguiente texto al idioma indicado.

IDIOMA DE DESTINO:
${idioma}

TEXTO:
${texto}

Entrega únicamente la traducción, sin explicaciones innecesarias.`,
        idioma
    );

}

/* =========================
   RESUMIR
========================= */

async function resumir(
    texto
) {

    if (
        !texto ||
        !texto.trim()
    ) {
        throw new Error(
            'Debes proporcionar el texto que quieres resumir.'
        );
    }

    return await preguntarGemini(
        `Resume el siguiente texto de forma clara y sencilla.

Texto:
${texto}

Conserva las ideas principales y elimina información innecesaria.`,
        'es'
    );

}

/* =========================
   HORA
========================= */

function obtenerHora(
    zona = 'America/Bogota'
) {

    try {

        return new Intl.DateTimeFormat(
            'es-CO',
            {
                timeZone: zona,
                dateStyle: 'full',
                timeStyle: 'medium'
            }
        ).format(new Date());

    } catch {

        throw new Error(
            'La zona horaria indicada no es válida.'
        );

    }

}

/* =========================
   CONVERTIR
========================= */

function convertir(
    cantidad,
    de,
    a
) {

    if (
        cantidad === undefined ||
        cantidad === null
    ) {
        throw new Error(
            'Debes indicar una cantidad.'
        );
    }

    if (
        !de ||
        !a
    ) {
        throw new Error(
            'Debes indicar la unidad de origen y la unidad de destino.'
        );
    }

    const valor =
        Number(cantidad);

    if (
        !Number.isFinite(valor)
    ) {
        throw new Error(
            'La cantidad debe ser un número válido.'
        );
    }

    const unidades = {

        mm: {
            m: 0.001,
            cm: 0.1,
            mm: 1,
            km: 0.000001
        },

        cm: {
            m: 0.01,
            cm: 1,
            mm: 10,
            km: 0.00001
        },

        m: {
            m: 1,
            cm: 100,
            mm: 1000,
            km: 0.001
        },

        km: {
            m: 1000,
            cm: 100000,
            mm: 1000000,
            km: 1
        },

        g: {
            g: 1,
            kg: 0.001,
            mg: 1000
        },

        kg: {
            g: 1000,
            kg: 1,
            mg: 1000000
        },

        mg: {
            g: 0.001,
            kg: 0.000001,
            mg: 1
        }

    };

    const origen =
        de.toLowerCase().trim();

    const destino =
        a.toLowerCase().trim();

    if (
        !unidades[origen] ||
        !unidades[origen][destino]
    ) {

        throw new Error(
            `No puedo convertir de ${de} a ${a}.`
        );

    }

    return valor *
        unidades[origen][destino];

}

/* =========================
   EXPORTAR
========================= */

module.exports = {

    calcularOperacion,

    traducir,

    resumir,

    obtenerHora,

    convertir

};
