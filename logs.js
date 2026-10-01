const fs = require('fs');
const path = require('path');

const ARCHIVO = path.join(__dirname, 'config-servidores.json');

function cargarConfiguracion() {
    try {
        if (!fs.existsSync(ARCHIVO)) {
            return {};
        }

        const datos = JSON.parse(
            fs.readFileSync(ARCHIVO, 'utf8')
        );

        return datos && typeof datos === 'object'
            ? datos
            : {};

    } catch (error) {
        console.error('❌ Error leyendo config-servidores.json:', error);
        return {};
    }
}

function guardarConfiguracion(datos) {
    try {
        fs.writeFileSync(
            ARCHIVO,
            JSON.stringify(datos, null, 2),
            'utf8'
        );

        return true;

    } catch (error) {
        console.error(
            '❌ Error guardando config-servidores.json:',
            error
        );

        return false;
    }
}

function configurarLogs(guildId, canalId) {
    if (!guildId) {
        throw new Error('El ID del servidor es obligatorio.');
    }

    if (!canalId) {
        throw new Error('El ID del canal es obligatorio.');
    }

    const configuracion = cargarConfiguracion();

    if (!configuracion[guildId]) {
        configuracion[guildId] = {};
    }

    configuracion[guildId].canalLogs = canalId;

    guardarConfiguracion(configuracion);

    return configuracion[guildId];
}

function obtenerCanalLogs(guildId) {
    const configuracion = cargarConfiguracion();

    return configuracion[guildId]?.canalLogs || null;
}

async function enviarLog(guild, mensaje) {
    try {
        if (!guild) return false;

        const canalId = obtenerCanalLogs(guild.id);

        if (!canalId) return false;

        const canal = await guild.channels
            .fetch(canalId)
            .catch(() => null);

        if (!canal || !canal.isTextBased()) {
            return false;
        }

        await canal.send({
            content: String(mensaje)
        });

        return true;

    } catch (error) {
        console.error('❌ Error enviando log:', error);
        return false;
    }
}

module.exports = {
    cargarConfiguracion,
    guardarConfiguracion,
    configurarLogs,
    obtenerCanalLogs,
    enviarLog
};
