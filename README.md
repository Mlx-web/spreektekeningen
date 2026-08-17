# Spreektekeningen

Een spreekkamer-tool voor patiëntuitleg: tekeningen die stap voor stap
opgebouwd worden als lijnanimatie (SVG line-draw), zodat de patiënt ziet hoe
de tekening "getekend" wordt terwijl er uitleg bij gegeven wordt. Na afloop
kan de voltooide tekening geprint worden, met een QR-code waarmee de patiënt
dezelfde uitleg thuis nog eens kan bekijken.

Gebouwd als een simpele, statische site — geen backend, geen database, geen
inlog. Bedoeld voor gebruik door één persoon (jij), zonder gebruikersrollen.

## Lokaal bekijken

Geen server nodig: open `public/index.html` gewoon direct in de browser
(dubbelklikken volstaat).

De "mooie" QR-link (`/tekeningen/<slug>`) werkt lokaal niet — dat is een
Netlify-redirect die pas actief is na het live zetten. Lokaal linkt het menu
daarom naar `tekening.html?thema=<slug>`, wat overal werkt.

## Live zetten op Netlify

1. Log in op [app.netlify.com](https://app.netlify.com) → **"Add new site" →
   "Import an existing project"**.
2. Kies GitHub → repository `Mlx-web/spreektekeningen`, branch `main`.
3. Netlify herkent de instellingen automatisch via `netlify.toml`
   (publish-map `public`, geen build-commando nodig — het is pure
   statische HTML/CSS/JS). Klik **"Deploy"**.
4. Je krijgt een gratis subdomein, bijvoorbeeld `iets-random.netlify.app`.
   Dat is meteen je basis-URL voor de QR-codes. Wil je later een eigen
   domein koppelen: dat kan altijd via **Site settings → Domain management**
   — let er dan op dat al geprinte QR-codes met het oude subdomein daarna
   niet meer werken.

Er is verder niets te configureren (geen environment variables, geen
functions) — de site is volledig statisch en publiek leesbaar.

## Een nieuw thema toevoegen

1. Kopieer `public/js/themas/voorbeeld-hart.js` naar
   `public/js/themas/<jouw-slug>.js`.
2. Pas de inhoud aan:
   - `slug` — wordt onderdeel van de link (`/tekeningen/<slug>`). Alleen
     kleine letters, cijfers en streepjes.
   - `titel`, `omschrijving` — voor in het menu.
   - `thuisartsUrl` — de link naar de bijbehorende Thuisarts.nl-pagina. Mag
     leeg (`""`) blijven; dan wordt dat stukje gewoon niet getoond.
   - `viewBox` — het SVG-canvas, bv. `"0 0 400 400"`.
   - `stappen` — een lijst van stappen. Elke stap heeft een `label` (voor
     jezelf, verschijnt onder de tekening) en `paden`: één of meer
     SVG-pad-`d`-waardes die tegelijk getekend worden bij die stap.
     Dat `d`-attribuut kopieer je gewoon uit een geëxporteerde SVG
     (Illustrator, Figma, Inkscape, ...). Gebruik **lijntekeningen zonder
     vlakke vulling** — de animatie werkt door de lijn zelf te "onthullen"
     (stroke-dasharray), niet door een oppervlak.
3. Voeg `"<jouw-slug>"` toe aan de lijst in `public/js/themas/manifest.js`.
4. Herlaad de pagina — geen build-stap nodig.

## Projectstructuur

```
public/
  index.html              Menuscherm
  tekening.html            Animatie-/printscherm (leest ?thema=<slug> of /tekeningen/<slug>)
  css/stijl.css             Alle styling
  js/
    registry.js              Thema-registratie + laadmechanisme (niet aanpassen om een thema toe te voegen)
    menu.js                  Rendert het menuscherm
    tekening.js               Animatielogica, printgebied, QR-code
    vendor/qrcode.js          QR-generator (MIT, lokaal — geen externe dienst nodig)
    themas/
      manifest.js              Lijst van actieve thema's (hier voeg je een regel toe)
      voorbeeld-hart.js         Eén thema = één bestand — kopieer dit bestand voor een nieuw thema
netlify.toml               Hosting-config (publish-map + de /tekeningen/* redirect)
```

## Hoe het animatiemechanisme werkt

Elk thema-bestand levert alleen data (paden, stappen, tekst). `tekening.js`
zet dat om in `<path>`-elementen, berekent bij het laden de echte lengte van
elke lijn (`getTotalLength()`), en gebruikt `stroke-dasharray` /
`stroke-dashoffset` om een lijn van "onzichtbaar" naar "volledig getekend"
te animeren. Er is geen automatische doorloop: "Volgende stap" onthult
steeds de paden van de eerstvolgende stap, "Opnieuw" verbergt alles weer
(instant, niet geanimeerd).

Het printgebied is een aparte, verborgen kopie van de tekening die **altijd
volledig getekend** is (geen dasharray-gedoe nodig) plus een QR-code naar
`<jouw-domein>/tekeningen/<slug>` en de Thuisarts.nl-link als leesbare tekst.
Die kopie staat los van de interactieve tekening op het scherm, dus printen
halverwege een uitleg toont altijd het complete plaatje — niet de stap
waar je net was.

## Nog niet gebouwd, wel alvast in de opzet meegenomen

**Vrij canvas om tijdens het consult zelf te tekenen/aanwijzen**, en dat op
te slaan als nieuw vast thema. De datastructuur is hier al geschikt voor:
een thema is niets anders dan een lijst SVG-pad-`d`-waardes per stap — en
dat is precies wat je overhoudt als je met de muis over een canvas
tekent (elke lijn/streek is zelf ook gewoon een SVG-pad). Wanneer dit
gebouwd wordt, kan het dus prima als een extra manier landen om een
`js/themas/<slug>.js`-bestand te genereren, zonder dat het bestaande
animatie-/printmechanisme hoeft te veranderen.
