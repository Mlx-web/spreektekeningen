/* =========================================================================
   Animatiescherm (tekening.html): bouwt de SVG op uit het thema, tekent
   stap voor stap (stroke-dasharray/-dashoffset), en vult het printgebied
   (altijd de VOLTOOIDE tekening + QR-code, ongeacht de huidige stap).
   ========================================================================= */

const SVG_NS = "http://www.w3.org/2000/svg";

function haalSlugOp() {
  const params = new URLSearchParams(location.search);
  if (params.has("thema")) return params.get("thema");
  // Fallback voor de "mooie" URL /tekeningen/<slug> (via Netlify-redirect).
  const delen = location.pathname.split("/").filter(Boolean);
  return delen[delen.length - 1] || null;
}

function toonFoutmelding(tekst) {
  document.getElementById("thema-titel").textContent = "Niet gevonden";
  document.getElementById("interactief-gebied").innerHTML =
    `<p>${tekst}</p><p><a href="index.html">← Terug naar het overzicht</a></p>`;
}

document.addEventListener("DOMContentLoaded", () => {
  laadAlleCategorieen(() => {
    laadAlleThemas(() => {
      const slug = haalSlugOp();
      const thema = slug ? window.THEMAS[slug] : null;

      if (!thema) {
        toonFoutmelding(
          slug
            ? `Er is geen thema met de naam "${slug}" gevonden.`
            : "Er is geen thema opgegeven."
        );
        return;
      }

      startInteractieveTekening(thema);
      vulPrintgebied(thema);
      laadThemaInfo(thema);
      initBeheerPaneel(thema);
      zetTerugLink(thema);
    });
  });
});

function zetTerugLink(thema) {
  const terug = document.getElementById("koptekst-terug");
  const categorie = window.CATEGORIEEN && window.CATEGORIEEN[thema.categorie];
  if (categorie) {
    terug.href = `categorie.html?categorie=${encodeURIComponent(categorie.slug)}`;
    terug.textContent = `← ${categorie.titel}`;
  }
}

function startInteractieveTekening(thema) {
  document.title = `Spreektekeningen — ${thema.titel}`;
  document.getElementById("thema-titel").textContent = thema.titel;

  const svg = document.getElementById("tekening-svg");
  svg.setAttribute("viewBox", thema.viewBox);

  // Eén <path>-element per pad, gegroepeerd per stap (data-stap-index).
  const padenPerStap = [];
  thema.stappen.forEach((stap, stapIndex) => {
    const padenVanDezeStap = [];
    stap.paden.forEach((d) => {
      const pad = document.createElementNS(SVG_NS, "path");
      pad.setAttribute("d", d);
      pad.setAttribute("class", "tekening-pad");
      pad.dataset.stapIndex = String(stapIndex);
      svg.appendChild(pad);
      padenVanDezeStap.push(pad);
    });
    padenPerStap.push(padenVanDezeStap);
  });

  // Padlengte kan pas na het toevoegen aan de DOM opgevraagd worden.
  //
  // Verborgen paden krijgen zowel dashoffset = lengte ALS opacity: 0.
  // Dashoffset alleen zou genoeg moeten zijn, maar sommige browsers laten
  // op het naadpunt van dash/gap soms een spookstipje zien (een
  // renderingdetail, geen logicafout) -- opacity: 0 sluit dat helemaal uit.
  //
  // transition tijdelijk uitzetten: .tekening-pad heeft een CSS-transition
  // op stroke-dashoffset (voor het latere teken-effect). Zonder deze truc
  // animeert de allereerste keer verbergen óók mee -- dan flitst de hele
  // tekening bij het openen van de pagina eerst zichtbaar en dan onzichtbaar.
  padenPerStap.flat().forEach((pad) => {
    const lengte = pad.getTotalLength();
    pad.style.transition = "none";
    pad.style.strokeDasharray = String(lengte);
    pad.style.strokeDashoffset = String(lengte);
    pad.style.opacity = "0";
    pad.getBoundingClientRect(); // forceert een reflow vóór we de transition terugzetten
    pad.style.transition = "";
  });

  const totaalStappen = thema.stappen.length;
  let huidigeStap = 0; // aantal reeds getekende stappen

  const stapLabelEl = document.getElementById("stap-label");
  const stapTellerEl = document.getElementById("stap-teller");
  const knopVolgende = document.getElementById("knop-volgende");
  const knopReset = document.getElementById("knop-reset");
  const knopPrint = document.getElementById("knop-print");

  function bijwerken() {
    stapTellerEl.textContent = `Stap ${huidigeStap} van ${totaalStappen}`;
    if (huidigeStap === 0) {
      stapLabelEl.textContent = "Klaar om te beginnen";
    } else {
      stapLabelEl.textContent = thema.stappen[huidigeStap - 1].label;
    }

    knopVolgende.disabled = huidigeStap >= totaalStappen;
    knopVolgende.textContent = huidigeStap >= totaalStappen ? "Voltooid" : "Volgende stap";
    knopReset.disabled = huidigeStap === 0;
  }

  knopVolgende.addEventListener("click", () => {
    if (huidigeStap >= totaalStappen) return;
    padenPerStap[huidigeStap].forEach((pad) => {
      pad.style.opacity = "1";
      pad.style.strokeDashoffset = "0";
    });
    huidigeStap++;
    bijwerken();
  });

  knopReset.addEventListener("click", () => {
    // Instant verbergen (geen geanimeerde "terugloop"): logischer voor
    // een reset-knop, en voorkomt dat de teken-transition zichtbaar
    // "terugspoelt".
    padenPerStap.flat().forEach((pad) => {
      pad.style.transition = "none";
      pad.style.strokeDashoffset = pad.style.strokeDasharray;
      pad.style.opacity = "0";
      pad.getBoundingClientRect();
      pad.style.transition = "";
    });
    huidigeStap = 0;
    bijwerken();
  });

  knopPrint.addEventListener("click", () => {
    window.print();
  });

  bijwerken();
}

function vulPrintgebied(thema) {
  document.getElementById("print-titel").textContent = thema.titel;

  // Altijd de volledig getekende versie, los van de huidige interactieve stap:
  // gewone <path>-elementen zonder stroke-dasharray zijn standaard al volledig zichtbaar.
  const printSvg = document.getElementById("print-svg");
  printSvg.setAttribute("viewBox", thema.viewBox);
  thema.stappen.forEach((stap) => {
    stap.paden.forEach((d) => {
      const pad = document.createElementNS(SVG_NS, "path");
      pad.setAttribute("d", d);
      pad.setAttribute("class", "tekening-pad");
      printSvg.appendChild(pad);
    });
  });

  const herbekijkUrl = `${location.origin}/tekeningen/${encodeURIComponent(thema.slug)}`;
  document.getElementById("print-url").textContent = herbekijkUrl;

  const qr = qrcode(0, "M");
  qr.addData(herbekijkUrl);
  qr.make();
  document.getElementById("print-qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0 });

  // print-thuisarts en print-notitie worden gevuld door laadThemaInfo()
  // zodra de beheer-API antwoord heeft gegeven.
}

/* -------------------------------------------------------------------------
   Beheer-info (Thuisarts-link + tekst voor thuis)
   -------------------------------------------------------------------------
   Deze twee velden staan NIET in het thema-bestand, maar in een klein
   opslagvakje op de server (netlify/functions/thema-info.js) -- dat is de
   enige manier waarop "invullen op deze pagina" ook echt zichtbaar wordt
   voor een patiënt die de QR-code op zijn eigen telefoon scant.
   GET is altijd publiek (alleen-lezen); opslaan vereist het wachtwoord.
   ------------------------------------------------------------------------- */

function themaInfoUrl(slug) {
  return `/api/thema-info?slug=${encodeURIComponent(slug)}`;
}

function laadThemaInfo(thema) {
  fetch(themaInfoUrl(thema.slug))
    .then((res) => (res.ok ? res.json() : { thuisartsUrl: "", notitie: "" }))
    .catch(() => ({ thuisartsUrl: "", notitie: "" }))
    .then((info) => toonThemaInfo(info));
}

function toonThemaInfo(info) {
  const thuisartsLink = document.getElementById("thuisarts-link");
  if (info.thuisartsUrl) {
    thuisartsLink.href = info.thuisartsUrl;
    document.getElementById("thuisarts-link-tekst").textContent = info.thuisartsUrl;
    thuisartsLink.hidden = false;
  } else {
    thuisartsLink.hidden = true;
  }

  const notitieBlok = document.getElementById("notitie-blok");
  if (info.notitie) {
    document.getElementById("notitie-tekst").textContent = info.notitie;
    notitieBlok.hidden = false;
  } else {
    notitieBlok.hidden = true;
  }

  document.getElementById("print-thuisarts").textContent = info.thuisartsUrl
    ? `Meer lezen: ${info.thuisartsUrl}`
    : "";
  document.getElementById("print-notitie").textContent = info.notitie || "";

  // Bewerk-formulier alvast vullen met de huidige waardes, zodat je bij
  // het openen ziet wat er nu staat in plaats van lege velden.
  document.getElementById("beheer-thuisarts").value = info.thuisartsUrl || "";
  document.getElementById("beheer-notitie").value = info.notitie || "";
}

function initBeheerPaneel(thema) {
  const toggle = document.getElementById("beheer-toggle");
  const form = document.getElementById("beheer-form");
  const annuleren = document.getElementById("beheer-annuleren");
  const statusEl = document.getElementById("beheer-status");

  toggle.addEventListener("click", () => {
    form.hidden = !form.hidden;
  });

  annuleren.addEventListener("click", () => {
    form.hidden = true;
    statusEl.hidden = true;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const wachtwoordVeld = document.getElementById("beheer-wachtwoord");
    const payload = {
      wachtwoord: wachtwoordVeld.value,
      thuisartsUrl: document.getElementById("beheer-thuisarts").value,
      notitie: document.getElementById("beheer-notitie").value
    };

    statusEl.hidden = false;
    statusEl.textContent = "Bezig met opslaan...";

    fetch(themaInfoUrl(thema.slug), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.fout || "Opslaan is niet gelukt.");
        }
        return data;
      })
      .then((info) => {
        toonThemaInfo(info);
        statusEl.textContent = "Opgeslagen.";
        wachtwoordVeld.value = "";
        setTimeout(() => {
          form.hidden = true;
          statusEl.hidden = true;
        }, 1200);
      })
      .catch((err) => {
        statusEl.textContent = err.message;
      });
  });
}
