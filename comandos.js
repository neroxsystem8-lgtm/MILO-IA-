// comandos.js

const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const SERVIDOR_GLOBAL = '1553169784697528450';
const ROL_GLOBAL = '1553526636547280967';

const comandos = [

    // =========================
    // IA
    // =========================

    new SlashCommandBuilder()
        .setName('ia')
        .setDescription('Habla con Milo mediante Gemini')
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

    // =========================
    // INFORMACIÓN
    // =========================

    new SlashCommandBuilder()
        .setName('ayuda')
        .setDescription('Muestra la ayuda de Milo'),

    new SlashCommandBuilder()
        .setName('estado')
        .setDescription('Muestra el estado de Milo'),

    new SlashCommandBuilder()
        .setName('modelo')
        .setDescription('Muestra el modelo de IA utilizado'),

    // =========================
    // BAN GLOBAL
    // =========================

    new SlashCommandBuilder()
        .setName('ban-global')
        .setDescription('Banea globalmente a un usuario')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuario que será baneado')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('razon')
                .setDescription('Razón del baneo')
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option
                .setName('prueba')
                .setDescription('Captura o evidencia del motivo')
                .setRequired(false)
        ),

    // =========================
    // UNBAN GLOBAL
    // =========================

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
        )
];

/*
========================================
VERIFICAR PERMISOS DE MODERACIÓN GLOBAL
========================================
*/

function puedeUsarGlobal(interaction) {

    if (interaction.guildId !== SERVIDOR_GLOBAL) {
        return false;
    }

    if (!interaction.member?.roles?.cache?.has(ROL_GLOBAL)) {
        return false;
    }

    return true;
}

/*
========================================
EXPORTAR
========================================
*/

module.exports = {
    comandos,
    puedeUsarGlobal,
    SERVIDOR_GLOBAL,
    ROL_GLOBAL
};
