const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const SERVIDOR_GLOBAL = '1553169784697528450';
const ROL_GLOBAL = '1553526636547280967';

const comandos = [

    // ==========================================
    // 🤖 INTELIGENCIA ARTIFICIAL
    // ==========================================

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
        .setDescription('Hazle una pregunta a Milo')
        .addStringOption(option =>
            option
                .setName('pregunta')
                .setDescription('Tu pregunta')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Inicia una conversación con Milo'),

    new SlashCommandBuilder()
        .setName('reiniciar')
        .setDescription('Reinicia tu conversación con Milo'),

    // ==========================================
    // 📌 CANAL DE IA
    // ==========================================

    new SlashCommandBuilder()
        .setName('canal')
        .setDescription('Configura el canal donde funcionará la IA')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ia')
                .setDescription('Configura, cambia o desactiva el canal de IA')
                .addChannelOption(option =>
                    option
                        .setName('canal')
                        .setDescription('Canal donde funcionará la IA')
                        .setRequired(false)
                )
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild.toString()
        ),

    // ==========================================
    // 🖼️ IMÁGENES
    // ==========================================

    new SlashCommandBuilder()
        .setName('imagen')
        .setDescription('Genera una imagen mediante inteligencia artificial')
        .addStringOption(option =>
            option
                .setName('prompt')
                .setDescription('Describe la imagen que quieres generar')
                .setRequired(true)
        ),

    // ==========================================
    // 🌐 IDIOMAS
    // ==========================================

    new SlashCommandBuilder()
        .setName('idioma')
        .setDescription('Configura el idioma de respuesta de Milo')
        .addStringOption(option =>
            option
                .setName('idioma')
                .setDescription('Idioma que quieres utilizar')
                .setRequired(true)
                .addChoices(
                    { name: '🇪🇸 Español', value: 'es' },
                    { name: '🇺🇸 Inglés', value: 'en' },
                    { name: '🇧🇷 Portugués', value: 'pt' },
                    { name: '🇫🇷 Francés', value: 'fr' },
                    { name: '🇩🇪 Alemán', value: 'de' },
                    { name: '🇮🇹 Italiano', value: 'it' },
                    { name: '🇯🇵 Japonés', value: 'ja' },
                    { name: '🇰🇷 Coreano', value: 'ko' },
                    { name: '🇨🇳 Chino', value: 'zh' }
                )
        ),

    // ==========================================
    // 🛡️ MODERACIÓN GLOBAL
    // ==========================================

    new SlashCommandBuilder()
        .setName('ban-global')
        .setDescription('Banea globalmente a un usuario')
        .addStringOption(option =>
            option
                .setName('usuario')
                .setDescription('ID del usuario que será baneado')
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
                .setName('tiempo')
                .setDescription('Ejemplo: 10 minutos, 2 días, 6 meses o permanente')
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option
                .setName('prueba')
                .setDescription('Captura o evidencia del motivo')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('unban-global')
        .setDescription('Retira un baneo global')
        .addStringOption(option =>
            option
                .setName('usuario')
                .setDescription('ID del usuario')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('razon')
                .setDescription('Razón del desbloqueo')
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option
                .setName('prueba')
                .setDescription('Captura o evidencia')
                .setRequired(false)
        ),

    // ==========================================
    // 📊 INFORMACIÓN
    // ==========================================

    new SlashCommandBuilder()
        .setName('ayuda')
        .setDescription('Muestra el centro de ayuda de Milo'),

    new SlashCommandBuilder()
        .setName('estado')
        .setDescription('Muestra el estado de Milo'),

    new SlashCommandBuilder()
        .setName('modelo')
        .setDescription('Muestra información del sistema de IA'),

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
                .setDescription('Usuario cuyo avatar quieres ver')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Muestra la latencia de Milo'),

    // ==========================================
    // 🔧 UTILIDADES
    // ==========================================

    new SlashCommandBuilder()
        .setName('calcular')
        .setDescription('Realiza una operación matemática')
        .addStringOption(option =>
            option
                .setName('operacion')
                .setDescription('Ejemplo: 20 + 20 * 2')
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
        .setName('hora')
        .setDescription('Consulta la hora de una zona')
        .addStringOption(option =>
            option
                .setName('zona')
                .setDescription('Ejemplo: America/Bogota')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('convertir')
        .setDescription('Convierte unidades')
        .addStringOption(option =>
            option
                .setName('valor')
                .setDescription('Valor que quieres convertir')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('a')
                .setDescription('Unidad de destino')
                .setRequired(true)
        ),

    // ==========================================
    // 👑 MILO
    // ==========================================

    new SlashCommandBuilder()
        .setName('soporte')
        .setDescription('Muestra el servidor oficial de soporte'),

    new SlashCommandBuilder()
        .setName('invitar')
        .setDescription('Muestra el enlace para invitar a Milo'),

    new SlashCommandBuilder()
        .setName('estadisticas')
        .setDescription('Muestra las estadísticas de Milo')
];

/*
==========================================
REGISTRAR COMANDOS
==========================================
*/

async function registrarComandos(client) {
    try {
        const datos =
            comandos.map(
                comando => comando.toJSON()
            );

        await client.application.commands.set(
            datos
        );

        console.log(
            `✅ ${datos.length} comandos registrados correctamente.`
        );

    } catch (error) {
        console.error(
            '❌ Error registrando comandos:',
            error
        );

        throw error;
    }
}

/*
==========================================
PERMISOS DE MODERACIÓN GLOBAL
==========================================
*/

function puedeUsarGlobal(interaction) {

    if (
        interaction.guildId !==
        SERVIDOR_GLOBAL
    ) {
        return false;
    }

    if (
        !interaction.member?.roles?.cache?.has(
            ROL_GLOBAL
        )
    ) {
        return false;
    }

    return true;
}

/*
==========================================
EXPORTAR
==========================================
*/

module.exports = {
    comandos,
    registrarComandos,
    puedeUsarGlobal,
    SERVIDOR_GLOBAL,
    ROL_GLOBAL
};
