const { evaluate } = require('mathjs');
const { preguntarGroq } = require('./groq');

/* =========================================================
   🧮 CALCULAR
========================================================= */

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

/* =========================================================
   🔄 CONVERTIR
========================================================= */

function convertir(cantidad, de, a) {
    const valor = Number(cantidad);

    if (Number.isNaN(valor)) {
        throw new Error('La cantidad debe ser un número.');
    }

    if (!de || !a) {
        throw new Error('Debes indicar la unidad de origen y destino.');
    }

    const origen = String(de).toLowerCase().trim();
    const destino = String(a).toLowerCase().trim();

    /* LONGITUD */

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
        const metros = valor * longitud[origen];
        return metros / longitud[destino];
    }

    /* PESO */

    const peso = {
        mg: 0.000001,
        g: 0.001,
        kg: 1,
        t: 1000
    };

    if (
        peso[origen] !== undefined &&
        peso[destino] !== undefined
    ) {
        const kilogramos = valor * peso[origen];
        return kilogramos / peso[destino];
    }

    /* TEMPERATURA */

    if (origen === 'c' && destino === 'f') {
        return (valor * 9 / 5) + 32;
    }

    if (origen === 'f' && destino === 'c') {
        return (valor - 32) * 5 / 9;
    }

    if (origen === 'c' && destino === 'k') {
        return valor + 273.15;
    }

    if (origen === 'k' && destino === 'c') {
        return valor - 273.15;
    }

    if (origen === 'f' && destino === 'k') {
        return (valor - 32) * 5 / 9 + 273.15;
    }

    if (origen === 'k' && destino === 'f') {
        return (valor - 273.15) * 9 / 5 + 32;
    }

    throw new Error(
        `No puedo convertir de "${de}" a "${a}".`
    );
}

/* =========================================================
   🌐 TRADUCIR
========================================================= */

async function traducir(texto, idioma) {
    if (!texto || !texto.trim()) {
        throw new Error(
            'Debes proporcionar el texto que quieres traducir.'
        );
    }

    if (!idioma || !idioma.trim()) {
        throw new Error(
            'Debes indicar el idioma al que quieres traducir.'
        );
    }

    return await preguntarGroq(
        `Traduce el siguiente texto al idioma "${idioma}".

REGLAS:
- Conserva el significado original.
- Conserva el tono original.
- No agregues explicaciones.
- No cambies nombres propios.
- Devuelve únicamente la traducción.

TEXTO:
${texto}`,
        idioma
    );
}

/* =========================================================
   📝 RESUMIR
========================================================= */

async function resumir(texto) {
    if (!texto || !texto.trim()) {
        throw new Error(
            'Debes proporcionar el texto que quieres resumir.'
        );
    }

    return await preguntarGroq(
        `Resume el siguiente texto de forma clara y precisa.

REGLAS:
- Conserva las ideas principales.
- Elimina información repetitiva.
- No inventes información.
- Utiliza un lenguaje fácil de entender.
- Responde en español.

TEXTO:
${texto}`,
        'es'
    );
}

/* =========================================================
   🤖 EXPLICAR
========================================================= */

async function explicar(texto) {
    if (!texto || !texto.trim()) {
        throw new Error(
            'Debes indicar qué quieres que explique.'
        );
    }

    return await preguntarGroq(
        `Explica de forma clara el siguiente tema:

${texto}

REGLAS:
- Explica paso a paso cuando sea necesario.
- Utiliza ejemplos sencillos.
- No inventes información.
- Responde en español.`
    );
}

/* =========================================================
   📅 FECHA
========================================================= */

function obtenerFecha(zona = 'America/Bogota') {
    try {
        return new Intl.DateTimeFormat('es-CO', {
            timeZone: zona,
            dateStyle: 'full'
        }).format(new Date());
    } catch (error) {
        throw new Error(
            'La zona horaria proporcionada no es válida.'
        );
    }
}

/* =========================================================
   🕐 HORA
========================================================= */

function obtenerHora(zona = 'America/Bogota') {
    try {
        return new Intl.DateTimeFormat('es-CO', {
            timeZone: zona,
            dateStyle: 'full',
            timeStyle: 'medium'
        }).format(new Date());
    } catch (error) {
        throw new Error(
            'La zona horaria proporcionada no es válida.'
        );
    }
}

/* =========================================================
   ⏱️ CONTADOR
========================================================= */

function calcularContador(fechaObjetivo) {
    const objetivo = new Date(fechaObjetivo);

    if (Number.isNaN(objetivo.getTime())) {
        throw new Error(
            'La fecha proporcionada no es válida.'
        );
    }

    const ahora = Date.now();
    const diferencia = objetivo.getTime() - ahora;

    if (diferencia <= 0) {
        return {
            terminado: true,
            dias: 0,
            horas: 0,
            minutos: 0,
            segundos: 0
        };
    }

    const segundosTotales = Math.floor(diferencia / 1000);

    const dias = Math.floor(
        segundosTotales / 86400
    );

    const horas = Math.floor(
        (segundosTotales % 86400) / 3600
    );

    const minutos = Math.floor(
        (segundosTotales % 3600) / 60
    );

    const segundos =
        segundosTotales % 60;

    return {
        terminado: false,
        dias,
        horas,
        minutos,
        segundos
    };
}

/* =========================================================
   📊 PORCENTAJE
========================================================= */

function calcularPorcentaje(porcentaje, cantidad) {
    const p = Number(porcentaje);
    const c = Number(cantidad);

    if (Number.isNaN(p) || Number.isNaN(c)) {
        throw new Error(
            'El porcentaje y la cantidad deben ser números.'
        );
    }

    return (p / 100) * c;
}

/* =========================================================
   📐 REGLA DE TRES
========================================================= */

function reglaTres(a, b, c) {
    const numeroA = Number(a);
    const numeroB = Number(b);
    const numeroC = Number(c);

    if (
        Number.isNaN(numeroA) ||
        Number.isNaN(numeroB) ||
        Number.isNaN(numeroC)
    ) {
        throw new Error(
            'Todos los valores deben ser números.'
        );
    }

    if (numeroA === 0) {
        throw new Error(
            'El primer valor no puede ser 0.'
        );
    }

    return (numeroB * numeroC) / numeroA;
}

/* =========================================================
   🔐 GENERAR PASSWORD
========================================================= */

function generarPassword(longitud = 16) {
    let cantidad = Number(longitud);

    if (Number.isNaN(cantidad)) {
        cantidad = 16;
    }

    cantidad = Math.floor(cantidad);

    if (cantidad < 6) {
        cantidad = 6;
    }

    if (cantidad > 128) {
        cantidad = 128;
    }

    const caracteres =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        'abcdefghijklmnopqrstuvwxyz' +
        '0123456789' +
        '!@#$%^&*()_+-=[]{}';

    let password = '';

    for (let i = 0; i < cantidad; i++) {
        const indice = Math.floor(
            Math.random() * caracteres.length
        );

        password += caracteres[indice];
    }

    return password;
}

/* =========================================================
   📤 EXPORTACIONES
========================================================= */

module.exports = {
    calcularOperacion,
    convertir,
    traducir,
    resumir,
    explicar,
    obtenerFecha,
    obtenerHora,
    calcularContador,
    calcularPorcentaje,
    reglaTres,
    generarPassword
};
