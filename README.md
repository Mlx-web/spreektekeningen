# Spreektekeningen

Een spreekkamer-tool voor patiëntuitleg: tekeningen die stap voor stap
opgebouwd worden als lijnanimatie (SVG line-draw), zodat de patiënt ziet hoe
de tekening "getekend" wordt terwijl er uitleg bij gegeven wordt. Na afloop
kan de voltooide tekening geprint worden, met een QR-code waarmee de patiënt
dezelfde uitleg thuis nog eens kan bekijken.

Gebouwd als een vrijwel volledig statische site — de tekeningen zelf, het
menu en de animatie hebben geen backend of database nodig. Alleen voor het
**invulbare** stukje per thema (de Thuisarts.nl-link en een tekst die de
patiënt thuis kan teruglezen) is er één klein opslag-vakje bijgekomen, zodat
je dat direct op de pagina zelf kunt invullen — zie "Beheren" hieronder.
Bedoeld voor gebruik door één persoon (jij), zonder gebruikersrollen: één
gedeeld wachtwoord is genoeg.

## Lokaal bekijken

Voor het tekenen/animeren/printen: geen server nodig, open `public/index.html`
gewoon direct in de browser (dubbelklikken volstaat).

Voor het "Bewerken"-paneel (Thuisarts-link + tekst voor thuis) heb je wél een
server nodig, omdat dat via een Netlify Function + opslag loopt. Lokaal test
je dat met [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```bash
npm install
npx netlify dev
```

Dat start de site inclusief een lokale versie van de Functions/Blobs-opslag.
Zonder `netlify dev` (dus bij gewoon dubbelklikken op `index.html`) werkt
alles behalve het opslaan/tonen van de Thuisarts-link en de tekst voor thuis
— die blijven dan gewoon leeg, de rest van de site werkt normaal door.

De "mooie" QR-link (`/tekeningen/<slug>`) werkt sowieso pas na het live
zetten (dat is een Netlify-redirect). Lokaal linkt het menu daarom naar
`tekening.html?thema=<slug>`, wat overal werkt.

## Live zetten op Netlify

1. Log in op [app.netlify.com](https://app.netlify.com) → **"Add new site" →
   "Import an existing project"**.
2. Kies GitHub → repository `Mlx-web/spreektekeningen`, branch `main`.
3. Netlify herkent de instellingen automatisch via `netlify.toml`
   (publish-map `public`, functions-map `netlify/functions`). Klik
   **"Deploy"**.
4. Ga naar **Site settings → Environment variables** en voeg toe:
   - `BEHEER_WACHTWOORD` — een zelfbedacht wachtwoord. Dit is wat je straks
     intypt in het "Bewerken"-paneel om de Thuisarts-link/tekst op te slaan.
   Daarna nog een **"Trigger deploy"** zodat de variabele meegenomen wordt.
5. Je krijgt een gratis subdomein, bijvoorbeeld `iets-random.netlify.app`.
   Dat is meteen je basis-URL voor de QR-codes. Wil je later een eigen
   domein koppelen: dat kan altijd via **Site settings → Domain management**
   — let er dan op dat al geprinte QR-codes met het oude subdomein daarna
   niet meer werken.

Netlify Blobs (de opslag voor de Thuisarts-link/tekst) hoeft nergens apart
aangezet te worden — dat werkt automatisch zodra de site op Netlify draait.

## Beheren: Thuisarts-link en tekst voor thuis invullen

Onderaan elke tekenpagina staat een kleine "Bewerken"-link. Daarachter:
- **Thuisarts.nl-link** — kopieer de URL van de pagina die je kiest op
  thuisarts.nl (niet de QR-afbeelding daar — gewoon de link uit de
  adresbalk).
- **Tekst voor thuis** — een vrij tekstveld dat de patiënt thuis kan
  teruglezen (bv. "bel gerust de praktijk bij vragen"). Laat dit **geen**
  patiëntgegevens bevatten — deze tekst hoort bij het *thema* (bv. "Hart"),
  niet bij een individuele patiënt, en is voor iedereen die de QR-code van
  dat thema scant hetzelfde.

Na het invullen van het wachtwoord en op "Opslaan" klikken, is de wijziging
meteen zichtbaar — zowel op je eigen scherm als voor patiënten die de
QR-code thuis scannen (en op een print die je daarna maakt).

## Een nieuw thema toevoegen

1. Kopieer `public/js/themas/hart.js` naar `public/js/themas/<jouw-slug>.js`.
2. Pas de inhoud aan:
   - `slug` — wordt onderdeel van de link (`/tekeningen/<slug>`). Alleen
     kleine letters, cijfers en streepjes.
   - `titel`, `omschrijving` — voor in het menu (`omschrijving` staat niet
     op de tegel zelf, maar bijvoorbeeld handig als `alt`-achtige notitie
     voor jezelf).
   - `kleur` — de achtergrondkleur van de tegel in het menu (hex, bv.
     `"#F0654E"`). De volledig getekende versie van het thema wordt in de
     gewone donkere lijnstijl bovenop die kleur getoond.
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
      hart.js, hartklep.js      Eén thema = één bestand — kopieer zo'n bestand voor een nieuw thema
netlify/functions/
  thema-info.js             Opslaan/ophalen van de Thuisarts-link + tekst voor thuis (Netlify Blobs)
netlify.toml               Hosting-config (publish-map, functions, /tekeningen/* en /api/* redirects)
package.json                Enige dependency: @netlify/blobs (voor thema-info.js)
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
`<jouw-domein>/tekeningen/<slug>`, en (zodra ingevuld) de Thuisarts.nl-link
en de tekst voor thuis als leesbare tekst. Die kopie staat los van de
interactieve tekening op het scherm, dus printen halverwege een uitleg
toont altijd het complete plaatje — niet de stap waar je net was.

## Nog niet gebouwd, wel alvast in de opzet meegenomen

**Vrij canvas om tijdens het consult zelf te tekenen/aanwijzen**, en dat op
te slaan als nieuw vast thema. De datastructuur is hier al geschikt voor:
een thema is niets anders dan een lijst SVG-pad-`d`-waardes per stap — en
dat is precies wat je overhoudt als je met de muis over een canvas
tekent (elke lijn/streek is zelf ook gewoon een SVG-pad). Wanneer dit
gebouwd wordt, kan het dus prima als een extra manier landen om een
`js/themas/<slug>.js`-bestand te genereren, zonder dat het bestaande
animatie-/printmechanisme hoeft te veranderen.
