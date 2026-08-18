/* =========================================================================
   Animatiescherm (tekening.html): bouwt de SVG op uit het thema, tekent
   bij één klik alle stappen automatisch na elkaar (stroke-dasharray/
   -dashoffset), en vult het printgebied (altijd de VOLTOOIDE tekening +
   QR-code, ongeacht waar de animatie op scherm is).
   ========================================================================= */

const SVG_NS = "http://www.w3.org/2000/svg";

// Tekensnelheid: eenheden SVG-padlengte per milliseconde. Een langere lijn
// (bv. het lichaam) duurt hierdoor vanzelf langer dan een korte (bv. een
// oogje) -- in plaats van dat elke stap even lang duurt ongeacht de lengte.
// Kleiner getal = trager tekenen. MIN_TEKEN_DUUR_MS voorkomt dat een heel
// kort lijntje (bv. een oog) bijna onzichtbaar snel "flitst".
const TEKEN_SNELHEID = 0.48; // padlengte-eenheden per ms (~480 per seconde)
const MIN_TEKEN_DUUR_MS = 900;
const PAUZE_TUSSEN_STAPPEN_MS = 600;

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
      toonInteractieveQr(thema);
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

  // Eén <path>-element per pad, gegroepeerd per stap.
  const padenPerStap = [];
  thema.stappen.forEach((stap) => {
    const padenVanDezeStap = [];
    stap.paden.forEach((d) => {
      const pad = document.createElementNS(SVG_NS, "path");
      pad.setAttribute("d", d);
      pad.setAttribute("class", "tekening-pad");
      svg.appendChild(pad);
      padenVanDezeStap.push(pad);
    });
    padenPerStap.push(padenVanDezeStap);
  });

  // Padlengte kan pas na het toevoegen aan de DOM opgevraagd worden. Elke
  // stap krijgt zijn eigen tekenduur (het langste pad binnen die stap
  // bepaalt hoe lang de stap duurt) -- zo tekent een lange lijn (bv. het
  // lichaam) vanzelf langzamer dan een korte (bv. een oogje).
  //
  // Verborgen paden krijgen zowel dashoffset = lengte ALS opacity: 0.
  // Dashoffset alleen zou genoeg moeten zijn, maar sommige browsers laten
  // op het naadpunt van dash/gap soms een spookstipje zien (een
  // renderingdetail, geen logicafout) -- opacity: 0 sluit dat helemaal uit.
  //
  // transition tijdelijk uitzetten: .tekening-pad krijgt zo meteen een
  // CSS-transition op stroke-dashoffset (voor het teken-effect). Zonder
  // deze truc animeert de allereerste keer verbergen óók mee -- dan flitst
  // de hele tekening bij het openen van de pagina eerst zichtbaar en dan
  // onzichtbaar.
  const duurPerStap = padenPerStap.map((padenVanDezeStap) =>
    Math.max(
      MIN_TEKEN_DUUR_MS,
      ...padenVanDezeStap.map((pad) => {
        const lengte = pad.getTotalLength();
        const duur = Math.max(MIN_TEKEN_DUUR_MS, lengte / TEKEN_SNELHEID);

        pad.style.transition = "none";
        pad.style.strokeDasharray = String(lengte);
        pad.style.strokeDashoffset = String(lengte);
        pad.style.opacity = "0";
        pad.dataset.duur = String(duur);
        pad.getBoundingClientRect(); // forceert een reflow vóór we de transition terugzetten
        pad.style.transition = `stroke-dashoffset ${duur}ms ease`;

        return duur;
      })
    )
  );

  const totaalStappen = thema.stappen.length;
  let huidigeStap = 0; // aantal reeds getekende stappen
  let bezig = false;
  let timers = [];

  const stapLabelEl = document.getElementById("stap-label");
  const knopVolgende = document.getElementById("knop-volgende");
  const knopReset = document.getElementById("knop-reset");
  const knopPrint = document.getElementById("knop-print");

  function bijwerken() {
    if (bezig) {
      stapLabelEl.textContent = thema.stappen[huidigeStap]
        ? `Aan het tekenen: ${thema.stappen[huidigeStap].label}...`
        : "Aan het tekenen...";
    } else if (huidigeStap === 0) {
      stapLabelEl.textContent = "Klaar om te beginnen";
    } else {
      stapLabelEl.textContent = "Voltooid";
    }

    knopVolgende.disabled = bezig || huidigeStap >= totaalStappen;
    knopReset.disabled = bezig || huidigeStap === 0;
  }

  function tekenVolgendeStap() {
    if (huidigeStap >= totaalStappen) {
      bezig = false;
      bijwerken();
      return;
    }
    bijwerken(); // toont "Aan het tekenen: <label>" voor de stap die nu start
    const duurDezeStap = duurPerStap[huidigeStap];
    padenPerStap[huidigeStap].forEach((pad) => {
      pad.style.opacity = "1";
      pad.style.strokeDashoffset = "0";
    });
    huidigeStap++;

    if (huidigeStap >= totaalStappen) {
      timers.push(setTimeout(() => {
        bezig = false;
        bijwerken();
      }, duurDezeStap));
    } else {
      timers.push(setTimeout(tekenVolgendeStap, duurDezeStap + PAUZE_TUSSEN_STAPPEN_MS));
    }
  }

  knopVolgende.addEventListener("click", () => {
    if (bezig || huidigeStap >= totaalStappen) return;
    bezig = true;
    tekenVolgendeStap();
  });

  knopReset.addEventListener("click", () => {
    timers.forEach(clearTimeout);
    timers = [];
    bezig = false;
    // Instant verbergen (geen geanimeerde "terugloop"): logischer voor
    // een reset-knop, en voorkomt dat de teken-transition zichtbaar
    // "terugspoelt".
    padenPerStap.flat().forEach((pad) => {
      pad.style.transition = "none";
      pad.style.strokeDashoffset = pad.style.strokeDasharray;
      pad.style.opacity = "0";
      pad.getBoundingClientRect();
      pad.style.transition = `stroke-dashoffset ${pad.dataset.duur}ms ease`;
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

  document.getElementById("print-url").textContent = herbekijkUrl(thema);
  document.getElementById("print-qr").innerHTML = maakQrSvg(herbekijkUrl(thema), 4);

  // print-thuisarts en print-notitie worden gevuld door laadThemaInfo()
  // zodra de beheer-API antwoord heeft gegeven.
}

function herbekijkUrl(thema) {
  return `${location.origin}/tekeningen/${encodeURIComponent(thema.slug)}`;
}

function maakQrSvg(tekst, cellSize) {
  const qr = qrcode(0, "M");
  qr.addData(tekst);
  qr.make();
  return qr.createSvgTag({ cellSize, margin: 0 });
}

/* QR-code die altijd al naast de tekening staat (niet alleen bij het
   printen) -- zodat je 'm ook op het scherm aan de patiënt kan laten zien. */
function toonInteractieveQr(thema) {
  document.getElementById("zijpaneel-qr").innerHTML = maakQrSvg(herbekijkUrl(thema), 5);
}

/* -------------------------------------------------------------------------
   Beheer-info (Thuisarts-link, tekst voor thuis)
   -------------------------------------------------------------------------
   Deze velden staan NIET in het thema-bestand, maar in een klein
   opslagvakje op de server (netlify/functions/thema-info.js) -- dat is de
   enige manier waarop "invullen op deze pagina" ook echt zichtbaar wordt
   voor een patiënt die de QR-code op zijn eigen telefoon scant.
   GET is altijd publiek (alleen-lezen); opslaan vereist het wachtwoord.
   Let op: dit zijpaneel is zichtbaar op dezelfde pagina die de patiënt
   thuis opent -- dus geen patiëntgegevens in deze velden.
   ------------------------------------------------------------------------- */

const LEGE_THEMA_INFO = { thuisartsUrl: "", notitie: "" };

function themaInfoUrl(slug) {
  return `/api/thema-info?slug=${encodeURIComponent(slug)}`;
}

function laadThemaInfo(thema) {
  fetch(themaInfoUrl(thema.slug))
    .then((res) => (res.ok ? res.json() : LEGE_THEMA_INFO))
    .catch(() => LEGE_THEMA_INFO)
    .then((info) => toonThemaInfo(info));
}

function toonThemaInfo(info) {
  document.getElementById("print-thuisarts").textContent = info.thuisartsUrl
    ? `Meer lezen: ${info.thuisartsUrl}`
    : "";
  document.getElementById("print-notitie").textContent = info.notitie || "";

  // Velden in het zijpaneel vullen met de huidige waardes, zodat je bij
  // het openen ziet wat er nu staat in plaats van lege velden.
  document.getElementById("beheer-thuisarts").value = info.thuisartsUrl || "";
  document.getElementById("beheer-notitie").value = info.notitie || "";
}

function initBeheerPaneel(thema) {
  const form = document.getElementById("beheer-form");
  const statusEl = document.getElementById("beheer-status");

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
      })
      .catch((err) => {
        statusEl.textContent = err.message;
      });
  });
}
