const { evaluate } = require('mathjs');
const { preguntarGroq } = require('./groq');

// =========================
// 🧮 CALCULADORA
// =========================

function calcularOperacion(operacion) {

    if (!operacion || !operacion.trim()) {
        throw new Error('Debes proporcionar una operación.');
    }

    try {

        const resultado = evaluate(operacion);

        return String(resultado);

    } catch (error) {

        throw new Error(
            'No pude calcular esa operación. Revisa que esté escrita correctamente.'
        );
    }
}


// =========================
// 🌐 TRADUCIR
// =========================

async function traducir(texto, idioma) {

    if (!texto || !texto.trim()) {
        throw new Error('Debes proporcionar el texto que quieres traducir.');
    }

    if (!idioma || !idioma.trim()) {
        throw new Error('Debes indicar el idioma al que quieres traducir.');
    }

    const respuesta = await preguntarGroq(
        `Traduce el siguiente texto al idioma "${idioma}".

REGLAS:
- Conserva el significado original.
- Conserva el tono del texto.
- No agregues explicaciones.
- Devuelve únicamente la traducción.

TEXTO:
${texto}`,
        idioma
    );

    return respuesta;
}


// =========================
// 📝 RESUMIR
// =========================

async function resumir(texto) {

    if (!texto || !texto.trim()) {
        throw new Error('Debes proporcionar el texto que quieres resumir.');
    }

    const respuesta = await preguntarGroq(
        `Resume el siguiente texto de forma clara y precisa.

REGLAS:
- Conserva las ideas principales.
- Elimina información repetitiva.
- No inventes información.
- Utiliza un resumen fácil de entender.
- Responde en español.

TEXTO:
${texto}`,
        'es'
    );

    return respuesta;
}


// =========================
// 🕐 HORA
// =========================

function obtenerHora(zona = 'America/Bogota') {

    try {

        return new Intl.DateTimeFormat(
            'es-CO',
            {
                timeZone: zona,
                dateStyle: 'full',
                timeStyle: 'medium'
            }
        ).format(new Date());

    } catch (error) {

        throw new Error(
            'La zona horaria proporcionada no es válida.'
        );
    }
}


// =========================
// 🔄 CONVERSIONES
// =========================

function convertir(cantidad, de, a) {

    const valor = Number(cantidad);

    if (Number.isNaN(valor)) {
        throw new Error('La cantidad debe ser un número.');
    }

    const origen = de.toLowerCase();
    const destino = a.toLowerCase();

    // =========================
    // LONGITUD
    // =========================

    const longitud = {
        mm: 0.001,
        cm: 0.01,
        m: 1,
        km: 1000
    };

    if (
        longitud[origen] !== undefined &&
        longitud[destino] !== undefined
    ) {

        const metros =
            valor * longitud[origen];

        return metros / longitud[destino];
    }


    // =========================
    // PESO
    // =========================

    const peso = {
        mg: 0.000001,
        g: 0.001,
        kg: 1
    };

    if (
        peso[origen] !== undefined &&
        peso[destino] !== undefined
    ) {

        const kilogramos =
            valor * peso[origen];

        return kilogramos / peso[destino];
    }


    // =========================
    // TEMPERATURA
    // =========================

    if (
        origen === 'c' &&
        destino === 'f'
    ) {

        return (valor * 9 / 5) + 32;
    }

    if (
        origen === 'f' &&
        destino === 'c'
    ) {

        return (valor - 32) * 5 / 9;
    }

    if (
        origen === 'c' &&
        destino === 'k'
    ) {

        return valor + 273.15;
    }

    if (
        origen === 'k' &&
        destino === 'c'
    ) {

        return valor - 273.15;
    }

    if (
        origen === 'f' &&
        destino === 'k'
    ) {

        return (valor - 32) * 5 / 9 + 273.15;
    }

    if (
        origen === 'k' &&
        destino === 'f'
    ) {

        return (valor - 273.15) * 9 / 5 + 32;
    }


    throw new Error(
        `No puedo convertir de "${de}" a "${a}".`
    );
}


// =========================
// 📦 EXPORTAR
// =========================

module.exports = {
    calcularOperacion,
    traducir,
    resumir,
    obtenerHora,
    convertir
};
