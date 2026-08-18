/* Rendert de startpagina (index.html): één tegel per categorie
   (orgaan-omgeving), met de aangeleverde illustratie erop.
   Ontbreekt die illustratie nog (afbeelding: "")? Dan valt de tegel terug
   op de gekleurde lijntekening van het eerste thema in die categorie --
   zodra de "echte" illustratie binnenkomt, verschijnt die vanzelf. */
const SVG_NS_OVERZICHT = "http://www.w3.org/2000/svg";

document.addEventListener("DOMContentLoaded", () => {
  laadAlleCategorieen(() => {
    laadAlleThemas(() => {
      const grid = document.getElementById("categorie-grid");
      const slugs = window.CATEGORIE_MANIFEST || [];

      if (slugs.length === 0) {
        grid.innerHTML = '<p class="leeg-bericht">Nog geen categorieën toegevoegd.</p>';
        return;
      }

      grid.innerHTML = "";
      slugs.forEach((slug) => {
        const categorie = window.CATEGORIEEN[slug];
        if (!categorie) return;
        grid.appendChild(bouwCategorieTegel(categorie));
      });
    });
  });
});

function bouwCategorieTegel(categorie) {
  const tegel = document.createElement("a");
  tegel.className = "categorie-tegel";
  tegel.href = `categorie.html?categorie=${encodeURIComponent(categorie.slug)}`;

  if (categorie.afbeelding) {
    const img = document.createElement("img");
    img.className = "categorie-tegel__afbeelding";
    img.src = categorie.afbeelding;
    img.alt = "";
    tegel.appendChild(img);
  } else {
    tegel.appendChild(bouwPlaceholderIllustratie(categorie.slug));
  }

  const naam = document.createElement("span");
  naam.className = "categorie-tegel__naam";
  naam.textContent = categorie.titel;

  tegel.appendChild(naam);
  return tegel;
}

/* Tijdelijke vervanger zolang er nog geen "echte" illustratie is: de
   gekleurde tegel-stijl die we al hadden, met de tekening van het eerste
   thema in deze categorie erop. */
function bouwPlaceholderIllustratie(categorieSlug) {
  const themaSlug = themasVoorCategorie(categorieSlug)[0];
  const wrapper = document.createElement("div");
  wrapper.className = "categorie-tegel__placeholder";

  const thema = themaSlug ? window.THEMAS[themaSlug] : null;
  if (!thema) {
    wrapper.style.setProperty("--kleur", "#dddddd");
    return wrapper;
  }

  wrapper.style.setProperty("--kleur", thema.kleur || "#dddddd");
  const svg = document.createElementNS(SVG_NS_OVERZICHT, "svg");
  svg.setAttribute("viewBox", thema.viewBox);
  thema.stappen.forEach((stap) => {
    stap.paden.forEach((d) => {
      const pad = document.createElementNS(SVG_NS_OVERZICHT, "path");
      pad.setAttribute("d", d);
      pad.setAttribute("class", "tekening-pad");
      svg.appendChild(pad);
    });
  });
  wrapper.appendChild(svg);
  return wrapper;
}
