/* Scroll moments (Batch 3, Oct 2026). One authored moment per page, built with GSAP ScrollTrigger.
   - Who I am, 'What I've moved': a Shape - Ship - Synchronize rail tracks which beat each result came from.
   - In their words, 'What they keep saying': the phrase behind each theme is highlighted as it comes into view.
   The page is complete without this file: nothing is hidden waiting for a scroll, and reduced motion skips it all. */
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
  var ledger = document.querySelector("#moved .ledger");
  if (!ledger) return;
  var pills = Array.prototype.slice.call(ledger.querySelectorAll(".pill"));
  var beatOf = function (p) { var b = p.querySelector(".beat"); return b ? b.textContent.trim() : ""; };

  function setActive(pill) {
    pills.forEach(function (p) { p.classList.toggle("on", p === pill); });
    var beat = beatOf(pill);
    document.querySelectorAll(".beatrail li").forEach(function (li) { li.classList.toggle("on", li.dataset.beat === beat); });
  }
  pills.forEach(function (p) {
    ScrollTrigger.create({ trigger: p, start: "top 58%", end: "bottom 58%", onToggle: function (s) { if (s.isActive) setActive(p); } });
  });
  ScrollTrigger.create({ trigger: ledger, start: "top 58%", end: "bottom 58%", onLeave: function () { setActive(null); }, onLeaveBack: function () { setActive(null); } });

  var mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", function () {
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
    var fill = rail.querySelector(".fill");
    var t = gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ledger, start: "top 58%", end: "bottom 58%", scrub: 0.4 } });
    ScrollTrigger.refresh();
    return function () { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); grid.parentNode.insertBefore(ledger, grid); grid.remove(); };
  });
})();
