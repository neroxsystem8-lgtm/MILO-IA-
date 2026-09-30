const {
    EmbedBuilder
} = require('discord.js');

const {
    guardarSancion,
    obtenerSancion,
    eliminarSancion,
    obtenerSancionesActivas,
    sancionExpirada,
    actualizarEstado
} = require('./sancion');

/*
========================================
CONFIGURACIÓN
========================================
*/

const SERVIDOR_GLOBAL =
    '1553169784697528450';

const ROL_GLOBAL =
    '1553526636547280967';

const CANAL_LOGS =
    '1553774248324104232';

/*
========================================
TEMPORIZADORES
========================================
*/

const temporizadores =
    new Map();

/*
========================================
PARSEAR DURACIÓN
========================================
*/

function calcularDuracion(texto) {

    if (!texto) {
        throw new Error(
            'Debes indicar una duración.'
        );
    }

    const original =
        String(texto)
            .trim()
            .toLowerCase();

    const normalizado =
        original
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            )
            .replace(/,/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

    if (
        normalizado === 'permanente' ||
        normalizado === 'permanente' ||
        normalizado === 'perm' ||
        normalizado === 'perma'
    ) {
        return {
            permanente: true,
            fechaExpiracion: null,
            texto: 'Permanente'
        };
    }

    /*
    ========================================
    FORMATO CORTO
    Ejemplo:
    10m
    5h
    2d
    3w
    6mo
    2y
    ========================================
    */

    const corto =
        normalizado.match(
            /^(\d+)\s*(mo|m|h|d|w|y)$/
        );

    if (corto) {

        const cantidad =
            Number(corto[1]);

        const unidad =
            corto[2];

        const ahora =
            new Date();

        const fecha =
            new Date(ahora);

        if (unidad === 'm') {
            fecha.setMinutes(
                fecha.getMinutes() +
                cantidad
            );
        }

        if (unidad === 'h') {
            fecha.setHours(
                fecha.getHours() +
                cantidad
            );
        }

        if (unidad === 'd') {
            fecha.setDate(
                fecha.getDate() +
                cantidad
            );
        }

        if (unidad === 'w') {
            fecha.setDate(
                fecha.getDate() +
                cantidad * 7
            );
        }

        if (unidad === 'mo') {
            fecha.setMonth(
                fecha.getMonth() +
                cantidad
            );
        }

        if (unidad === 'y') {
            fecha.setFullYear(
                fecha.getFullYear() +
                cantidad
            );
        }

        return {
            permanente: false,
            fechaExpiracion: fecha,
            texto: original
        };
    }

    /*
    ========================================
    DURACIÓN EN ESPAÑOL
    ========================================

    Ejemplos:

    10 minutos
    5 horas
    2 días
    3 semanas
    6 meses
    2 años

    1 año 6 meses
    2 meses 15 días
    ========================================
    */

    const patron =
        /(\d+)\s*(minuto|minutos|hora|horas|dia|dias|semana|semanas|mes|meses|ano|anos)/g;

    const partes = [];

    let coincidencia;

    while (
        (coincidencia =
            patron.exec(normalizado))
    ) {
        partes.push({
            cantidad:
                Number(
                    coincidencia[1]
                ),
            unidad:
                coincidencia[2]
        });
    }

    if (!partes.length) {
        throw new Error(
            'Duración inválida. Usa ejemplos como 10m, 5h, 2d, 6mo, 2y o "6 meses".'
        );
    }

    const fecha =
        new Date();

    for (const parte of partes) {

        const cantidad =
            parte.cantidad;

        const unidad =
            parte.unidad;

        if (
            unidad === 'minuto' ||
            unidad === 'minutos'
        ) {
            fecha.setMinutes(
                fecha.getMinutes() +
                cantidad
            );
        }

        else if (
            unidad === 'hora' ||
            unidad === 'horas'
        ) {
            fecha.setHours(
                fecha.getHours() +
                cantidad
            );
        }

        else if (
            unidad === 'dia' ||
            unidad === 'dias'
        ) {
            fecha.setDate(
                fecha.getDate() +
                cantidad
            );
        }

        else if (
            unidad === 'semana' ||
            unidad === 'semanas'
        ) {
            fecha.setDate(
                fecha.getDate() +
                cantidad * 7
            );
        }

        else if (
            unidad === 'mes' ||
            unidad === 'meses'
        ) {
            fecha.setMonth(
                fecha.getMonth() +
                cantidad
            );
        }

        else if (
            unidad === 'ano' ||
            unidad === 'anos'
        ) {
            fecha.setFullYear(
                fecha.getFullYear() +
                cantidad
            );
        }
    }

    return {
        permanente: false,
        fechaExpiracion: fecha,
        texto: original
    };
}

/*
========================================
COMPROBAR PERMISOS
========================================
*/

function puedeModerarGlobal(interaction) {

    if (
        !interaction ||
        interaction.guildId !==
        SERVIDOR_GLOBAL
    ) {
        return false;
    }

    return Boolean(
        interaction.member?.roles?.cache?.has(
            ROL_GLOBAL
        )
    );
}

/*
========================================
OBTENER USUARIO
========================================
*/

async function obtenerUsuario(
    client,
    usuarioId
) {

    if (!usuarioId) {
        return null;
    }

    try {
        return await client.users.fetch(
            usuarioId
        );
    } catch {
        return null;
    }
}

/*
========================================
ENVIAR LOG
========================================
*/

async function enviarLog(
    client,
    datos
) {

    try {

        const canal =
            await client.channels.fetch(
                CANAL_LOGS
            );

        if (
            !canal ||
            !canal.isTextBased()
        ) {
            return;
        }

        const embed =
            new EmbedBuilder()
                .setColor(
                    datos.tipo === 'unban'
                        ? 0x57F287
                        : 0xED4245
                )
                .setTitle(
                    datos.tipo === 'unban'
                        ? '🔓 Usuario desbaneado'
                        : '🔨 Usuario sancionado'
                )
                .addFields(
                    {
                        name: '👤 Usuario',
                        value:
                            datos.usuario
                                ? `${datos.usuario.tag || datos.usuario.username}`
                                : 'Desconocido',
                        inline: true
                    },
                    {
                        name: '🆔 ID',
                        value:
                            datos.usuarioId ||
                            'Desconocido',
                        inline: true
                    },
                    {
                        name: '📋 Razón',
                        value:
                            datos.razon ||
                            'Sin razón especificada',
                        inline: false
                    },
                    {
                        name: '⏱️ Duración',
                        value:
                            datos.duracion ||
                            'No especificada',
                        inline: true
                    },
                    {
                        name: '👮 Moderador',
                        value:
                            datos.moderadorId
                                ? `<@${datos.moderadorId}>`
                                : 'Sistema',
                        inline: true
                    },
                    {
                        name: '🌐 Servidor',
                        value:
                            datos.guild?.name ||
                            'Servidor global',
                        inline: true
                    }
                )
                .setTimestamp();

        if (datos.prueba) {

            embed.addFields({
                name: '📎 Pruebas',
                value:
                    datos.prueba,
                inline: false
            });
        }

        if (datos.error) {

            embed.addFields({
                name: '⚠️ Errores',
                value:
                    datos.error,
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

/*
========================================
ENVIAR DM
========================================
*/

async function enviarDM(
    usuario,
    datos
) {

    if (!usuario) {
        return false;
    }

    try {

        const embed =
            new EmbedBuilder()
                .setColor(
                    datos.tipo === 'unban'
                        ? 0x57F287
                        : 0xED4245
                )
                .setTitle(
                    datos.tipo === 'unban'
                        ? '🔓 Has sido desbaneado'
                        : '🔨 Has sido sancionado globalmente'
                )
                .setDescription(
                    datos.tipo === 'unban'
                        ? 'Tu sanción global ha sido retirada.'
                        : 'Has recibido una sanción global en Milo.'
                )
                .addFields(
                    {
                        name: '📋 Razón',
                        value:
                            datos.razon ||
                            'Sin razón especificada'
                    },
                    {
                        name: '⏱️ Duración',
                        value:
                            datos.duracion ||
                            'Permanente'
                    }
                )
                .setTimestamp();

        if (datos.prueba) {

            embed.addFields({
                name: '📎 Pruebas',
                value:
                    datos.prueba
            });
        }

        await usuario.send({
            embeds: [embed]
        });

        return true;

    } catch {
        return false;
    }
}

/*
========================================
BANEAR EN TODOS LOS SERVIDORES
========================================
*/

async function banearEnTodosLosServidores(
    client,
    usuarioId,
    razon
) {

    const resultados = [];

    for (
        const guild
        of client.guilds.cache.values()
    ) {

        try {

            await guild.members.ban(
                usuarioId,
                {
                    reason:
                        razon
                }
            );

            resultados.push({
                guildId:
                    guild.id,
                guildName:
                    guild.name,
                correcto:
                    true
            });

        } catch (error) {

            resultados.push({
                guildId:
                    guild.id,
                guildName:
                    guild.name,
                correcto:
                    false,
                error:
                    error.message
            });
        }
    }

    return resultados;
}

/*
========================================
DESBANEAR EN TODOS LOS SERVIDORES
========================================
*/

async function desbanearEnTodosLosServidores(
    client,
    usuarioId,
    razon
) {

    const resultados = [];

    for (
        const guild
        of client.guilds.cache.values()
    ) {

        try {

            await guild.bans.remove(
                usuarioId,
                razon
            );

            resultados.push({
                guildId:
                    guild.id,
                guildName:
                    guild.name,
                correcto:
                    true
            });

        } catch (error) {

            resultados.push({
                guildId:
                    guild.id,
                guildName:
                    guild.name,
                correcto:
                    false,
                error:
                    error.message
            });
        }
    }

    return resultados;
}

/*
========================================
PROGRAMAR DESBANEO
========================================
*/

function programarDesbaneo(
    client,
    usuarioId,
    fechaExpiracion
) {

    if (!fechaExpiracion) {
        return;
    }

    if (
        temporizadores.has(
            usuarioId
        )
    ) {

        clearTimeout(
            temporizadores.get(
                usuarioId
            )
        );
    }

    const ejecutar =
        async () => {

            try {

                const sancion =
                    obtenerSancion(
                        usuarioId
                    );

                if (!sancion) {
                    return;
                }

                if (
                    sancion.permanente
                ) {
                    return;
                }

                if (
                    !sancionExpirada(
                        usuarioId
                    )
                ) {

                    programarDesbaneo(
                        client,
                        usuarioId,
                        sancion.fechaExpiracion
                    );

                    return;
                }

                console.log(
                    `⏰ Desbaneando ${usuarioId}...`
                );

                await desbanearEnTodosLosServidores(
                    client,
                    usuarioId,
                    'Expiración automática de sanción global'
                );

                actualizarEstado(
                    usuarioId,
                    'expirado'
                );

                eliminarSancion(
                    usuarioId
                );

                temporizadores.delete(
                    usuarioId
                );

                console.log(
                    `✅ Sanción de ${usuarioId} expirada.`
                );

            } catch (error) {

                console.error(
                    `❌ Error expirando sanción ${usuarioId}:`,
                    error
                );
            }
        };

    const diferencia =
        new Date(
            fechaExpiracion
        ).getTime() -
        Date.now();

    /*
    Node.js no permite un setTimeout
    superior a ~24.8 días.

    Por eso dividimos duraciones
    largas en bloques.
    */

    const MAX_TIMEOUT =
        2147483647;

    const tiempo =
        Math.min(
            Math.max(
                diferencia,
                0
            ),
            MAX_TIMEOUT
        );

    const timeout =
        setTimeout(
            ejecutar,
            tiempo
        );

    temporizadores.set(
        usuarioId,
        timeout
    );
}

/*
========================================
RESTAURAR SANCIONES AL INICIAR
========================================
*/

async function restaurarSanciones(
    client
) {

    const sanciones =
        obtenerSancionesActivas();

    console.log(
        `🛡️ Restaurando ${sanciones.length} sanciones globales...`
    );

    for (
        const sancion
        of sanciones
    ) {

        if (
            sancion.permanente
        ) {

            await banearEnTodosLosServidores(
                client,
                sancion.usuarioId,
                sancion.razon
            );

            continue;
        }

        if (
            sancionExpirada(
                sancion.usuarioId
            )
        ) {

            await desbanearEnTodosLosServidores(
                client,
                sancion.usuarioId,
                'Sanción temporal expirada'
            );

            eliminarSancion(
                sancion.usuarioId
            );

            continue;
        }

        await banearEnTodosLosServidores(
            client,
            sancion.usuarioId,
            sancion.razon
        );

        programarDesbaneo(
            client,
            sancion.usuarioId,
            sancion.fechaExpiracion
        );
    }
}

/*
========================================
BAN GLOBAL
========================================
*/

async function banGlobal({
    client,
    guild,
    usuarioId,
    razon,
    tiempo,
    prueba = null,
    moderadorId
}) {

    if (!client) {
        throw new Error(
            'El cliente de Discord es obligatorio.'
        );
    }

    if (!usuarioId) {
        throw new Error(
            'El ID del usuario es obligatorio.'
        );
    }

    if (!razon) {
        throw new Error(
            'La razón es obligatoria.'
        );
    }

    if (!tiempo) {
        throw new Error(
            'La duración es obligatoria.'
        );
    }

    const duracion =
        calcularDuracion(
            tiempo
        );

    const usuario =
        await obtenerUsuario(
            client,
            usuarioId
        );

    const resultados =
        await banearEnTodosLosServidores(
            client,
            usuarioId,
            razon
        );

    const sancion =
        guardarSancion({
            usuarioId,
            usuario:
                usuario?.tag ||
                usuario?.username ||
                null,
            razon,
            duracionTexto:
                duracion.texto,
            permanente:
                duracion.permanente,
            fechaInicio:
                new Date(),
            fechaExpiracion:
                duracion.fechaExpiracion,
            moderadorId,
            prueba,
            estado:
                'baneado'
        });

    /*
    Programar expiración
    */

    if (
        !duracion.permanente &&
        duracion.fechaExpiracion
    ) {

        programarDesbaneo(
            client,
            usuarioId,
            duracion.fechaExpiracion
        );
    }

    /*
    DM
    */

    await enviarDM(
        usuario,
        {
            tipo: 'ban',
            razon,
            duracion:
                duracion.permanente
                    ? 'Permanente'
                    : duracion.texto,
            prueba
        }
    );

    /*
    Log
    */

    const errores =
        resultados
            .filter(
                resultado =>
                    !resultado.correcto
            )
            .map(
                resultado =>
                    `${resultado.guildName}: ${resultado.error}`
            )
            .join('\n');

    await enviarLog(
        client,
        {
            tipo: 'ban',
            usuario,
            usuarioId,
            razon,
            duracion:
                duracion.permanente
                    ? 'Permanente'
                    : duracion.texto,
            prueba,
            moderadorId,
            guild,
            error:
                errores || null
        }
    );

    return {
        sancion,
        resultados,
        usuario
    };
}

/*
========================================
UNBAN GLOBAL
========================================
*/

async function unbanGlobal({
    client,
    guild,
    usuarioId,
    razon,
    prueba = null,
    moderadoId
}) {

    if (!client) {
        throw new Error(
            'El cliente de Discord es obligatorio.'
        );
    }

    if (!usuarioId) {
        throw new Error(
            'El ID del usuario es obligatorio.'
        );
    }

    if (!razon) {
        throw new Error(
            'La razón es obligatoria.'
        );
    }

    const usuario =
        await obtenerUsuario(
            client,
            usuarioId
        );

    const resultados =
        await desbanearEnTodosLosServidores(
            client,
            usuarioId,
            razon
        );

    if (
        temporizadores.has(
            usuarioId
        )
    ) {

        clearTimeout(
            temporizadores.get(
                usuarioId
            )
        );

        temporizadores.delete(
            usuarioId
        );
    }

    eliminarSancion(
        usuarioId
    );

    await enviarDM(
        usuario,
        {
            tipo: 'unban',
            razon,
            duracion:
                'Sanción retirada',
            prueba
        }
    );

    const errores =
        resultados
            .filter(
                resultado =>
                    !resultado.correcto
            )
            .map(
                resultado =>
                    `${resultado.guildName}: ${resultado.error}`
            )
            .join('\n');

    await enviarLog(
        client,
        {
            tipo: 'unban',
            usuario,
            usuarioId,
            razon,
            duracion:
                'Sanción retirada',
            prueba,
            moderadorId,
            guild,
            error:
                errores || null
        }
    );

    return {
        resultados,
        usuario
    };
}

/*
========================================
EXPORTAR
========================================
*/

module.exports = {
    SERVIDOR_GLOBAL,
    ROL_GLOBAL,
    CANAL_LOGS,

    puedeModerarGlobal,

    calcularDuracion,

    banGlobal,
    unbanGlobal,

    restaurarSanciones,

    programarDesbaneo,

    banearEnTodosLosServidores,
    desbanearEnTodosLosServidores
};
