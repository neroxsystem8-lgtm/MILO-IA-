require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    ActivityType
} = require("discord.js");

const funciones = require("./funciones");
require("./web");

/* =========================
   CLIENTE DE DISCORD
========================= */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites
    ],

    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
    ]
});

/* =========================
   CONFIGURACIÓN
========================= */

const GLOBAL_LOG_CHANNEL_ID =
    process.env.GLOBAL_LOG_CHANNEL_ID ||
    "1553774365504569464";

const NOTIFICATION_CHANNEL_ID =
    process.env.NOTIFICATION_CHANNEL_ID ||
    "1553527162336841759";

/* =========================
   DATOS
========================= */

let datos;

try {
    datos = funciones.cargarDatos();
} catch (error) {
    console.error(
        "❌ No se pudieron cargar los datos:",
        error
    );

    process.exit(1);
}

/* =========================
   PRESENCIA
========================= */

function actualizarPresencia() {
    if (!client.user) return;

    client.user.setPresence({
        activities: [
            {
                name: "Milo IA",
                type: ActivityType.Playing
            }
        ],
        status: "online"
    });
}

/* =========================
   LOG GLOBAL
========================= */

async function logGlobal({
    titulo,
    descripcion,
    color = 0x5865f2,
    campos = []
}) {
    try {
        const canal =
            await client.channels.fetch(
                GLOBAL_LOG_CHANNEL_ID
            ).catch(() => null);

        if (!canal || !canal.isTextBased()) {
            return;
        }

        const embed = {
            title: titulo,
            description:
                descripcion || undefined,
            color,
            fields: campos,
            timestamp: new Date()
        };

        await canal.send({
            embeds: [embed]
        });
    } catch (error) {
        console.error(
            "❌ Error en log global:",
            error.message
        );
    }
}

/* =========================
   INVITACIÓN PERMANENTE
========================= */

async function obtenerInvitacion(guild) {
    try {
        const yo =
            guild.members.me;

        if (!yo) return null;

        const canales =
            guild.channels.cache.filter(
                canal =>
                    canal.isTextBased() &&
                    canal
                        .permissionsFor(yo)
                        ?.has("CreateInstantInvite")
            );

        const canal =
            canales.first();

        if (!canal) return null;

        const invite =
            await canal.createInvite({
                maxAge: 0,
                maxUses: 0,
                unique: true,
                reason:
                    "Invitación permanente de Milo IA"
            });

        return invite.url;
    } catch {
        return null;
    }
}

/* =========================
   NOTIFICACIONES
========================= */

async function notificarEntrada(guild) {
    try {
        const canal =
            await client.channels.fetch(
                NOTIFICATION_CHANNEL_ID
            ).catch(() => null);

        if (!canal || !canal.isTextBased()) {
            return;
        }

        const owner =
            await guild.fetchOwner()
                .catch(() => null);

        const invite =
            await obtenerInvitacion(guild);

        const embed = {
            color: 0x57f287,
            title:
                "🤖 Milo fue añadido a un servidor",

            fields: [
                {
                    name: "🏠 Servidor",
                    value:
                        guild.name ||
                        "Desconocido",
                    inline: true
                },

                {
                    name: "👥 Miembros",
                    value:
                        String(
                            guild.memberCount || 0
                        ),
                    inline: true
                },

                {
                    name: "👑 Propietario",
                    value:
                        owner?.user?.tag ||
                        owner?.user?.username ||
                        "Desconocido",
                    inline: true
                },

                {
                    name: "📅 Fecha",
                    value:
                        `<t:${Math.floor(
                            Date.now() / 1000
                        )}:F>`,
                    inline: false
                },

                {
                    name: "🔗 Invitar a Milo",
                    value:
                        invite ||
                        "No se pudo generar una invitación.",
                    inline: false
                },

                {
                    name: "🌐 Servidores",
                    value:
                        String(
                            client.guilds.cache.size
                        ),
                    inline: true
                }
            ],

            timestamp: new Date()
        };

        await canal.send({
            embeds: [embed]
        });

        await logGlobal({
            titulo:
                "🤖 Milo entró a un servidor",

            color: 0x57f287,

            campos: [
                {
                    name: "🏠 Servidor",
                    value: guild.name,
                    inline: true
                },
                {
                    name: "👥 Miembros",
                    value:
                        String(
                            guild.memberCount || 0
                        ),
                    inline: true
                },
                {
                    name: "🌐 Servidores",
                    value:
                        String(
                            client.guilds.cache.size
                        ),
                    inline: true
                }
            ]
        });
    } catch (error) {
        console.error(
            "❌ Error notificando entrada:",
            error.message
        );
    }
}

async function notificarSalida(guild) {
    try {
        const canal =
            await client.channels.fetch(
                NOTIFICATION_CHANNEL_ID
            ).catch(() => null);

        const embed = {
            color: 0xed4245,
            title:
                "🚪 Milo salió de un servidor",

            fields: [
                {
                    name: "🏠 Servidor",
                    value:
                        guild.name ||
                        "Desconocido",
                    inline: true
                },

                {
                    name: "👥 Miembros",
                    value:
                        String(
                            guild.memberCount || 0
                        ),
                    inline: true
                },

                {
                    name: "📅 Fecha",
                    value:
                        `<t:${Math.floor(
                            Date.now() / 1000
                        )}:F>`,
                    inline: false
                },

                {
                    name: "🌐 Servidores actuales",
                    value:
                        String(
                            client.guilds.cache.size
                        ),
                    inline: true
                }
            ],

            timestamp: new Date()
        };

        if (canal?.isTextBased()) {
            await canal.send({
                embeds: [embed]
            });
        }

        await logGlobal({
            titulo:
                "🚪 Milo salió de un servidor",

            color: 0xed4245,

            campos: [
                {
                    name: "🏠 Servidor",
                    value:
                        guild.name ||
                        "Desconocido",
                    inline: true
                },

                {
                    name: "👥 Miembros",
                    value:
                        String(
                            guild.memberCount || 0
                        ),
                    inline: true
                },

                {
                    name: "🌐 Servidores",
                    value:
                        String(
                            client.guilds.cache.size
                        ),
                    inline: true
                }
            ]
        });
    } catch (error) {
        console.error(
            "❌ Error notificando salida:",
            error.message
        );
    }
}

/* =========================
   READY
========================= */

client.once("ready", async () => {
    console.log("");
    console.log("================================");
    console.log("🤖 MILO IA");
    console.log("================================");
    console.log(
        `👤 ${client.user.tag}`
    );
    console.log(
        `🌐 Servidores: ${client.guilds.cache.size}`
    );
    console.log(
        `📡 Ping: ${client.ws.ping}ms`
    );
    console.log("================================");
    console.log("");

    actualizarPresencia();

    /*
     * Inicialización general de cada servidor.
     */

    for (
        const guild of client.guilds.cache.values()
    ) {
        try {
            if (!datos.servers[guild.id]) {
                datos.servers[guild.id] = {
                    idioma: "es",
                    premium: null,
                    tickets: {},
                    configuracion: {},
                    uso: {
                        ia: 0,
                        imagenes: 0,
                        tickets: 0
                    }
                };
            }

            /*
             * Si funciones.js tiene un
             * inicializador de servidor,
             * se ejecuta automáticamente.
             */

            if (
                typeof funciones.inicializarServidor ===
                "function"
            ) {
                await funciones.inicializarServidor(
                    client,
                    guild,
                    datos
                );
            }
        } catch (error) {
            console.error(
                `❌ Error inicializando ${guild.name}:`,
                error.message
            );
        }
    }

    funciones.guardarDatos(datos);

    await logGlobal({
        titulo: "🟢 Milo IA iniciado",
        descripcion:
            "Milo IA se encuentra conectado y operativo.",
        color: 0x57f287,

        campos: [
            {
                name: "🌐 Servidores",
                value:
                    String(
                        client.guilds.cache.size
                    ),
                inline: true
            },

            {
                name: "📡 Ping",
                value:
                    `${client.ws.ping}ms`,
                inline: true
            }
        ]
    });
});

/* =========================
   NUEVO SERVIDOR
========================= */

client.on(
    "guildCreate",
    async guild => {
        console.log(
            `➕ Milo entró a: ${guild.name}`
        );

        try {
            if (!datos.servers[guild.id]) {
                datos.servers[guild.id] = {
                    idioma: "es",
                    premium: null,
                    tickets: {},
                    configuracion: {},
                    uso: {
                        ia: 0,
                        imagenes: 0,
                        tickets: 0
                    }
                };
            }

            funciones.guardarDatos(datos);

            if (
                typeof funciones.inicializarServidor ===
                "function"
            ) {
                await funciones.inicializarServidor(
                    client,
                    guild,
                    datos
                );
            }

            await notificarEntrada(guild);
        } catch (error) {
            console.error(
                "❌ Error en guildCreate:",
                error
            );
        }
    }
);

/* =========================
   SALIDA DE SERVIDOR
========================= */

client.on(
    "guildDelete",
    async guild => {
        console.log(
            `➖ Milo salió de: ${guild.name}`
        );

        await notificarSalida(guild);
    }
);

/* =========================
   MENSAJES
========================= */

client.on(
    "messageCreate",
    async message => {
        try {
            if (message.author.bot) {
                return;
            }

            if (!message.guild) {
                return;
            }

            /*
             * Todo el procesamiento de Milo
             * pasa por funciones.js.
             */

            if (
                typeof funciones.procesarMensaje ===
                "function"
            ) {
                await funciones.procesarMensaje(
                    client,
                    message,
                    datos
                );

                return;
            }

            /*
             * Compatibilidad mientras se termina
             * de conectar funciones.js.
             */

            if (
                typeof funciones.sumarEstadistica ===
                "function"
            ) {
                funciones.sumarEstadistica(
                    "messages"
                );
            }
        } catch (error) {
            console.error(
                "❌ Error procesando mensaje:",
                error
            );

            await logGlobal({
                titulo:
                    "❌ Error en messageCreate",
                descripcion:
                    error.message,
                color: 0xed4245
            });
        }
    }
);

/* =========================
   INTERACCIONES
========================= */

client.on(
    "interactionCreate",
    async interaction => {
        try {
            if (
                typeof funciones.procesarInteraccion ===
                "function"
            ) {
                await funciones.procesarInteraccion(
                    client,
                    interaction,
                    datos
                );
            }
        } catch (error) {
            console.error(
                "❌ Error en interacción:",
                error
            );

            try {
                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    await interaction.reply({
                        content:
                            "❌ Ocurrió un error al procesar esta acción.",
                        ephemeral: true
                    });
                }
            } catch {}
        }
    }
);

/* =========================
   ERRORES
========================= */

client.on(
    "error",
    error => {
        console.error(
            "❌ Error de Discord:",
            error
        );
    }
);

client.on(
    "warn",
    warning => {
        console.warn(
            "⚠️ Discord:",
            warning
        );
    }
);

process.on(
    "unhandledRejection",
    error => {
        console.error(
            "❌ Unhandled Rejection:",
            error
        );
    }
);

process.on(
    "uncaughtException",
    error => {
        console.error(
            "❌ Uncaught Exception:",
            error
        );
    }
);

/* =========================
   APAGADO SEGURO
========================= */

async function apagar(signal) {
    console.log(
        `\n🛑 Recibida señal ${signal}.`
    );

    try {
        funciones.guardarDatos(datos);

        await logGlobal({
            titulo: "🔴 Milo IA detenido",
            descripcion:
                `Milo IA se está apagando (${signal}).`,
            color: 0xed4245
        });
    } catch {}

    client.destroy();

    process.exit(0);
}

process.on(
    "SIGINT",
    () => apagar("SIGINT")
);

process.on(
    "SIGTERM",
    () => apagar("SIGTERM")
);

/* =========================
   TOKEN
========================= */

if (!process.env.DISCORD_TOKEN) {
    console.error(
        "❌ DISCORD_TOKEN no está configurado en .env"
    );

    process.exit(1);
}

/* =========================
   LOGIN
========================= */

client.login(
    process.env.DISCORD_TOKEN
);
