/* KLINGLER – Grundfunktionen: Menü, Header, Kontaktdaten aus config.js, Einblendungen, Tracking-Events */
(function () {
  "use strict";
  var cfg = window.KLINGLER_CONFIG || {};

  // Telefonnummern und Kontaktdaten aus config.js einsetzen
  function istPlatzhalter(wert) { return !wert || /^\[.*\]$/.test(wert); }
  document.querySelectorAll("[data-tel]").forEach(function (el) {
    var art = el.getAttribute("data-tel");               // "buero" | "kundendienst"
    var anzeige = cfg.telefon && cfg.telefon[art];
    var link = cfg.telefon && cfg.telefon[art + "Link"];
    if (link) el.setAttribute("href", "tel:" + link);
    var ziel = el.querySelector("[data-tel-text]");
    if (ziel && anzeige) {
      ziel.textContent = anzeige;
      ziel.classList.toggle("ph", istPlatzhalter(anzeige));
    }
  });
  if (cfg.whatsapp) {
    document.querySelectorAll("[data-whatsapp]").forEach(function (el) {
      el.hidden = false;
      el.setAttribute("href", "https://wa.me/" + cfg.whatsapp);
    });
  }

  // Mobiles Menü
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobilmenu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var offen = menu.classList.toggle("ist-offen");
      toggle.setAttribute("aria-expanded", offen ? "true" : "false");
      document.body.style.overflow = offen ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("ist-offen");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  // Header-Schatten beim Scrollen
  var header = document.querySelector(".header");
  if (header) {
    var onScroll = function () { header.classList.toggle("ist-gescrollt", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Sanftes Einblenden
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("ist-sichtbar"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("ist-sichtbar"); });
  }

  // Cookie-freie Analyse (nur wenn in config.js eingetragen)
  if (cfg.analyticsDomain) {
    var s = document.createElement("script");
    s.defer = true;
    s.setAttribute("data-domain", cfg.analyticsDomain);
    s.src = "https://plausible.io/js/script.tagged-events.js";
    document.head.appendChild(s);
  }
  window.klinglerEvent = function (name, props) {
    if (typeof window.plausible === "function") window.plausible(name, { props: props || {} });
  };
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("tel:") === 0) window.klinglerEvent("klick_telefon", { seite: location.pathname });
    if (href.indexOf("wa.me") !== -1) window.klinglerEvent("klick_whatsapp", { seite: location.pathname });
    if (href.indexOf("/anfrage/") !== -1) window.klinglerEvent("anfrage_klick", { ziel: href, seite: location.pathname });
  });

  // Galerie-Lightbox: Bilder mit gleichem data-lightbox-gruppe (oder in derselben .galerie) lassen sich durchblättern
  var galerieItems = document.querySelectorAll("[data-lightbox]");
  if (galerieItems.length) {
    var box = document.createElement("figure");
    box.className = "lightbox"; box.hidden = true;
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Bildansicht");
    box.innerHTML = '<button class="lightbox__zu" type="button" aria-label="Schließen">×</button>' +
      '<button class="lightbox__pfeil lightbox__pfeil--zurueck" type="button" aria-label="Vorheriges Foto">‹</button>' +
      '<img alt=""><figcaption><span class="lightbox__text"></span> <span class="lightbox__zaehler"></span></figcaption>' +
      '<button class="lightbox__pfeil lightbox__pfeil--weiter" type="button" aria-label="Nächstes Foto">›</button>';
    document.body.appendChild(box);
    var boxImg = box.querySelector("img"), boxText = box.querySelector(".lightbox__text"), boxZahl = box.querySelector(".lightbox__zaehler");
    var zu = box.querySelector(".lightbox__zu"), zurueck = box.querySelector(".lightbox__pfeil--zurueck"), weiter = box.querySelector(".lightbox__pfeil--weiter");
    var zuletzt = null, liste = [], pos = 0;
    var gruppeVon = function (item) {
      var name = item.getAttribute("data-lightbox-gruppe");
      if (name) return Array.prototype.filter.call(galerieItems, function (el) { return el.getAttribute("data-lightbox-gruppe") === name; });
      var galerie = item.closest(".galerie");
      return galerie ? Array.prototype.slice.call(galerie.querySelectorAll("[data-lightbox]")) : [item];
    };
    var zeigen = function (i) {
      pos = (i + liste.length) % liste.length;
      var el = liste[pos], bild = el.querySelector("img");
      var text = el.getAttribute("data-alt") || (bild ? bild.alt : "");
      boxImg.src = el.getAttribute("data-lightbox");
      boxImg.alt = text;
      boxText.textContent = text;
      boxZahl.textContent = liste.length > 1 ? "(" + (pos + 1) + " / " + liste.length + ")" : "";
      zurueck.hidden = weiter.hidden = liste.length < 2;
      if (liste.length > 1) new Image().src = liste[(pos + 1) % liste.length].getAttribute("data-lightbox");
    };
    var schliessen = function () { box.hidden = true; document.body.style.overflow = ""; if (zuletzt) zuletzt.focus(); };
    galerieItems.forEach(function (item) {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        zuletzt = item;
        liste = gruppeVon(item);
        zeigen(liste.indexOf(item));
        box.hidden = false; document.body.style.overflow = "hidden"; zu.focus();
        window.klinglerEvent("galerie_oeffnen", { gruppe: item.getAttribute("data-lightbox-gruppe") || "einzeln", seite: location.pathname });
      });
    });
    zu.addEventListener("click", schliessen);
    zurueck.addEventListener("click", function () { zeigen(pos - 1); });
    weiter.addEventListener("click", function () { zeigen(pos + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) schliessen(); });
    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") schliessen();
      else if (e.key === "ArrowLeft" && liste.length > 1) zeigen(pos - 1);
      else if (e.key === "ArrowRight" && liste.length > 1) zeigen(pos + 1);
    });
    // Wischen am Handy
    var startX = null;
    box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (startX === null || liste.length < 2) return;
      var dx = e.changedTouches[0].clientX - startX; startX = null;
      if (Math.abs(dx) > 50) zeigen(dx < 0 ? pos + 1 : pos - 1);
    });
  }

  // Filter (z. B. Referenzen): Buttons mit data-filter, Einträge mit data-kategorie
  document.querySelectorAll("[data-filter-gruppe]").forEach(function (gruppe) {
    var name = gruppe.getAttribute("data-filter-gruppe");
    var ziel = document.querySelector('[data-filter-ziel="' + name + '"]');
    var leer = document.querySelector("[data-filter-leer]");
    if (!ziel) return;
    gruppe.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      var wert = btn.getAttribute("data-filter");
      gruppe.querySelectorAll("[data-filter]").forEach(function (b) {
        var aktiv = b === btn;
        b.classList.toggle("ist-aktiv", aktiv);
        b.setAttribute("aria-pressed", aktiv ? "true" : "false");
      });
      var sichtbar = 0;
      ziel.querySelectorAll("[data-kategorie]").forEach(function (el) {
        var passt = wert === "alle" || el.getAttribute("data-kategorie").split(" ").indexOf(wert) !== -1;
        el.hidden = !passt;
        if (passt) sichtbar++;
      });
      if (leer) leer.hidden = sichtbar > 0;
    });
  });

  var jahr = document.getElementById("jahr");
  if (jahr) jahr.textContent = new Date().getFullYear();
})();
