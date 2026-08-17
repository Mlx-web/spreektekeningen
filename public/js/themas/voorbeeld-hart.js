/* -------------------------------------------------------------------------
   VOORBEELDTHEMA — laat alleen het opbouw-patroon zien, geen echte
   medische tekening. Vervang gerust de hele inhoud hieronder.

   Nieuw thema maken:
     1. Kopieer dit bestand naar js/themas/<jouw-slug>.js
     2. Pas slug / titel / omschrijving / thuisartsUrl / viewBox / stappen aan
     3. Voeg "<jouw-slug>" toe aan js/themas/manifest.js

   Over "paden": dat is gewoon het d-attribuut van een SVG-pad, bijvoorbeeld
   rechtstreeks te kopiëren uit een geëxporteerde SVG (Illustrator, Figma,
   Inkscape, ...). Gebruik lijntekeningen zonder vlakke vulling: dit
   mechanisme animeert de lijn zelf (stroke-dasharray), niet een oppervlak.
   Eén stap mag uit meerdere paden bestaan — die worden dan gelijktijdig
   getekend (bijvoorbeeld: twee ogen in één stap).
   ------------------------------------------------------------------------- */
registreerThema({
  slug: "voorbeeld-hart",
  titel: "Het hart (voorbeeld)",
  omschrijving: "Voorbeeldthema om het opbouw-patroon te testen — nog geen echte uitleg-tekening.",
  thuisartsUrl: "",
  viewBox: "0 0 400 400",
  stappen: [
    {
      label: "Buitenvorm van het hart",
      paden: [
        "M200,320 C120,260 40,200 40,130 C40,80 80,50 120,50 C155,50 185,70 200,110 C215,70 245,50 280,50 C320,50 360,80 360,130 C360,200 280,260 200,320 Z"
      ]
    },
    {
      label: "Middenlijn",
      paden: [
        "M200,110 C195,150 206,190 196,230 C189,258 200,288 200,308"
      ]
    },
    {
      label: "Bloedstroom in en uit",
      paden: [
        "M64,64 C46,44 46,22 66,10",
        "M336,64 C354,44 354,22 334,10"
      ]
    }
  ]
});
