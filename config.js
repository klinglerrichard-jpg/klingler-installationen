/*
 * KLINGLER Website – zentrale Einstellungen
 * Hier alle Kontaktdaten, das Einzugsgebiet und die Score-Regeln pflegen.
 * Werte in [eckigen Klammern] sind Platzhalter und müssen vor dem Live-Gang ersetzt werden.
 */
window.KLINGLER_CONFIG = {
  firma: "KLINGLER",
  adresse: { strasse: "Dorf Oberau 213", plz: "6311", ort: "Wildschönau" },

  telefon: {
    buero: "+43 5339 8156",       // Anzeige
    bueroLink: "+4353398156",      // nur Ziffern für den tel:-Link
    kundendienst: "+43 5339 8156",
    kundendienstLink: "+4353398156"
  },
  whatsapp: "",                   // optional, z. B. "43664…" – leer = ausgeblendet

  email: {
    bad: "oberau@klinglerteam.at",
    heizung: "oberau@klinglerteam.at",
    projekt: "oberau@klinglerteam.at",
    kundendienst: "oberau@klinglerteam.at"
  },

  // Wohin die Anfragen geschickt werden – leer = Testmodus (nichts wird versendet).
  // Entweder eine Adresse für alle Themen:
  //   formularEndpoint: "https://formspree.io/f/xxxxxxx",
  // oder je Thema eine eigene (z. B. Projektanfragen direkt an die Projektleitung):
  //   formularEndpoint: { bad: "https://…", heizung: "https://…", projekt: "https://…", kundendienst: "https://…" },
  formularEndpoint: "",
  rueckrufWerktage: "1",

  // Einzugsgebiet Privatkunden (Vorschlag – bitte bestätigen, siehe KONZEPT.md, Frage 2)
  einzugsgebietPLZ: [
    "6311", "6313", "6314",       // Wildschönau
    "6300",                       // Wörgl
    "6330", "6334", "6335", "6336", // Kufstein, Schwoich, Thiersee, Langkampfen
    "6305", "6306",               // Itter, Söll
    "6361", "6363", "6364", "6365", "6370", // Hopfgarten, Westendorf, Brixen i. Th., Kirchberg, Kitzbühel
    "6322", "6323",               // Kirchbichl, Bad Häring
    "6230", "6233", "6240", "6250", "6252" // Brixlegg, Kramsach, Rattenberg, Kundl, Breitenbach
  ],

  // Budget-Stufen im Bad-Assistenten. Erste Grenze = Untergrenze für ein passendes Projekt (Komplettbad ab ca. € 15.000).
  // ok: true = +Punkte, false = −Punkte, null = neutral (siehe score)
  budgetStufenBad: [
    { wert: "1", label: "unter € 15.000", kurz: "<15.000", ok: false },
    { wert: "2", label: "€ 15.000 bis 25.000", kurz: "15–25.000", ok: true },
    { wert: "3", label: "€ 25.000 bis 40.000", kurz: "25–40.000", ok: true },
    { wert: "4", label: "über € 40.000", kurz: ">40.000", ok: true },
    { wert: "offen", label: "Weiß ich noch nicht", kurz: "Budget offen", ok: null }
  ],

  // Score-Regeln (siehe KONZEPT.md ⑤)
  score: {
    imGebiet: 3, ausserhalb: -3,
    zeitrahmen: { "0-3": 3, "3-6": 2, "6-12": 1, "info": 0 },
    budgetOk: 2, budgetUnbekannt: 0, budgetZuNiedrig: -2,
    fotosOderFlaeche: 1, mailUndTelefon: 1, umstiegOelGas: 1,
    projektGrundwert: 6, projektPlanungFortgeschritten: 2,
    klasseA: 7, klasseB: 4
  },

  // Cookie-freie Analyse (z. B. Plausible). Leer = kein Tracking.
  analyticsDomain: ""
};
