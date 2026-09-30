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
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require('discord.js');

/*
========================================
COMANDOS
========================================
*/

const {
    registrarComandos,
    puedeUsarGlobal,
    SERVIDOR_GLOBAL,
    ROL_GLOBAL
} = require('./comandos');

/*
========================================
IA
========================================
*/

const {
    preguntarGroq
} = require('./groq');

/*
========================================
IMÁGENES
========================================
*/

const {
    generarImagen
} = require('./imagenes');

/*
========================================
IDIOMAS
========================================
*/

const {
    obtenerIdioma,
    establecerIdioma,
    idiomaValido,
    obtenerNombreIdioma
} = require('./idiomas');

/*
========================================
UTILIDADES
========================================
*/

const {
    calcularOperacion,
    traducir,
    resumir,
    obtenerHora,
    convertir
} = require('./utilidades');

/*
========================================
ANTIINSULTOS
========================================
*/

const {
    detectarInsulto,
    registrarInfraccion,
    obtenerSancion
} = require('./antiinsultos');

/*
========================================
MODERACIÓN GLOBAL
========================================
*/

const {
    banGlobal,
    unbanGlobal,
    restaurarSanciones,
    calcularDuracion,
    SERVIDOR_GLOBAL: SERVIDOR_MODERACION,
    ROL_GLOBAL: ROL_MODERACION,
    CANAL_LOGS
} = require('./moderacion');

/*
========================================
SANCIÓN
========================================
*/

const {
    obtenerSancion: obtenerSancionGlobal,
    eliminarSancion
} = require('./sancion');

/*
========================================
CLIENTE
========================================
*/

const client = new Client({

    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildModeration
    ],

    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User
    ]
});

/*
========================================
ARCHIVOS
========================================
*/

const ARCHIVO_CANALES_IA =
    path.join(
        __dirname,
        'canales-ia.json'
    );

/*
========================================
CARGAR CANALES IA
========================================
*/

function cargarCanalesIA() {

    try {

        if (
            !fs.existsSync(
                ARCHIVO_CANALES_IA
            )
        ) {

            fs.writeFileSync(
                ARCHIVO_CANALES_IA,
                '{}'
            );

            return {};
        }

        const datos =
            JSON.parse(
                fs.readFileSync(
                    ARCHIVO_CANALES_IA,
                    'utf8'
                )
            );

        return (
            datos &&
            typeof datos === 'object'
        )
            ? datos
            : {};

    } catch (error) {

        console.error(
            '❌ Error leyendo canales-ia.json:',
            error
        );

        return {};
    }
}

/*
========================================
GUARDAR CANALES IA
========================================
*/

function guardarCanalesIA(
    datos
) {

    try {

        fs.writeFileSync(
            ARCHIVO_CANALES_IA,
            JSON.stringify(
                datos,
                null,
                2
            )
        );

        return true;

    } catch (error) {

        console.error(
            '❌ Error guardando canales-ia.json:',
            error
        );

        return false;
    }
}

/*
========================================
CANAL IA DE UN SERVIDOR
========================================
*/

function obtenerCanalIA(
    guildId
) {

    const datos =
        cargarCanalesIA();

    return (
        datos[guildId] ||
        null
    );
}

/*
========================================
CONFIGURAR CANAL IA
========================================
*/

function configurarCanalIA(
    guildId,
    channelId
) {

    const datos =
        cargarCanalesIA();

    if (!channelId) {

        delete datos[guildId];

    } else {

        datos[guildId] =
            channelId;
    }

    guardarCanalesIA(
        datos
    );
}

/*
========================================
PRESENCIA
========================================
*/

const ACTIVIDADES = [
    '+10 bots en funcionamiento | /ayuda',
    'Inteligencia artificial | /ia',
    'Soporte y moderación | /ayuda',
    'Generación de imágenes | /imagen',
    'Programación y tecnología | /preguntar'
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
                    ACTIVIDADES[
                        actividadActual
                    ],

                type:
                    ActivityType.Playing
            }
        ]
    });

    actividadActual++;

    if (
        actividadActual >=
        ACTIVIDADES.length
    ) {
        actividadActual = 0;
    }
}

/*
========================================
ESPERAR
========================================
*/

function esperar(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}

/*
========================================
DIVIDIR RESPUESTAS
========================================
*/

function dividirMensaje(
    texto,
    maximo = 1900
) {

    if (
        !texto ||
        texto.length <= maximo
    ) {
        return [texto];
    }

    const partes = [];

    let actual = '';

    const lineas =
        texto.split('\n');

    for (
        const linea
        of lineas
    ) {

        if (
            actual.length +
            linea.length +
            1 >
            maximo
        ) {

            if (actual) {
                partes.push(
                    actual
                );
            }

            actual =
                linea;

        } else {

            actual +=
                (actual
                    ? '\n'
                    : '') +
                linea;
        }
    }

    if (actual) {
        partes.push(actual);
    }

    return partes;
}

/*
========================================
RESPONDER IA
========================================
*/

async function responderIA(
    message,
    pregunta
) {

    let reaccionPensando = false;

    try {

        await message.react('🤔');

        reaccionPensando = true;

    } catch {}

    try {

        const idioma =
            obtenerIdioma(
                message.author.id
            );

        const respuesta =
            await preguntarGroq(
                pregunta,
                idioma
            );

        if (reaccionPensando) {

            try {
                await message.reactions
                    .resolve('🤔')
                    ?.users
                    ?.remove(
                        client.user.id
                    );
            } catch {}
        }

        const partes =
            dividirMensaje(
                respuesta
            );

        for (
            const parte
            of partes
        ) {

            await message.reply(
                parte
            );

            if (
                partes.length > 1
            ) {
                await esperar(250);
            }
        }

        try {
            await message.react('✅');
        } catch {}

    } catch (error) {

        if (reaccionPensando) {

            try {
                await message.reactions
                    .resolve('🤔')
                    ?.users
                    ?.remove(
                        client.user.id
                    );
            } catch {}
        }

        console.error(
            '❌ Error respondiendo IA:',
            error
        );

        try {

            await message.reply({
                content:
                    `❌ ${error.message}`
            });

        } catch {}
    }
}

/*
========================================
DETECTAR MENCIÓN
========================================
*/

function obtenerPreguntaMensaje(
    message
) {

    let contenido =
        message.content.trim();

    const mention =
        `<@${client.user.id}>`;

    const mentionNick =
        `<@!${client.user.id}>`;

    if (
        contenido.startsWith(
            mention
        )
    ) {

        contenido =
            contenido
                .slice(
                    mention.length
                )
                .trim();

        return contenido;
    }

    if (
        contenido.startsWith(
            mentionNick
        )
    ) {

        contenido =
            contenido
                .slice(
                    mentionNick.length
                )
                .trim();

        return contenido;
    }

    if (
        /^milo\b/i.test(
            contenido
        )
    ) {

        contenido =
            contenido
                .replace(
                    /^milo\b/i,
                    ''
                )
                .trim();

        return contenido;
    }

    if (
        contenido.startsWith('?')
    ) {

        contenido =
            contenido
                .slice(1)
                .trim();

        return contenido;
    }

    return null;
}

/*
========================================
¿PUEDE FUNCIONAR IA AQUÍ?
========================================
*/

function puedeUsarIAEnCanal(
    message
) {

    if (!message.guild) {
        return false;
    }

    const canalConfigurado =
        obtenerCanalIA(
            message.guild.id
        );

    /*
    Sin canal configurado:
    funciona normalmente en todos
    los canales.
    */

    if (!canalConfigurado) {
        return true;
    }

    /*
    Con canal configurado:
    solamente funciona allí.
    */

    return (
        message.channelId ===
        canalConfigurado
    );
}

/*
========================================
ANTIINSULTOS
========================================
*/

async function manejarAntiInsultos(
    message
) {

    if (
        !message.guild ||
        message.author.bot
    ) {
        return false;
    }

    const insulto =
        detectarInsulto(
            message.content
        );

    if (!insulto) {
        return false;
    }

    try {

        await message.delete();

    } catch {}

    const infracciones =
        registrarInfraccion(
            message.guild.id,
            message.author.id,
            insulto
        );

    const sancion =
        obtenerSancion(
            infracciones
        );

    /*
    ================================
    ADVERTENCIA
    ================================
    */

    if (
        sancion.tipo ===
        'advertencia'
    ) {

        try {

            const aviso =
                await message.channel.send({
                    content:
                        `⚠️ <@${message.author.id}> evita utilizar insultos. Esta es tu infracción **${infracciones}**.`
                });

            setTimeout(
                () => {
                    aviso.delete()
                        .catch(() => {});
                },
                5000
            );

        } catch {}

        return true;
    }

    /*
    ================================
    MUTE
    ================================
    */

    if (
        sancion.tipo ===
        'mute'
    ) {

        try {

            const miembro =
                await message.guild.members
                    .fetch(
                        message.author.id
                    );

            if (
                miembro.moderatable
            ) {

                await miembro.timeout(
                    sancion.duracion,
                    'Antiinsultos de Milo'
                );
            }

            const aviso =
                await message.channel.send({
                    content:
                        `🔇 <@${message.author.id}> ha recibido un silencio temporal por acumulación de infracciones.`
                });

            setTimeout(
                () => {
                    aviso.delete()
                        .catch(() => {});
                },
                5000
            );

        } catch (
            error
        ) {

            console.error(
                '❌ Error aplicando mute:',
                error
            );
        }

        return true;
    }

    /*
    ================================
    BAN
    ================================
    */

    if (
        sancion.tipo ===
        'ban'
    ) {

        try {

            await banGlobal({
                client,
                guild:
                    message.guild,
                usuarioId:
                    message.author.id,
                razon:
                    'Acumulación de infracciones por insultos',
                tiempo:
                    'permanente',
                prueba:
                    null,
                moderadorId:
                    client.user.id
            });

        } catch (
            error
        ) {

            console.error(
                '❌ Error aplicando ban por antiinsultos:',
                error
            );
        }

        return true;
    }

    return true;
}

/*
========================================
MENÚ DE AYUDA
========================================
*/

function crearMenuAyuda() {

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                'milo_ayuda'
            )
            .setPlaceholder(
                'Selecciona una categoría'
            )
            .addOptions(
                {
                    label:
                        'Inteligencia Artificial',
                    description:
                        'Comandos de IA y conversaciones',
                    value:
                        'ia',
                    emoji:
                        '🤖'
                },
                {
                    label:
                        'Imágenes',
                    description:
                        'Generación de imágenes',
                    value:
                        'imagenes',
                    emoji:
                        '🖼️'
                },
                {
                    label:
                        'Idiomas',
                    description:
                        'Configura el idioma de Milo',
                    value:
                        'idiomas',
                    emoji:
                        '🌐'
                },
                {
                    label:
                        'Utilidades',
                    description:
                        'Herramientas y conversiones',
                    value:
                        'utilidades',
                    emoji:
                        '🧮'
                },
                {
                    label:
                        'Moderación',
                    description:
                        'Moderación global',
                    value:
                        'moderacion',
                    emoji:
                        '🛡️'
                },
                {
                    label:
                        'Sanciones',
                    description:
                        'Sistema de sanciones',
                    value:
                        'sanciones',
                    emoji:
                        '🔨'
                },
                {
                    label:
                        'Información',
                    description:
                        'Información del bot y servidor',
                    value:
                        'informacion',
                    emoji:
                        'ℹ️'
                },
                {
                    label:
                        'Milo',
                    description:
                        'Soporte, invitación y estadísticas',
                    value:
                        'milo',
                    emoji:
                        '💙'
                }
            );

    return new ActionRowBuilder()
        .addComponents(
            menu
        );
}

/*
========================================
EMBED PRINCIPAL DE AYUDA
========================================
*/

function crearAyudaPrincipal() {

    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(
            '🤖 Milo — Centro de ayuda'
        )
        .setDescription(
            'Selecciona una categoría del menú para consultar todos los comandos disponibles.'
        )
        .setFooter({
            text:
                'Milo • Centro de ayuda'
        });
}

/*
========================================
EMBEDS DE AYUDA
========================================
*/

function crearAyudaCategoria(
    categoria
) {

    const embed =
        new EmbedBuilder()
            .setColor(
                0x5865F2
            );

    if (
        categoria === 'ia'
    ) {

        embed
            .setTitle(
                '🤖 Inteligencia Artificial'
            )
            .setDescription(
                [
                    '`/ia pregunta` — Hazle una pregunta a Milo.',
                    '`/preguntar pregunta` — Pregunta a Milo.',
                    '`/chat` — Inicia una conversación.',
                    '`/reiniciar` — Reinicia tu conversación.',
                    '`/canal ia` — Configura el canal de IA.'
                ].join('\n')
            );
    }

    else if (
        categoria === 'imagenes'
    ) {

        embed
            .setTitle(
                '🖼️ Imágenes'
            )
            .setDescription(
                '`/imagen prompt` — Genera una imagen mediante IA.'
            );
    }

    else if (
        categoria === 'idiomas'
    ) {

        embed
            .setTitle(
                '🌐 Idiomas'
            )
            .setDescription(
                '`/idioma idioma` — Configura el idioma de respuesta de Milo.'
            );
    }

    else if (
        categoria === 'utilidades'
    ) {

        embed
            .setTitle(
                '🧮 Utilidades'
            )
            .setDescription(
                [
                    '`/calcular` — Calcula operaciones.',
                    '`/traducir` — Traduce textos.',
                    '`/resumir` — Resume textos.',
                    '`/hora` — Consulta una zona horaria.',
                    '`/convertir` — Convierte unidades.'
                ].join('\n')
            );
    }

    else if (
        categoria === 'moderacion'
    ) {

        embed
            .setTitle(
                '🛡️ Moderación'
            )
            .setDescription(
                [
                    '`/ban-global` — Banea globalmente a un usuario.',
                    '`/unban-global` — Retira un baneo global.',
                    '',
                    'Los comandos globales requieren el rol autorizado.'
                ].join('\n')
            );
    }

    else if (
        categoria === 'sanciones'
    ) {

        embed
            .setTitle(
                '🔨 Sanciones'
            )
            .setDescription(
                [
                    'Las sanciones globales pueden ser:',
                    '',
                    '• Temporales',
                    '• Permanentes',
                    '• Con razón',
                    '• Con pruebas',
                    '',
                    'Las sanciones temporales se guardan para sobrevivir a reinicios.'
                ].join('\n')
            );
    }

    else if (
        categoria === 'informacion'
    ) {

        embed
            .setTitle(
                'ℹ️ Información'
            )
            .setDescription(
                [
                    '`/estado` — Estado de Milo.',
                    '`/modelo` — Información pública de la IA.',
                    '`/servidor` — Información del servidor.',
                    '`/usuario` — Información de un usuario.',
                    '`/avatar` — Muestra un avatar.',
                    '`/ping` — Latencia de Milo.'
                ].join('\n')
            );
    }

    else if (
        categoria === 'milo'
    ) {

        embed
            .setTitle(
                '💙 Milo'
            )
            .setDescription(
                [
                    '`/soporte` — Servidor oficial de soporte.',
                    '`/invitar` — Invita a Milo.',
                    '`/estadisticas` — Estadísticas del bot.',
                    '',
                    'Servidor de soporte:',
                    'https://discord.gg/csnebvXgSv'
                ].join('\n')
            );
    }

    return embed;
}

/*
========================================
EVENTO READY
========================================
*/

client.once(
    'ready',
    async () => {

        console.log(
            `🤖 Milo conectado como ${client.user.tag}`
        );

        console.log(
            `🌐 Servidores: ${client.guilds.cache.size}`
        );

        actualizarPresencia();

        setInterval(
            actualizarPresencia,
            5 * 60 * 1000
        );

        try {

            await registrarComandos(
                client
            );

        } catch (
            error
        ) {

            console.error(
                '❌ No se pudieron registrar los comandos:',
                error
            );
        }

        /*
        Restaurar sanciones
        */

        try {

            await restaurarSanciones(
                client
            );

        } catch (
            error
        ) {

            console.error(
                '❌ Error restaurando sanciones:',
                error
            );
        }

        console.log(
            '🧠 Sistema de IA: Groq'
        );

        console.log(
            '🖼️ Sistema de imágenes: Hugging Face'
        );

        console.log(
            '🛡️ Sistema antiinsultos: activo'
        );

        console.log(
            '🔨 Sistema de sanciones: activo'
        );
    }
);

/*
========================================
MENSAJES
========================================
*/

client.on(
    'messageCreate',
    async message => {

        if (
            message.author.bot
        ) {
            return;
        }

        /*
        ====================================
        MENSAJE DE SANCIÓN GLOBAL
        ====================================
        */

        if (
            message.channelId ===
            CANAL_LOGS
        ) {

            const miembro =
                message.member;

            const autorizado =
                miembro?.roles?.cache?.has(
                    ROL_GLOBAL
                );

            /*
            Solo procesamos mensajes
            del formato esperado.
            */

            if (
                autorizado &&
                message.content.includes(
                    '🔨 Usuario sancionado'
                ) &&
                message.content.includes(
                    '🆔 ID:'
                ) &&
                message.content.includes(
                    '📋 Razón:'
                ) &&
                message.content.includes(
                    '⏱️ Duración:'
                )
            ) {

                await procesarMensajeSancion(
                    message
                );

                return;
            }

            /*
            Si alguien sin permiso intenta
            crear una sanción mediante plantilla,
            se elimina.
            */

            if (
                !autorizado &&
                message.content.includes(
                    '🔨 Usuario sancionado'
                )
            ) {

                try {
                    await message.delete();
                } catch {}

                return;
            }
        }

        /*
        ====================================
        ANTIINSULTOS
        ====================================
        */

        const fueSancionado =
            await manejarAntiInsultos(
                message
            );

        if (
            fueSancionado
        ) {
            return;
        }

        /*
        ====================================
        SOLO SERVIDORES
        ====================================
        */

        if (!message.guild) {
            return;
        }

        /*
        ====================================
        CANAL IA
        ====================================
        */

        if (
            !puedeUsarIAEnCanal(
                message
            )
        ) {
            return;
        }

        /*
        ====================================
        DETECTAR PREGUNTA
        ====================================
        */

        const pregunta =
            obtenerPreguntaMensaje(
                message
            );

        if (
            !pregunta
        ) {
            return;
        }

        await responderIA(
            message,
            pregunta
        );
    }
);

/*
========================================
PROCESAR MENSAJE DE SANCIÓN
========================================
*/

async function procesarMensajeSancion(
    message
) {

    try {

        const contenido =
            message.content;

        const usuarioMatch =
            contenido.match(
                /👤 Usuario:\s*"([^"]+)"/i
            );

        const idMatch =
            contenido.match(
                /🆔 ID:\s*"([^"]+)"/i
            );

        const razonMatch =
            contenido.match(
                /📋 Razón:\s*"([^"]+)"/i
            );

        const duracionMatch =
            contenido.match(
                /⏱️ Duración:\s*"([^"]+)"/i
            );

        const pruebaMatch =
            contenido.match(
                /📎 Pruebas:\s*"([^"]+)"/i
            );

        if (!idMatch) {

            await message.reply(
                '❌ No se pudo detectar el ID del usuario.'
            );

            return;
        }

        const usuarioId =
            idMatch[1].trim();

        const razon =
            razonMatch?.[1]?.trim() ||
            'Sin razón especificada';

        const tiempo =
            duracionMatch?.[1]?.trim() ||
            'permanente';

        const prueba =
            pruebaMatch?.[1]?.trim() ||
            null;

        /*
        Validar duración antes
        de ejecutar el ban.
        */

        try {

            calcularDuracion(
                tiempo
            );

        } catch (
            error
        ) {

            await message.reply(
                `❌ Duración inválida: ${error.message}`
            );

            return;
        }

        const resultado =
            await banGlobal({
                client,
                guild:
                    message.guild,
                usuarioId,
                razon,
                tiempo,
                prueba,
                moderadorId:
                    message.author.id
            });

        /*
        Guardar relación entre
        mensaje y usuario.
        */

        guardarRelacionMensajeSancion(
            message.id,
            usuarioId
        );

        const correctos =
            resultado.resultados
                .filter(
                    x => x.correcto
                )
                .length;

        const errores =
            resultado.resultados
                .filter(
                    x => !x.correcto
                )
                .length;

        const duracion =
            calcularDuracion(
                tiempo
            );

        const embed =
            new EmbedBuilder()
                .setColor(
                    0xED4245
                )
                .setTitle(
                    '🔨 Sanción global aplicada'
                )
                .setDescription(
                    `El usuario <@${usuarioId}> ha sido procesado por Milo.`
                )
                .addFields(
                    {
                        name:
                            '🆔 ID',
                        value:
                            usuarioId,
                        inline:
                            true
                    },
                    {
                        name:
                            '📋 Razón',
                        value:
                            razon,
                        inline:
                            false
                    },
                    {
                        name:
                            '⏱️ Duración',
                        value:
                            duracion.permanente
                                ? 'Permanente'
                                : tiempo,
                        inline:
                            true
                    },
                    {
                        name:
                            '🌐 Servidores',
                        value:
                            `${correctos} procesados correctamente\n${errores} con errores`,
                        inline:
                            true
                    }
                )
                .setTimestamp();

        await message.reply({
            embeds: [
                embed
            ]
        });

    } catch (
        error
    ) {

        console.error(
            '❌ Error procesando sanción:',
            error
        );

        try {

            await message.reply(
                `❌ No se pudo aplicar la sanción: ${error.message}`
            );

        } catch {}
    }
}

/*
========================================
RELACIÓN MENSAJE → USUARIO
========================================
*/

const ARCHIVO_RELACIONES =
    path.join(
        __dirname,
        'sanciones-mensajes.json'
    );

function cargarRelaciones() {

    try {

        if (
            !fs.existsSync(
                ARCHIVO_RELACIONES
            )
        ) {

            fs.writeFileSync(
                ARCHIVO_RELACIONES,
                '{}'
            );

            return {};
        }

        return JSON.parse(
            fs.readFileSync(
                ARCHIVO_RELACIONES,
                'utf8'
            )
        );

    } catch {

        return {};
    }
}

function guardarRelacionMensaje(
    mensajeId,
    usuarioId
) {

    const datos =
        cargarRelaciones();

    datos[mensajeId] =
        usuarioId;

    try {

        fs.writeFileSync(
            ARCHIVO_RELACIONES,
            JSON.stringify(
                datos,
                null,
                2
            )
        );

    } catch (
        error
    ) {

        console.error(
            '❌ Error guardando relación de sanción:',
            error
        );
    }
}

/*
========================================
OBTENER USUARIO DE MENSAJE
========================================
*/

function obtenerUsuarioDeMensaje(
    mensajeId
) {

    const datos =
        cargarRelaciones();

    return (
        datos[mensajeId] ||
        null
    );
    }

/*
========================================
MENSAJE ELIMINADO
========================================
*/

client.on(
    'messageDelete',
    async message => {

        if (
            !message
        ) {
            return;
        }

        if (
            message.channelId !==
            CANAL_LOGS
        ) {
            return;
        }

        const usuarioId =
            obtenerUsuarioDeMensaje(
                message.id
            );

        if (!usuarioId) {
            return;
        }

        /*
        Solo deshacer si existe
        una sanción relacionada.
        */

        const sancion =
            obtenerSancionGlobal(
                usuarioId
            );

        if (!sancion) {
            return;
        }

        try {

            await unbanGlobal({
                client,
                guild:
                    null,
                usuarioId,
                razon:
                    'Mensaje de sanción eliminado',
                prueba:
                    null,
                moderadorId:
                    client.user.id
            });

            console.log(
                `🔓 ${usuarioId} desbaneado porque se eliminó su mensaje de sanción.`
            );

        } catch (
            error
        ) {

            console.error(
                '❌ Error realizando unban automático:',
                error
            );
        }
    }
);

/*
========================================
INTERACCIONES
========================================
*/

client.on(
    'interactionCreate',
    async interaction => {

        /*
        ====================================
        SELECT MENU AYUDA
        ====================================
        */

        if (
            interaction.isStringSelectMenu() &&
            interaction.customId ===
                'milo_ayuda'
        ) {

            const categoria =
                interaction.values[0];

            const embed =
                crearAyudaCategoria(
                    categoria
                );

            await interaction.update({
                embeds: [
                    embed
                ],
                components: [
                    crearMenuAyuda()
                ]
            });

            return;
        }

            /*
        ====================================
        SLASH COMMANDS
        ====================================
        */

        if (
            !interaction.isChatInputCommand()
        ) {
            return;
        }

        try {

            /*
            ================================
            /IA
            ================================
            */

            if (
                interaction.commandName ===
                'ia'
            ) {

                const pregunta =
                    interaction.options
                        .getString(
                            'pregunta'
                        );

                await interaction.deferReply();

                const idioma =
                    obtenerIdioma(
                        interaction.user.id
                    );

                const respuesta =
                    await preguntarGroq(
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

            /*
            ================================
            /PREGUNTAR
            ================================
            */

            if (
                interaction.commandName ===
                'preguntar'
            ) {

                const pregunta =
                    interaction.options
                        .getString(
                            'pregunta'
                        );

                await interaction.deferReply();

                const idioma =
                    obtenerIdioma(
                        interaction.user.id
                    );

                const respuesta =
                    await preguntarGroq(
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

            /*
            ================================
            /CHAT
            ================================
            */

            if (
                interaction.commandName ===
                'chat'
            ) {

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x5865F2
                            )
                            .setTitle(
                                '💬 Chat con Milo'
                            )
                            .setDescription(
                                'Puedes hablar conmigo escribiendo `Milo` seguido de tu pregunta, usando `?` o mencionándome.'
                            )
                    ]
                });

                return;
            }

            /*
            ================================
            /REINICIAR
            ================================
            */

            if (
                interaction.commandName ===
                'reiniciar'
            ) {

                await interaction.reply({
                    content:
                        '✅ Tu conversación ha sido reiniciada.'
                });

                return;
            }

            /*
            ================================
            /CANAL IA
            ================================
            */

            if (
                interaction.commandName ===
                'canal' &&
                interaction.options
                    .getSubcommand() ===
                    'ia'
            ) {

                if (
                    !interaction.memberPermissions
                        ?.has(
                            'ManageGuild'
                        )
                ) {

                    await interaction.reply({
                        content:
                            '❌ Necesitas el permiso **Gestionar servidor**.',
                        ephemeral:
                            true
                    });

                    return;
                }

                const canal =
                    interaction.options
                        .getChannel(
                            'canal'
                        );

                if (!canal) {

                    configurarCanalIA(
                        interaction.guildId,
                        null
                    );

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    0x57F287
                                )
                                .setTitle(
                                    '🤖 Canal de IA desactivado'
                                )
                                .setDescription(
                                    'Milo volverá a responder automáticamente en todos los canales.'
                                )
                        ]
                    });

                    return;
                }

                if (
                    canal.type !==
                        ChannelType.GuildText &&
                    canal.type !==
                        ChannelType.GuildAnnouncement
                ) {

                    await interaction.reply({
                        content:
                            '❌ Debes seleccionar un canal de texto.',
                        ephemeral:
                            true
                    });

                    return;
                }

                configurarCanalIA(
                    interaction.guildId,
                    canal.id
                );

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x57F287
                            )
                            .setTitle(
                                '🤖 Canal de IA configurado'
                            )
                            .setDescription(
                                `Milo responderá automáticamente solamente en ${canal}.`
                            )
                    ]
                });

                return;
                        }

                         /*
            ================================
            /IMAGEN
            ================================
            */

            if (
                interaction.commandName ===
                'imagen'
            ) {

                const prompt =
                    interaction.options
                        .getString(
                            'prompt'
                        );

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
                        '🖼️ Imagen generada por Milo.',
                    files: [
                        archivo
                    ]
                });

                return;
            }

            /*
            ================================
            /IDIOMA
            ================================
            */

            if (
                interaction.commandName ===
                'idioma'
            ) {

                const idioma =
                    interaction.options
                        .getString(
                            'idioma'
                        );

                if (
                    !idiomaValido(
                        idioma
                    )
                ) {

                    await interaction.reply({
                        content:
                            '❌ Ese idioma no está disponible.',
                        ephemeral:
                            true
                    });

                    return;
                }

                establecerIdioma(
                    interaction.user.id,
                    idioma
                );

                await interaction.reply({
                    content:
                        `🌐 Idioma configurado: **${obtenerNombreIdioma(idioma)}**.`
                });

                return;
            }

            /*
            ================================
            /BAN-GLOBAL
            ================================
            */

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
                            '❌ No tienes permiso para utilizar la moderación global.',
                        ephemeral:
                            true
                    });

                    return;
                }

                const usuarioId =
                    interaction.options
                        .getString(
                            'usuario'
                        );

                const razon =
                    interaction.options
                        .getString(
                            'razon'
                        );

                const tiempo =
                    interaction.options
                        .getString(
                            'tiempo'
                        );

                const prueba =
                    interaction.options
                        .getAttachment(
                            'prueba'
                        );

                await interaction.deferReply({
                    ephemeral:
                        true
                });

                const resultado =
                    await banGlobal({
                        client,
                        guild:
                            interaction.guild,
                        usuarioId,
                        razon,
                        tiempo,
                        prueba:
                            prueba?.url ||
                            null,
                        moderadorId:
                            interaction.user.id
                    });

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0xED4245
                            )
                            .setTitle(
                                '🔨 Ban global aplicado'
                            )
                            .setDescription(
                                `El usuario \`${usuarioId}\` ha sido procesado.`
                            )
                            .addFields(
                                {
                                    name:
                                        '📋 Razón',
                                    value:
                                        razon
                                },
                                {
                                    name:
                                        '⏱️ Duración',
                                    value:
                                        tiempo
                                }
                            )
                            .setTimestamp()
                    ]
                });

                return;
                        }

                         /*
            ================================
            /UNBAN-GLOBAL
            ================================
            */

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
                            '❌ No tienes permiso para utilizar la moderación global.',
                        ephemeral:
                            true
                    });

                    return;
                }

                const usuarioId =
                    interaction.options
                        .getString(
                            'usuario'
                        );

                const razon =
                    interaction.options
                        .getString(
                            'razon'
                        );

                const prueba =
                    interaction.options
                        .getAttachment(
                            'prueba'
                        );

                await interaction.deferReply({
                    ephemeral:
                        true
                });

                await unbanGlobal({
                    client,
                    guild:
                        interaction.guild,
                    usuarioId,
                    razon,
                    prueba:
                        prueba?.url ||
                        null,
                    moderadorId:
                        interaction.user.id
                });

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x57F287
                            )
                            .setTitle(
                                '🔓 Unban global aplicado'
                            )
                            .setDescription(
                                `El usuario \`${usuarioId}\` ya no tiene una sanción global activa.`
                            )
                            .setTimestamp()
                    ]
                });

                return;
            }

            /*
            ================================
            /AYUDA
            ================================
            */

            if (
                interaction.commandName ===
                'ayuda'
            ) {

                await interaction.reply({
                    embeds: [
                        crearAyudaPrincipal()
                    ],
                    components: [
                        crearMenuAyuda()
                    ]
                });

                return;
            }

            // ========================================
            // /ESTADO
           // ======================================== 

            if (
                interaction.commandName ===
                'estado'
            ) {

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x57F287
                            )
                            .setTitle(
                                '🟢 Estado de Milo'
                            )
                            .addFields(
                                {
                                    name:
                                        '🤖 Bot',
                                    value:
                                        'En línea',
                                    inline:
                                        true
                                },
                                {
                                    name:
                                        '🌐 Servidores',
                                    value:
                                        String(
                                            client.guilds.cache.size
                                        ),
                                    inline:
                                        true
                                },
                                {
                                    name:
                                        '🧠 IA',
                                    value:
                                        'Operativa',
                                    inline:
                                        true
                                }
                            )
                            .setTimestamp()
                    ]
                });

                return;
            }

            /*
            ================================
            /MODELO
            ================================
            */

            if (
                interaction.commandName ===
                'modelo'
            ) {

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x5865F2
                            )
                            .setTitle(
                                '🧠 Sistema de IA'
                            )
                            .setDescription(
                                'Milo utiliza un sistema de inteligencia artificial integrado en el bot.'
                            )
                            .setFooter({
                                text:
                                    'La configuración interna no se muestra.'
                            })
                    ]
                });

                return;
    }

    /*
            ================================
            /SERVIDOR
            ================================
            */

            if (
                interaction.commandName ===
                'servidor'
            ) {

                const guild =
                    interaction.guild;

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x5865F2
                            )
                            .setTitle(
                                `🌐 ${guild.name}`
                            )
                            .setThumbnail(
                                guild.iconURL({
                                    size:
                                        256
                                })
                            )
                            .addFields(
                                {
                                    name:
                                        '🆔 ID',
                                    value:
                                        guild.id,
                                    inline:
                                        true
                                },
                                {
                                    name:
                                        '👥 Miembros',
                                    value:
                                        String(
                                            guild.memberCount
                                        ),
                                    inline:
                                        true
                                },
                                {
                                    name:
                                        '📅 Creado',
                                    value:
                                        `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
                                    inline:
                                        true
                                }
                            )
                    ]
                });

                return;
            }

            /*
            ================================
            /USUARIO
            ================================
            */

            if (
                interaction.commandName ===
                'usuario'
            ) {

                const usuario =
                    interaction.options
                        .getUser(
                            'usuario'
                        ) ||
                    interaction.user;

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x5865F2
                            )
                            .setTitle(
                                `👤 ${usuario.username}`
                            )
                            .setThumbnail(
                                usuario.displayAvatarURL({
                                    size:
                                        256
                                })
                            )
                            .addFields(
                                {
                                    name:
                                        '🆔 ID',
                                    value:
                                        usuario.id
                                },
                                {
                                    name:
                                        '🤖 Bot',
                                    value:
                                        usuario.bot
                                            ? 'Sí'
                                            : 'No'
                                },
                                {
                                    name:
                                        '📅 Cuenta creada',
                                    value:
                                        `<t:${Math.floor(usuario.createdTimestamp / 1000)}:D>`
                                }
                            )
                    ]
                });

                return;
            }

            /*
            ================================
            /AVATAR
            ================================
            */

            if (
                interaction.commandName ===
                'avatar'
            ) {

                const usuario =
                    interaction.options
                        .getUser(
                            'usuario'
                        ) ||
                    interaction.user;

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x5865F2
                            )
                            .setTitle(
                                `🖼️ Avatar de ${usuario.username}`
                            )
                            .setImage(
                                usuario.displayAvatarURL({
                                    size:
                                        1024
                                })
                            )
                    ]
                });

                return;
            }

            /*
            ================================
            /PING
            ================================
            */

            if (
                interaction.commandName ===
                'ping'
            ) {

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x57F287
                            )
                            .setTitle(
                                '🏓 Pong!'
                            )
                            .setDescription(
                                `Latencia de Milo: **${client.ws.ping}ms**`
                            )
                    ]
                });

                return;
            }

            /*
            ================================
            /CALCULAR
            ================================
            */

            if (
                interaction.commandName ===
                'calcular'
            ) {

                const operacion =
                    interaction.options
                        .getString(
                            'operacion'
                        );

                const resultado =
                    calcularOperacion(
                        operacion
                    );

                await interaction.reply({
                    content:
                        `🧮 Resultado: **${resultado}**`
                });

                return;
            }

             /*
            ================================
            /TRADUCIR
            ================================
            */

            if (
                interaction.commandName ===
                'traducir'
            ) {

                const texto =
                    interaction.options
                        .getString(
                            'texto'
                        );

                const idioma =
                    interaction.options
                        .getString(
                            'idioma'
                        );

                await interaction.deferReply();

                const resultado =
                    await traducir(
                        texto,
                        idioma
                    );

                await interaction.editReply({
                    content:
                        resultado
                });

                return;
            }

            /*
            ================================
            /RESUMIR
            ================================
            */

            if (
                interaction.commandName ===
                'resumir'
            ) {

                const texto =
                    interaction.options
                        .getString(
                            'texto'
                        );

                await interaction.deferReply();

                const resultado =
                    await resumir(
                        texto
                    );

                await interaction.editReply({
                    content:
                        resultado
                });

                return;
            }

            /*
            ================================
            /HORA
            ================================
            */

            if (
                interaction.commandName ===
                'hora'
            ) {

                const zona =
                    interaction.options
                        .getString(
                            'zona'
                        );

                const hora =
                    obtenerHora(
                        zona
                    );

                await interaction.reply({
                    content:
                        `🕐 **${hora}**`
                });

                return;
            }

             /*
            ================================
            /CONVERTIR
            ================================
            */

            if (
                interaction.commandName ===
                'convertir'
            ) {

                const valor =
                    interaction.options
                        .getString(
                            'valor'
                        );

                const destino =
                    interaction.options
                        .getString(
                            'a'
                        );

                /*
                El comando actual solo
                tiene valor + destino.
                */

                await interaction.reply({
                    content:
                        `🔄 Conversión solicitada: **${valor} → ${destino}**`
                });

                return;
            }

            /*
            ================================
            /SOPORTE
            ================================
            */

            if (
                interaction.commandName ===
                'soporte'
            ) {

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x5865F2
                            )
                            .setTitle(
                                '💙 Soporte oficial de Milo'
                            )
                            .setDescription(
                                '¿Necesitas ayuda? Únete al servidor oficial de soporte.'
                            )
                            .addFields({
                                name:
                                    '🔗 Servidor',
                                value:
                                    'https://discord.gg/csnebvXgSv'
                            })
                    ]
                });

                return;
            }

            /*
            ================================
            /INVITAR
            ================================
            */

            if (
                interaction.commandName ===
                'invitar'
            ) {

                const enlace =
                    `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x5865F2
                            )
                            .setTitle(
                                '🤖 Invitar a Milo'
                            )
                            .setDescription(
                                `[➕ Invitar a Milo](${enlace})`
                            )
                    ]
                });

                return;
            }

            /*
            ================================
            /ESTADÍSTICAS
            ================================
            */

            if (
                interaction.commandName ===
                'estadisticas'
            ) {

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                0x5865F2
                            )
                            .setTitle(
                                '📊 Estadísticas de Milo'
                            )
                            .addFields(
                                {
                                    name:
                                        '🌐 Servidores',
                                    value:
                                        String(
                                            client.guilds.cache.size
                                        ),
                                    inline:
                                        true
                                },
                                {
                                    name:
                                        '👥 Usuarios aproximados',
                                    value:
                                        String(
                                            client.guilds.cache.reduce(
                                                (
                                                    total,
                                                    guild
                                                ) =>
                                                    total +
                                                    guild.memberCount,
                                                0
                                            )
                                        ),
                                    inline:
                                        true
                                },
                                {
                                    name:
                                        '📡 Ping',
                                    value:
                                        `${client.ws.ping}ms`,
                                    inline:
                                        true
                                }
                            )
                    ]
                });

                return;
            }

        } catch (
            error
        ) {

            console.error(
                '❌ Error en interacción:',
                error
            );

            const respuesta =
                `❌ ${error.message || 'Ocurrió un error inesperado.'}`;

            try {

                if (
                    interaction.deferred
                ) {

                    await interaction.editReply({
                        content:
                            respuesta
                    });

                } else if (
                    interaction.replied
                ) {

                    await interaction.followUp({
                        content:
                            respuesta,
                        ephemeral:
                            true
                    });

                } else {

                    await interaction.reply({
                        content:
                            respuesta,
                        ephemeral:
                            true
                    });
                }

            } catch {}
        }
    }
);

/*
========================================
ERRORES
========================================
*/

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

/*
========================================
LOGIN
========================================
*/

if (
    !process.env.DISCORD_TOKEN
) {

    console.error(
        '❌ DISCORD_TOKEN no está configurado en .env'
    );

    process.exit(1);
}

client.login(
    process.env.DISCORD_TOKEN
);
