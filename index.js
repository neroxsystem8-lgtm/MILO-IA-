require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    AttachmentBuilder,
    ActivityType
} = require('discord.js');

// =========================
// IMPORTACIONES
// =========================

const {
    registrarComandos,
    puedeUsarGlobal
} = require('./comandos');

const {
    preguntarGroq,
    MODELO
} = require('./groq');

const {
    generarImagen,
    obtenerLimiteImagenes
} = require('./imagenes');

const {
    obtenerIdioma,
    establecerIdioma,
    obtenerNombreIdioma,
    obtenerIdiomas
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


// =========================
// CLIENTE DISCORD
// =========================

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


// =========================
// CONFIGURACIÓN
// =========================

const PREFIX = '?';

const SUPPORT_SERVER =
    'https://discord.gg/csnebvXgSv';


// =========================
// PRESENCIA
// =========================

const actividades = [
    '+10 bots en funcionamiento | /ayuda',
    'Pregúntame lo que quieras',
    'IA con Groq 🧠',
    'Generación de imágenes 🖼️',
    '/ayuda para ver comandos'
];

let actividadActual = 0;

function actualizarPresencia() {

    client.user.setPresence({

        status: 'dnd',

        activities: [
            {
                name: actividades[actividadActual],
                type: ActivityType.Watching
            }
        ]

    });

    actividadActual++;

    if (
        actividadActual >= actividades.length
    ) {
        actividadActual = 0;
    }
}


// =========================
// BOT LISTO
// =========================

client.once('ready', async () => {

    console.log(
        `✅ Milo conectado como ${client.user.tag}`
    );

    console.log(
        `🧠 Modelo Groq: ${MODELO}`
    );

    console.log(
        `🌐 Servidores: ${client.guilds.cache.size}`
    );

    actualizarPresencia();

    setInterval(
        actualizarPresencia,
        5 * 60 * 1000
    );


    // =========================
    // REGISTRAR COMANDOS
    // =========================

    try {

        await registrarComandos(client);

        console.log(
            '✅ Comandos registrados correctamente.'
        );

    } catch (error) {

        console.error(
            '❌ Error registrando comandos:'
        );

        console.error(error);

    }

});


// =========================
// MENSAJES NORMALES
// =========================

client.on('messageCreate', async message => {

    try {

        if (message.author.bot) {
            return;
        }


        // =========================
        // DETECTAR MENSAJE PARA MILO
        // =========================

        const contenido =
            message.content.trim();

        const contenidoLower =
            contenido.toLowerCase();

        const mencion =
            `<@${client.user.id}>`;

        const mencionNick =
            `<@!${client.user.id}>`;

        let pregunta = null;


        // Milo pregunta
        if (
            contenidoLower.startsWith('milo ')
        ) {

            pregunta =
                contenido.slice(5).trim();

        }


        // Prefijo ?
        else if (
            contenido.startsWith(PREFIX)
        ) {

            pregunta =
                contenido
                    .slice(PREFIX.length)
                    .trim();

        }


        // Mención
        else if (
            contenido.startsWith(mencion) ||
            contenido.startsWith(mencionNick)
        ) {

            pregunta =
                contenido
                    .replace(mencion, '')
                    .replace(mencionNick, '')
                    .trim();

        }


        if (!pregunta) {
            return;
        }


        // =========================
        // IDIOMA
        // =========================

        const idioma =
            obtenerIdioma(
                message.author.id
            );


        // =========================
        // REACCIÓN PENSANDO
        // =========================

        let reaccionPensando = false;

        try {

            await message.react('🤔');

            reaccionPensando = true;

        } catch {}


        console.log(
            `🤖 Pregunta: ${pregunta}`
        );

        console.log(
            `🧠 Modelo: ${MODELO}`
        );

        console.log(
            `🌐 Idioma: ${idioma}`
        );


        // =========================
        // GROQ
        // =========================

        const respuesta =
            await preguntarGroq(
                pregunta,
                idioma
            );


        // =========================
        // ELIMINAR 🤔
        // =========================

        if (reaccionPensando) {

            try {

                await message.reactions
                    .cache
                    .get('🤔')
                    ?.users
                    .remove(client.user.id);

            } catch {}

        }


        // =========================
        // ENVIAR RESPUESTA
        // =========================

        if (respuesta.length <= 2000) {

            const mensaje =
                await message.reply({
                    content: respuesta
                });

            try {
                await mensaje.react('✅');
            } catch {}

        } else {

            // Discord limita los mensajes
            // a 2000 caracteres.

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
                const parte of partes
            ) {

                await message.reply({
                    content: parte
                });

            }

        }

    } catch (error) {

        console.error(
            '❌ ERROR EN MENSAJE IA:'
        );

        console.error(error);

        try {

            await message.reply({
                content:
                    `❌ ${error.message || 'Ocurrió un error procesando tu pregunta.'}`
            });

        } catch {}

    }

});


// =========================
// INTERACCIONES
// =========================

client.on(
    'interactionCreate',
    async interaction => {

        try {

            if (
                !interaction.isChatInputCommand()
            ) {
                return;
            }


            const comando =
                interaction.commandName;


            // =========================
            // IA
            // =========================

            if (
                comando === 'ia' ||
                comando === 'preguntar'
            ) {

                const pregunta =
                    interaction.options
                        .getString('pregunta', true);

                const idioma =
                    obtenerIdioma(
                        interaction.user.id
                    );

                await interaction.deferReply();


                const respuesta =
                    await preguntarGroq(
                        pregunta,
                        idioma
                    );


                if (
                    respuesta.length <= 2000
                ) {

                    await interaction.editReply({
                        content: respuesta
                    });

                } else {

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

                    await interaction.editReply({
                        content: partes.shift()
                    });

                    for (
                        const parte of partes
                    ) {

                        await interaction.followUp({
                            content: parte
                        });

                    }

                }

                return;
            }


            // =========================
            // CHAT
            // =========================

            if (comando === 'chat') {

                await interaction.reply({

                    content:
                        '🧠 **Chat con Milo**\n\n' +
                        'Puedes hablar conmigo directamente usando:\n' +
                        '`Milo <pregunta>`\n\n' +
                        'También puedes usar `/ia`.'

                });

                return;
            }


            // =========================
            // REINICIAR
            // =========================

            if (comando === 'reiniciar') {

                await interaction.reply({

                    content:
                        '🔄 Tu conversación con Milo ha sido reiniciada.'

                });

                return;
            }


            // =========================
            // IMAGEN
            // =========================

            if (comando === 'imagen') {

                const prompt =
                    interaction.options
                        .getString('prompt', true);

                await interaction.deferReply();

                const imagen =
                    await generarImagen(
                        prompt
                    );

                const archivo =
                    new AttachmentBuilder(
                        imagen,
                        {
                            name: 'milo-imagen.png'
                        }
                    );

                const limite =
                    obtenerLimiteImagenes();

                await interaction.editReply({

                    content:
                        `🖼️ **Imagen generada por Milo**\n\n` +
                        `📊 Generaciones restantes hoy: **${limite.restantes}**`,

                    files: [archivo]

                });

                return;
            }


            // =========================
            // IDIOMA
            // =========================

            if (comando === 'idioma') {

                const idioma =
                    interaction.options
                        .getString('idioma', true);

                if (
                    !obtenerIdiomas()[idioma]
                ) {

                    await interaction.reply({
                        content:
                            '❌ Ese idioma no está disponible.',
                        ephemeral: true
                    });

                    return;
                }

                establecerIdioma(
                    interaction.user.id,
                    idioma
                );

                await interaction.reply({

                    content:
                        `🌐 Tu idioma ahora es **${obtenerNombreIdioma(idioma)}**.`

                });

                return;
            }


            // =========================
            // CALCULAR
            // =========================

            if (comando === 'calcular') {

                const operacion =
                    interaction.options
                        .getString('operacion', true);

                const resultado =
                    calcularOperacion(
                        operacion
                    );

                await interaction.reply({

                    content:
                        `🧮 **Resultado**\n\`${resultado}\``

                });

                return;
            }


            // =========================
            // TRADUCIR
            // =========================

            if (comando === 'traducir') {

                const texto =
                    interaction.options
                        .getString('texto', true);

                const idioma =
                    interaction.options
                        .getString('idioma', true);

                await interaction.deferReply();

                const resultado =
                    await traducir(
                        texto,
                        idioma
                    );

                await interaction.editReply({
                    content: resultado
                });

                return;
            }


            // =========================
            // RESUMIR
            // =========================

            if (comando === 'resumir') {

                const texto =
                    interaction.options
                        .getString('texto', true);

                await interaction.deferReply();

                const resultado =
                    await resumir(texto);

                await interaction.editReply({
                    content: resultado
                });

                return;
            }


            // =========================
            // HORA
            // =========================

            if (comando === 'hora') {

                const zona =
                    interaction.options
                        .getString('zona') ||
                    'America/Bogota';

                const resultado =
                    obtenerHora(zona);

                await interaction.reply({

                    content:
                        `🕐 **Hora**\n${resultado}`

                });

                return;
            }


            // =========================
            // CONVERTIR
            // =========================

            if (comando === 'convertir') {

                const cantidad =
                    interaction.options
                        .getNumber('cantidad', true);

                const de =
                    interaction.options
                        .getString('de', true);

                const a =
                    interaction.options
                        .getString('a', true);

                const resultado =
                    convertir(
                        cantidad,
                        de,
                        a
                    );

                await interaction.reply({

                    content:
                        `🔄 **Conversión**\n` +
                        `${cantidad} ${de} = **${resultado} ${a}**`

                });

                return;
            }


            // =========================
            // PING
            // =========================

            if (comando === 'ping') {

                await interaction.reply({

                    content:
                        `🏓 **Pong!**\n` +
                        `Latencia: **${client.ws.ping}ms**`

                });

                return;
            }


            // =========================
            // ESTADO
            // =========================

            if (comando === 'estado') {

                await interaction.reply({

                    content:
                        `🟢 **Milo está funcionando**\n\n` +
                        `🧠 IA: **Groq**\n` +
                        `🤖 Modelo: **${MODELO}**\n` +
                        `🌐 Servidores: **${client.guilds.cache.size}**\n` +
                        `🏓 Ping: **${client.ws.ping}ms**`

                });

                return;
            }


            // =========================
            // MODELO
            // =========================

            if (comando === 'modelo') {

                await interaction.reply({

                    content:
                        `🧠 **Modelo actual**\n\`${MODELO}\``

                });

                return;
            }


            // =========================
            // SERVIDOR
            // =========================

            if (comando === 'servidor') {

                if (!interaction.guild) {

                    await interaction.reply({
                        content:
                            '❌ Este comando debe utilizarse dentro de un servidor.',
                        ephemeral: true
                    });

                    return;
                }

                await interaction.reply({

                    content:
                        `🏠 **Servidor**\n\n` +
                        `📛 Nombre: **${interaction.guild.name}**\n` +
                        `👥 Miembros: **${interaction.guild.memberCount}**\n` +
                        `🆔 ID: \`${interaction.guild.id}\``

                });

                return;
            }


            // =========================
            // USUARIO
            // =========================

            if (comando === 'usuario') {

                await interaction.reply({

                    content:
                        `👤 **Tu información**\n\n` +
                        `Nombre: **${interaction.user.username}**\n` +
                        `ID: \`${interaction.user.id}\``

                });

                return;
            }


            // =========================
            // AVATAR
            // =========================

            if (comando === 'avatar') {

                await interaction.reply({

                    content:
                        interaction.user.displayAvatarURL({
                            size: 1024,
                            extension: 'png'
                        })

                });

                return;
            }


            // =========================
            // SOPORTE
            // =========================

            if (comando === 'soporte') {

                await interaction.reply({

                    content:
                        `🛠️ **Soporte de Milo**\n\n` +
                        `Únete al servidor de soporte:\n${SUPPORT_SERVER}`

                });

                return;
            }


            // =========================
            // INVITAR
            // =========================

            if (comando === 'invitar') {

                const url =
                    `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

                await interaction.reply({

                    content:
                        `🤖 **Invita a Milo**\n\n${url}`

                });

                return;
            }


            // =========================
            // ESTADÍSTICAS
            // =========================

            if (comando === 'estadisticas') {

                await interaction.reply({

                    content:
                        `📊 **Estadísticas de Milo**\n\n` +
                        `🌐 Servidores: **${client.guilds.cache.size}**\n` +
                        `🧠 Modelo: **${MODELO}**\n` +
                        `🏓 Ping: **${client.ws.ping}ms**\n` +
                        `🖼️ Imágenes restantes hoy: **${obtenerLimiteImagenes().restantes}**`

                });

                return;
            }


            // =========================
            // AYUDA
            // =========================

            if (comando === 'ayuda') {

                const embed =
                    new EmbedBuilder()

                        .setTitle('🤖 Milo — Ayuda')

                        .setDescription(
                            'Aquí tienes los principales comandos de Milo.'
                        )

                        .addFields(

                            {
                                name: '🧠 IA',
                                value:
                                    '`/ia` `/preguntar` `/chat` `/reiniciar`'
                            },

                            {
                                name: '🖼️ Imágenes',
                                value:
                                    '`/imagen`'
                            },

                            {
                                name: '🌐 Idiomas',
                                value:
                                    '`/idioma`'
                            },

                            {
                                name: '🔧 Utilidades',
                                value:
                                    '`/calcular` `/traducir` `/resumir` `/hora` `/convertir`'
                            },

                            {
                                name: '📊 Información',
                                value:
                                    '`/estado` `/modelo` `/servidor` `/usuario` `/avatar` `/ping` `/estadisticas`'
                            },

                            {
                                name: '🛠️ Milo',
                                value:
                                    '`/soporte` `/invitar`'
                            }

                        )

                        .setFooter({
                            text: 'Milo • IA para Discord'
                        });

                await interaction.reply({
                    embeds: [embed]
                });

                return;
            }


            // =========================
            // BAN GLOBAL
            // =========================

            if (comando === 'ban-global') {

                if (
                    !puedeUsarGlobal(
                        interaction
                    )
                ) {

                    await interaction.reply({

                        content:
                            '❌ No tienes permisos para utilizar este comando.',

                        ephemeral: true

                    });

                    return;
                }

                const usuarioId =
                    interaction.options
                        .getString('usuario', true);

                const razon =
                    interaction.options
                        .getString('razon', true);

                const duracion =
                    interaction.options
                        .getString('duracion') ||
                    'permanente';

                const prueba =
                    interaction.options
                        .getString('prueba') ||
                    'No proporcionada';

                await interaction.deferReply({
                    ephemeral: true
                });

                await banGlobal(
                    usuarioId,
                    razon,
                    duracion,
                    prueba,
                    interaction.user,
                    interaction.guild
                );

                await interaction.editReply({

                    content:
                        `🔨 Usuario \`${usuarioId}\` añadido al baneo global.`

                });

                return;
            }


            // =========================
            // UNBAN GLOBAL
            // =========================

            if (comando === 'unban-global') {

                if (
                    !puedeUsarGlobal(
                        interaction
                    )
                ) {

                    await interaction.reply({

                        content:
                            '❌ No tienes permisos para utilizar este comando.',

                        ephemeral: true

                    });

                    return;
                }

                const usuarioId =
                    interaction.options
                        .getString('usuario', true);

                const razon =
                    interaction.options
                        .getString('razon', true);

                await interaction.deferReply({
                    ephemeral: true
                });

                await unbanGlobal(
                    usuarioId,
                    razon,
                    interaction.user,
                    interaction.guild
                );

                await interaction.editReply({

                    content:
                        `🔓 Usuario \`${usuarioId}\` eliminado del baneo global.`

                });

                return;
            }

        } catch (error) {

            console.error(
                '❌ ERROR EN INTERACCIÓN:'
            );

            console.error(error);

            const mensaje =
                `❌ ${error.message || 'Ocurrió un error.'}`;


            try {

                if (
                    interaction.deferred
                ) {

                    await interaction.editReply({
                        content: mensaje
                    });

                } else if (
                    interaction.replied
                ) {

                    await interaction.followUp({

                        content: mensaje,
                        ephemeral: true

                    });

                } else {

                    await interaction.reply({

                        content: mensaje,
                        ephemeral: true

                    });

                }

            } catch {}

        }

    }
);

// =========================
// ERRORES
// =========================

process.on(
    'unhandledRejection',
    error => {

        console.error(
            '❌ Unhandled Rejection:'
        );

        console.error(error);

    }
);


process.on(
    'uncaughtException',
    error => {

        console.error(
            '❌ Uncaught Exception:'
        );

        console.error(error);

    }
);


// =========================
// LOGIN
// =========================

if (!process.env.DISCORD_TOKEN) {

    console.error(
        '❌ DISCORD_TOKEN no está configurado.'
    );

    process.exit(1);
}

client.login(
    process.env.DISCORD_TOKEN
);
