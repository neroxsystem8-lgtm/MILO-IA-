// moderacion.js

const PALABRAS_PROHIBIDAS = [
    'puto',
    'puta',
    'pendejo',
    'pendeja',
    'idiota',
    'estupido',
    'estúpido',
    'estupida',
    'estúpida',
    'imbecil',
    'imbécil'
];

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function detectarInsulto(texto) {
    const contenido = normalizarTexto(texto);

    return PALABRAS_PROHIBIDAS.some(
        palabra => contenido.includes(palabra)
    );
}

async function revisarMensaje(message) {

    if (!message || message.author?.bot) {
        return false;
    }

    if (!detectarInsulto(message.content)) {
        return false;
    }

    try {
        if (message.deletable) {
            await message.delete();
        }

        await message.channel.send({
            content: `⚠️ ${message.author}, evita utilizar insultos u ofensas en el servidor.`,
            allowedMentions: {
                users: [message.author.id]
            }
        });

        return true;

    } catch (error) {
        console.error('Error en el sistema antiinsultos:', error);
        return false;
    }
}

module.exports = {
    revisarMensaje,
    detectarInsulto
};
