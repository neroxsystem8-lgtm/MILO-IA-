const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const SERVIDOR_GLOBAL = '1553169784697528450';
const ROL_GLOBAL = '1553526636547280967';

/* =========================================================
   📋 COMANDOS
========================================================= */

const comandos = [

    /* =========================
       🤖 INTELIGENCIA ARTIFICIAL
    ========================= */

    new SlashCommandBuilder()
        .setName('ia')
        .setDescription('Habla con Milo mediante inteligencia artificial')
        .addStringOption(option =>
            option
                .setName('pregunta')
                .setDescription('Pregunta que quieres hacerle a Milo')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('preguntar')
        .setDescription('Haz una pregunta a Milo')
        .addStringOption(option =>
            option
                .setName('pregunta')
                .setDescription('Tu pregunta')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Continúa tu conversación con Milo'),

    new SlashCommandBuilder()
        .setName('reiniciar')
        .setDescription('Reinicia tu conversación con Milo'),

    /* =========================
       🖼️ IMÁGENES
    ========================= */

    new SlashCommandBuilder()
        .setName('imagen')
        .setDescription('Genera una imagen con inteligencia artificial')
        .addStringOption(option =>
            option
                .setName('descripcion')
                .setDescription('Describe la imagen que quieres generar')
                .setRequired(true)
        ),

    /* =========================
       🌐 IDIOMAS
    ========================= */

    new SlashCommandBuilder()
        .setName('idioma')
        .setDescription('Cambia el idioma de Milo')
        .addStringOption(option =>
            option
                .setName('idioma')
                .setDescription('Idioma que quieres utilizar')
                .setRequired(true)
                .addChoices(
                    { name: '🇪🇸 Español', value: 'es' },
                    { name: '🇺🇸 English', value: 'en' },
                    { name: '🇧🇷 Português', value: 'pt' },
                    { name: '🇫🇷 Français', value: 'fr' },
                    { name: '🇩🇪 Deutsch', value: 'de' },
                    { name: '🇮🇹 Italiano', value: 'it' },
                    { name: '🇯🇵 日本語', value: 'ja' },
                    { name: '🇰🇷 한국어', value: 'ko' },
                    { name: '🇨🇳 中文', value: 'zh' }
                )
        ),

    /* =========================
       🧮 UTILIDADES
    ========================= */

    new SlashCommandBuilder()
        .setName('calcular')
        .setDescription('Realiza una operación matemática')
        .addStringOption(option =>
            option
                .setName('operacion')
                .setDescription('Ejemplo: 25 * 8 + 10')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('convertir')
        .setDescription('Convierte una cantidad entre unidades')
        .addNumberOption(option =>
            option
                .setName('cantidad')
                .setDescription('Cantidad que quieres convertir')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('de')
                .setDescription('Unidad de origen, por ejemplo kg')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('a')
                .setDescription('Unidad de destino, por ejemplo g')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('traducir')
        .setDescription('Traduce un texto')
        .addStringOption(option =>
            option
                .setName('texto')
                .setDescription('Texto que quieres traducir')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('idioma')
                .setDescription('Idioma al que quieres traducir')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('resumir')
        .setDescription('Resume un texto')
        .addStringOption(option =>
            option
                .setName('texto')
                .setDescription('Texto que quieres resumir')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('explicar')
        .setDescription('Explica un tema con ayuda de Milo')
        .addStringOption(option =>
            option
                .setName('tema')
                .setDescription('Tema que quieres que explique')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('hora')
        .setDescription('Muestra la hora actual')
        .addStringOption(option =>
            option
                .setName('zona')
                .setDescription('Zona horaria, ejemplo America/Bogota')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('fecha')
        .setDescription('Muestra la fecha actual')
        .addStringOption(option =>
            option
                .setName('zona')
                .setDescription('Zona horaria')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('contador')
        .setDescription('Calcula cuánto falta para una fecha')
        .addStringOption(option =>
            option
                .setName('fecha')
                .setDescription('Fecha objetivo')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('porcentaje')
        .setDescription('Calcula un porcentaje')
        .addNumberOption(option =>
            option
                .setName('porcentaje')
                .setDescription('Porcentaje')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName('cantidad')
                .setDescription('Cantidad')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('regla3')
        .setDescription('Resuelve una regla de tres')
        .addNumberOption(option =>
            option
                .setName('a')
                .setDescription('Valor A')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName('b')
                .setDescription('Valor B')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName('c')
                .setDescription('Valor C')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('generar-password')
        .setDescription('Genera una contraseña aleatoria')
        .addIntegerOption(option =>
            option
                .setName('longitud')
                .setDescription('Longitud de la contraseña')
                .setMinValue(6)
                .setMaxValue(128)
                .setRequired(false)
        ),

    /* =========================
       🛡️ MODERACIÓN GLOBAL
    ========================= */

    new SlashCommandBuilder()
        .setName('ban-global')
        .setDescription('Banea globalmente a un usuario')
        .addStringOption(option =>
            option
                .setName('usuario')
                .setDescription('ID o usuario de Discord')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('razon')
                .setDescription('Razón del baneo')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('duracion')
                .setDescription('Ejemplo: 10m, 5h, 2d, permanente')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('unban-global')
        .setDescription('Retira un baneo global')
        .addStringOption(option =>
            option
                .setName('usuario')
                .setDescription('ID del usuario')
                .setRequired(true)
        ),

    /* =========================
       ⚙️ CONFIGURACIÓN IA
    ========================= */

    new SlashCommandBuilder()
        .setName('canal')
        .setDescription('Configura el canal donde Milo responderá')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('ia')
                .setDescription('Configura el canal de inteligencia artificial')
                .addChannelOption(option =>
                    option
                        .setName('canal')
                        .setDescription('Canal donde Milo responderá')
                        .setRequired(false)
                )
        ),

    /* =========================
       ℹ️ INFORMACIÓN
    ========================= */

    new SlashCommandBuilder()
        .setName('estado')
        .setDescription('Muestra el estado de Milo'),

    new SlashCommandBuilder()
        .setName('modelo')
        .setDescription('Muestra información sobre la IA'),

    new SlashCommandBuilder()
        .setName('servidor')
        .setDescription('Muestra información del servidor'),

    new SlashCommandBuilder()
        .setName('usuario')
        .setDescription('Muestra información de un usuario')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuario que quieres consultar')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Muestra el avatar de un usuario')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuario')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Muestra la latencia de Milo'),

    new SlashCommandBuilder()
        .setName('estadisticas')
        .setDescription('Muestra las estadísticas de Milo'),

    /* =========================
       💙 MILO
    ========================= */

    new SlashCommandBuilder()
        .setName('soporte')
        .setDescription('Obtén el servidor oficial de soporte'),

    new SlashCommandBuilder()
        .setName('invitar')
        .setDescription('Obtén el enlace para invitar a Milo'),

    /* =========================
       📚 AYUDA
    ========================= */

    new SlashCommandBuilder()
        .setName('ayuda')
        .setDescription('Abre el centro de ayuda de Milo')
];

/* =========================================================
   📤 REGISTRAR COMANDOS
========================================================= */

async function registrarComandos(client) {

    try {

        console.log('🔄 Registrando comandos slash...');

        await client.application.commands.set(
            comandos.map(comando => comando.toJSON())
        );

        console.log(
            `✅ ${comandos.length} comandos registrados correctamente.`
        );

    } catch (error) {

        console.error(
            '❌ Error registrando comandos:',
            error
        );
    }
}

/* =========================================================
   🔐 PERMISOS DE MODERACIÓN GLOBAL
========================================================= */

function puedeUsarGlobal(member) {

    if (!member) {
        return false;
    }

    if (member.id === member.guild.ownerId) {
        return true;
    }

    if (
        member.guild.id === SERVIDOR_GLOBAL &&
        member.roles.cache.has(ROL_GLOBAL)
    ) {
        return true;
    }

    return false;
}

/* =========================================================
   📤 EXPORTACIONES
========================================================= */

module.exports = {
    comandos,
    registrarComandos,
    puedeUsarGlobal,
    SERVIDOR_GLOBAL,
    ROL_GLOBAL
};
