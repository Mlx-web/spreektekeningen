/* =========================================================================
   /api/thema-info  (via netlify.toml: /api/* -> /.netlify/functions/:splat)

   Bewaart per thema-slug twee simpele, door de huisarts zelf invulbare
   velden: de Thuisarts.nl-link en een vrij tekstveld ("notitie") dat de
   patiënt thuis kan teruglezen. Bewust NIET voor patiëntgegevens -- deze
   opslag is gekoppeld aan het THEMA (bv. "hart"), niet aan een patiënt of
   consult, en blijft dus voor iedereen die de QR-code van dat thema
   scant hetzelfde.

   GET  /api/thema-info?slug=hart          -> altijd toegestaan (publiek, alleen-lezen)
   POST /api/thema-info?slug=hart          -> vereist { wachtwoord } gelijk aan
                                              de env var BEHEER_WACHTWOORD
   ========================================================================= */
const { getStore } = require("@netlify/blobs");

const LEGE_INFO = { thuisartsUrl: "", notitie: "" };

exports.handler = async (event) => {
  const slug = event.queryStringParameters && event.queryStringParameters.slug;
  if (!slug) {
    return json(400, { fout: "Geen slug opgegeven." });
  }

  const store = getStore("thema-info");

  if (event.httpMethod === "GET") {
    const data = await store.get(slug, { type: "json" });
    return json(200, data || LEGE_INFO);
  }

  if (event.httpMethod === "POST") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { fout: "Ongeldige data." });
    }

    const verwacht = process.env.BEHEER_WACHTWOORD;
    if (!verwacht) {
      return json(500, { fout: "Server heeft nog geen BEHEER_WACHTWOORD ingesteld." });
    }
    if (body.wachtwoord !== verwacht) {
      return json(401, { fout: "Onjuist wachtwoord." });
    }

    const nieuweData = {
      thuisartsUrl: typeof body.thuisartsUrl === "string" ? body.thuisartsUrl.trim() : "",
      notitie: typeof body.notitie === "string" ? body.notitie.trim() : ""
    };
    await store.setJSON(slug, nieuweData);
    return json(200, nieuweData);
  }

  return json(405, { fout: "Methode niet toegestaan." });
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
  };
}
