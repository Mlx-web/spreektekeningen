/* Rendert het menuscherm (index.html) op basis van window.THEMAS. */
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

      const kaart = document.createElement("a");
      kaart.className = "thema-kaart";
      kaart.href = `tekening.html?thema=${encodeURIComponent(thema.slug)}`;

      const titel = document.createElement("h2");
      titel.className = "thema-kaart__titel";
      titel.textContent = thema.titel;

      const omschrijving = document.createElement("p");
      omschrijving.className = "thema-kaart__omschrijving";
      omschrijving.textContent = thema.omschrijving;

      kaart.append(titel, omschrijving);
      grid.appendChild(kaart);
    });
  });
});
