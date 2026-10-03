const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

function cargarDatos() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const datosIniciales = {
                premium: {
                    users: {},
                    servers: {},
                    codes: {}
                },
                servers: {},
                users: {},
                stats: {
                    messages: 0,
                    aiResponses: 0,
                    images: 0,
                    tickets: 0,
                    moderations: 0
                }
            };

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(datosIniciales, null, 2)
            );

            return datosIniciales;
        }

        return JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );
    } catch (error) {
        console.error("❌ Error cargando data.json:", error);

        return {
            premium: {
                users: {},
                servers: {},
                codes: {}
            },
            servers: {},
            users: {},
            stats: {
                messages: 0,
                aiResponses: 0,
                images: 0,
                tickets: 0,
                moderations: 0
            }
        };
    }
}

function guardarDatos(datos) {
    try {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(datos, null, 2)
        );
    } catch (error) {
        console.error("❌ Error guardando data.json:", error);
    }
}

function sumarEstadistica(nombre, cantidad = 1) {
    const datos = cargarDatos();

    if (
        typeof datos.stats[nombre] !== "number"
    ) {
        datos.stats[nombre] = 0;
    }

    datos.stats[nombre] += cantidad;

    guardarDatos(datos);

    return datos.stats[nombre];
}

function obtenerEstadisticas() {
    const datos = cargarDatos();

    return datos.stats;
}

function obtenerDatos() {
    return cargarDatos();
}

module.exports = {
    cargarDatos,
    guardarDatos,
    sumarEstadistica,
    obtenerEstadisticas,
    obtenerDatos
};
