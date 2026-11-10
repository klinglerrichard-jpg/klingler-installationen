/* KLINGLER – „Passt eine Wärmepumpe zu meinem Haus?“
 * Grobe Ersteinschätzung ohne Formular. Ersetzt keine Heizlastberechnung. */
(function () {
  "use strict";
  var box = document.getElementById("wpcheck");
  if (!box) return;
  var ergebnis = box.querySelector("[data-ergebnis]");
  var FRAGEN = ["baujahr", "abgabe", "daemmung", "platz"];
  // Punkte je Antwort: hoch = günstig für eine Wärmepumpe
  var PUNKTE = {
    baujahr: { "nach-2000": 2, "1980-2000": 1, "vor-1980": 0 },
    abgabe: { fussboden: 2, gross: 1, klein: 0 },
    daemmung: { gut: 2, teilweise: 1, kaum: 0 },
    platz: { ja: 1, unsicher: 0, nein: -1 }
  };

  box.addEventListener("change", function () {
    var werte = {}, fehlt = false, summe = 0;
    FRAGEN.forEach(function (f) {
      var el = box.querySelector('[name="wp-' + f + '"]:checked');
      if (!el) { fehlt = true; return; }
      werte[f] = el.value;
      summe += PUNKTE[f][el.value];
    });
    if (fehlt) return;

    var art, titel, text;
    if (summe >= 5) {
      art = "gut"; titel = "Gute Voraussetzungen für eine Wärmepumpe";
      text = "Ihre Angaben sprechen dafür, dass eine Wärmepumpe in Ihrem Haus effizient arbeiten kann. Wärmepumpen laufen am sparsamsten mit niedrigen Vorlauftemperaturen – genau das bieten gut gedämmte Häuser mit Flächenheizung oder großen Heizkörpern.";
    } else if (summe >= 3) {
      art = "mittel"; titel = "Wahrscheinlich möglich – wir prüfen das genauer";
      text = "Eine Wärmepumpe kommt für Ihr Haus gut in Frage. Ob einzelne Heizkörper getauscht oder Dämm-Maßnahmen sinnvoll sind, klären wir bei der Besichtigung.";
    } else {
      art = "pruefen"; titel = "Genau hinschauen lohnt sich";
      text = "Bei Ihrem Haus braucht es eine sorgfältige Planung. Oft ist eine Wärmepumpe trotzdem möglich – manchmal mit Anpassungen an Heizkörpern oder Dämmung, oder ein anderes System passt besser. Wir beraten Sie ehrlich.";
    }
    if (werte.platz === "nein") text += " Zum Aufstellort des Außengeräts finden wir gemeinsam eine Lösung – oder prüfen Alternativen.";
    ergebnis.className = "wpcheck__ergebnis wpcheck__ergebnis--" + art;
    ergebnis.innerHTML = "<h3>" + titel + "</h3><p>" + text + "</p>" +
      '<p><a class="btn btn--primaer" href="../anfrage/index.html?thema=heizung&amp;anliegen=tausch">Kostenlose Beratung anfragen</a></p>' +
      '<p style="font-size:.85rem;color:var(--text-leise)">Grobe Ersteinschätzung – ersetzt keine Heizlastberechnung vor Ort.</p>';
    ergebnis.hidden = false;
    if (window.klinglerEvent) window.klinglerEvent("wp_check", { ergebnis: art });
  });
})();
