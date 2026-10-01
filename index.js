/* =========================================================
   MILO IA
   INDEX.JS
   ========================================================= */

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
    Client,
    GatewayIntentBits,
    Partials,
    ActivityType,
    AttachmentBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error('❌ Falta DISCORD_TOKEN en el archivo .env');
    process.exit(1);
}

const SERVIDOR_GLOBAL =
    process.env.SERVIDOR_GLOBAL || '1553169784697528450';

const ROL_GLOBAL =
    process.env.ROL_GLOBAL || '1553526636547280967';

const CANAL_LOGS_GLOBAL =
    process.env.CANAL_LOGS_GLOBAL || '1553774248324104232';

const SERVIDOR_SOPORTE =
    'https://discord.gg/csnebvXgSv';


/* =========================================================
   CLIENTE DISCORD
   ========================================================= */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration
    ],

    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User
    ]
});


/* =========================================================
   MÓDULOS
   ========================================================= */

const comandos = require('./comandos');

const {
    preguntarGroq
} = require('./groq');

const {
    generarImagen
} = require('./imagenes');

const {
    obtenerIdioma,
    establecerIdioma,
    obtenerNombreIdioma,
    obtenerIdiomas
} = require('./idiomas');

const utilidades = require('./utilidades');

const antiinsultos = require('./antiinsultos');

const sancion = require('./sancion');

const moderacion = require('./moderacion');

const logs = require('./logs');

const gestionServidor = require('./gestion-servidor');


/* =========================================================
   ARCHIVOS JSON
   ========================================================= */

const ARCHIVOS = {
    conversaciones: path.join(__dirname, 'conversaciones.json'),
    premium: path.join(__dirname, 'premium.json'),
    usos: path.join(__dirname, 'usos.json'),
    codigosPremium: path.join(__dirname, 'codigos-premium.json'),
    sugerencias: path.join(__dirname, 'sugerencias.json'),
    paneles: path.join(__dirname, 'paneles.json'),
    tickets: path.join(__dirname, 'tickets.json'),
    configuracion: path.join(__dirname, 'config-servidores.json'),
    canalesIA: path.join(__dirname, 'canales-ia.json'),
    sanciones: path.join(__dirname, 'sanciones.json')
};


/* =========================================================
   CREAR ARCHIVOS SI NO EXISTEN
   ========================================================= */

function prepararArchivos() {

    for (const archivo of Object.values(ARCHIVOS)) {

        try {

            if (!fs.existsSync(archivo)) {

                fs.writeFileSync(
                    archivo,
                    '{}',
                    'utf8'
                );

            }

        } catch (error) {

            console.error(
                `❌ Error preparando ${archivo}:`,
                error
            );

        }

    }

}

prepararArchivos();


/* =========================================================
   JSON
   ========================================================= */

function cargarJSON(archivo) {

    try {

        if (!fs.existsSync(archivo)) {
            return {};
        }

        const datos = JSON.parse(
            fs.readFileSync(
                archivo,
                'utf8'
            )
        );

        return datos && typeof datos === 'object'
            ? datos
            : {};

    } catch (error) {

        console.error(
            `❌ Error leyendo ${archivo}:`,
            error
        );

        return {};

    }

}


function guardarJSON(archivo, datos) {

    try {

        fs.writeFileSync(
            archivo,
            JSON.stringify(
                datos,
                null,
                2
            ),
            'utf8'
        );

        return true;

    } catch (error) {

        console.error(
            `❌ Error guardando ${archivo}:`,
            error
        );

        return false;

    }

}


/* =========================================================
   CONVERSACIONES
   ========================================================= */

function obtenerConversacion(usuarioId) {

    const datos =
        cargarJSON(
            ARCHIVOS.conversaciones
        );

    return datos[usuarioId] || [];

}


function guardarConversacion(
    usuarioId,
    role,
    content
) {

    const datos =
        cargarJSON(
            ARCHIVOS.conversaciones
        );

    if (!datos[usuarioId]) {
        datos[usuarioId] = [];
    }

    datos[usuarioId].push({
        role,
        content,
        fecha: new Date().toISOString()
    });

    /*
       Evitamos que el archivo crezca
       indefinidamente.
    */

    if (datos[usuarioId].length > 30) {

        datos[usuarioId] =
            datos[usuarioId].slice(-30);

    }

    guardarJSON(
        ARCHIVOS.conversaciones,
        datos
    );

}


function borrarConversacion(usuarioId) {

    const datos =
        cargarJSON(
            ARCHIVOS.conversaciones
        );

    delete datos[usuarioId];

    guardarJSON(
        ARCHIVOS.conversaciones,
        datos
    );

}


/* =========================================================
   CANAL DE IA
   ========================================================= */

function obtenerCanalIA(guildId) {

    const datos =
        cargarJSON(
            ARCHIVOS.canalesIA
        );

    return datos[guildId] || null;

}


function configurarCanalIA(
    guildId,
    canalId
) {

    const datos =
        cargarJSON(
            ARCHIVOS.canalesIA
        );

    datos[guildId] = canalId;

    guardarJSON(
        ARCHIVOS.canalesIA,
        datos
    );

}


/* =========================================================
   PREMIUM
   ========================================================= */

function obtenerPremium(usuarioId) {

    const datos =
        cargarJSON(
            ARCHIVOS.premium
        );

    return datos[usuarioId] || null;

}


function usuarioTienePremium(usuarioId) {

    const premium =
        obtenerPremium(usuarioId);

    if (!premium) {
        return false;
    }

    if (
        premium.expira &&
        Date.now() >=
        new Date(premium.expira).getTime()
    ) {

        const datos =
            cargarJSON(
                ARCHIVOS.premium
            );

        delete datos[usuarioId];

        guardarJSON(
            ARCHIVOS.premium,
            datos
        );

        return false;

    }

    return true;

}


function obtenerPlanPremium(usuarioId) {

    const premium =
        obtenerPremium(usuarioId);

    if (!premium) {
        return null;
    }

    return premium.plan || 'Premium';

}


/* =========================================================
   USOS
   ========================================================= */

function obtenerUsos(usuarioId) {

    const datos =
        cargarJSON(
            ARCHIVOS.usos
        );

    const hoy =
        new Date()
            .toISOString()
            .slice(0, 10);

    if (!datos[usuarioId]) {

        datos[usuarioId] = {
            fecha: hoy,
            imagenes: 0,
            preguntas: 0
        };

        guardarJSON(
            ARCHIVOS.usos,
            datos
        );

    }

    if (datos[usuarioId].fecha !== hoy) {

        datos[usuarioId] = {
            fecha: hoy,
            imagenes: 0,
            preguntas: 0
        };

        guardarJSON(
            ARCHIVOS.usos,
            datos
        );

    }

    return datos[usuarioId];

}


function registrarUso(
    usuarioId,
    tipo
) {

    const datos =
        cargarJSON(
            ARCHIVOS.usos
        );

    const usos =
        obtenerUsos(usuarioId);

    datos[usuarioId] = usos;

    if (
        typeof datos[usuarioId][tipo]
        !== 'number'
    ) {

        datos[usuarioId][tipo] = 0;

    }

    datos[usuarioId][tipo]++;

    guardarJSON(
        ARCHIVOS.usos,
        datos
    );

}


/* =========================================================
   LÍMITES
   ========================================================= */

function limitePreguntas(usuarioId) {

    if (
        usuarioTienePremium(usuarioId)
    ) {

        return Infinity;

    }

    return 100;

}


function limiteImagenes(usuarioId) {

    if (
        usuarioTienePremium(usuarioId)
    ) {

        return 20;

    }

    return 3;

}


/* =========================================================
   DIVIDIR MENSAJES
   ========================================================= */

function dividirMensaje(texto) {

    const partes = [];

    const limite = 1900;

    if (!texto) {
        return partes;
    }

    for (
        let i = 0;
        i < texto.length;
        i += limite
    ) {

        partes.push(
            texto.slice(
                i,
                i + limite
            )
        );

    }

    return partes;

}


/* =========================================================
   PRESENCIA
   ========================================================= */

const actividades = [

    '+10 bots en funcionamiento | /ayuda',
    'Milo IA | /ayuda',
    '🤖 Respondiendo preguntas',
    '🧠 Inteligencia artificial',
    '🎫 Sistema de tickets',
    '💎 Sistema Premium',
    '🛡️ Moderación global',
    '⚡ Milo está activo'

];

let actividadActual = 0;


function actualizarPresencia() {

    if (!client.user) {
        return;
    }

    client.user.setPresence({

        status: 'dnd',

        activities: [
            {
                name:
                    actividades[
                        actividadActual
                    ],

                type:
                    ActivityType.Watching
            }
        ]

    });

    actividadActual++;

    if (
        actividadActual >=
        actividades.length
    ) {

        actividadActual = 0;

    }

}


/* =========================================================
   RESPUESTA DE IA
   ========================================================= */

async function responderIA(
    usuarioId,
    pregunta,
    idioma = 'es'
) {

    const historial =
        obtenerConversacion(
            usuarioId
        );

    let contexto = '';

    if (historial.length) {

        contexto =
            historial
                .slice(-10)
                .map(
                    mensaje =>
                        `${mensaje.role}: ${mensaje.content}`
                )
                .join('\n');

    }

    const prompt = `

CONTEXTO DE CONVERSACIÓN:
${contexto || 'No existe conversación anterior.'}

NUEVO MENSAJE:
${pregunta}

Responde al usuario de forma clara,
natural y útil.

No inventes información.

Si solicita código,
proporciona código funcional.

Idioma:
${obtenerNombreIdioma(idioma)}

`;

    const respuesta =
        await preguntarGroq(
            prompt,
            idioma
        );

    guardarConversacion(
        usuarioId,
        'user',
        pregunta
    );

    guardarConversacion(
        usuarioId,
        'assistant',
        respuesta
    );

    return respuesta;

}


/* =========================================================
   DETECTAR PREGUNTA
   ========================================================= */

function obtenerPreguntaMensaje(
    message
) {

    let contenido =
        message.content.trim();

    const nombreBot =
        client.user?.username
            ?.toLowerCase();

    if (nombreBot) {

        const regex =
            new RegExp(
                `^${nombreBot}\\s*`,
                'i'
            );

        contenido =
            contenido.replace(
                regex,
                ''
            );

    }

    if (
        client.user &&
        contenido.includes(
            `<@${client.user.id}>`
        )
    ) {

        contenido =
            contenido.replace(
                new RegExp(
                    `<@!?${client.user.id}>`,
                    'g'
                ),
                ''
            );

    }

    return contenido.trim();

}


function debeResponderMensaje(
    message
) {

    if (
        !message ||
        message.author.bot
    ) {

        return false;

    }

    const contenido =
        message.content.trim();

    if (!contenido) {
        return false;
    }

    if (
        contenido.startsWith('?')
    ) {

        return true;

    }

    if (
        contenido
            .toLowerCase()
            .startsWith('milo ')
    ) {

        return true;

    }

    if (
        contenido
            .toLowerCase()
            .startsWith('milo,')
    ) {

        return true;

    }

    if (
        client.user &&
        message.mentions.has(
            client.user
        )
    ) {

        return true;

    }

    if (
        contenido.toLowerCase() ===
        'ping'
    ) {

        return true;

    }

    const canalIA =
        message.guild
            ? obtenerCanalIA(
                message.guild.id
            )
            : null;

    if (
        canalIA &&
        canalIA === message.channel.id
    ) {

        return true;

    }

    return false;

}


/* =========================================================
   AYUDA
   ========================================================= */

function crearMenuAyuda() {

    return new StringSelectMenuBuilder()
        .setCustomId(
            'milo_ayuda'
        )
        .setPlaceholder(
            'Selecciona una categoría'
        )
        .addOptions(

            new StringSelectMenuOptionBuilder()
                .setLabel('IA')
                .setDescription(
                    'Preguntas y conversación'
                )
                .setValue('ia')
                .setEmoji('🧠'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Tickets')
                .setDescription(
                    'Paneles y tickets'
                )
                .setValue('tickets')
                .setEmoji('🎫'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Premium')
                .setDescription(
                    'Funciones Premium'
                )
                .setValue('premium')
                .setEmoji('💎'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Utilidades')
                .setDescription(
                    'Herramientas de Milo'
                )
                .setValue('utilidades')
                .setEmoji('🛠️'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Moderación')
                .setDescription(
                    'Moderación y sanciones'
                )
                .setValue('moderacion')
                .setEmoji('🛡️'),

            new StringSelectMenuOptionBuilder()
                .setLabel('Servidor')
                .setDescription(
                    'Gestión del servidor'
                )
                .setValue('servidor')
                .setEmoji('⚙️')

        );

}


function embedAyuda(
    categoria
) {

    const embed =
        new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(
                '🤖 Milo IA'
            )
            .setTimestamp();

    if (
        categoria === 'ia'
    ) {

        embed
            .setDescription(
                [
                    '### 🧠 Inteligencia artificial',
                    '',
                    '`/ia` — Preguntar a Milo',
                    '`/preguntar` — Hacer una pregunta',
                    '`/chat` — Conversación',
                    '`/reiniciar` — Reiniciar conversación',
                    '`/idioma` — Cambiar idioma',
                    '`/imagen` — Generar una imagen'
                ].join('\n')
            );

    }

    else if (
        categoria === 'tickets'
    ) {

        embed
            .setDescription(
                [
                    '### 🎫 Tickets',
                    '',
                    '`/panel create` — Crear panel',
                    '`/panel edit` — Editar panel',
                    '',
                    'Sistema de tickets privados,',
                    'reclamar, cerrar, reabrir,',
                    'transferir, renombrar y transcript.'
                ].join('\n')
            );

    }

    else if (
        categoria === 'premium'
    ) {

        embed
            .setDescription(
                [
                    '### 💎 Premium',
                    '',
                    'Funciones Premium disponibles',
                    'para usuarios con Premium.',
                    '',
                    '• Más usos de IA',
                    '• Más generaciones de imágenes',
                    '• Funciones adicionales'
                ].join('\n')
            );

    }

    else if (
        categoria === 'utilidades'
    ) {

        embed
            .setDescription(
                [
                    '### 🛠️ Utilidades',
                    '',
                    '`/calcular`',
                    '`/convertir`',
                    '`/traducir`',
                    '`/resumir`',
                    '`/explicar`',
                    '`/hora`',
                    '`/fecha`',
                    '`/contador`',
                    '`/porcentaje`',
                    '`/regla3`',
                    '`/generar-password`'
                ].join('\n')
            );

    }

    else if (
        categoria === 'moderacion'
    ) {

        embed
            .setDescription(
                [
                    '### 🛡️ Moderación',
                    '',
                    '`/ban-global`',
                    '`/unban-global`',
                    '',
                    'Sistema global de sanciones,',
                    'logs y restauración.'
                ].join('\n')
            );

    }

    else if (
        categoria === 'servidor'
    ) {

        embed
            .setDescription(
                [
                    '### ⚙️ Servidor',
                    '',
                    '`/canal ia`',
                    '`/estado`',
                    '`/modelo`',
                    '`/servidor`',
                    '`/estadisticas`',
                    '',
                    'Funciones de configuración',
                    'y administración.'
                ].join('\n')
            );

    }

    return embed;

}


/* =========================================================
   READY
   ========================================================= */

client.once(
    'ready',
    async () => {

        console.log(
            '========================================'
        );

        console.log(
            '🤖 MILO IA CONECTADO'
        );

        console.log(
            `👤 Usuario: ${client.user.tag}`
        );

        console.log(
            `🌐 Servidores: ${client.guilds.cache.size}`
        );

        console.log(
            `🧠 Modelo: ${
                process.env.GROQ_MODEL ||
                'openai/gpt-oss-120b'
            }`
        );

        console.log(
            '========================================'
        );

        actualizarPresencia();

        setInterval(
            actualizarPresencia,
            5 * 60 * 1000
        );

        try {

            if (
                 typeof comandos.registrarComandos
                === 'function'
            ) {

                await comandos.registrarComandos(
                    client
                );

                console.log(
                    '✅ Comandos registrados.'
                );

            }

        } catch (error) {

            console.error(
                '❌ Error registrando comandos:',
                error
            );

        }

        try {

            if (
                typeof moderacion.restaurarSanciones
                === 'function'
            ) {

                await moderacion.restaurarSanciones(
                    client
                );

                console.log(
                    '🛡️ Sanciones restauradas.'
                );

            }

        } catch (error) {

            console.error(
                '❌ Error restaurando sanciones:',
                error
            );

        }

    }
);


/* =========================================================
   MENSAJES
   ========================================================= */

client.on(
    'messageCreate',
    async message => {

        try {

            if (
                message.author.bot
            ) {

                return;

            }


            /* -----------------------------------------
               ANTIINSULTOS
            ----------------------------------------- */

            if (
                typeof antiinsultos.manejarAntiInsultos
                === 'function'
            ) {

                const resultado =
                    await antiinsultos.manejarAntiInsultos(
                        message
                    );

                if (resultado) {
                    return;
                }

            }


            /* -----------------------------------------
               IA
            ----------------------------------------- */

            if (
                !debeResponderMensaje(
                    message
                )
            ) {

                return;

            }


            const pregunta =
                obtenerPreguntaMensaje(
                    message
                );


            if (!pregunta) {

                await message.reply(
                    '🤖 ¿Qué quieres preguntarme?'
                );

                return;

            }


            /* -----------------------------------------
               PING
            ----------------------------------------- */

            if (
                pregunta.toLowerCase() ===
                'ping'
            ) {

                await message.reply(
                    `🏓 Pong!\nLatencia: ${client.ws.ping}ms`
                );

                return;

            }


            /* -----------------------------------------
               LÍMITE
            ----------------------------------------- */

            const usos =
                obtenerUsos(
                    message.author.id
                );

            const limite =
                limitePreguntas(
                    message.author.id
                );

            if (
                usos.preguntas >= limite
            ) {

                await message.reply(
                    [
                        '⚠️ Has alcanzado tu límite diario.',
                        '',
                        '💎 Con Premium tienes límites superiores.'
                    ].join('\n')
                );

                return;

            }


            registrarUso(
                message.author.id,
                'preguntas'
            );


             /* -----------------------------------------
               PENSANDO
            ----------------------------------------- */

            let reaccion = null;

            try {

                reaccion =
                    await message.react('🤔');

            } catch {}


            const idioma =
                obtenerIdioma(
                    message.author.id
                );


            const respuesta =
                await responderIA(
                    message.author.id,
                    pregunta,
                    idioma
                );


            try {

                if (reaccion) {
                    await reaccion.users.remove(
                        client.user.id
                    );
                }

            } catch {}


            const partes =
                dividirMensaje(
                    respuesta
                );


            for (
                const parte of partes
            ) {

                await message.reply(
                    parte
                );

            }


            try {

                await message.react('✅');

            } catch {}


        } catch (error) {

            console.error(
                '❌ ERROR messageCreate:',
                error
            );

            try {

                await message.reply(
                    '❌ Ocurrió un error al procesar tu mensaje.'
                );

            } catch {}

        }

    }
);


/* =========================================================
   INTERACCIONES
   ========================================================= */

client.on(
    'interactionCreate',
    async interaction => {

        try {


            /* =================================================
               MENÚ DE AYUDA
            ================================================= */

            if (
                interaction.isStringSelectMenu() &&
                interaction.customId ===
                'milo_ayuda'
            ) {

                const categoria =
                    interaction.values[0];

                await interaction.update({

                    embeds: [
                        embedAyuda(
                            categoria
                        )
                    ],

                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                crearMenuAyuda()
                            )
                    ]

                });

                return;

        }


        /* =================================================
               BOTONES
            ================================================= */

            if (
                interaction.isButton()
            ) {

                const id =
                    interaction.customId;


                /* -----------------------------------------
                   CERRAR TICKET
                ----------------------------------------- */

                if (
                    id.startsWith(
                        'ticket_cerrar_'
                    )
                ) {

                    if (
                        interaction.channel
                    ) {

                        await interaction.channel
                            .send(
                                '🔒 Este ticket será cerrado.'
                            );

                    }

                    return;

                }


                /* -----------------------------------------
                   RECLAMAR TICKET
                ----------------------------------------- */

                if (
                    id.startsWith(
                        'ticket_reclamar_'
                    )
                ) {

                    await interaction.reply({

                        content:
                            `🛡️ Ticket reclamado por ${interaction.user}.`,

                        ephemeral: false

                    });

                    return;

                }

            }


            /* =================================================
               SLASH COMMANDS
            ================================================= */

            if (
                !interaction.isChatInputCommand()
            ) {

                return;

            }


            const nombre =
                interaction.commandName;


            /* =================================================
               AYUDA
            ================================================= */

            if (
                nombre === 'ayuda'
            ) {

                await interaction.reply({

                    embeds: [
                        embedAyuda('ia')
                    ],

                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                crearMenuAyuda()
                            )
                    ]

                });

                return;

            }


            /* =================================================
               IA
            ================================================= */

            if (
                nombre === 'ia' ||
                nombre === 'preguntar' ||
                nombre === 'chat'
            ) {

                const pregunta =
                    interaction.options.getString(
                        'pregunta'
                    );

                if (!pregunta) {

                    await interaction.reply({
                        content:
                            '❌ Debes escribir una pregunta.',
                        ephemeral: true
                    });

                    return;

                }


                const usos =
                    obtenerUsos(
                        interaction.user.id
                    );

                const limite =
                    limitePreguntas(
                        interaction.user.id
                    );

                if (
                    usos.preguntas >= limite
                ) {

                    await interaction.reply({

                        content:
                            '⚠️ Has alcanzado tu límite diario. 💎 Premium aumenta tus límites.',

                        ephemeral: true

                    });

                    return;

                }


                registrarUso(
                    interaction.user.id,
                    'preguntas'
                );


                await interaction.deferReply();


                const idioma =
                    obtenerIdioma(
                        interaction.user.id
                    );


                const respuesta =
                    await responderIA(
                        interaction.user.id,
                        pregunta,
                        idioma
                    );


                const partes =
                    dividirMensaje(
                        respuesta
                    );


                await interaction.editReply(
                    partes[0]
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


            /* =================================================
               REINICIAR
            ================================================= */

            if (
                nombre === 'reiniciar'
            ) {

                borrarConversacion(
                    interaction.user.id
                );

                await interaction.reply(
                    '🧹 Tu conversación con Milo ha sido reiniciada.'
                );

                return;

        }


        
