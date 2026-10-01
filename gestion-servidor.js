const {
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

async function crearCategoria(guild, nombre) {
    if (!guild) {
        throw new Error('Servidor no válido.');
    }

    if (!nombre || !nombre.trim()) {
        throw new Error('Debes indicar el nombre de la categoría.');
    }

    const categoria = await guild.channels.create({
        name: nombre.trim(),
        type: ChannelType.GuildCategory
    });

    return categoria;
}

async function crearCanalTexto(
    guild,
    nombre,
    categoriaId = null
) {
    if (!guild) {
        throw new Error('Servidor no válido.');
    }

    if (!nombre || !nombre.trim()) {
        throw new Error('Debes indicar el nombre del canal.');
    }

    const opciones = {
        name: nombre.trim(),
        type: ChannelType.GuildText
    };

    if (categoriaId) {
        const categoria = guild.channels.cache.get(categoriaId);

        if (
            categoria &&
            categoria.type === ChannelType.GuildCategory
        ) {
            opciones.parent = categoria.id;
        }
    }

    const canal = await guild.channels.create(opciones);

    return canal;
}

async function crearCanalVoz(
    guild,
    nombre,
    categoriaId = null
) {
    if (!guild) {
        throw new Error('Servidor no válido.');
    }

    if (!nombre || !nombre.trim()) {
        throw new Error('Debes indicar el nombre del canal.');
    }

    const opciones = {
        name: nombre.trim(),
        type: ChannelType.GuildVoice
    };

    if (categoriaId) {
        const categoria = guild.channels.cache.get(categoriaId);

        if (
            categoria &&
            categoria.type === ChannelType.GuildCategory
        ) {
            opciones.parent = categoria.id;
        }
    }

    const canal = await guild.channels.create(opciones);

    return canal;
}

async function eliminarCanal(guild, canalId) {
    if (!guild || !canalId) {
        throw new Error('Datos insuficientes.');
    }

    const canal = await guild.channels
        .fetch(canalId)
        .catch(() => null);

    if (!canal) {
        throw new Error('No encontré ese canal.');
    }

    await canal.delete();

    return true;
}

async function renombrarCanal(
    guild,
    canalId,
    nuevoNombre
) {
    if (!guild || !canalId) {
        throw new Error('Datos insuficientes.');
    }

    if (!nuevoNombre || !nuevoNombre.trim()) {
        throw new Error('Debes indicar el nuevo nombre.');
    }

    const canal = await guild.channels
        .fetch(canalId)
        .catch(() => null);

    if (!canal) {
        throw new Error('No encontré ese canal.');
    }

    await canal.setName(nuevoNombre.trim());

    return canal;
}

async function moverCanal(
    guild,
    canalId,
    categoriaId
) {
    if (!guild || !canalId || !categoriaId) {
        throw new Error('Datos insuficientes.');
    }

    const canal = await guild.channels
        .fetch(canalId)
        .catch(() => null);

    const categoria = await guild.channels
        .fetch(categoriaId)
        .catch(() => null);

    if (!canal) {
        throw new Error('No encontré el canal.');
    }

    if (
        !categoria ||
        categoria.type !== ChannelType.GuildCategory
    ) {
        throw new Error('La categoría no es válida.');
    }

    await canal.setParent(categoria.id);

    return canal;
}

function esPropietario(guild, usuarioId) {
    if (!guild || !usuarioId) {
        return false;
    }

    return guild.ownerId === usuarioId;
}

function puedeGestionarServidor(member) {
    if (!member) return false;

    return (
        member.permissions.has(
            PermissionFlagsBits.ManageChannels
        ) ||
        member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    );
}

module.exports = {
    crearCategoria,
    crearCanalTexto,
    crearCanalVoz,
    eliminarCanal,
    renombrarCanal,
    moverCanal,
    esPropietario,
    puedeGestionarServidor
};
