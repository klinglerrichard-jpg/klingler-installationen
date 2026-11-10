/*
 * KLINGLER – Anfrage-Assistent
 * Mehrstufig, eine Frage pro Bildschirm, Kontaktdaten am Schluss.
 * Neue Themen werden in FLOWS ergänzt – die Darstellung ist generisch.
 *
 * Einbindung: <div id="assistent"></div> + anfrage.js
 *   data-thema="…"  Thema fest vorgeben (sonst ?thema=… aus der URL)
 *   data-danke="…"  Pfad zur Danke-Seite (Standard: danke/index.html)
 */
(function () {
  "use strict";
  var cfg = window.KLINGLER_CONFIG || {};
  var uploads = cfg.dateiUpload !== false; // false = keine Upload-Felder (Formular-Dienst ohne Datei-Upload)
  var root = document.getElementById("assistent");
  if (!root) return;

  var ICON = {
    bad: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M7 19l-1 2M17 19l1 2"/>',
    heizung: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9v6M12 9v6M16 9v6"/>',
    projekt: '<path d="M3 21h18M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6M9 11h.01M15 11h.01"/>',
    stoerung: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z"/>',
    komplett: '<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
    teil: '<path d="M12 3v18M3 12h18"/>',
    neubau: '<path d="M3 21h18M6 21V10h12v11M9 10V6h6v4"/>',
    barrierefrei: '<circle cx="12" cy="4.5" r="1.8"/><path d="M9 21a5 5 0 1 0 6-8.5"/><path d="M12 8v5h4l2 5"/>',
    wellness: '<path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-4 3-6 5-9z"/>',
    tausch: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
    uhr: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    euro: '<path d="M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9"/>'
  };
  function icon(n) { return '<span class="option__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[n] || ICON.teil) + "</svg></span>"; }

  var ZEITRAHMEN = [
    { wert: "0-3", label: "In den nächsten 3 Monaten", kurz: "<3 Mon." },
    { wert: "3-6", label: "In 3 bis 6 Monaten", kurz: "3–6 Mon." },
    { wert: "6-12", label: "In 6 bis 12 Monaten", kurz: "6–12 Mon." },
    { wert: "info", label: "Ich informiere mich erst", kurz: "Info" }
  ];
  var KONTAKT = { typ: "kontakt", frage: "Wie erreichen wir Sie?", hilfe: "Wir rufen Sie zurück und besprechen Ihr Vorhaben persönlich." };

  function labelVon(optionen, wert) {
    var o = (optionen || []).filter(function (x) { return x.wert === wert; })[0];
    return o ? (o.kurz || o.label) : "";
  }

  // Heizungs-Optionen (auch für den Betreff verwendet)
  var HZ_AKTUELL = [
    { wert: "oel", label: "Öl", kurz: "Öl" }, { wert: "gas", label: "Gas", kurz: "Gas" },
    { wert: "strom", label: "Strom", kurz: "Strom" }, { wert: "holz", label: "Holz / Pellets", kurz: "Holz" },
    { wert: "keine", label: "Keine (Neubau)", kurz: "Neubau" }
  ];
  var HZ_WUNSCH = [
    { wert: "waermepumpe", label: "Wärmepumpe", kurz: "WP" }, { wert: "pellets", label: "Pellets / Biomasse", kurz: "Pellets" },
    { wert: "beratung", label: "Weiß ich nicht – Beratung gewünscht", kurz: "Beratung" }
  ];
  var KD_PROBLEM = [
    { wert: "heizung-aus", label: "Heizung ist aus", kurz: "Heizung aus", dringend: true },
    { wert: "kein-warmwasser", label: "Kein Warmwasser", kurz: "Kein Warmwasser", dringend: true },
    { wert: "wartung", label: "Wartung / Service", kurz: "Wartung" },
    { wert: "sonstiges", label: "Sonstiges", kurz: "Sonstiges" }
  ];

  var PR_ART = [
    { wert: "hotel", label: "Hotel / Tourismus", kurz: "Hotel" }, { wert: "wohnbau", label: "Wohnbau", kurz: "Wohnbau" },
    { wert: "gewerbe", label: "Gewerbe / Industrie", kurz: "Gewerbe" }, { wert: "oeffentlich", label: "Öffentlicher Bau", kurz: "Öffentlich" }
  ];
  var PR_ROLLE = [
    { wert: "bauherr", label: "Bauherr / Betreiber", kurz: "Bauherr" }, { wert: "architekt", label: "Architekt", kurz: "Architekt" },
    { wert: "planer", label: "Fachplaner", kurz: "Planer" }, { wert: "gu", label: "GU / Bauträger", kurz: "GU" }
  ];
  var PR_STAND = [
    { wert: "idee", label: "Idee", kurz: "Idee" }, { wert: "entwurf", label: "Entwurf", kurz: "Entwurf" },
    { wert: "einreichung", label: "Einreichung", kurz: "Einreichung", fortgeschritten: true },
    { wert: "ausschreibung", label: "Ausschreibung", kurz: "Ausschreibung", fortgeschritten: true },
    { wert: "ausfuehrung", label: "Ausführung", kurz: "Ausführung", fortgeschritten: true }
  ];
  var PR_LEISTUNGEN = ["Sanitär", "Heizung", "Lüftung", "Klima / Kälte", "Wellness / Spa", "Planung"];

  var FLOWS = {
    bad: {
      titel: "Ihr neues Bad",
      untertitel: "Fünf kurze Fragen – danach meldet sich Ihr Berater persönlich.",
      themaKurz: "Bad",
      schritte: [
        { typ: "auswahl", name: "vorhaben", frage: "Was planen Sie?", hilfe: "Wählen Sie, was am ehesten passt.", raster: 2, optionen: [
          { wert: "komplett", label: "Komplettsanierung", info: "Altes Bad raus, neues Bad rein", icon: "komplett" },
          { wert: "teil", label: "Teilsanierung", info: "z. B. neue Dusche oder Gäste-WC", icon: "teil" },
          { wert: "neubau", label: "Bad im Neubau / Ausbau", info: "Neues Bad im Haus oder Dachgeschoss", icon: "neubau" },
          { wert: "barrierefrei", label: "Barrierefreier Umbau", info: "Bodenebene Dusche, mehr Bewegungsfreiheit", icon: "barrierefrei" },
          { wert: "wellness", label: "Wellness, Sauna oder Infrarot", info: "Wie im Hotel – nur zuhause", icon: "wellness" }
        ] },
        { typ: "ort", frage: "Wo befindet sich das Bad?", hilfe: "So sehen wir, ob wir Sie schnell erreichen." },
        { typ: "auswahl", name: "zeitrahmen", frage: "Wann soll es losgehen?", icon: "uhr", optionen: ZEITRAHMEN },
        { typ: "budget", frage: "Welchen Budgetrahmen haben Sie im Kopf?", hilfe: "Eine grobe Einschätzung genügt – sie hilft uns, Sie passend zu beraten." },
        KONTAKT
      ],
      extraPunkte: function (d, sc) {
        var p = 0;
        var stufe = (cfg.budgetStufenBad || []).filter(function (b) { return b.wert === d.budget; })[0];
        if (stufe) p += stufe.ok === true ? (sc.budgetOk || 0) : stufe.ok === false ? (sc.budgetZuNiedrig || 0) : (sc.budgetUnbekannt || 0);
        var fotos = root.querySelector('[name="fotos"]');
        if ((fotos && fotos.files.length) || d.flaeche) p += sc.fotosOderFlaeche || 0;
        return p;
      },
      betreffDetail: function (d) { return [labelVon(ZEITRAHMEN, d.zeitrahmen) || "?", labelVon(cfg.budgetStufenBad, d.budget) || "?"]; }
    },

    heizung: {
      titel: "Ihre neue Heizung",
      untertitel: "Fünf kurze Fragen – danach meldet sich Ihr Heizungsberater persönlich.",
      themaKurz: "Heizung",
      schritte: [
        { typ: "auswahl", name: "anliegen", frage: "Worum geht es?", hilfe: "Bei einer Störung leiten wir Sie direkt zu unserem Kundendienst.", optionen: [
          { wert: "neubau", label: "Neue Heizung für einen Neubau", info: "Haus in Planung oder im Bau", icon: "neubau" },
          { wert: "tausch", label: "Heizungstausch", info: "Alte Heizung ersetzen, z. B. raus aus Öl oder Gas", icon: "tausch" },
          { wert: "stoerung", label: "Störung oder Wartung", info: "Heizung aus, kein Warmwasser, Service fällig", icon: "stoerung", sprung: "../kundendienst/index.html#formular" }
        ] },
        { typ: "gruppen", frage: "Erzählen Sie uns kurz von Ihrem Gebäude.", hilfe: "Grobe Angaben genügen.", gruppen: [
          { name: "gebaeude", legende: "Gebäude", optionen: [
            { wert: "efh", label: "Einfamilienhaus", kurz: "EFH" }, { wert: "mfh", label: "Mehrfamilienhaus", kurz: "MFH" }, { wert: "gewerbe", label: "Gewerbe", kurz: "Gewerbe" }
          ] },
          { name: "baujahr", legende: "Baujahr", optionen: [
            { wert: "vor-1980", label: "vor 1980" }, { wert: "1980-2000", label: "1980 – 2000" }, { wert: "nach-2000", label: "nach 2000" }, { wert: "neubau", label: "Neubau" }
          ] },
          { name: "wohnflaeche", legende: "Beheizte Fläche", optionen: [
            { wert: "bis-120", label: "bis 120 m²" }, { wert: "120-200", label: "120 – 200 m²" }, { wert: "ueber-200", label: "über 200 m²" }
          ] }
        ] },
        { typ: "gruppen", frage: "Wie heizen Sie heute – und was schwebt Ihnen vor?", gruppen: [
          { name: "heizung_aktuell", legende: "Aktuelle Heizung", optionen: HZ_AKTUELL },
          { name: "wunsch", legende: "Gewünschtes System", optionen: HZ_WUNSCH }
        ] },
        { typ: "ort", frage: "Wo steht das Gebäude – und wann soll es losgehen?", hilfe: "So sehen wir, ob wir Sie schnell erreichen.", mitZeitrahmen: true },
        KONTAKT
      ],
      extraPunkte: function (d, sc) {
        return (d.heizung_aktuell === "oel" || d.heizung_aktuell === "gas") ? (sc.umstiegOelGas || 0) : 0;
      },
      betreffDetail: function (d) {
        return [labelVon(ZEITRAHMEN, d.zeitrahmen) || "?", (labelVon(HZ_AKTUELL, d.heizung_aktuell) || "?") + "→" + (labelVon(HZ_WUNSCH, d.wunsch) || "?")];
      }
    },

    projekt: {
      titel: "Ihr Projekt",
      untertitel: "Drei kurze Schritte – Ihre Projektleitung meldet sich persönlich.",
      themaKurz: "Projekt",
      ohneGebiet: true, // B2B: tirolweit und darüber hinaus, keine PLZ-Prüfung
      schritte: [
        { typ: "gruppen", frage: "Um welches Projekt geht es?", gruppen: [
          { name: "projektart", legende: "Projektart", optionen: PR_ART },
          { name: "rolle", legende: "Ihre Rolle", optionen: PR_ROLLE }
        ] },
        { typ: "eckdaten", frage: "Die Eckdaten", hilfe: "So können wir Umfang und Kapazität vorab einschätzen." },
        { typ: "kontakt_b2b", frage: "Ihre Kontaktdaten", hilfe: "Ihre Projektleitung meldet sich persönlich bei Ihnen." }
      ],
      pflicht: [["name", "Bitte geben Sie Ihren Namen ein."], ["firma", "Bitte geben Sie Ihre Firma an."], ["telefon", "Bitte geben Sie eine Telefonnummer an."], ["email", "Bitte geben Sie Ihre E-Mail-Adresse an."]],
      extraPunkte: function (d, sc) {
        var stand = PR_STAND.filter(function (x) { return x.wert === d.planungsstand; })[0];
        return (sc.projektGrundwert || 0) + (stand && stand.fortgeschritten ? (sc.projektPlanungFortgeschritten || 0) : 0);
      },
      betreffDetail: function (d) { return [labelVon(PR_ART, d.projektart) || "?", labelVon(PR_ROLLE, d.rolle) || "?", labelVon(PR_STAND, d.planungsstand) || "?"]; }
    },

    kundendienst: {
      titel: "Kundendienst anfragen",
      untertitel: "",
      themaKurz: "Kundendienst",
      ohneKopf: true,
      schritte: [
        { typ: "kundendienst", frage: "Rückruf anfordern", hilfe: "Für Wartung und weniger dringende Anliegen. Bei einem Ausfall rufen Sie bitte direkt an." }
      ],
      pflicht: [["name", "Bitte geben Sie Ihren Namen ein."], ["telefon", "Bitte geben Sie eine Telefonnummer für den Rückruf an."], ["plz", "Bitte geben Sie die PLZ an."]],
      // Kundendienst wird nicht nach Punkten, sondern nach Dringlichkeit sortiert
      klasse: function (d) {
        var p = KD_PROBLEM.filter(function (x) { return x.wert === d.problem; })[0];
        return p && p.dringend ? "DRINGEND" : "NORMAL";
      },
      betreffDetail: function (d) { return [labelVon(KD_PROBLEM, d.problem) || "?", d.bestandskunde === "ja" ? "Bestandskunde" : "Neukunde"]; }
    }
  };

  var THEMEN_AUSWAHL = [
    { thema: "bad", label: "Neues Bad", info: "Sanierung, barrierefrei, Wellness", icon: "bad" },
    { thema: "heizung", label: "Neue Heizung", info: "Heizungstausch, Wärmepumpe, Neubau", icon: "heizung" },
    { thema: "projekt", label: "Projektbau", info: "Hotel, Wohnbau, Gewerbe", icon: "projekt" },
    { thema: "kundendienst", label: "Störung oder Wartung", info: "Heizung aus, kein Warmwasser", icon: "stoerung" }
  ];

  // ---------- Hilfsfunktionen ----------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function istPlatzhalter(w) { return !w || /^\[.*\]$/.test(w); }
  function mitPh(text) { return esc(text).replace(/\[([^\]]+)\]/g, '<span class="ph">[$1]</span>'); }
  function ev(name, props) { if (window.klinglerEvent) window.klinglerEvent(name, props); }
  function speicher(key, wert) { try { sessionStorage.setItem(key, JSON.stringify(wert)); } catch (e) {} }
  function laden(key) { try { return JSON.parse(sessionStorage.getItem(key) || "null"); } catch (e) { return null; } }
  function loeschen(key) { try { sessionStorage.removeItem(key); } catch (e) {} }
  function telLink(art) {
    var t = cfg.telefon || {};
    var anzeige = t[art] || "";
    var link = t[art + "Link"] ? ' href="tel:' + esc(t[art + "Link"]) + '"' : ' href="#"';
    return "<a" + link + ">" + (istPlatzhalter(anzeige) ? '<span class="ph">' + esc(anzeige || "[TEL]") + "</span>" : esc(anzeige)) + "</a>";
  }

  var params = new URLSearchParams(location.search);
  var thema = root.getAttribute("data-thema") || params.get("thema");
  var dankeBasis = root.getAttribute("data-danke") || "danke/index.html";
  var eingebettet = root.hasAttribute("data-thema"); // auf einer Themenseite eingebaut: ohne eigenen Kopf

  // ---------- Kein (fertiges) Thema: Auswahl ----------
  if (!thema || !FLOWS[thema]) {
    renderAuswahl(thema);
    return;
  }

  var flow = FLOWS[thema];
  var SPEICHER_KEY = "klingler-anfrage-" + thema;
  var daten = laden(SPEICHER_KEY) || {};
  ["vorhaben", "wunsch", "anliegen", "problem"].forEach(function (k) { if (params.get(k)) daten[k] = params.get(k); });
  var startZeit = Date.now();
  var aktuell = 0;
  var gestartet = false;
  var ausserhalbBestaetigt = false;

  renderFlow();

  // ---------- Darstellung ----------
  function renderAuswahl(unbekannt) {
    var hinweis = "";
    root.innerHTML =
      '<div class="assistent__kopf"><h1>Wobei dürfen wir helfen?</h1><p>Wählen Sie Ihr Vorhaben – die Anfrage dauert nur zwei Minuten.</p></div>' +
      '<div class="assistent__karte">' + hinweis +
      '<div class="optionen optionen--2" role="list">' +
      THEMEN_AUSWAHL.map(function (t) {
        var href = t.thema === "kundendienst" ? "../kundendienst/index.html#formular" : "index.html?thema=" + t.thema;
        return '<a role="listitem" class="option" href="' + href + '" style="text-decoration:none;color:inherit"><label style="pointer-events:none">' + icon(t.icon) +
          "<span><strong>" + esc(t.label) + "</strong><small>" + esc(t.info) + "</small></span></label></a>";
      }).join("") +
      "</div></div>";
  }

  function renderFlow() {
    var n = flow.schritte.length;
    var html =
      (flow.ohneKopf || eingebettet ? "" : '<div class="assistent__kopf"><h1>' + esc(flow.titel) + "</h1><p>" + esc(flow.untertitel) + "</p></div>") +
      (n > 1 ? '<div class="fortschritt" aria-hidden="true"><div class="fortschritt__balken"></div></div><p class="fortschritt__text" aria-live="polite"></p>' : "") +
      '<form class="assistent__karte" novalidate>' +
      (daten.wunsch === "showroom" ? '<div class="hinweis hinweis--info">Sie möchten einen <strong>Showroom-Termin</strong> – wir stimmen ihn beim Rückruf mit Ihnen ab.</div>' : "") +
      flow.schritte.map(function (s, i) { return renderSchritt(s, i); }).join("") +
      '<div class="hp-feld" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="assistent__nav">' +
      '<button type="button" class="btn--text" data-zurueck>← Zurück</button>' +
      '<button type="button" class="btn btn--blau" data-weiter>Weiter</button>' +
      '<button type="submit" class="btn btn--primaer" data-senden hidden>Anfrage absenden</button>' +
      "</div>" +
      '<p class="feld__fehler" data-fehler role="alert" hidden></p>' +
      "</form>" +
      (flow.ohneKopf || eingebettet ? "" : '<div class="assistent__vertrauen"><span>Unverbindlich &amp; kostenlos</span><span>Persönlicher Rückruf</span><span>Daten nur für Ihre Anfrage</span></div>');
    root.innerHTML = html;

    var form = root.querySelector("form");
    datenEinsetzen(form);
    form.addEventListener("change", function (e) { aufAenderung(form, e); });
    form.addEventListener("click", function (e) { aufKlick(form, e); });
    form.addEventListener("input", function () { datenLesen(form); });
    root.querySelector("[data-weiter]").addEventListener("click", function () { weiter(form); });
    root.querySelector("[data-zurueck]").addEventListener("click", function () { zeige(form, aktuell - 1); });
    form.addEventListener("submit", function (e) { e.preventDefault(); absenden(form); });
    zeige(form, 0, true);
  }

  function kopfHtml(s) {
    return '<h2 class="schritt__frage" tabindex="-1">' + esc(s.frage) + "</h2>" + (s.hilfe ? '<p class="schritt__hilfe">' + esc(s.hilfe) + "</p>" : "");
  }

  function ortFelder() {
    return '<div class="feld--reihe">' +
      '<div class="feld"><label for="f-plz">PLZ</label><input id="f-plz" type="text" name="plz" inputmode="numeric" maxlength="4" autocomplete="postal-code" required></div>' +
      '<div class="feld"><label for="f-ort">Ort</label><input id="f-ort" type="text" name="ort" autocomplete="address-level2" required></div>' +
      "</div>" +
      '<div class="hinweis hinweis--warn" data-ausserhalb hidden><strong>Dieser Ort liegt leider außerhalb unseres Gebiets für Privatkunden.</strong> Wir sind im Umkreis von rund 40 km um die Wildschönau für Sie da. Sie können trotzdem anfragen – wir melden uns mit einer ehrlichen Einschätzung.</div>';
  }

  function datenschutzFeld() {
    return '<label class="checkbox"><input type="checkbox" name="datenschutz" value="ja" required> <span>Ich bin einverstanden, dass KLINGLER meine Angaben zur Bearbeitung meiner Anfrage verwendet. Mehr dazu in der <a href="../datenschutz/index.html" target="_blank">Datenschutzerklärung</a>.</span></label>';
  }

  // ---------- Mail ans Büro: Klartext statt technischer Feldnamen und Kürzel ----------
  var FELDNAMEN = {
    vorhaben: "Vorhaben", anliegen: "Anliegen", plz: "PLZ", ort: "Ort", zeitrahmen: "Zeitrahmen", budget: "Budget",
    flaeche: "Badgröße (m²)", gebaeude: "Gebäude", baujahr: "Baujahr", wohnflaeche: "Beheizte Fläche",
    heizung_aktuell: "Heizung aktuell", wunsch: "Gewünschtes System", projektart: "Projektart", rolle: "Rolle",
    groesse: "Größe", leistungen: "Leistungen", planungsstand: "Planungsstand", zeitraum: "Ausführungszeitraum",
    problem: "Problem", geraet: "Gerät / Marke", bestandskunde: "Bereits Kunde",
    vorname: "Vorname", nachname: "Nachname", name: "Name", firma: "Firma", funktion: "Funktion",
    telefon: "Telefon", email: "E-Mail", rueckruf: "Rückruf am besten", nachricht: "Nachricht",
    datenschutz: "Datenschutz-Einwilligung", fotos: "Fotos", plaene: "Pläne"
  };
  // Beschriftung der gewählten Antwort statt des internen Werts (z. B. „über € 40.000“ statt „4“)
  function anzeigeWert(form, name, wert) {
    var el = Array.prototype.filter.call(form.querySelectorAll('input[name="' + name + '"]'), function (i) { return i.value === wert; })[0];
    if (el && (el.type === "radio" || el.type === "checkbox")) {
      var lab = form.querySelector('label[for="' + el.id + '"]');
      var txt = lab && (lab.querySelector("strong") || lab).textContent.trim();
      if (txt) return txt;
    }
    return wert;
  }
  // Formulardaten in Klartext, leere Felder und der Spamschutz bleiben draußen; Mehrfachauswahl mit Komma
  function mailDaten(form) {
    var reihenfolge = [], werte = {}, dateien = [];
    new FormData(form).forEach(function (v, k) {
      if (k === "website") return;
      if (typeof v !== "string") { if (v.name) dateien.push([FELDNAMEN[k] || k, v]); return; }
      if (!v.trim()) return;
      var titel = FELDNAMEN[k] || k;
      if (!werte[titel]) { werte[titel] = []; reihenfolge.push(titel); }
      werte[titel].push(anzeigeWert(form, k, v.trim()));
    });
    var fd = new FormData();
    reihenfolge.forEach(function (t) { fd.append(t, werte[t].join(", ")); });
    dateien.forEach(function (d) { fd.append(d[0], d[1]); });
    return fd;
  }

  // Ersatz für ein Upload-Feld: Unterlagen nach der Anfrage per E-Mail schicken
  function mailHinweis(was, thema) {
    var mail = (cfg.email || {})[thema];
    if (istPlatzhalter(mail)) return "";
    return '<p class="feld" style="color:var(--text-leise);font-size:.92rem"><strong>' + esc(was) + '?</strong> Gern – schicken Sie sie nach dem Absenden einfach an ' +
      '<a href="mailto:' + esc(mail) + '">' + esc(mail) + '</a>.</p>';
  }

  function renderSchritt(s, i) {
    var inhalt = "";
    if (s.typ === "auswahl") inhalt = optionenHtml(s.name, s.optionen, s.raster, s.icon, s.frage);
    if (s.typ === "gruppen") inhalt = s.gruppen.map(function (g) { return chipsHtml(g.name, g.optionen, g.legende); }).join("");
    if (s.typ === "ort") inhalt = ortFelder() + (s.mitZeitrahmen ? chipsHtml("zeitrahmen", ZEITRAHMEN, "Wann soll es losgehen?") : "");
    if (s.typ === "budget") {
      var stufen = (cfg.budgetStufenBad || []).map(function (b) { return { wert: b.wert, label: b.label }; });
      inhalt =
        optionenHtml("budget", stufen, 2, "euro", s.frage) +
        '<div class="feld"><label for="f-flaeche">Ungefähre Größe des Bads <span class="optional">(optional)</span></label>' +
        '<input id="f-flaeche" type="number" name="flaeche" min="1" max="200" inputmode="decimal" placeholder="z. B. 8 m²"></div>' +
        (uploads
          ? '<div class="feld"><label for="f-fotos">Fotos Ihres jetzigen Bads <span class="optional">(optional, max. 5 Bilder à 10 MB)</span></label>' +
            '<div class="upload"><input id="f-fotos" type="file" name="fotos" accept="image/*" multiple><ul class="upload__liste" data-upload-liste></ul></div></div>'
          : mailHinweis("Fotos Ihres jetzigen Bads", "bad"));
    }
    if (s.typ === "kontakt") {
      inhalt =
        '<div class="feld--reihe feld--zwei">' +
        '<div class="feld"><label for="f-vorname">Vorname</label><input id="f-vorname" type="text" name="vorname" autocomplete="given-name" required></div>' +
        '<div class="feld"><label for="f-nachname">Nachname</label><input id="f-nachname" type="text" name="nachname" autocomplete="family-name" required></div>' +
        "</div>" +
        '<div class="feld"><label for="f-telefon">Telefon</label><input id="f-telefon" type="tel" name="telefon" autocomplete="tel" required placeholder="für den Rückruf"></div>' +
        '<div class="feld"><label for="f-email">E-Mail <span class="optional">(optional)</span></label><input id="f-email" type="email" name="email" autocomplete="email"></div>' +
        '<fieldset class="optionen" style="margin-bottom:1.15rem"><legend>Wann erreichen wir Sie am besten?</legend>' +
        '<div style="display:flex;flex-wrap:wrap;gap:.5rem 1.25rem">' +
        ["vormittags", "nachmittags", "egal"].map(function (w) {
          return '<label class="checkbox" style="align-items:center"><input type="radio" name="rueckruf" value="' + w + '"> ' + (w === "egal" ? "ist mir egal" : w) + "</label>";
        }).join("") +
        "</div></fieldset>" +
        '<div class="feld"><label for="f-nachricht">Möchten Sie uns noch etwas mitteilen? <span class="optional">(optional)</span></label><textarea id="f-nachricht" name="nachricht" rows="4"></textarea></div>' +
        datenschutzFeld();
    }
    if (s.typ === "eckdaten") {
      inhalt =
        '<div class="feld--reihe feld--zwei">' +
        '<div class="feld"><label for="f-pr-ort">Ort des Projekts</label><input id="f-pr-ort" type="text" name="ort" autocomplete="address-level2" required></div>' +
        '<div class="feld"><label for="f-groesse">Zimmer / Einheiten / m² <span class="optional">(optional)</span></label><input id="f-groesse" type="text" name="groesse" placeholder="z. B. 60 Zimmer"></div>' +
        "</div>" +
        '<fieldset class="optionen optionen--chips"><legend>Gewünschte Leistungen <span class="optional" style="font-weight:400">(Mehrfachauswahl)</span></legend>' +
        PR_LEISTUNGEN.map(function (l, j) {
          return '<div class="option"><input type="checkbox" id="c-leist-' + j + '" name="leistungen" value="' + esc(l) + '"><label for="c-leist-' + j + '"><strong>' + esc(l) + "</strong></label></div>";
        }).join("") + "</fieldset>" +
        chipsHtml("planungsstand", PR_STAND, "Planungsstand") +
        '<div class="feld"><label for="f-zeitraum">Geplanter Ausführungszeitraum <span class="optional">(optional)</span></label><input id="f-zeitraum" type="text" name="zeitraum" placeholder="z. B. April – Juni 2027, zwischen den Saisonen"></div>';
    }
    if (s.typ === "kontakt_b2b") {
      inhalt =
        '<div class="feld--reihe feld--zwei">' +
        '<div class="feld"><label for="f-name">Name</label><input id="f-name" type="text" name="name" autocomplete="name" required></div>' +
        '<div class="feld"><label for="f-firma">Firma</label><input id="f-firma" type="text" name="firma" autocomplete="organization" required></div>' +
        "</div>" +
        '<div class="feld"><label for="f-funktion">Funktion <span class="optional">(optional)</span></label><input id="f-funktion" type="text" name="funktion" autocomplete="organization-title"></div>' +
        '<div class="feld--reihe feld--zwei">' +
        '<div class="feld"><label for="f-telefon">Telefon</label><input id="f-telefon" type="tel" name="telefon" autocomplete="tel" required></div>' +
        '<div class="feld"><label for="f-email">E-Mail</label><input id="f-email" type="email" name="email" autocomplete="email" required></div>' +
        "</div>" +
        '<div class="feld"><label for="f-nachricht">Nachricht <span class="optional">(optional)</span></label><textarea id="f-nachricht" name="nachricht" rows="4"></textarea></div>' +
        (uploads
          ? '<div class="feld"><label for="f-plaene">Pläne, LV oder Unterlagen <span class="optional">(optional, PDF, max. 5 Dateien à 20 MB)</span></label>' +
            '<div class="upload"><input id="f-plaene" type="file" name="plaene" accept=".pdf,application/pdf,image/*" multiple><ul class="upload__liste" data-upload-liste></ul></div></div>'
          : mailHinweis("Pläne, LV oder Unterlagen", "projekt")) +
        datenschutzFeld();
    }
    if (s.typ === "kundendienst") {
      inhalt =
        chipsHtml("problem", KD_PROBLEM, "Was ist los?") +
        '<div class="feld"><label for="f-name">Name</label><input id="f-name" type="text" name="name" autocomplete="name" required></div>' +
        '<div class="feld"><label for="f-telefon">Telefon</label><input id="f-telefon" type="tel" name="telefon" autocomplete="tel" required placeholder="für den Rückruf"></div>' +
        ortFelder() +
        '<div class="feld"><label for="f-geraet">Gerät / Marke <span class="optional">(optional)</span></label><input id="f-geraet" type="text" name="geraet" placeholder="z. B. Typenschild am Kessel"></div>' +
        chipsHtml("bestandskunde", [{ wert: "ja", label: "Ja, ich bin bereits Kunde" }, { wert: "nein", label: "Nein, Neukunde" }], "Waren wir schon einmal bei Ihnen?") +
        '<div class="feld"><label for="f-nachricht">Beschreibung <span class="optional">(optional)</span></label><textarea id="f-nachricht" name="nachricht" rows="3"></textarea></div>' +
        datenschutzFeld();
    }
    return '<section class="schritt" data-schritt="' + i + '" data-typ="' + s.typ + '" hidden>' + kopfHtml(s) + inhalt + "</section>";
  }

  function optionenHtml(name, optionen, raster, iconName, legende) {
    return '<fieldset class="optionen' + (raster === 2 ? " optionen--2" : "") + '"><legend class="sr-only">' + esc(legende) + "</legend>" +
      optionen.map(function (o, j) {
        var id = "o-" + name + "-" + j;
        return '<div class="option"><input type="radio" id="' + id + '" name="' + name + '" value="' + esc(o.wert) + '"><label for="' + id + '">' +
          icon(o.icon || iconName) + "<span><strong>" + mitPh(o.label) + "</strong>" + (o.info ? "<small>" + esc(o.info) + "</small>" : "") + "</span></label></div>";
      }).join("") + "</fieldset>";
  }

  function chipsHtml(name, optionen, legende) {
    return '<fieldset class="optionen optionen--chips" data-gruppe="' + name + '"><legend>' + esc(legende) + "</legend>" +
      optionen.map(function (o, j) {
        var id = "c-" + name + "-" + j;
        return '<div class="option"><input type="radio" id="' + id + '" name="' + name + '" value="' + esc(o.wert) + '"><label for="' + id + '"><strong>' + mitPh(o.label) + "</strong></label></div>";
      }).join("") + "</fieldset>";
  }

  // ---------- Ablauf ----------
  function zeige(form, i, ohneFokus) {
    var n = flow.schritte.length;
    if (i < 0 || i >= n) return;
    aktuell = i;
    form.querySelectorAll(".schritt").forEach(function (el) { el.hidden = Number(el.getAttribute("data-schritt")) !== i; });
    var balken = root.querySelector(".fortschritt__balken");
    if (balken) {
      balken.style.width = ((i + 1) / n * 100) + "%";
      root.querySelector(".fortschritt__text").textContent = "Schritt " + (i + 1) + " von " + n;
    }
    root.querySelector("[data-zurueck]").style.visibility = i === 0 ? "hidden" : "visible";
    root.querySelector("[data-weiter]").hidden = i === n - 1;
    root.querySelector("[data-senden]").hidden = i !== n - 1;
    fehler("");
    if (!ohneFokus) {
      var h = form.querySelector('[data-schritt="' + i + '"] .schritt__frage');
      if (h) h.focus({ preventScroll: true });
      var top = root.getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
    }
    if (n > 1) ev("anfrage_schritt", { thema: thema, schritt: String(i + 1) });
  }

  function aufAenderung(form, e) {
    if (!gestartet) { gestartet = true; ev("anfrage_start", { thema: thema }); }
    datenLesen(form);
    if (e.target.type === "file") fotosAnzeigen(e.target);
    if (e.target.name === "plz") { ausserhalbBestaetigt = false; form.querySelectorAll("[data-ausserhalb]").forEach(function (h) { h.hidden = true; }); root.querySelector("[data-weiter]").textContent = "Weiter"; }
  }

  // Reine Auswahl-Schritte: nach Antippen automatisch weiter – auch wenn die Antwort schon gewählt war.
  // Nur bei Maus/Touch (detail > 0); mit der Tastatur geht es über „Weiter“.
  function aufKlick(form, e) {
    var t = e.target;
    if (t.type !== "radio" || !e.detail) return;
    var schritt = flow.schritte[aktuell];
    if (schritt.typ !== "auswahl" || t.name !== schritt.name) return;
    var opt = (schritt.optionen || []).filter(function (o) { return o.wert === t.value; })[0];
    if (opt && opt.sprung) { ev("anfrage_umleitung", { thema: thema, ziel: opt.sprung }); location.href = opt.sprung; return; }
    setTimeout(function () { weiter(form); }, 260);
  }

  function gewaehlt(form, name) { return !!form.querySelector('[name="' + name + '"]:checked'); }

  function ortPruefen(form, bereich) {
    var plz = form.querySelector('[name="plz"]').value.trim();
    var ort = form.querySelector('[name="ort"]').value.trim();
    if (!/^\d{4}$/.test(plz)) return "Bitte geben Sie eine gültige vierstellige PLZ ein.";
    if (!ort) return "Bitte geben Sie den Ort ein.";
    if (!imGebiet(plz) && !ausserhalbBestaetigt) {
      bereich.querySelector("[data-ausserhalb]").hidden = false;
      ausserhalbBestaetigt = true;
      ev("ausserhalb_gebiet", { thema: thema, plz: plz });
      return "AUSSERHALB";
    }
    return "";
  }

  function weiter(form) {
    var s = flow.schritte[aktuell];
    var bereich = form.querySelector('[data-schritt="' + aktuell + '"]');
    if (s.typ === "auswahl" && !gewaehlt(form, s.name)) return fehler("Bitte wählen Sie eine Antwort.");
    if (s.typ === "auswahl") {
      var gewaehltWert = form.querySelector('[name="' + s.name + '"]:checked').value;
      var sprungOpt = (s.optionen || []).filter(function (o) { return o.wert === gewaehltWert && o.sprung; })[0];
      if (sprungOpt) { location.href = sprungOpt.sprung; return; }
    }
    if (s.typ === "gruppen") {
      for (var g = 0; g < s.gruppen.length; g++) {
        if (!gewaehlt(form, s.gruppen[g].name)) return fehler("Bitte wählen Sie bei „" + s.gruppen[g].legende + "“ eine Antwort.");
      }
    }
    if (s.typ === "eckdaten") {
      if (!form.querySelector('[name="ort"]').value.trim()) return fehler("Bitte geben Sie den Ort des Projekts an.");
      if (!gewaehlt(form, "leistungen")) return fehler("Bitte wählen Sie mindestens eine Leistung.");
      if (!gewaehlt(form, "planungsstand")) return fehler("Bitte wählen Sie den Planungsstand.");
    }
    if (s.typ === "budget") {
      if (!gewaehlt(form, "budget")) return fehler("Bitte wählen Sie einen Rahmen – „Weiß ich noch nicht“ ist auch in Ordnung.");
      var f = form.querySelector('[name="fotos"]');
      if (f && f.files.length > 5) return fehler("Bitte maximal 5 Fotos auswählen.");
      for (var k = 0; f && k < f.files.length; k++) if (f.files[k].size > 10 * 1024 * 1024) return fehler("Ein Foto ist größer als 10 MB. Bitte kleiner speichern oder weglassen.");
    }
    if (s.typ === "ort") {
      if (s.mitZeitrahmen && !gewaehlt(form, "zeitrahmen")) {
        var vorab = ortPruefen(form, bereich);
        if (vorab && vorab !== "AUSSERHALB") return fehler(vorab);
        return fehler("Bitte wählen Sie noch den Zeitrahmen.");
      }
      var ergebnis = ortPruefen(form, bereich);
      if (ergebnis === "AUSSERHALB") { root.querySelector("[data-weiter]").textContent = "Trotzdem weiter"; fehler(""); return; }
      if (ergebnis) return fehler(ergebnis);
    }
    root.querySelector("[data-weiter]").textContent = "Weiter";
    zeige(form, aktuell + 1);
  }

  function imGebiet(plz) { return (cfg.einzugsgebietPLZ || []).indexOf(plz) !== -1; }

  function fehler(text) {
    var el = root.querySelector("[data-fehler]");
    if (!el) return;
    el.textContent = text; el.hidden = !text;
  }

  function fotosAnzeigen(input) {
    var liste = input.parentNode.querySelector("[data-upload-liste]");
    liste.innerHTML = Array.prototype.map.call(input.files, function (f) {
      return "<li>" + esc(f.name) + " (" + (f.size / 1024 / 1024).toFixed(1) + " MB)</li>";
    }).join("");
  }

  // ---------- Daten ----------
  function datenLesen(form) {
    var fd = new FormData(form);
    var neu = {};
    fd.forEach(function (v, k) {
      if (typeof v !== "string" || k === "website" || k === "datenschutz") return;
      neu[k] = neu[k] ? neu[k] + ", " + v : v; // Mehrfachauswahl (Checkboxen) zusammenfassen
    });
    if (daten.wunsch && !neu.wunsch) neu.wunsch = daten.wunsch;
    daten = neu;
    speicher(SPEICHER_KEY, daten);
  }

  function datenEinsetzen(form) {
    Object.keys(daten).forEach(function (k) {
      form.querySelectorAll('[name="' + k + '"]').forEach(function (f) {
        if (f.type === "radio") f.checked = f.value === daten[k];
        else if (f.type === "checkbox") f.checked = String(daten[k]).split(", ").indexOf(f.value) !== -1;
        else if (f.type !== "file") f.value = daten[k];
      });
    });
  }

  function bewerten() {
    var sc = cfg.score || {};
    var gebiet = flow.ohneGebiet ? true : imGebiet(daten.plz || "");
    var p = flow.ohneGebiet ? 0 : gebiet ? (sc.imGebiet || 0) : (sc.ausserhalb || 0);
    p += (sc.zeitrahmen || {})[daten.zeitrahmen] || 0;
    if (daten.email && daten.telefon) p += sc.mailUndTelefon || 0;
    if (flow.extraPunkte) p += flow.extraPunkte(daten, sc);
    var klasse = flow.klasse ? flow.klasse(daten) : (p >= (sc.klasseA || 7) ? "A" : p >= (sc.klasseB || 4) ? "B" : "C");
    return { punkte: p, klasse: klasse, imGebiet: gebiet };
  }

  function absenden(form) {
    datenLesen(form);
    var s = flow.schritte[aktuell];
    var bereich = form.querySelector('[data-schritt="' + aktuell + '"]');
    if (s.typ === "kundendienst" && !gewaehlt(form, "problem")) return fehler("Bitte wählen Sie, was los ist.");
    var pflicht = flow.pflicht || [["vorname", "Bitte geben Sie Ihren Vornamen ein."], ["nachname", "Bitte geben Sie Ihren Nachnamen ein."], ["telefon", "Bitte geben Sie eine Telefonnummer für den Rückruf an."]];
    for (var i = 0; i < pflicht.length; i++) {
      var el = form.querySelector('[name="' + pflicht[i][0] + '"]');
      if (!el.value.trim()) { el.focus(); return fehler(pflicht[i][1]); }
    }
    if (!/^[+0-9 ()\/-]{6,}$/.test(daten.telefon.trim())) return fehler("Bitte prüfen Sie die Telefonnummer.");
    if (daten.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(daten.email)) return fehler("Bitte prüfen Sie die E-Mail-Adresse.");
    var dateiFeld = form.querySelector('[name="plaene"]');
    if (dateiFeld) {
      if (dateiFeld.files.length > 5) return fehler("Bitte maximal 5 Dateien anhängen.");
      for (var d = 0; d < dateiFeld.files.length; d++) if (dateiFeld.files[d].size > 20 * 1024 * 1024) return fehler("Eine Datei ist größer als 20 MB. Bitte verkleinern oder per E-Mail nachreichen.");
    }
    if (s.typ === "kundendienst") {
      var ortFehler = ortPruefen(form, bereich);
      if (ortFehler === "AUSSERHALB") return fehler("Hinweis: Dieser Ort liegt außerhalb unseres Gebiets. Sie können trotzdem absenden.");
      if (ortFehler) return fehler(ortFehler);
    }
    if (!form.querySelector('[name="datenschutz"]').checked) return fehler("Bitte bestätigen Sie die Datenschutz-Einwilligung.");

    // Spamschutz: Honeypot und Mindestzeit
    if (form.querySelector('[name="website"]').value) return;
    if (Date.now() - startZeit < 4000) return fehler("Einen Moment bitte – und dann noch einmal absenden.");

    var b = bewerten();
    var teile = ["[" + b.klasse + "] " + flow.themaKurz, daten.ort || daten.plz || "?"].concat(flow.betreffDetail ? flow.betreffDetail(daten) : []);
    var betreff = teile.join(" · ") + (b.imGebiet ? "" : " · AUSSERHALB");

    // Endpoint: eine Adresse für alles oder je Thema eine eigene (config.js)
    var endpoint = cfg.formularEndpoint && typeof cfg.formularEndpoint === "object" ? cfg.formularEndpoint[thema] : cfg.formularEndpoint;

    var fd = mailDaten(form);
    fd.append("Thema", flow.themaKurz);
    if (!flow.ohneGebiet) fd.append("Im Einzugsgebiet", b.imGebiet ? "ja" : "nein");
    if (!flow.klasse) fd.append("Punkte", String(b.punkte));
    fd.append("Klasse", b.klasse);
    fd.append("Gekommen über", eingebettet ? location.pathname : (document.referrer || "direkt"));
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (u) { if (params.get(u)) fd.append(u, params.get(u)); });
    if (daten.wunsch === "showroom") fd.append("Terminwunsch", "Showroom");
    fd.append("_subject", betreff);
    var ziel = (cfg.email || {})[thema];
    // Empfänger nur für ein eigenes Skript (README, Variante B) – Formspree stellt selbst zu
    if (ziel && !istPlatzhalter(ziel) && !/formspree\.io/.test(endpoint || "")) fd.append("_empfaenger", ziel);
    if (daten.email) fd.append("_replyto", daten.email); // „Antworten“ im Mailprogramm geht direkt an den Kunden

    var btn = root.querySelector("[data-senden]");
    btn.disabled = true; btn.textContent = "Wird gesendet …";
    var vorname = daten.vorname || (daten.name || "").split(" ")[0];
    var dankeUrl = dankeBasis + "?thema=" + encodeURIComponent(thema) + "&vorname=" + encodeURIComponent(vorname || "");

    if (!endpoint) {
      // Testmodus: nichts wird versendet, Zusammenfassung für die Danke-Seite merken
      var zusammenfassung = { betreff: betreff, punkte: flow.klasse ? null : b.punkte, klasse: b.klasse, felder: {} };
      fd.forEach(function (v, k) {
        var wert = typeof v === "string" ? v : "[Datei] " + v.name;
        zusammenfassung.felder[k] = zusammenfassung.felder[k] ? zusammenfassung.felder[k] + ", " + wert : wert;
      });
      speicher("klingler-testmodus", zusammenfassung);
      loeschen(SPEICHER_KEY);
      ev("anfrage_gesendet", { thema: thema, klasse: b.klasse });
      location.href = dankeUrl + "&test=1";
      return;
    }

    fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        loeschen(SPEICHER_KEY);
        ev("anfrage_gesendet", { thema: thema, klasse: b.klasse });
        location.href = dankeUrl;
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = "Anfrage absenden";
        fehler("Das Senden hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder rufen Sie uns an.");
      });
  }
})();
