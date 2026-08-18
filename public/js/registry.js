/* =========================================================================
   Registratie + laadmechanisme voor categorieën (orgaan-overzicht) en
   thema's (losse spreektekeningen). Gebruikt door alle drie de schermen
   (index.html, categorie.html, tekening.html) — pas dit bestand niet aan
   om een categorie of thema toe te voegen, dat doe je in js/categorieen/
   of js/themas/.
   ========================================================================= */

window.CATEGORIEEN = window.CATEGORIEEN || {};
window.THEMAS = window.THEMAS || {};

/**
 * Wordt aangeroepen vanuit elk bestand in js/categorieen/*.js (behalve manifest.js).
 * Een categorie is een "orgaan-omgeving" op de startpagina (bv. "Hart"),
 * met daaronder één of meer spreektekeningen (thema's).
 *
 * @param {object} categorie
 * @param {string} categorie.slug         Unieke, URL-veilige naam (bv. "hart").
 *                                        Wordt onderdeel van de link /categorieen/<slug>.
 * @param {string} categorie.titel
 * @param {string} categorie.afbeelding   Pad naar de illustratie op de startpagina
 *                                        (bv. "img/categorieen/hart.png").
 */
function registreerCategorie(categorie) {
  if (!categorie || !categorie.slug) {
    console.error("Categorie zonder geldige slug genegeerd:", categorie);
    return;
  }
  if (window.CATEGORIEEN[categorie.slug]) {
    console.warn(`Let op: categorie-slug "${categorie.slug}" komt dubbel voor — controleer js/categorieen/.`);
  }
  window.CATEGORIEEN[categorie.slug] = categorie;
}

/**
 * Wordt aangeroepen vanuit elk bestand in js/themas/*.js (behalve manifest.js).
 * Eén thema = één spreektekening (het scherm met de stap-voor-stap animatie).
 *
 * @param {object} thema
 * @param {string} thema.slug          Unieke, URL-veilige naam (bv. "hart").
 *                                     Wordt onderdeel van de link /tekeningen/<slug>.
 * @param {string} thema.titel
 * @param {string} thema.omschrijving  Korte tekst, niet zichtbaar op de tegel zelf
 *                                     (wel als toegankelijkheids-label).
 * @param {string} thema.categorie     Slug van de bijbehorende categorie (bv. "hart") --
 *                                     bepaalt onder welke orgaan-omgeving deze tekening
 *                                     op de site staat.
 * @param {string} thema.viewBox       SVG viewBox, bv. "0 0 400 400".
 * @param {Array<{label: string, paden: string[]}>} thema.stappen
 *                                     Elke stap is één of meer SVG-pad-
 *                                     "d"-waardes die tegelijk getekend worden.
 *
 * De Thuisarts-link en de "tekst voor thuis" horen NIET in dit bestand --
 * die vul je in via het "Bewerken"-paneel op de tekenpagina zelf (worden
 * bewaard op de server, zie netlify/functions/thema-info.js), zodat een
 * patiënt die de QR-code thuis scant hetzelfde te zien krijgt.
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
 * Laadt een lijst bestanden (uit een map, bv. "js/themas/") via losse
 * <script>-tags en roept daarna callback() aan. Bewust geen fetch(): zo
 * werkt dit ook lokaal als je een pagina gewoon dubbelklikt, zonder dat er
 * een servertje nodig is.
 */
function laadBestanden(bestandsnamen, map, callback) {
  if (bestandsnamen.length === 0) {
    callback();
    return;
  }

  let geladen = 0;
  const klaar = () => {
    geladen++;
    if (geladen === bestandsnamen.length) callback();
  };

  bestandsnamen.forEach((naam) => {
    const script = document.createElement("script");
    script.src = `${map}${naam}.js`;
    script.onload = klaar;
    script.onerror = () => {
      console.error(`Kon "${map}${naam}.js" niet laden.`);
      klaar();
    };
    document.head.appendChild(script);
  });
}

function laadAlleCategorieen(callback) {
  laadBestanden(window.CATEGORIE_MANIFEST || [], "js/categorieen/", callback);
}

function laadAlleThemas(callback) {
  laadBestanden(window.THEMA_MANIFEST || [], "js/themas/", callback);
}

/** Themaslugs die bij een categorie horen, in manifest-volgorde. */
function themasVoorCategorie(categorieSlug) {
  return (window.THEMA_MANIFEST || []).filter(
    (slug) => window.THEMAS[slug] && window.THEMAS[slug].categorie === categorieSlug
  );
}
