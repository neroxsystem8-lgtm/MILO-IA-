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
// CUANDO MILO ESTÁ LISTO
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

        const rest = new REST({
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
                        comando => comando.toJSON()
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
// MENSAJES
// ==========================================

client.on(
    Events.MessageCreate,
    async message => {

        if (message.author.bot) {
            return;
        }

        // Antiinsultos
        const moderado =
            await revisarMensaje(message);

        if (moderado) {
            return;
        }

        const mencionado =
            message.mentions.has(client.user);

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

        // Quitar mención
        if (mencionado) {

            pregunta =
                pregunta.replace(
                    new RegExp(
                        `<@!?${client.user.id}>`,
                        'g'
                    ),
                    ''
                ).trim();
        }

        // Quitar ?
        if (
            pregunta.startsWith('?')
        ) {

            pregunta =
                pregunta
                    .slice(1)
                    .trim();
        }

        if (!pregunta) {

            await message.reply({
                content:
                    '🤖 ¡Hola! Soy Milo. Escribe tu pregunta después de `?` o mencióname.',
                allowedMentions: {
                    repliedUser: false
                }
            });

            return;
        }

        try {

            await message.channel.sendTyping();

            const respuesta =
                await preguntarGemini(
                    pregunta
                );

            await message.reply({
                content:
                    respuesta.slice(0, 2000),
                allowedMentions: {
                    repliedUser: false
                }
            });

        } catch (error) {

            console.error(
                '❌ Error con Gemini:',
                error
            );

            await message.reply({
                content:
                    '❌ No pude procesar tu pregunta.',
                allowedMentions: {
                    repliedUser: false
                }
            });
        }
    }
);

// ==========================================
// SLASH COMMANDS
// ==========================================

client.on(
    Events.InteractionCreate,
    async interaction => {

        if (!interaction.isChatInputCommand()) {
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
                    interaction.options.getString(
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
                        respuesta.slice(0, 2000)
                });

                return;
            }

            // ==================================
            // CHAT
            // ==================================

            if (
                interaction.commandName === 'chat'
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
                interaction.commandName === 'reiniciar'
            ) {

                await interaction.reply({
                    content:
                        '🔄 Tu conversación con Milo ha sido reiniciada.',
                    ephemeral: true
                });

                return;
            }

            // ==================================
            // AYUDA
            // ==================================

            if (
                interaction.commandName === 'ayuda'
            ) {

                await interaction.reply({
                    content:
                        '🤖 **MILO — AYUDA**\n\n' +
                        '`? pregunta` — Hablar con Milo\n' +
                        '`@Milo pregunta` — Mencionar a Milo\n' +
                        '`/ia` — Preguntar a Gemini\n' +
                        '`/preguntar` — Hacer una pregunta\n' +
                        '`/chat` — Información del chat\n' +
                        '`/reiniciar` — Reiniciar conversación\n' +
                        '`/estado` — Estado de Milo\n' +
                        '`/modelo` — Modelo utilizado\n' +
                        '`/ban-global` — Baneo global\n' +
                        '`/unban-global` — Retirar baneo global\n\n' +
                        '🛠️ Soporte: https://discord.gg/csnebvXgSv',
                    ephemeral: true
                });

                return;
            }

            // ==================================
            // ESTADO
            // ==================================

            if (
                interaction.commandName === 'estado'
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
                interaction.commandName === 'modelo'
            ) {

                await interaction.reply({
                    content:
                        `🧠 Modelo actual de Milo: \`${modelo}\``,
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

                if (!puedeUsarGlobal(interaction)) {

                    await interaction.reply({
                        content:
                            '❌ No tienes permiso para utilizar este comando.',
                        ephemeral: true
                    });

                    return;
                }

                const usuario =
                    interaction.options.getUser(
                        'usuario',
                        true
                    );

                const razon =
                    interaction.options.getString(
                        'razon',
                        true
                    );

                const prueba =
                    interaction.options.getAttachment(
                        'prueba'
                    );

                await interaction.deferReply({
                    ephemeral: true
                });

                const resultados =
                    await banGlobal(
                        client,
                        usuario.id,
                        razon,
                        prueba
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
                        `👤 Usuario: ${usuario.tag}\n` +
                        `🆔 ID: ${usuario.id}\n` +
                        `📝 Razón: ${razon}\n` +
                        `📸 Prueba: ${prueba ? prueba.url : 'No adjunta'}\n` +
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

                if (!puedeUsarGlobal(interaction)) {

                    await interaction.reply({
                        content:
                            '❌ No tienes permiso para utilizar este comando.',
                        ephemeral: true
                    });

                    return;
                }

                const usuarioId =
                    interaction.options.getString(
                        'usuario',
                        true
                    );

                const razon =
                    interaction.options.getString(
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
                        `🆔 Usuario: ${usuarioId}\n` +
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

            if (interaction.replied ||
                interaction.deferred) {

                await interaction.editReply({
                    content:
                        '❌ Ocurrió un error al ejecutar el comando.'
                }).catch(() => {});

            } else {

                await interaction.reply({
                    content:
                        '❌ Ocurrió un error al ejecutar el comando.',
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
);

// ==========================================
// INICIAR MILO
// ==========================================

client.login(
    process.env.DISCORD_TOKEN
);
