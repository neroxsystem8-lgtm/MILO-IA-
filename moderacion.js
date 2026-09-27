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
            '❌ Error en antiinsultos:',
            error
        );

        return false;
    }
}

// ==========================================
// PERMISOS GLOBALES
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
// OBTENER ID
// ==========================================

function obtenerIdUsuario(valor) {

    if (!valor) {
        return null;
    }

    const texto =
        String(valor).trim();

    // ID directo
    if (
        /^\d{17,20}$/.test(texto)
    ) {
        return texto;
    }

    // Mención <@123...>
    const mencion =
        texto.match(
            /^<@!?(\d{17,20})>$/
        );

    if (mencion) {
        return mencion[1];
    }

    return null;
}

// ==========================================
// TIEMPO
// ==========================================

function convertirTiempo(tiempo) {

    const valor =
        String(tiempo || '')
            .toLowerCase()
            .trim();

    if (
        valor === 'permanente' ||
        valor === 'perm' ||
        valor === 'perma'
    ) {
        return null;
    }

    const coincidencia =
        valor.match(
            /^(\d+)\s*(s|m|h|d|w)$/
        );

    if (!coincidencia) {
        return undefined;
    }

    const cantidad =
        Number(
            coincidencia[1]
        );

    const unidad =
        coincidencia[2];

    const multiplicadores = {

        s: 1000,

        m:
            60 * 1000,

        h:
            60 * 60 * 1000,

        d:
            24 * 60 * 60 * 1000,

        w:
            7 * 24 * 60 * 60 * 1000
    };

    return (
        cantidad *
        multiplicadores[unidad]
    );
}

// ==========================================
// FORMATO TIEMPO
// ==========================================

function formatearTiempo(tiempo) {

    if (tiempo === null) {
        return 'Permanente';
    }

    const segundos =
        Math.floor(
            tiempo / 1000
        );

    const dias =
        Math.floor(
            segundos / 86400
        );

    const horas =
        Math.floor(
            (segundos % 86400) /
            3600
        );

    const minutos =
        Math.floor(
            (segundos % 3600) /
            60
        );

    const partes = [];

    if (dias > 0) {
        partes.push(
            `${dias}d`
        );
    }

    if (horas > 0) {
        partes.push(
            `${horas}h`
        );
    }

    if (minutos > 0) {
        partes.push(
            `${minutos}m`
        );
    }

    if (
        partes.length === 0
    ) {
        partes.push('<1m');
    }

    return partes.join(' ');
}

// ==========================================
// BAN GLOBAL
// ==========================================

async function banGlobal(
    client,
    usuarioId,
    razon,
    tiempoTexto,
    prueba,
    moderador
) {

    const id =
        obtenerIdUsuario(
            usuarioId
        );

    if (!id) {

        return [
            {
                estado: 'error',
                mensaje:
                    'ID de usuario inválido.'
            }
        ];
    }

    const duracion =
        convertirTiempo(
            tiempoTexto
        );

    if (
        duracion === undefined
    ) {

        return [
            {
                estado: 'error',
                mensaje:
                    'Tiempo inválido.'
            }
        ];
    }

    const resultados = [];

    // ======================================
    // RECORRER SERVIDORES
    // ======================================

    for (
        const guild
        of client.guilds.cache.values()
    ) {

        try {

            const miembro =
                await guild.members
                    .fetch(id)
                    .catch(
                        () => null
                    );

            if (!miembro) {
                continue;
            }

            const botMember =
                guild.members.me;

            if (!botMember) {
                continue;
            }

            if (
                !botMember.permissions.has(
                    'BanMembers'
                )
            ) {

                resultados.push({

                    guild:
                        guild.name,

                    guildId:
                        guild.id,

                    estado:
                        'sin permisos'
                });

                continue;
            }

            await miembro.ban({

                deleteMessageSeconds:
                    0,

                reason:
                    `BAN GLOBAL | ${razon}`
            });

            resultados.push({

                guild:
                    guild.name,

                guildId:
                    guild.id,

                estado:
                    'baneado'
            });

        } catch (error) {

            resultados.push({

                guild:
                    guild.name,

                guildId:
                    guild.id,

                estado:
                    'error'
            });

            console.error(
                `❌ Error baneando en ${guild.name}:`,
                error
            );
        }
    }

    // ======================================
    // EMBED
    // ======================================

    const embed =
        new EmbedBuilder()

            .setColor(
                0xFF0000
            )

            .setTitle(
                '🔨 BAN GLOBAL'
            )

            .setDescription(
                'Se ha aplicado un baneo global a un usuario.'
            )

            .addFields(

                {
                    name:
                        '👤 Usuario',

                    value:
                        `<@${id}>`,

                    inline:
                        true
                },

                {
                    name:
                        '🆔 ID',

                    value:
                        `\`${id}\``,

                    inline:
                        true
                },

                {
                    name:
                        '⏱️ Duración',

                    value:
                        formatearTiempo(
                            duracion
                        ),

                    inline:
                        true
                },

                {
                    name:
                        '📝 Razón',

                    value:
                        String(razon)
                            .slice(
                                0,
                                1024
                            ),

                    inline:
                        false
                },

                {
                    name:
                        '👮 Moderador',

                    value:
                        `<@${moderador.id}>`,

                    inline:
                        true
                }
            )

            .setTimestamp();

    if (prueba) {

        embed.addFields({

            name:
                '📸 Prueba',

            value:
                `[Ver evidencia](${prueba.url})`,

            inline:
                true
        });

        if (
            prueba.contentType?.startsWith(
                'image/'
            )
        ) {

            embed.setImage(
                prueba.url
            );
        }
    }

    // ======================================
    // ENVIAR AVISO EN TODOS LOS SERVIDORES
    // ======================================

    for (
        const guild
        of client.guilds.cache.values()
    ) {

        try {

            const canal =
                guild.systemChannel;

            if (
                !canal ||
                !canal.isTextBased()
            ) {
                continue;
            }

            const permisos =
                canal.permissionsFor(
                    guild.members.me
                );

            if (
                !permisos?.has(
                    'SendMessages'
                )
            ) {
                continue;
            }

            await canal.send({
                embeds: [
                    embed
                ]
            });

        } catch (error) {

            console.error(
                `❌ Error enviando aviso en ${guild.name}:`,
                error
            );
        }
    }

    // ======================================
    // BAN TEMPORAL
    // ======================================

    if (
        duracion !== null &&
        duracion !== undefined
    ) {

        setTimeout(
            async () => {

                for (
                    const guild
                    of client.guilds.cache.values()
                ) {

                    try {

                        await guild.members
                            .unban(
                                id,
                                'Fin del ban global temporal.'
                            )
                            .catch(
                                () => {}
                            );

                    } catch (error) {

                        console.error(
                            `❌ Error quitando ban temporal en ${guild.name}:`,
                            error
                        );
                    }
                }

            },
            duracion
        );
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

    const id =
        obtenerIdUsuario(
            usuarioId
        );

    if (!id) {

        return [
            {
                estado: 'error',
                mensaje:
                    'ID de usuario inválido.'
            }
        ];
    }

    const resultados = [];

    for (
        const guild
        of client.guilds.cache.values()
    ) {

        try {

            const ban =
                await guild.bans
                    .fetch(id)
                    .catch(
                        () => null
                    );

            if (!ban) {
                continue;
            }

            const botMember =
                guild.members.me;

            if (
                !botMember?.permissions.has(
                    'BanMembers'
                )
            ) {

                resultados.push({

                    guild:
                        guild.name,

                    estado:
                        'sin permisos'
                });

                continue;
            }

            await guild.members.unban(
                id,
                `UNBAN GLOBAL | ${razon}`
            );

            resultados.push({

                guild:
                    guild.name,

                estado:
                    'desbaneado'
            });

        } catch (error) {

            resultados.push({

                guild:
                    guild.name,

                estado:
                    'error'
            });

            console.error(
                `❌ Error desbaneando en ${guild.name}:`,
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

    obtenerIdUsuario,

    convertirTiempo,

    formatearTiempo,

    SERVIDOR_GLOBAL,

    ROL_GLOBAL
};
