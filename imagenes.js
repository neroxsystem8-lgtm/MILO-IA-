const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const LIMITE_DIARIO = 3;

const API_KEY = process.env.GEMINI_API_KEY;

const MODELO_IMAGEN =
    process.env.GEMINI_IMAGE_MODEL ||
    'gemini-3.1-flash-image';

const ARCHIVO_LIMITE = path.join(
    __dirname,
    'imagenes-limite.json'
);

if (!API_KEY) {
    console.error(
        '❌ Falta GEMINI_API_KEY en las variables de entorno.'
    );
}

const ai = new GoogleGenAI({
    apiKey: API_KEY
});

/* =========================
   FECHA
========================= */

function obtenerFecha() {

    return new Date()
        .toISOString()
        .split('T')[0];

}

/* =========================
   CARGAR LÍMITE
========================= */

function cargarDatos() {

    try {

        if (!fs.existsSync(ARCHIVO_LIMITE)) {

            return {
                fecha: obtenerFecha(),
                usadas: 0
            };

        }

        const datos =
            JSON.parse(
                fs.readFileSync(
                    ARCHIVO_LIMITE,
                    'utf8'
                )
            );

        const fechaActual =
            obtenerFecha();

        if (
            datos.fecha !==
            fechaActual
        ) {

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

/* =========================
   GUARDAR LÍMITE
========================= */

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

/* =========================
   DETECTAR NSFW
========================= */

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
        prompt
            .toLowerCase()
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            );

    return palabrasBloqueadas.some(
        palabra =>
            texto.includes(
                palabra
                    .normalize('NFD')
                    .replace(
                        /[\u0300-\u036f]/g,
                        ''
                    )
            )
    );

}

/* =========================
   VER LÍMITE
========================= */

function obtenerLimiteImagenes() {

    const datos =
        cargarDatos();

    return {

        usadas:
            datos.usadas,

        restantes:
            Math.max(
                0,
                LIMITE_DIARIO -
                    datos.usadas
            ),

        limite:
            LIMITE_DIARIO

    };

}

/* =========================
   CONSUMIR IMAGEN
========================= */

function consumirImagen() {

    const datos =
        cargarDatos();

    if (
        datos.usadas >=
        LIMITE_DIARIO
    ) {

        return false;

    }

    datos.usadas++;

    guardarDatos(datos);

    return true;

}

/* =========================
   GENERAR IMAGEN
========================= */

async function generarImagen(prompt) {

    if (!API_KEY) {

        throw new Error(
            'GEMINI_API_KEY no está configurada.'
        );

    }

    if (
        !prompt ||
        !prompt.trim()
    ) {

        throw new Error(
            'Debes proporcionar una descripción para la imagen.'
        );

    }

    if (esNSFW(prompt)) {

        throw new Error(
            'No puedo generar imágenes con contenido NSFW.'
        );

    }

    const limite =
        obtenerLimiteImagenes();

    if (
        limite.restantes <= 0
    ) {

        throw new Error(
            'Milo ya utilizó las 3 generaciones de imágenes disponibles hoy. El límite se reiniciará mañana.'
        );

    }

    try {

        console.log(
            '🎨 Generando imagen...'
        );

        console.log(
            '🧠 Modelo:',
            MODELO_IMAGEN
        );

        console.log(
            '📝 Prompt:',
            prompt
        );

        const interaction =
            await ai.interactions.create({

                model:
                    MODELO_IMAGEN,

                input:
                    `Genera una imagen de alta calidad basada en esta descripción:

${prompt}

No generes contenido sexual explícito, pornográfico o NSFW.`

            });

        const imagen =
            interaction?.output_image;

        if (!imagen) {

            throw new Error(
                'Gemini no devolvió ninguna imagen.'
            );

        }

        if (!imagen.data) {

            throw new Error(
                'Gemini devolvió una imagen sin datos.'
            );

        }

        const buffer =
            Buffer.from(
                imagen.data,
                'base64'
            );

        if (!buffer.length) {

            throw new Error(
                'La imagen generada está vacía.'
            );

        }

        // Solo consumimos el límite
        // después de generar correctamente.

        consumirImagen();

        console.log(
            '✅ Imagen generada correctamente.'
        );

        return buffer;

    } catch (error) {

        console.error(
            '❌ ERROR GENERANDO IMAGEN'
        );

        console.error(
            error?.message ||
            error
        );

        throw new Error(
            'No pude generar la imagen en este momento. Inténtalo nuevamente.'
        );

    }

}

/* =========================
   EXPORTAR
========================= */

module.exports = {

    generarImagen,

    obtenerLimiteImagenes,

    consumirImagen,

    esNSFW,

    LIMITE_DIARIO

};
