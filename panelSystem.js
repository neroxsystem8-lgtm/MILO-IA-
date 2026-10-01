const fs = require('fs');
const path = require('path');

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require('discord.js');

const ARCHIVO = path.join(
    __dirname,
    'paneles.json'
);


/* =========================================================
   CARGAR PANELES
========================================================= */

function cargarPaneles() {

    try {

        if (!fs.existsSync(ARCHIVO)) {
            return {};
        }

        const datos = JSON.parse(
            fs.readFileSync(
                ARCHIVO,
                'utf8'
            )
        );

        return datos &&
            typeof datos === 'object'
            ? datos
            : {};

    } catch (error) {

        console.error(
            '❌ Error leyendo paneles.json:',
            error
        );

        return {};

    }

}


/* =========================================================
   GUARDAR PANELES
========================================================= */

function guardarPaneles(paneles) {

    try {

        fs.writeFileSync(
            ARCHIVO,
            JSON.stringify(
                paneles,
                null,
                2
            ),
            'utf8'
        );

        return true;

    } catch (error) {

        console.error(
            '❌ Error guardando paneles.json:',
            error
        );

        return false;

    }

}


/* =========================================================
   CREAR PANEL
========================================================= */

function crearPanel({

    guildId,
    canalId,
    descripcion,
    rolId = null,
    usuarioId = null

}) {

    if (!guildId) {
        throw new Error(
            'El servidor es obligatorio.'
        );
    }

    if (!canalId) {
        throw new Error(
            'El canal es obligatorio.'
        );
    }

    if (
        !descripcion ||
        !descripcion.trim()
    ) {

        throw new Error(
            'La descripción del panel es obligatoria.'
        );

    }

    const paneles =
        cargarPaneles();

    const id =
        Date.now().toString();

    const panel = {

        id,

        guildId,

        canalId,

        descripcion:
            descripcion.trim(),

        rolId,

        usuarioId,

        creadoEn:
            new Date().toISOString()

    };

    paneles[id] = panel;

    guardarPaneles(
        paneles
    );

    return panel;

}


/* =========================================================
   OBTENER PANEL
========================================================= */

function obtenerPanel(panelId) {

    const paneles =
        cargarPaneles();

    return (
        paneles[panelId] ||
        null
    );

}


/* =========================================================
   OBTENER PANELES DEL SERVIDOR
========================================================= */

function obtenerPanelesServidor(
    guildId
) {

    const paneles =
        cargarPaneles();

    return Object.values(
        paneles
    ).filter(
        panel =>
            panel.guildId === guildId
    );

}


/* =========================================================
   ELIMINAR PANEL
========================================================= */

function eliminarPanel(panelId) {

    const paneles =
        cargarPaneles();

    if (
        !paneles[panelId]
    ) {

        return false;

    }

    delete paneles[panelId];

    guardarPaneles(
        paneles
    );

    return true;

}


/* =========================================================
   CREAR MENSAJE DEL PANEL
========================================================= */

function crearMensajePanel(panel) {

    const embed =
        new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(
                '🎫 Sistema de Tickets'
            )
            .setDescription(
                panel.descripcion
            )
            .setFooter({
                text:
                    'Milo Ticket'
            });

    const boton =
        new ButtonBuilder()
            .setCustomId(
                `ticket_abrir_${panel.id}`
            )
            .setLabel(
                'Abrir ticket'
            )
            .setEmoji('🎫')
            .setStyle(
                ButtonStyle.Primary
            );

    const fila =
        new ActionRowBuilder()
            .addComponents(
                boton
            );

    return {
        embeds: [embed],
        components: [fila]
    };

}


/* =========================================================
   ENVIAR PANEL
========================================================= */

async function enviarPanel(
    client,
    panel
) {

    if (!client) {
        throw new Error(
            'El cliente de Discord es obligatorio.'
        );
    }

    const guild =
        await client.guilds
            .fetch(panel.guildId)
            .catch(() => null);

    if (!guild) {
        throw new Error(
            'No se encontró el servidor.'
        );
    }

    const canal =
        await guild.channels
            .fetch(panel.canalId)
            .catch(() => null);

    if (!canal) {
        throw new Error(
            'No se encontró el canal.'
        );
    }

    if (
        canal.type !==
        ChannelType.GuildText
    ) {

        throw new Error(
            'El canal seleccionado no es un canal de texto.'
        );

    }

    const mensaje =
        crearMensajePanel(
            panel
        );

    const enviado =
        await canal.send(
            mensaje
        );

    return enviado;

}


/* =========================================================
   CREAR Y ENVIAR PANEL
========================================================= */

async function crearYEnviarPanel({

    client,
    guildId,
    canalId,
    descripcion,
    rolId = null,
    usuarioId = null

}) {

    const panel =
        crearPanel({

            guildId,
            canalId,
            descripcion,
            rolId,
            usuarioId

        });

    try {

        const mensaje =
            await enviarPanel(
                client,
                panel
            );

        return {
            panel,
            mensaje
        };

    } catch (error) {

        /*
         * Si no pudo enviarse,
         * eliminamos el panel guardado.
         */

        eliminarPanel(
            panel.id
        );

        throw error;

    }

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    cargarPaneles,

    guardarPaneles,

    crearPanel,

    obtenerPanel,

    obtenerPanelesServidor,

    eliminarPanel,

    crearMensajePanel,

    enviarPanel,

    crearYEnviarPanel

};
