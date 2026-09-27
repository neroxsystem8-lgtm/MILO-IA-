const fs = require('fs');
const path = require('path');
const { InferenceClient } = require('@huggingface/inference');

const LIMITE_DIARIO = 3;

const HF_TOKEN = process.env.HF_TOKEN;
const MODELO_IMAGEN =
    process.env.HF_IMAGE_MODEL ||
    'black-forest-labs/FLUX.1-schnell';

const ARCHIVO_LIMITE = path.join(
    __dirname,
    'imagenes-limite.json'
);

const hf = HF_TOKEN
    ? new InferenceClient(HF_TOKEN)
    : null;


// =========================
// FECHA
// =========================

function obtenerFecha() {
    return new Date()
        .toISOString()
        .split('T')[0];
}


// =========================
// CARGAR DATOS
// =========================

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

        if (datos.fecha !== obtenerFecha()) {

            return {
                fecha: obtenerFecha(),
                usadas: 0
            };
        }

        return datos;

    } catch {

        return {
            fecha: obtenerFecha(),
            usadas: 0
        };
    }
}


// =========================
// GUARDAR DATOS
// =========================

function guardarDatos(datos) {

    fs.writeFileSync(
        ARCHIVO_LIMITE,
        JSON.stringify(
            datos,
            null,
            2
        )
    );
}


// =========================
// DETECTAR NSFW
// =========================

function esNSFW(prompt) {

    const palabras = [
        'nsfw',
        'porn',
        'pornografía',
        'porno',
        'desnudo',
        'desnuda',
        'desnudos',
        'desnudas',
        'sexo explícito',
        'sexual explícito',
        'genitales',
        'xxx',
        'erótico explícito',
        'erotico explicito'
    ];

    const texto =
        prompt
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    return palabras.some(
        palabra =>
            texto.includes(
                palabra
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
            )
    );
}


// =========================
// OBTENER LÍMITE
// =========================

function obtenerLimiteImagenes() {

    const datos = cargarDatos();

    return {
        usadas: datos.usadas,
        restantes:
            Math.max(
                0,
                LIMITE_DIARIO - datos.usadas
            )
    };
}


// =========================
// CONSUMIR IMAGEN
// =========================

function consumirImagen() {

    const datos = cargarDatos();

    datos.usadas++;

    guardarDatos(datos);

    return obtenerLimiteImagenes();
}


// =========================
// GENERAR IMAGEN
// =========================

async function generarImagen(prompt) {

    if (!HF_TOKEN) {

        throw new Error(
            'HF_TOKEN no está configurado.'
        );
    }

    if (!hf) {

        throw new Error(
            'No se pudo inicializar Hugging Face.'
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
            'Milo no puede generar imágenes con contenido NSFW.'
        );
    }


    // =========================
    // COMPROBAR LÍMITE
    // =========================

    const limite =
        obtenerLimiteImagenes();

    if (limite.restantes <= 0) {

        throw new Error(
            'Milo ya utilizó las 3 generaciones de imágenes disponibles hoy. El límite se reiniciará mañana.'
        );
    }


    try {

        console.log(
            `🖼️ Generando imagen con ${MODELO_IMAGEN}...`
        );

        const imagen =
            await hf.textToImage({

                model: MODELO_IMAGEN,

                inputs: prompt,

                parameters: {
                    num_inference_steps: 4
                }

            });


        // =========================
        // CONVERTIR RESPUESTA
        // =========================

        let buffer;


        if (
            Buffer.isBuffer(imagen)
        ) {

            buffer = imagen;

        } else if (
            imagen instanceof ArrayBuffer
        ) {

            buffer = Buffer.from(
                imagen
            );

        } else if (
            imagen?.arrayBuffer
        ) {

            const datos =
                await imagen.arrayBuffer();

            buffer = Buffer.from(
                datos
            );

        } else {

            throw new Error(
                'Hugging Face devolvió un formato de imagen desconocido.'
            );
        }


        if (
            !buffer ||
            !buffer.length
        ) {

            throw new Error(
                'La imagen generada está vacía.'
            );
        }


        // Solo gastamos una generación
        // si realmente se creó la imagen.

        consumirImagen();


        console.log(
            '✅ Imagen generada correctamente.'
        );

        return buffer;

    } catch (error) {

        console.error(
            '❌ ERROR GENERANDO IMAGEN:'
        );

        console.error(error);

        if (
            error?.status === 401 ||
            error?.statusCode === 401
        ) {

            throw new Error(
                'El token de Hugging Face no es válido.'
            );
        }

        if (
            error?.status === 429 ||
            error?.statusCode === 429
        ) {

            throw new Error(
                'Hugging Face alcanzó temporalmente el límite de solicitudes.'
            );
        }

        throw new Error(
            'No se pudo generar la imagen. Inténtalo nuevamente.'
        );
    }
}


// =========================
// EXPORTAR
// =========================

module.exports = {

    generarImagen,

    obtenerLimiteImagenes,

    consumirImagen,

    esNSFW,

    LIMITE_DIARIO,

    MODELO_IMAGEN

};
