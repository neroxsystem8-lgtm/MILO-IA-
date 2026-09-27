const fs = require('fs');
const path = require('path');

// ==========================================
// ⚙️ CONFIGURACIÓN
// ==========================================

const LIMITE_DIARIO = 3;

const ARCHIVO_LIMITE = path.join(
    __dirname,
    'imagenes-limite.json'
);

// ==========================================
// 📁 CARGAR DATOS
// ==========================================

function cargarDatos() {

    try {

        if (!fs.existsSync(ARCHIVO_LIMITE)) {

            return {
                fecha: obtenerFecha(),
                usadas: 0
            };
        }

        const datos = JSON.parse(
            fs.readFileSync(
                ARCHIVO_LIMITE,
                'utf8'
            )
        );

        const fechaActual = obtenerFecha();

        // Reiniciar automáticamente cada día
        if (datos.fecha !== fechaActual) {

            return {
                fecha: fechaActual,
                usadas: 0
            };
        }

        return datos;

    } catch (error) {

        console.error(
            '❌ Error leyendo el límite de imágenes:',
            error
        );

        return {
            fecha: obtenerFecha(),
            usadas: 0
        };
    }
}

// ==========================================
// 💾 GUARDAR DATOS
// ==========================================

function guardarDatos(datos) {

    try {

        fs.writeFileSync(
            ARCHIVO_LIMITE,
            JSON.stringify(
                datos,
                null,
                4
            )
        );

    } catch (error) {

        console.error(
            '❌ Error guardando el límite:',
            error
        );
    }
}

// ==========================================
// 📅 FECHA ACTUAL
// ==========================================

function obtenerFecha() {

    const ahora = new Date();

    return ahora.toISOString()
        .split('T')[0];
}

// ==========================================
// 🔞 BLOQUEO NSFW
// ==========================================

function esNSFW(prompt) {

    const palabrasBloqueadas = [

        'porn',
        'porno',
        'pornografía',
        'pornografia',
        'nude',
        'nudity',
        'desnudo',
        'desnuda',
        'sex',
        'sexual',
        'sexo',
        'xxx',
        'hentai',
        'erótico',
        'erotico',
        'erótica',
        'erotica',
        'fetish',
        'fetiche',
        'nsfw'
    ];

    const texto =
        prompt.toLowerCase();

    return palabrasBloqueadas.some(
        palabra =>
            texto.includes(palabra)
    );
}

// ==========================================
// 📊 CONSULTAR LÍMITE
// ==========================================

function obtenerLimiteImagenes() {

    const datos = cargarDatos();

    return {
        usadas: datos.usadas,
        restantes:
            Math.max(
                0,
                LIMITE_DIARIO - datos.usadas
            ),
        limite: LIMITE_DIARIO
    };
}

// ==========================================
// ➕ CONSUMIR UNA IMAGEN
// ==========================================

function consumirImagen() {

    const datos = cargarDatos();

    if (datos.usadas >= LIMITE_DIARIO) {

        return false;
    }

    datos.usadas++;

    guardarDatos(datos);

    return true;
}

// ==========================================
// 🖼️ GENERAR IMAGEN
// ==========================================

async function generarImagen(prompt) {

    if (!prompt || !prompt.trim()) {

        throw new Error(
            'Debes proporcionar una descripción para la imagen.'
        );
    }

    // 🔞 Bloqueo NSFW
    if (esNSFW(prompt)) {

        throw new Error(
            'No puedo generar imágenes con contenido NSFW.'
        );
    }

    // 📊 Comprobar límite global
    const limite =
        obtenerLimiteImagenes();

    if (limite.restantes <= 0) {

        throw new Error(
            'Milo ya utilizó las 3 generaciones de imágenes disponibles hoy. El límite se reiniciará mañana.'
        );
    }

    /*
    ==========================================
    ⚠️ API DE GENERACIÓN
    ==========================================

    Aquí conectaremos la API real de imágenes.

    Ejemplo del flujo:

    1. Recibir prompt.
    2. Enviar prompt a la API.
    3. Recibir la imagen.
    4. Consumir 1 generación.
    5. Devolver la imagen.

    No consumimos el límite hasta que
    la generación haya sido exitosa.
    */

    throw new Error(
        'La API de generación de imágenes todavía no está configurada.'
    );
}

// ==========================================
// 📦 EXPORTAR
// ==========================================

module.exports = {
    generarImagen,
    obtenerLimiteImagenes,
    consumirImagen,
    esNSFW,
    LIMITE_DIARIO
};
