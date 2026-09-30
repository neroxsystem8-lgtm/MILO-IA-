const { InferenceClient } = require('@huggingface/inference');

const HF_TOKEN = process.env.HF_TOKEN;

const MODELO_IMAGEN =
    process.env.HF_IMAGE_MODEL ||
    'black-forest-labs/FLUX.1-schnell';

const hf = HF_TOKEN
    ? new InferenceClient(HF_TOKEN)
    : null;

/*
=========================
DETECTAR NSFW
=========================
*/

function esNSFW(prompt) {
    if (!prompt || !prompt.trim()) {
        return false;
    }

    const palabras = [
        'nsfw',
        'porn',
        'pornografia',
        'pornografía',
        'porno',
        'desnudo',
        'desnuda',
        'desnudos',
        'desnudas',
        'sexo explicito',
        'sexo explícito',
        'sexual explicito',
        'sexual explícito',
        'genitales',
        'xxx',
        'erotico explicito',
        'erótico explícito'
    ];

    const texto = String(prompt)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    return palabras.some(palabra => {
        const palabraNormalizada =
            palabra
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

        return texto.includes(
            palabraNormalizada
        );
    });
}

/*
=========================
GENERAR IMAGEN
=========================
*/

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

    if (!prompt || !prompt.trim()) {
        throw new Error(
            'Debes proporcionar una descripción para la imagen.'
        );
    }

    /*
    =========================
    BLOQUEO NSFW
    =========================
    */

    if (esNSFW(prompt)) {
        throw new Error(
            'Milo no puede generar imágenes con contenido NSFW.'
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

        let buffer;

        /*
        =========================
        CONVERTIR RESPUESTA
        =========================
        */

        if (Buffer.isBuffer(imagen)) {

            buffer = imagen;

        } else if (
            imagen instanceof ArrayBuffer
        ) {

            buffer =
                Buffer.from(imagen);

        } else if (
            imagen?.arrayBuffer
        ) {

            const datos =
                await imagen.arrayBuffer();

            buffer =
                Buffer.from(datos);

        } else {

            throw new Error(
                'Hugging Face devolvió un formato de imagen desconocido.'
            );
        }

        /*
        =========================
        COMPROBAR IMAGEN
        =========================
        */

        if (
            !buffer ||
            !buffer.length
        ) {
            throw new Error(
                'La imagen generada está vacía.'
            );
        }

        console.log(
            '✅ Imagen generada correctamente.'
        );

        return buffer;

    } catch (error) {

        console.error(
            '❌ ERROR GENERANDO IMAGEN:'
        );

        console.error(error);

        /*
        =========================
        ERRORES DE AUTORIZACIÓN
        =========================
        */

        if (
            error?.status === 401 ||
            error?.statusCode === 401
        ) {
            throw new Error(
                'El token de Hugging Face no es válido.'
            );
        }

        /*
        =========================
        LÍMITE DEL PROVEEDOR
        =========================
        */

        if (
            error?.status === 429 ||
            error?.statusCode === 429
        ) {
            throw new Error(
                'Hugging Face alcanzó temporalmente el límite de solicitudes. Inténtalo nuevamente más tarde.'
            );
        }

        /*
        =========================
        ERROR GENERAL
        =========================
        */

        throw new Error(
            'No se pudo generar la imagen. Inténtalo nuevamente.'
        );
    }
}

/*
=========================
EXPORTAR
=========================
*/

module.exports = {
    generarImagen,
    esNSFW,
    MODELO_IMAGEN
};
