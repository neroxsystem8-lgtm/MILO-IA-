// index.js

require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    Events
} = require('discord.js');

const {
    comandos,
    puedeUsarGlobal
} = require('./comandos');

const {
    preguntarGemini,
    modelo
} = require('./gemini');

const {
    revisarMensaje,
    banGlobal,
    unbanGlobal
} = require('./moderacion');

const client = new Client({

    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],

    partials: [
        Partials.Channel,
        Partials.Message
    ]
});

// ==========================================
// MILO LISTO
// ==========================================

client.once(
    Events.ClientReady,
    async () => {

        console.log(
            `✅ Milo conectado como ${client.user.tag}`
        );

        client.user.setPresence({

            status: 'online',

            activities: [
                {
                    name: '? para hablar conmigo',
                    type: 0
                }
            ]
        });

        const rest =
            new REST({
                version: '10'
            }).setToken(
                process.env.DISCORD_TOKEN
            );

        try {

            await rest.put(
                Routes.applicationCommands(
                    client.user.id
                ),
                {
                    body: comandos.map(
                        comando =>
                            comando.toJSON()
                    )
                }
            );

            console.log(
                '✅ Comandos registrados.'
            );

        } catch (error) {

            console.error(
                '❌ Error registrando comandos:',
                error
            );
        }
    }
);

// ==========================================
// PROCESAR PREGUNTA DE IA
// ==========================================

async function procesarPregunta(
    message,
    pregunta
) {

    let pensando = false;

    try {

        // 🤔 MILO ESTÁ PENSANDO
        await message.react('🤔');

        pensando = true;

        await message.channel.sendTyping();

        const respuesta =
            await preguntarGemini(
                pregunta
            );

        // QUITAR 🤔
        await message.reactions
            .removeAll()
            .catch(() => {});

        pensando = false;

        // ✅ TERMINÓ
        await message.react('✅');

        if (!respuesta) {

            await message.reply({
                content:
                    '⚠️ No recibí una respuesta de la IA.',
                allowedMentions: {
                    repliedUser: false
                }
            });

            return;
        }

        /*
         * Discord permite máximo 2000 caracteres
         * por mensaje.
         */

        const partes = [];

        for (
            let i = 0;
            i < respuesta.length;
            i += 1900
        ) {

            partes.push(
                respuesta.slice(
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

            await message.reply({

                content:
                    i === 0
                        ? `🤖 **Milo**\n\n${partes[i]}`
                        : partes[i],

                allowedMentions: {
                    repliedUser: false
                }
            });
        }

    } catch (error) {

        console.error(
            '❌ Error procesando pregunta:',
            error
        );

        if (pensando) {

            await message.reactions
                .removeAll()
                .catch(() => {});
        }

        await message.reply({

            content:
                '❌ **No pude procesar tu pregunta.**\n\n' +
                'Verifica que Gemini esté disponible e inténtalo nuevamente.',

            allowedMentions: {
                repliedUser: false
            }
        });
    }
}

// ==========================================
// MENSAJES
// ==========================================

client.on(
    Events.MessageCreate,
    async message => {

        if (message.author.bot) {
            return;
        }

        // 🛡️ ANTIINSULTOS
        const moderado =
            await revisarMensaje(
                message
            );

        if (moderado) {
            return;
        }

        // ¿MENCIONÓ A MILO?
        const mencionado =
            message.mentions.has(
                client.user
            );

        // ¿USÓ ?
        const conPrefijo =
            message.content
                .trim()
                .startsWith('?');

        if (
            !mencionado &&
            !conPrefijo
        ) {
            return;
        }

        let pregunta =
            message.content;

        // QUITAR MENCIÓN
        if (mencionado) {

            pregunta =
                pregunta.replace(
                    new RegExp(
                        `<@!?${client.user.id}>`,
                        'g'
                    ),
                    ''
                )
                .trim();
        }

        // QUITAR ?
        if (
            pregunta.startsWith('?')
        ) {

            pregunta =
                pregunta
                    .slice(1)
                    .trim();
        }

        // SI NO ESCRIBIÓ PREGUNTA
        if (!pregunta) {

            await message.reply({

                content:
                    '🤖 **¡Hola! Soy Milo!**\n\n' +
                    'Puedes preguntarme algo escribiendo:\n' +
                    '`? tu pregunta`\n\n' +
                    'O simplemente mencióname.',

                allowedMentions: {
                    repliedUser: false
                }
            });

            return;
        }

        await procesarPregunta(
            message,
            pregunta
        );
    }
);

// ==========================================
// SLASH COMMANDS
// ==========================================

client.on(
    Events.InteractionCreate,
    async interaction => {

        if (
            !interaction.isChatInputCommand()
        ) {
            return;
        }

        try {

            // ==================================
            // IA
            // ==================================

            if (
                interaction.commandName === 'ia' ||
                interaction.commandName === 'preguntar'
            ) {

                const pregunta =
                    interaction.options
                        .getString(
                            'pregunta',
                            true
                        );

                await interaction.deferReply();

                const respuesta =
                    await preguntarGemini(
                        pregunta
                    );

                await interaction.editReply({

                    content:
                        `🤖 **Milo**\n\n${respuesta}`
                            .slice(
                                0,
                                2000
                            )
                });

                return;
            }

            // ==================================
            // CHAT
            // ==================================

            if (
                interaction.commandName ===
                'chat'
            ) {

                await interaction.reply({

                    content:
                        '🤖 Puedes hablar conmigo escribiendo `?` seguido de tu pregunta o mencionándome.',

                    ephemeral: true
                });

                return;
            }

            // ==================================
            // REINICIAR
            // ==================================

            if (
                interaction.commandName ===
                'reiniciar'
            ) {

                await interaction.reply({

                    content:
                        '🔄 **Conversación reiniciada.**',

                    ephemeral: true
                });

                return;
            }

            // ==================================
            // AYUDA
            // ==================================

            if (
                interaction.commandName ===
                'ayuda'
            ) {

                await interaction.reply({

                    content:
                        '🤖 **MILO — AYUDA**\n\n' +
                        '💬 `? pregunta` — Hablar con Milo\n' +
                        '👤 `@Milo pregunta` — Mencionarlo\n' +
                        '🧠 `/ia` — Preguntar a la IA\n' +
                        '💡 `/preguntar` — Hacer una pregunta\n' +
                        '💬 `/chat` — Información del chat\n' +
                        '🔄 `/reiniciar` — Reiniciar conversación\n' +
                        '📊 `/estado` — Estado de Milo\n' +
                        '🧠 `/modelo` — Modelo utilizado\n' +
                        '🔨 `/ban-global` — Baneo global\n' +
                        '🔓 `/unban-global` — Retirar baneo global\n\n' +
                        '🛠️ Soporte: https://discord.gg/csnebvXgSv',

                    ephemeral: true
                });

                return;
            }

            // ==================================
            // ESTADO
            // ==================================

            if (
                interaction.commandName ===
                'estado'
            ) {

                await interaction.reply({

                    content:
                        `🟢 **Milo está funcionando.**\n\n` +
                        `🤖 Modelo: \`${modelo}\`\n` +
                        `📡 Discord: conectado\n` +
                        `🧠 Gemini: disponible`,

                    ephemeral: true
                });

                return;
            }

            // ==================================
            // MODELO
            // ==================================

            if (
                interaction.commandName ===
                'modelo'
            ) {

                await interaction.reply({

                    content:
                        `🧠 **Modelo actual de Milo:**\n\`${modelo}\``,

                    ephemeral: true
                });

                return;
            }

            // ==================================
            // BAN GLOBAL
            // ==================================

            if (
                interaction.commandName ===
                'ban-global'
            ) {

                if (
                    !puedeUsarGlobal(
                        interaction
                    )
                ) {

                    await interaction.reply({

                        content:
                            '❌ No tienes permiso para utilizar este comando.',

                        ephemeral: true
                    });

                    return;
                }

                const usuarioId =
                    interaction.options
                        .getString(
                            'usuario',
                            true
                        );

                const razon =
                    interaction.options
                        .getString(
                            'razon',
                            true
                        );

                const tiempo =
                    interaction.options
                        .getString(
                            'tiempo',
                            true
                        );

                const prueba =
                    interaction.options
                        .getAttachment(
                            'prueba'
                        );

                await interaction.deferReply({
                    ephemeral: true
                });

                const resultados =
                    await banGlobal(
                        client,
                        usuarioId,
                        razon,
                        tiempo,
                        prueba,
                        interaction.user
                    );

                const exitos =
                    resultados.filter(
                        resultado =>
                            resultado.estado ===
                            'baneado'
                    ).length;

                await interaction.editReply({

                    content:
                        `🔨 **BAN GLOBAL EJECUTADO**\n\n` +
                        `🆔 Usuario: \`${usuarioId}\`\n` +
                        `📝 Razón: ${razon}\n` +
                        `⏱️ Tiempo: ${tiempo}\n` +
                        `📸 Prueba: ${
                            prueba
                                ? prueba.url
                                : 'No adjunta'
                        }\n` +
                        `🌐 Servidores afectados: ${exitos}`
                });

                return;
            }

            // ==================================
            // UNBAN GLOBAL
            // ==================================

            if (
                interaction.commandName ===
                'unban-global'
            ) {

                if (
                    !puedeUsarGlobal(
                        interaction
                    )
                ) {

                    await interaction.reply({

                        content:
                            '❌ No tienes permiso para utilizar este comando.',

                        ephemeral: true
                    });

                    return;
                }

                const usuarioId =
                    interaction.options
                        .getString(
                            'usuario',
                            true
                        );

                const razon =
                    interaction.options
                        .getString(
                            'razon',
                            true
                        );

                await interaction.deferReply({
                    ephemeral: true
                });

                const resultados =
                    await unbanGlobal(
                        client,
                        usuarioId,
                        razon
                    );

                const exitos =
                    resultados.filter(
                        resultado =>
                            resultado.estado ===
                            'desbaneado'
                    ).length;

                await interaction.editReply({

                    content:
                        `🔓 **UNBAN GLOBAL EJECUTADO**\n\n` +
                        `🆔 Usuario: \`${usuarioId}\`\n` +
                        `📝 Razón: ${razon}\n` +
                        `🌐 Servidores afectados: ${exitos}`
                });

                return;
            }

        } catch (error) {

            console.error(
                '❌ Error ejecutando comando:',
                error
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction
                    .editReply({
                        content:
                            '❌ Ocurrió un error al ejecutar el comando.'
                    })
                    .catch(() => {});

            } else {

                await interaction.reply({

                    content:
                        '❌ Ocurrió un error al ejecutar el comando.',

                    ephemeral: true
                })
                .catch(() => {});
            }
        }
    }
);

// ==========================================
// LOGIN
// ==========================================

client.login(
    process.env.DISCORD_TOKEN
);
