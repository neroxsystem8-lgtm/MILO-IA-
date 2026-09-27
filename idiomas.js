const idiomas = new Map();

/* =========================
   IDIOMAS DISPONIBLES
========================= */

const IDIOMAS_DISPONIBLES = {
    es: 'Español',
    en: 'English',
    pt: 'Português',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    ja: '日本語',
    ko: '한국어',
    zh: '中文'
};

/* =========================
   OBTENER IDIOMA
========================= */

function obtenerIdioma(usuarioId) {

    return idiomas.get(usuarioId) || 'es';

}

/* =========================
   ESTABLECER IDIOMA
========================= */

function establecerIdioma(
    usuarioId,
    idioma
) {

    if (
        !IDIOMAS_DISPONIBLES[idioma]
    ) {

        throw new Error(
            'Ese idioma no está disponible.'
        );

    }

    idiomas.set(
        usuarioId,
        idioma
    );

    return idioma;

}

/* =========================
   COMPROBAR IDIOMA
========================= */

function idiomaValido(idioma) {

    return Boolean(
        IDIOMAS_DISPONIBLES[idioma]
    );

}

/* =========================
   NOMBRE DEL IDIOMA
========================= */

function obtenerNombreIdioma(
    idioma
) {

    return (
        IDIOMAS_DISPONIBLES[idioma] ||
        'Español'
    );

}

/* =========================
   LISTA DE IDIOMAS
========================= */

function obtenerIdiomas() {

    return {
        ...IDIOMAS_DISPONIBLES
    };

}

/* =========================
   ELIMINAR PREFERENCIA
========================= */

function eliminarIdioma(
    usuarioId
) {

    idiomas.delete(usuarioId);

}

/* =========================
   EXPORTAR
========================= */

module.exports = {

    obtenerIdioma,

    establecerIdioma,

    idiomaValido,

    obtenerNombreIdioma,

    obtenerIdiomas,

    eliminarIdioma,

    IDIOMAS_DISPONIBLES

};
