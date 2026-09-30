const fs = require('fs');
const path = require('path');

const ARCHIVO = path.join(
    __dirname,
    'sanciones.json'
);

/*
=========================
CARGAR SANCIONES
=========================
*/

function cargarSanciones() {
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
            '❌ Error leyendo sanciones.json:',
            error
        );

        return {};
    }
}

/*
=========================
GUARDAR SANCIONES
=========================
*/

function guardarSanciones(sanciones) {
    try {
        fs.writeFileSync(
            ARCHIVO,
            JSON.stringify(
                sanciones,
                null,
                2
            )
        );

        return true;

    } catch (error) {
        console.error(
            '❌ Error guardando sanciones.json:',
            error
        );

        return false;
    }
}

/*
=========================
GUARDAR SANCIÓN
=========================
*/

function guardarSancion({
    usuarioId,
    usuario = null,
    razon = 'Sin razón especificada',
    duracionTexto = 'permanente',
    permanente = false,
    fechaInicio = new Date(),
    fechaExpiracion = null,
    mensajeId = null,
    moderadorId = null,
    prueba = null
}) {
    if (!usuarioId) {
        throw new Error(
            'El ID del usuario es obligatorio.'
        );
    }

    const sanciones =
        cargarSanciones();

    sanciones[usuarioId] = {
        usuarioId,
        usuario,

        razon,

        duracion:
            duracionTexto,

        permanente:
            Boolean(permanente),

        fechaInicio:
            new Date(
                fechaInicio
            ).toISOString(),

        fechaExpiracion:
            fechaExpiracion
                ? new Date(
                    fechaExpiracion
                ).toISOString()
                : null,

        mensajeId,

        moderadorId,

        prueba,

        estado: 'baneado'
    };

    guardarSanciones(
        sanciones
    );

    return sanciones[usuarioId];
}

/*
=========================
OBTENER SANCIÓN
=========================
*/

function obtenerSancion(usuarioId) {
    const sanciones =
        cargarSanciones();

    return (
        sanciones[usuarioId] ||
        null
    );
}

/*
=========================
ELIMINAR SANCIÓN
=========================
*/

function eliminarSancion(usuarioId) {
    const sanciones =
        cargarSanciones();

    if (!sanciones[usuarioId]) {
        return false;
    }

    delete sanciones[usuarioId];

    guardarSanciones(
        sanciones
    );

    return true;
}

/*
=========================
ACTUALIZAR ESTADO
=========================
*/

function actualizarEstado(
    usuarioId,
    estado
) {
    const sanciones =
        cargarSanciones();

    if (!sanciones[usuarioId]) {
        return false;
    }

    sanciones[usuarioId].estado =
        estado;

    guardarSanciones(
        sanciones
    );

    return true;
}

/*
=========================
COMPROBAR EXPIRACIÓN
=========================
*/

function sancionExpirada(usuarioId) {
    const sancion =
        obtenerSancion(
            usuarioId
        );

    if (!sancion) {
        return false;
    }

    if (sancion.permanente) {
        return false;
    }

    if (!sancion.fechaExpiracion) {
        return false;
    }

    return (
        Date.now() >=
        new Date(
            sancion.fechaExpiracion
        ).getTime()
    );
}

/*
=========================
OBTENER SANCIONES ACTIVAS
=========================
*/

function obtenerSancionesActivas() {
    const sanciones =
        cargarSanciones();

    return Object.values(
        sanciones
    ).filter(sancion => {
        if (
            sancion.estado !==
            'baneado'
        ) {
            return false;
        }

        if (sancion.permanente) {
            return true;
        }

        if (!sancion.fechaExpiracion) {
            return true;
        }

        return (
            Date.now() <
            new Date(
                sancion.fechaExpiracion
            ).getTime()
        );
    });
}

/*
=========================
OBTENER SANCIONES EXPIRADAS
=========================
*/

function obtenerSancionesExpiradas() {
    const sanciones =
        cargarSanciones();

    return Object.values(
        sanciones
    ).filter(sancion => {
        if (
            sancion.estado !==
            'baneado'
        ) {
            return false;
        }

        if (sancion.permanente) {
            return false;
        }

        if (!sancion.fechaExpiracion) {
            return false;
        }

        return (
            Date.now() >=
            new Date(
                sancion.fechaExpiracion
            ).getTime()
        );
    });
}

/*
=========================
BUSCAR POR MENSAJE
=========================
*/

function obtenerSancionPorMensaje(
    mensajeId
) {
    const sanciones =
        cargarSanciones();

    return (
        Object.values(
            sanciones
        ).find(
            sancion =>
                sancion.mensajeId ===
                mensajeId
        ) || null
    );
}

/*
=========================
EXPORTAR
=========================
*/

module.exports = {
    cargarSanciones,
    guardarSanciones,
    guardarSancion,
    obtenerSancion,
    eliminarSancion,
    actualizarEstado,
    sancionExpirada,
    obtenerSancionesActivas,
    obtenerSancionesExpiradas,
    obtenerSancionPorMensaje
};
