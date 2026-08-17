/* Rendert het menuscherm (index.html) op basis van window.THEMAS.
   Elke tegel toont de volledig getekende versie van het thema (alle
   stappen tegelijk, geen animatie) op de eigen kleur van dat thema. */
const SVG_NS_MENU = "http://www.w3.org/2000/svg";

document.addEventListener("DOMContentLoaded", () => {
  laadAlleThemas(() => {
    const grid = document.getElementById("thema-grid");
    const slugs = window.THEMA_MANIFEST || [];

    if (slugs.length === 0) {
      grid.innerHTML = '<p class="leeg-bericht">Nog geen thema\'s toegevoegd.</p>';
      return;
    }

    grid.innerHTML = "";
    slugs.forEach((slug) => {
      const thema = window.THEMAS[slug];
      if (!thema) return;
      grid.appendChild(bouwTegel(thema));
    });
  });
});

function bouwTegel(thema) {
  const tegel = document.createElement("a");
  tegel.className = "thema-tegel";
  tegel.href = `tekening.html?thema=${encodeURIComponent(thema.slug)}`;
  tegel.style.setProperty("--kleur", thema.kleur || "#dddddd");
  tegel.setAttribute("aria-label", `${thema.titel} — ${thema.omschrijving}`);

  const svg = document.createElementNS(SVG_NS_MENU, "svg");
  svg.setAttribute("viewBox", thema.viewBox);
  svg.setAttribute("class", "thema-tegel__tekening");
  thema.stappen.forEach((stap) => {
    stap.paden.forEach((d) => {
      const pad = document.createElementNS(SVG_NS_MENU, "path");
      pad.setAttribute("d", d);
      pad.setAttribute("class", "tekening-pad");
      svg.appendChild(pad);
    });
  });

  const naam = document.createElement("span");
  naam.className = "thema-tegel__naam";
  naam.textContent = thema.titel;

  tegel.append(svg, naam);
  return tegel;
}
