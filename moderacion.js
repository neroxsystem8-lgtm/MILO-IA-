const {
    EmbedBuilder
} = require('discord.js');

const SERVIDOR_GLOBAL = '1553169784697528450';
const ROL_GLOBAL = '1553526636547280967';

// ==========================================
// ANTIINSULTOS
// ==========================================

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

    const contenido =
        normalizarTexto(texto);

    return PALABRAS_PROHIBIDAS.some(
        palabra =>
            contenido.includes(
                normalizarTexto(palabra)
            )
    );
}

async function revisarMensaje(message) {

    if (
        !message ||
        message.author?.bot
    ) {
        return false;
    }

    if (
        !detectarInsulto(
            message.content
        )
    ) {
        return false;
    }

    try {

        if (message.deletable) {
            await message.delete();
        }

        await message.channel.send({
            content:
                `⚠️ ${message.author}, evita utilizar insultos u ofensas en el servidor.`,
            allowedMentions: {
                users: [
                    message.author.id
                ]
            }
        });

        return true;

    } catch (error) {

        console.error(
            'Error en antiinsultos:',
            error
        );

        return false;
    }
}

// ==========================================
// VERIFICAR PERMISO GLOBAL
// ==========================================

function puedeUsarGlobal(interaction) {

    if (
        interaction.guildId !==
        SERVIDOR_GLOBAL
    ) {
        return false;
    }

    if (
        !interaction.member?.roles?.cache?.has(
            ROL_GLOBAL
        )
    ) {
        return false;
    }

    return true;
}

// ==========================================
// BAN GLOBAL
// ==========================================

async function banGlobal(
    client,
    usuarioId,
    razon,
    prueba
) {

    const resultados = [];

    for (const guild of client.guilds.cache.values()) {

        try {

            const miembro =
                await guild.members.fetch(
                    usuarioId
                ).catch(() => null);

            if (!miembro) {
                continue;
            }

            if (!guild.members.me.permissions.has('BanMembers')) {
                resultados.push({
                    guild: guild.name,
                    estado: 'sin permisos'
                });

                continue;
            }

            await miembro.ban({
                reason:
                    `BAN GLOBAL: ${razon}`
            });

            resultados.push({
                guild: guild.name,
                estado: 'baneado'
            });

        } catch (error) {

            resultados.push({
                guild: guild.name,
                estado: 'error'
            });

            console.error(
                `Error baneando en ${guild.name}:`,
                error
            );
        }
    }

    return resultados;
}

// ==========================================
// UNBAN GLOBAL
// ==========================================

async function unbanGlobal(
    client,
    usuarioId,
    razon
) {

    const resultados = [];

    for (const guild of client.guilds.cache.values()) {

        try {

            const ban =
                await guild.bans.fetch(
                    usuarioId
                ).catch(() => null);

            if (!ban) {
                continue;
            }

            if (
                !guild.members.me.permissions.has(
                    'BanMembers'
                )
            ) {
                resultados.push({
                    guild: guild.name,
                    estado: 'sin permisos'
                });

                continue;
            }

            await guild.members.unban(
                usuarioId,
                `UNBAN GLOBAL: ${razon}`
            );

            resultados.push({
                guild: guild.name,
                estado: 'desbaneado'
            });

        } catch (error) {

            resultados.push({
                guild: guild.name,
                estado: 'error'
            });

            console.error(
                `Error desbaneando en ${guild.name}:`,
                error
            );
        }
    }

    return resultados;
}

// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    revisarMensaje,
    detectarInsulto,
    puedeUsarGlobal,
    banGlobal,
    unbanGlobal,
    SERVIDOR_GLOBAL,
    ROL_GLOBAL
};
