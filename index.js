require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    AttachmentBuilder
} = require('discord.js');

/* =========================
   MÓDULOS
========================= */

const {
    registrarComandos,
    puedeUsarGlobal
} = require('./comandos');

const {
    preguntarGemini,
    modelo
} = require('./gemini');

const {
    generarImagen,
    obtenerLimiteImagenes
} = require('./imagenes');

const {
    obtenerIdioma,
    establecerIdioma,
    obtenerNombreIdioma
} = require('./idiomas');

const {
    calcularOperacion,
    traducir,
    resumir,
    obtenerHora,
    convertir
} = require('./utilidades');

const {
    banGlobal,
    unbanGlobal
} = require('./moderacion');

/* =========================
   CLIENTE
========================= */

const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,

        GatewayIntentBits.GuildMembers,

        GatewayIntentBits.GuildMessages,

        GatewayIntentBits.MessageContent,

        GatewayIntentBits.DirectMessages

    ],

    partials: [
        Partials.Channel
    ]

});

/* =========================
   CONFIGURACIÓN
========================= */

const TOKEN =
    process.env.DISCORD_TOKEN;

const PREFIX = '!';

/* =========================
   PROCESAR PREGUNTA
========================= */

async function procesarPregunta(
    message,
    pregunta
) {

    if (
        !pregunta ||
        !pregunta.trim()
    ) {

        return;

    }

    const idioma =
        obtenerIdioma(
            message.author.id
        );

    try {

        await message.react('🤔');

        const respuesta =
            await preguntarGemini(
                pregunta,
                idioma
            );

        try {
            await message.reactions.cache
                .get('🤔')
                ?.users.remove(
                    client.user.id
                );
        } catch {}

        await message.react('✅');

        const texto =
            String(respuesta);

        const partes = [];

        for (
            let i = 0;
            i < texto.length;
            i += 1900
        ) {

            partes.push(
                texto.substring(
                    i,
                    i + 1900
                )
            );

        }

        for (
            let i = 0;
            i < partes.length;
            i++
        ) {

            if (i === 0) {

                await message.reply(
                    `🤖 **Milo**\n\n${partes[i]}`
                );

            } else {

                await message.channel.send(
                    partes[i]
                );

            }

        }

    } catch (error) {

        console.error(
            '❌ Error procesando pregunta:',
            error
        );

        try {

            await message.reactions.cache
                .get('🤔')
                ?.users.remove(
                    client.user.id
                );

        } catch {}

        try {
            await message.react('❌');
        } catch {}

        await message.reply(
            '❌ Ocurrió un error al procesar tu pregunta.'
        );

    }

}

/* =========================
   EVENTO READY
========================= */

client.once(
    'ready',
    async () => {

        console.log(
            `✅ Milo conectado como ${client.user.tag}`
        );

        console.log(
            `🧠 Modelo: ${modelo}`
        );

        console.log(
            `🌐 Servidores: ${client.guilds.cache.size}`
        );

        client.user.setPresence({

            status: 'dnd',

            activities: [
                {
                    name:
                        '+10 bots en funcionamiento | /help',

                    type: 0
                }
            ]

        });

        try {

            await registrarComandos(
                client
            );

            console.log(
                '✅ Comandos registrados correctamente.'
            );

        } catch (error) {

            console.error(
                '❌ Error registrando comandos:',
                error
            );

        }

    }
);

/* =========================
   MENSAJES
========================= */

client.on(
    'messageCreate',
    async message => {

        if (
            message.author.bot
        ) {
            return;
        }

        let contenido =
            message.content.trim();

        if (
            !contenido
        ) {
            return;
        }

        const mencion =
            `<@${client.user.id}>`;

        const mencionNick =
            `<@!${client.user.id}>`;

        /* =========================
           MENCIÓN
        ========================= */

        if (
            contenido.startsWith(
                mencion
            ) ||
            contenido.startsWith(
                mencionNick
            )
        ) {

            contenido =
                contenido
                    .replace(
                        mencion,
                        ''
                    )
                    .replace(
                        mencionNick,
                        ''
                    )
                    .trim();

            if (
                contenido
            ) {

                await procesarPregunta(
                    message,
                    contenido
                );

            }

            return;

        }

        /* =========================
           PREFIX
        ========================= */

        if (
            contenido.startsWith(
                PREFIX
            )
        ) {

            const partes =
                contenido
                    .slice(
                        PREFIX.length
                    )
                    .trim()
                    .split(/\s+/);

            const comando =
                partes.shift()
                    ?.toLowerCase();

            const pregunta =
                partes.join(' ');

            if (
                comando === 'ia' ||
                comando === 'preguntar'
            ) {

                await procesarPregunta(
                    message,
                    pregunta
                );

            }

        }

    }
);

/* =========================
   INTERACCIONES
========================= */

client.on(
    'interactionCreate',
    async interaction => {

        if (
            !interaction.isChatInputCommand()
        ) {
            return;
        }

        const comando =
            interaction.commandName;

        try {

            /* =========================
               IA
            ========================= */

            if (
                comando === 'ia' ||
                comando === 'preguntar'
            ) {

                const pregunta =
                    interaction.options.getString(
                        'pregunta'
                    );

                if (
                    !pregunta
                ) {

                    return interaction.reply({
                        content:
                            '❌ Debes escribir una pregunta.',
                        ephemeral: true
                    });

                }

                const idioma =
                    obtenerIdioma(
                        interaction.user.id
                    );

                await interaction.deferReply();

                const respuesta =
                    await preguntarGemini(
                        pregunta,
                        idioma
                    );

                const texto =
                    String(respuesta);

                if (
                    texto.length <= 1900
                ) {

                    return interaction.editReply(
                        `🤖 **Milo**\n\n${texto}`
                    );

                }

                const partes = [];

                for (
                    let i = 0;
                    i < texto.length;
                    i += 1900
                ) {

                    partes.push(
                        texto.substring(
                            i,
                            i + 1900
                        )
                    );

                }

                await interaction.editReply(
                    `🤖 **Milo**\n\n${partes[0]}`
                );

                for (
                    let i = 1;
                    i < partes.length;
                    i++
                ) {

                    await interaction.followUp(
                        partes[i]
                    );

                }

                return;

            }

            /* =========================
               IMAGEN
            ========================= */

            if (
                comando === 'imagen'
            ) {

                const prompt =
                    interaction.options.getString(
                        'prompt'
                    );

                if (
                    !prompt
                ) {

                    return interaction.reply({
                        content:
                            '❌ Debes describir la imagen que quieres generar.',
                        ephemeral: true
                    });

                }

                const limite =
                    obtenerLimiteImagenes();

                if (
                    limite.restantes <= 0
                ) {

                    return interaction.reply({
                        content:
                            '❌ Milo ya utilizó las 3 imágenes disponibles hoy.',
                        ephemeral: true
                    });

                }

                await interaction.deferReply();

                const buffer =
                    await generarImagen(
                        prompt
                    );

                const archivo =
                    new AttachmentBuilder(
                        buffer,
                        {
                            name:
                                'milo-imagen.png'
                        }
                    );

                await interaction.editReply({

                    content:
                        `🖼️ **Imagen generada por Milo**\n\n` +
                        `📝 ${prompt}\n\n` +
                        `📊 Imágenes restantes hoy: ${
                            Math.max(
                                0,
                                limite.restantes - 1
                            )
                        }`,

                    files: [
                        archivo
                    ]

                });

                return;

            }

            /* =========================
               IDIOMA
            ========================= */

            if (
                comando === 'idioma'
            ) {

                const idioma =
                    interaction.options.getString(
                        'idioma'
                    );

                establecerIdioma(
                    interaction.user.id,
                    idioma
                );

                return interaction.reply({

                    content:
                        `🌐 Tu idioma ahora es **${obtenerNombreIdioma(
                            idioma
                        )}**.`,

                    ephemeral: true

                });

            }

            /* =========================
               CALCULAR
            ========================= */

            if (
                comando === 'calcular'
            ) {

                const operacion =
                    interaction.options.getString(
                        'operacion'
                    );

                const resultado =
                    calcularOperacion(
                        operacion
                    );

                return interaction.reply(
                    `🧮 **Resultado:** \`${resultado}\``
                );

            }

            /* =========================
               TRADUCIR
            ========================= */

            if (
                comando === 'traducir'
            ) {

                const texto =
                    interaction.options.getString(
                        'texto'
                    );

                const idioma =
                    interaction.options.getString(
                        'idioma'
                    );

                await interaction.deferReply();

                const resultado =
                    await traducir(
                        texto,
                        idioma
                    );

                return interaction.editReply(
                    `🌐 **Traducción**\n\n${resultado}`
                );

            }

            /* =========================
               RESUMIR
            ========================= */

            if (
                comando === 'resumir'
            ) {

                const texto =
                    interaction.options.getString(
                        'texto'
                    );

                await interaction.deferReply();

                const resultado =
                    await resumir(
                        texto
                    );

                return interaction.editReply(
                    `📝 **Resumen**\n\n${resultado}`
                );

            }

            /* =========================
               HORA
            ========================= */

            if (
                comando === 'hora'
            ) {

                const zona =
                    interaction.options.getString(
                        'zona'
                    ) ||
                    'America/Bogota';

                const hora =
                    obtenerHora(
                        zona
                    );

                return interaction.reply(
                    `🕐 **Hora actual**\n\n${hora}`
                );

            }

            /* =========================
               CONVERTIR
            ========================= */

            if (
                comando === 'convertir'
            ) {

                const cantidad =
                    interaction.options.getNumber(
                        'cantidad'
                    );

                const de =
                    interaction.options.getString(
                        'de'
                    );

                const a =
                    interaction.options.getString(
                        'a'
                    );

                const resultado =
                    convertir(
                        cantidad,
                        de,
                        a
                    );

                return interaction.reply(
                    `🔄 **Conversión**\n\n` +
                    `\`${cantidad} ${de}\` = \`${resultado} ${a}\``
                );

            }

            /* =========================
               MODERACIÓN GLOBAL
            ========================= */

            if (
                comando === 'ban-global'
            ) {

                if (
                    !puedeUsarGlobal(
                        interaction
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ No tienes permiso para utilizar este comando.',
                        ephemeral: true
                    });

                }

                const usuarioId =
                    interaction.options.getString(
                        'usuario'
                    );

                const razon =
                    interaction.options.getString(
                        'razon'
                    );

                const tiempo =
                    interaction.options.getString(
                        'tiempo'
                    );

                const prueba =
                    interaction.options.getAttachment(
                        'prueba'
                    );

                await interaction.deferReply({
                    ephemeral: true
                });

                await banGlobal(
                    client,
                    usuarioId,
                    razon,
                    tiempo,
                    prueba,
                    interaction.user,
                    interaction.guild
                );

                return interaction.editReply(
                    '🔨 El usuario fue procesado para el baneo global.'
                );

            }

            if (
                comando === 'unban-global'
            ) {

                if (
                    !puedeUsarGlobal(
                        interaction
                    )
                ) {

                    return interaction.reply({
                        content:
                            '❌ No tienes permiso para utilizar este comando.',
                        ephemeral: true
                    });

                }

                const usuarioId =
                    interaction.options.getString(
                        'usuario'
                    );

                const razon =
                    interaction.options.getString(
                        'razon'
                    );

                const prueba =
                    interaction.options.getAttachment(
                        'prueba'
                    );

                await interaction.deferReply({
                    ephemeral: true
                });

                await unbanGlobal(
                    client,
                    usuarioId,
                    razon,
                    prueba,
                    interaction.user,
                    interaction.guild
                );

                return interaction.editReply(
                    '🔓 El usuario fue procesado para el desbloqueo global.'
                );

            }

            /* =========================
               PING
            ========================= */

            if (
                comando === 'ping'
            ) {

                return interaction.reply(
                    `🏓 **Pong!**\nLatencia: \`${client.ws.ping}ms\``
                );

            }

            /* =========================
               ESTADO
            ========================= */

            if (
                comando === 'estado'
            ) {

                const limite =
                    obtenerLimiteImagenes();

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            '🤖 Estado de Milo'
                        )
                        .setDescription(
                            'Milo está funcionando correctamente.'
                        )
                        .addFields(

                            {
                                name:
                                    '🧠 Modelo',
                                value:
                                    `\`${modelo}\``,
                                inline: true
                            },

                            {
                                name:
                                    '🌐 Servidores',
                                value:
                                    `\`${client.guilds.cache.size}\``,
                                inline: true
                            },

                            {
                                name:
                                    '🖼️ Imágenes',
                                value:
                                    `${limite.usadas}/${limite.limite}`,
                                inline: true
                            },

                            {
                                name:
                                    '🏓 Ping',
                                value:
                                    `${client.ws.ping}ms`,
                                inline: true
                            }

                        )
                        .setTimestamp();

                return interaction.reply({
                    embeds: [embed]
                });

            }

            /* =========================
               MODELO
            ========================= */

            if (
                comando === 'modelo'
            ) {

                return interaction.reply(
                    `🧠 **Modelo de Milo:**\n\`${modelo}\``
                );

            }

            /* =========================
               SERVIDOR
            ========================= */

            if (
                comando === 'servidor'
            ) {

                const guild =
                    interaction.guild;

                if (!guild) {

                    return interaction.reply({
                        content:
                            '❌ Este comando solo puede utilizarse dentro de un servidor.',
                        ephemeral: true
                    });

                }

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            `📊 ${guild.name}`
                        )
                        .addFields(

                            {
                                name:
                                    '🆔 ID',
                                value:
                                    guild.id,
                                inline: true
                            },

                            {
                                name:
                                    '👥 Miembros',
                                value:
                                    `${guild.memberCount}`,
                                inline: true
                            },

                            {
                                name:
                                    '📅 Creado',
                                value:
                                    `<t:${Math.floor(
                                        guild.createdTimestamp / 1000
                                    )}:F>`,
                                inline: false
                            }

                        )
                        .setTimestamp();

                return interaction.reply({
                    embeds: [embed]
                });

            }

            /* =========================
               USUARIO
            ========================= */

            if (
                comando === 'usuario'
            ) {

                const usuario =
                    interaction.user;

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            '👤 Información del usuario'
                        )
                        .setThumbnail(
                            usuario.displayAvatarURL({
                                size: 256
                            })
                        )
                        .addFields(

                            {
                                name:
                                    'Nombre',
                                value:
                                    usuario.tag,
                                inline: true
                            },

                            {
                                name:
                                    'ID',
                                value:
                                    usuario.id,
                                inline: true
                            },

                            {
                                name:
                                    'Cuenta creada',
                                value:
                                    `<t:${Math.floor(
                                        usuario.createdTimestamp / 1000
                                    )}:F>`,
                                inline: false
                            }

                        );

                return interaction.reply({
                    embeds: [embed]
                });

            }

            /* =========================
               AVATAR
            ========================= */

            if (
                comando === 'avatar'
            ) {

                const usuario =
                    interaction.options.getUser(
                        'usuario'
                    ) ||
                    interaction.user;

                return interaction.reply(
                    usuario.displayAvatarURL({
                        size: 4096,
                        extension: 'png'
                    })
                );

            }

            /* =========================
               AYUDA
            ========================= */

            if (
                comando === 'ayuda'
            ) {

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            '🤖 Ayuda de Milo'
                        )
                        .setDescription(
                            'Estos son los comandos disponibles.'
                        )
                        .addFields(

                            {
                                name:
                                    '🤖 IA',
                                value:
                                    '`/ia` `/preguntar` `/chat` `/reiniciar`'
                            },

                            {
                                name:
                                    '🖼️ Imágenes',
                                value:
                                    '`/imagen`'
                            },

                            {
                                name:
                                    '🌐 Idiomas',
                                value:
                                    '`/idioma`'
                            },

                            {
                                name:
                                    '🛡️ Moderación',
                                value:
                                    '`/ban-global` `/unban-global`'
                            },

                            {
                                name:
                                    '📊 Información',
                                value:
                                    '`/ayuda` `/estado` `/modelo` `/servidor` `/usuario` `/avatar` `/ping`'
                            },

                            {
                                name:
                                    '🔧 Utilidades',
                                value:
                                    '`/calcular` `/traducir` `/resumir` `/hora` `/convertir`'
                            },

                            {
                                name:
                                    '👑 Milo',
                                value:
                                    '`/soporte` `/invitar` `/estadisticas`'
                            }

                        )
                        .setTimestamp();

                return interaction.reply({
                    embeds: [embed]
                });

            }

            /* =========================
               COMANDOS MILO
            ========================= */

            if (
                comando === 'soporte'
            ) {

                return interaction.reply(
                    '🛠️ **Soporte de Milo**\nhttps://discord.gg/csnebvXgSv'
                );

            }

            if (
                comando === 'invitar'
            ) {

                return interaction.reply(
                    '🤖 Puedes invitar a Milo desde el enlace de invitación del bot.'
                );

            }

            if (
                comando === 'estadisticas'
            ) {

                return interaction.reply(
                    `📊 **Estadísticas de Milo**\n\n` +
                    `🌐 Servidores: \`${client.guilds.cache.size}\`\n` +
                    `👥 Usuarios aproximados: \`${client.guilds.cache.reduce(
                        (total, guild) =>
                            total + guild.memberCount,
                        0
                    )}\`\n` +
                    `🏓 Ping: \`${client.ws.ping}ms\``
                );

            }

        } catch (error) {

            console.error(
                `❌ Error en /${comando}:`,
                error
            );

            const mensaje =
                '❌ Ocurrió un error al ejecutar este comando.';

            if (
                interaction.deferred
            ) {

                return interaction.editReply(
                    mensaje
                ).catch(() => {});

            }

            if (
                interaction.replied
            ) {

                return interaction.followUp({
                    content: mensaje,
                    ephemeral: true
                }).catch(() => {});

            }

            return interaction.reply({
                content: mensaje,
                ephemeral: true
            }).catch(() => {});

        }

    }
);

 /* =========================
   ERROR GENERAL
========================= */

process.on(
    'unhandledRejection',
    error => {

        console.error(
            '❌ Unhandled Rejection:',
            error
        );

    }
);

process.on(
    'uncaughtException',
    error => {

        console.error(
            '❌ Uncaught Exception:',
            error
        );

    }
);

/* =========================
   INICIAR BOT
========================= */

if (!TOKEN) {

    console.error(
        '❌ Falta DISCORD_TOKEN en el archivo .env'
    );

    process.exit(1);

}

client.login(TOKEN);                   
