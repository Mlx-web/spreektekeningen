/* =========================================================================
   Thema-registratie + laadmechanisme.
   Gebruikt door zowel het menuscherm (menu.js) als het animatiescherm
   (tekening.js) — pas dit bestand niet aan om een thema toe te voegen,
   dat doe je in js/themas/.
   ========================================================================= */

window.THEMAS = window.THEMAS || {};

/**
 * Wordt aangeroepen vanuit elk bestand in js/themas/*.js (behalve manifest.js).
 *
 * @param {object} thema
 * @param {string} thema.slug          Unieke, URL-veilige naam (bv. "hart").
 *                                     Wordt onderdeel van de link /tekeningen/<slug>.
 * @param {string} thema.titel
 * @param {string} thema.omschrijving  Korte tekst, zichtbaar in het menu.
 * @param {string} thema.thuisartsUrl  Link naar de bijbehorende Thuisarts.nl-pagina.
 *                                     Laat leeg ("") als die nog niet ingevuld is.
 * @param {string} thema.viewBox       SVG viewBox, bv. "0 0 400 400".
 * @param {Array<{label: string, paden: string[]}>} thema.stappen
 *                                     Elke stap is één of meer SVG-pad-
 *                                     "d"-waardes die tegelijk getekend worden.
 */
function registreerThema(thema) {
  if (!thema || !thema.slug) {
    console.error("Thema zonder geldige slug genegeerd:", thema);
    return;
  }
  if (window.THEMAS[thema.slug]) {
    console.warn(`Let op: thema-slug "${thema.slug}" komt dubbel voor — controleer js/themas/.`);
  }
  window.THEMAS[thema.slug] = thema;
}

/**
 * Laadt alle thema-bestanden uit het manifest (js/themas/manifest.js) via
 * losse <script>-tags en roept daarna callback() aan. Bewust geen fetch():
 * zo werkt dit ook lokaal als je index.html gewoon dubbelklikt, zonder dat
 * er een servertje nodig is.
 */
function laadAlleThemas(callback) {
  const manifest = window.THEMA_MANIFEST || [];
  if (manifest.length === 0) {
    callback();
    return;
  }

  let geladen = 0;
  const klaar = () => {
    geladen++;
    if (geladen === manifest.length) callback();
  };

  manifest.forEach((slug) => {
    const script = document.createElement("script");
    script.src = `js/themas/${slug}.js`;
    script.onload = klaar;
    script.onerror = () => {
      console.error(`Kon thema-bestand "js/themas/${slug}.js" niet laden.`);
      klaar();
    };
    document.head.appendChild(script);
  });
}
