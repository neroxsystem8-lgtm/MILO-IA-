const CATEGORIAS = {
    tickets: "「🎫」・TICKETS",
    moderacion: "「🛡️」・MODERACIÓN",
    premium: "「💎」・PREMIUM"
};

async function crearCategorias(guild) {
    const creadas = {};

    for (const [clave, nombre] of Object.entries(CATEGORIAS)) {
        let categoria = guild.channels.cache.find(
            channel =>
                channel.type === 4 &&
                channel.name === nombre
        );

        if (!categoria) {
            try {
                categoria = await guild.channels.create({
                    name: nombre,
                    type: 4
                });

                console.log(
                    `📁 Categoría creada en ${guild.name}: ${nombre}`
                );
            } catch (error) {
                console.error(
                    `❌ No se pudo crear ${nombre} en ${guild.name}:`,
                    error.message
                );

                continue;
            }
        }

        creadas[clave] = categoria.id;
    }

    return creadas;
}

module.exports = {
    crearCategorias,
    CATEGORIAS
};
