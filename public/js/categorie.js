/* Rendert categorie.html: de losse spreektekeningen (thema's) binnen één
   categorie, als eenvoudige zwart-witte pentekening-tegels (bewust geen
   kleur hier -- dat effect is voor de startpagina). */
const SVG_NS_CATEGORIE = "http://www.w3.org/2000/svg";

function haalCategorieSlugOp() {
  const params = new URLSearchParams(location.search);
  if (params.has("categorie")) return params.get("categorie");
  const delen = location.pathname.split("/").filter(Boolean);
  return delen[delen.length - 1] || null;
}

document.addEventListener("DOMContentLoaded", () => {
  laadAlleCategorieen(() => {
    laadAlleThemas(() => {
      const slug = haalCategorieSlugOp();
      const categorie = slug ? window.CATEGORIEEN[slug] : null;

      if (!categorie) {
        document.getElementById("categorie-titel").textContent = "Niet gevonden";
        document.getElementById("thema-grid").innerHTML =
          `<p class="leeg-bericht">Er is geen categorie met de naam "${slug || ""}" gevonden.</p>`;
        return;
      }

      document.title = `Spreektekeningen — ${categorie.titel}`;
      document.getElementById("categorie-titel").textContent = categorie.titel;

      const grid = document.getElementById("thema-grid");
      const themaSlugs = themasVoorCategorie(categorie.slug);

      if (themaSlugs.length === 0) {
        grid.innerHTML = '<p class="leeg-bericht">Nog geen tekeningen toegevoegd in deze categorie.</p>';
        return;
      }

      themaSlugs.forEach((themaSlug) => {
        grid.appendChild(bouwThemaTegel(window.THEMAS[themaSlug]));
      });
    });
  });
});

function bouwThemaTegel(thema) {
  const tegel = document.createElement("a");
  tegel.className = "thema-kaart";
  tegel.href = `tekening.html?thema=${encodeURIComponent(thema.slug)}`;
  tegel.setAttribute("aria-label", `Open de tekening "${thema.titel}"`);

  const svg = document.createElementNS(SVG_NS_CATEGORIE, "svg");
  svg.setAttribute("viewBox", thema.viewBox);
  svg.setAttribute("class", "thema-kaart__tekening");
  thema.stappen.forEach((stap) => {
    stap.paden.forEach((d) => {
      const pad = document.createElementNS(SVG_NS_CATEGORIE, "path");
      pad.setAttribute("d", d);
      pad.setAttribute("class", "tekening-pad");
      svg.appendChild(pad);
    });
  });

  const naam = document.createElement("span");
  naam.className = "thema-kaart__naam";
  naam.textContent = thema.titel;

  tegel.append(svg, naam);
  return tegel;
}
