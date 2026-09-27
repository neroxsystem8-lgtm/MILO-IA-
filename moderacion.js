const {
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    puedeUsarGlobal
} = require('./comandos');

// ==========================================
// ⚙️ CONFIGURACIÓN
// ==========================================

const CANAL_LOGS_GLOBAL = '1553774248324104232';

// ==========================================
// ⏱️ CONVERTIR TIEMPO
// ==========================================

function convertirTiempo(tiempo) {

    if (!tiempo) return null;

    const texto =
        tiempo.toLowerCase().trim();

    if (
        texto === 'permanente' ||
        texto === 'perm' ||
        texto === 'perma'
    ) {
        return null;
    }

    const coincidencia =
        texto.match(/^(\d+)\s*(s|m|h|d|w)$/i);

    if (!coincidencia) {
        return undefined;
    }

    const cantidad =
        Number(coincidencia[1]);

    const unidad =
        coincidencia[2].toLowerCase();

    const unidades = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000
    };

    return cantidad * unidades[unidad];
}

// ==========================================
// 🕐 FORMATEAR TIEMPO
// ==========================================

function formatearTiempo(tiempo) {

    if (tiempo === null) {
        return 'Permanente';
    }

    if (tiempo === undefined) {
        return 'Tiempo inválido';
    }

    const segundos =
        Math.floor(tiempo / 1000);

    if (segundos < 60) {
        return `${segundos}s`;
    }

    const minutos =
        Math.floor(segundos / 60);

    if (minutos < 60) {
        return `${minutos}m`;
    }

    const horas =
        Math.floor(minutos / 60);

    if (horas < 24) {
        return `${horas}h`;
    }

    const dias =
        Math.floor(horas / 24);

    if (dias < 7) {
        return `${dias}d`;
    }

    const semanas =
        Math.floor(dias / 7);

    return `${semanas}w`;
}

// ==========================================
// 📋 ENVIAR LOG GLOBAL
// ==========================================

async function enviarLogGlobal(
    client,
    datos
) {

    try {

        const canal =
            await client.channels.fetch(
                CANAL_LOGS_GLOBAL
            );

        if (
            !canal ||
            !canal.isTextBased()
        ) {
            console.error(
                '❌ No se encontró el canal de logs global.'
            );

            return;
        }

        const embed =
            new EmbedBuilder()
                .setColor(
                    datos.tipo === 'BAN GLOBAL'
                        ? 0xff0000
                        : 0x00ff66
                )
                .setTitle(
                    datos.tipo
                )
                .addFields(
                    {
                        name: '👤 Usuario',
                        value:
                            `<@${datos.usuarioId}>`,
                        inline: true
                    },
                    {
                        name: '🆔 ID',
                        value:
                            datos.usuarioId,
                        inline: true
                    },
                    {
                        name: '🛡️ Moderador',
                        value:
                            `${datos.moderador}\n${datos.moderadorId}`,
                        inline: true
                    },
                    {
                        name: '🏠 Servidor',
                        value:
                            `${datos.servidor}\n${datos.servidorId}`,
                        inline: false
                    },
                    {
                        name: '📝 Razón',
                        value:
                            datos.razon || 'Sin razón',
                        inline: false
                    }
                )
                .setTimestamp();

        if (datos.tiempo) {

            embed.addFields({
                name: '⏱️ Duración',
                value: datos.tiempo,
                inline: true
            });
        }

        if (datos.prueba) {

            embed.addFields({
                name: '📎 Prueba',
                value: datos.prueba,
                inline: false
            });
        }

        if (datos.errores?.length) {

            embed.addFields({
                name: '⚠️ Errores',
                value:
                    datos.errores
                        .slice(0, 10)
                        .join('\n')
                        .slice(0, 1024),
                inline: false
            });
        }

        await canal.send({
            embeds: [embed]
        });

    } catch (error) {

        console.error(
            '❌ Error enviando log global:',
            error
        );
    }
}

// ==========================================
// 📩 ENVIAR MD AL USUARIO
// ==========================================

async function enviarDM(
    client,
    usuarioId,
    embed
) {

    try {

        const usuario =
            await client.users.fetch(
                usuarioId
            );

        await usuario.send({
            embeds: [embed]
        });

        return true;

    } catch (error) {

        console.error(
            `❌ No se pudo enviar MD a ${usuarioId}:`,
            error.message
        );

        return false;
    }
}

// ==========================================
// 🔨 BAN GLOBAL
// ==========================================

async function banGlobal(
    client,
    usuarioId,
    razon,
    tiempoTexto,
    prueba,
    moderador
) {

    const tiempo =
        convertirTiempo(tiempoTexto);

    if (tiempo === undefined) {

        throw new Error(
            'Tiempo inválido. Usa permanente, 1h, 1d, 7d, 30d, etc.'
        );
    }

    const errores = [];
    let baneados = 0;

    // ======================================
    // 📩 AVISAR AL USUARIO
    // ======================================

    const dmEmbed =
        new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('🔨 Has recibido un Ban Global')
            .setDescription(
                'Milo ha aplicado una sanción global a tu cuenta.'
            )
            .addFields(
                {
                    name: '📝 Razón',
                    value: razon,
                    inline: false
                },
                {
                    name: '⏱️ Duración',
                    value:
                        formatearTiempo(tiempo),
                    inline: true
                },
                {
                    name: '🛡️ Moderador',
                    value:
                        `${moderador.tag || moderador.username}`,
                    inline: true
                }
            )
            .setTimestamp();

    if (prueba) {

        dmEmbed.addFields({
            name: '📎 Evidencia',
            value: prueba.url,
            inline: false
        });
    }

    await enviarDM(
        client,
        usuarioId,
        dmEmbed
    );

    // ======================================
    // 🌎 BANEAR EN TODOS LOS SERVIDORES
    // ======================================

    for (const guild of client.guilds.cache.values()) {

        try {

            const botMember =
                guild.members.me;

            if (
                !botMember ||
                !botMember.permissions.has(
                    PermissionFlagsBits.BanMembers
                )
            ) {
                errores.push(
                    `${guild.name}: Milo no tiene permiso para banear.`
                );

                continue;
            }

            await guild.members.ban(
                usuarioId,
                {
                    deleteMessageSeconds: 0,
                    reason:
                        `BAN GLOBAL | ${razon}`
                }
            );

            baneados++;

        } catch (error) {

            // Si ya estaba baneado, no lo tratamos
            // como un fallo importante.

            if (
                error.code === 10026 ||
                error.code === 10007
            ) {
                continue;
            }

            errores.push(
                `${guild.name}: ${error.message}`
            );
        }
    }

    // ======================================
    // 📊 LOG GLOBAL
    // ======================================

    await enviarLogGlobal(
        client,
        {
            tipo: '🔨 BAN GLOBAL',
            usuarioId,
            razon,
            tiempo:
                formatearTiempo(tiempo),
            prueba:
                prueba?.url || null,
            moderador:
                moderador.tag ||
                moderador.username,
            moderadorId:
                moderador.id,
            servidor:
                moderador.guild?.name ||
                'Servidor desconocido',
            servidorId:
                moderador.guild?.id ||
                'Desconocido',
            errores
        }
    );

    // ======================================
    // ⏱️ DESBAN AUTOMÁTICO
    // ======================================

    if (tiempo !== null) {

        setTimeout(
            async () => {

                await unbanGlobal(
                    client,
                    usuarioId,
                    'Finalización automática del Ban Global',
                    true
                );

            },
            tiempo
        );
    }

    return {
        baneados,
        errores,
        tiempo
    };
}

// ==========================================
// 🔓 UNBAN GLOBAL
// ==========================================

async function unbanGlobal(
    client,
    usuarioId,
    razon,
    automatico = false
) {

    const errores = [];
    let desbloqueados = 0;

    for (const guild of client.guilds.cache.values()) {

        try {

            const botMember =
                guild.members.me;

            if (
                !botMember ||
                !botMember.permissions.has(
                    PermissionFlagsBits.BanMembers
                )
            ) {
                errores.push(
                    `${guild.name}: Milo no tiene permiso.`
                );

                continue;
            }

            await guild.bans.remove(
                usuarioId,
                razon
            );

            desbloqueados++;

        } catch (error) {

            // 10026 = usuario no está baneado
            if (error.code === 10026) {
                continue;
            }

            errores.push(
                `${guild.name}: ${error.message}`
            );
        }
    }

    // ======================================
    // 📩 AVISAR AL USUARIO
    // ======================================

    const dmEmbed =
        new EmbedBuilder()
            .setColor(0x00ff66)
            .setTitle('🔓 Ban Global retirado')
            .setDescription(
                automatico
                    ? 'Tu Ban Global ha finalizado automáticamente.'
                    : 'Tu Ban Global ha sido retirado.'
            )
            .addFields({
                name: '📝 Razón',
                value: razon,
                inline: false
            })
            .setTimestamp();

    await enviarDM(
        client,
        usuarioId,
        dmEmbed
    );

    // ======================================
    // 📊 LOG
    // ======================================

    await enviarLogGlobal(
        client,
        {
            tipo: '🔓 UNBAN GLOBAL',
            usuarioId,
            razon,
            moderador:
                automatico
                    ? 'Sistema automático'
                    : 'Moderador',
            moderadorId:
                automatico
                    ? 'Sistema'
                    : 'Desconocido',
            servidor:
                'Sistema Global',
            servidorId:
                'Global',
            errores
        }
    );

    return {
        desbloqueados,
        errores
    };
}

// ==========================================
// 📦 EXPORTAR
// ==========================================

module.exports = {
    puedeUsarGlobal,
    banGlobal,
    unbanGlobal,
    convertirTiempo,
    formatearTiempo
};
