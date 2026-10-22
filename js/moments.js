/* Scroll moments (Oct 2026), built with GSAP ScrollTrigger.
   - Who I am, 'What I've moved': a Shape - Ship - Synchronize rail tracks which beat each result came from.
   - Who I am, 'The journey' (latest first): a spine fills as you read down the three stops.
   - In their words, 'What they keep saying': the phrase behind each theme is highlighted as it comes into view.
   - Overview, Training: the three pillars build left to right, then their anchors, so the model reads in order.
   Every page is complete without this file, and reduced motion skips all of it. */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- In their words: highlight the words each theme is built on ---------- */
  document.querySelectorAll(".themes .theme").forEach(function (theme, i) {
    var marks = theme.querySelectorAll("mark.hl");
    if (!marks.length) return;
    gsap.fromTo(marks, { backgroundSize: "0% 100%" }, {
      backgroundSize: "100% 100%", duration: 0.7, ease: "power2.out", stagger: 0.3, delay: i * 0.12,
      scrollTrigger: { trigger: theme, start: "top 82%", once: true }
    });
  });

  /* ---------- Who I am: the beat rail beside the results ---------- */
  (function moved() {
    var ledger = document.querySelector("#moved .ledger");
    if (!ledger) return;
    var pills = Array.prototype.slice.call(ledger.querySelectorAll(".pill"));
    var beatOf = function (p) { var b = p.querySelector(".beat"); return b ? b.textContent.trim() : ""; };
    function setActive(pill) {
      pills.forEach(function (p) { p.classList.toggle("on", p === pill); });
      var beat = pill ? beatOf(pill) : null;
      document.querySelectorAll(".beatrail li").forEach(function (li) { li.classList.toggle("on", li.dataset.beat === beat); });
    }
    pills.forEach(function (p) {
      ScrollTrigger.create({ trigger: p, start: "top 58%", end: "bottom 58%", onToggle: function (s) { if (s.isActive) setActive(p); } });
    });
    ScrollTrigger.create({ trigger: ledger, start: "top 58%", end: "bottom 58%", onLeave: function () { setActive(null); }, onLeaveBack: function () { setActive(null); } });

    gsap.matchMedia().add("(min-width: 900px)", function () {
      var beats = [];
      pills.forEach(function (p) { var b = beatOf(p); if (b && beats.indexOf(b) < 0) beats.push(b); });
      var grid = document.createElement("div"); grid.className = "moved-grid";
      var rail = document.createElement("aside"); rail.className = "beatrail"; rail.setAttribute("aria-hidden", "true");
      rail.innerHTML = '<div class="track"><span class="fill"></span></div><ol>' +
        beats.map(function (b) {
          var n = pills.filter(function (p) { return beatOf(p) === b; }).length;
          return '<li data-beat="' + b + '"><b>' + b + '</b><span>' + n + (n === 1 ? " result" : " results") + "</span></li>";
        }).join("") + "</ol>";
      ledger.parentNode.insertBefore(grid, ledger);
      grid.appendChild(rail); grid.appendChild(ledger);
      var t = gsap.fromTo(rail.querySelector(".fill"), { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ledger, start: "top 58%", end: "bottom 58%", scrub: 0.4 } });
      ScrollTrigger.refresh();
      return function () { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); grid.parentNode.insertBefore(ledger, grid); grid.remove(); };
    });
  })();

  /* ---------- Who I am: the journey strip (visible while folded) draws itself, latest first ---------- */
  (function strip() {
    var st = document.querySelector("#journey .strip");
    if (!st) return;
    var items = st.querySelectorAll("span"), links = st.querySelectorAll("i");
    gsap.timeline({ scrollTrigger: { trigger: st, start: "top 85%", once: true }, defaults: { ease: "power3.out" } })
      .from(items, { autoAlpha: 0, x: -10, duration: 0.45, stagger: 0.35 }, 0)
      .from(links, { scaleX: 0, transformOrigin: "left center", duration: 0.35, stagger: 0.35 }, 0.25);
  })();

  /* ---------- Who I am: the journey spine, latest stop first ---------- */
  (function journey() {
    var body = document.querySelector("#journey .fold-body");
    if (!body) return;
    var stops = Array.prototype.slice.call(body.querySelectorAll(":scope > .stop"));
    if (!stops.length) return;
    var wrap = document.createElement("div"); wrap.className = "jstops";
    var line = document.createElement("span"); line.className = "jline"; line.setAttribute("aria-hidden", "true"); line.innerHTML = "<i></i>";
    body.insertBefore(wrap, stops[0]); wrap.appendChild(line);
    stops.forEach(function (s) { wrap.appendChild(s); });
    gsap.fromTo(line.firstChild, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: wrap, start: "top 62%", end: "bottom 62%", scrub: 0.4 } });
    stops.forEach(function (s) {
      ScrollTrigger.create({ trigger: s, start: "top 62%", end: "bottom 62%",
        onToggle: function (st) { s.classList.toggle("on", st.isActive); if (st.isActive) s.classList.add("seen"); },
        onLeaveBack: function () { s.classList.remove("seen"); } });
    });
    var d = body.closest("details");
    if (d) d.addEventListener("toggle", function () { ScrollTrigger.refresh(); });
  })();

  /* ---------- Overview, Training: pillars build in reading order ---------- */
  // Runs after site.js has shown the right audience tab (DOMContentLoaded), and again when the Training tab is opened.
  var pillarsDone = false;
  function pillars() {
    var host = document.getElementById("pillarsA");
    if (pillarsDone || !host || !("IntersectionObserver" in window)) return;
    var cols = Array.prototype.slice.call(host.querySelectorAll(".pcol"));
    if (!cols.length) return;
    var parts = function (c) { return { icon: c.querySelector(".pic"), head: c.querySelector(".hd"), anchors: c.querySelectorAll("details.an") }; };
    // Every pillar the visitor has not scrolled past yet builds in, including ones already on screen when the tab opens.
    var below = cols.filter(function (c) { var r = c.getBoundingClientRect(); return r.height > 0 && r.bottom > 0; });
    if (!below.length) return;
    pillarsDone = true;
    below.forEach(function (c) { var p = parts(c); gsap.set([p.icon, p.head], { autoAlpha: 0, y: 14 }); gsap.set(p.anchors, { autoAlpha: 0, y: 10 }); });
    var played = false;
    var io = new IntersectionObserver(function (entries) {
      if (played || !entries.some(function (e) { return e.isIntersecting; })) return;
      played = true; io.disconnect();
      var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      below.forEach(function (c, i) {
        var p = parts(c), at = i * 0.32;
        tl.to(p.icon, { autoAlpha: 1, y: 0, duration: 0.45 }, at)
          .to(p.head, { autoAlpha: 1, y: 0, duration: 0.45 }, at + 0.1)
          .to(p.anchors, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08 }, at + 0.22);
      });
    }, { rootMargin: "0px 0px -18% 0px" });
    io.observe(host);
    // Safety net: if the section is never scrolled to properly (print, odd viewport), show everything.
    window.addEventListener("beforeprint", function () { gsap.set(host.querySelectorAll(".pic,.hd,details.an"), { clearProps: "all" }); });
  }
  if (document.readyState === "complete") pillars(); else document.addEventListener("DOMContentLoaded", pillars);
  document.querySelectorAll('.tab[data-t="tr"]').forEach(function (t) { t.addEventListener("click", function () { setTimeout(pillars, 60); }); });
})();
