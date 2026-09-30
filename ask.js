/* OWL ('Ask about Gaurav') - assistant for gsj24983.github.io
   Add to every page, just before </body>:
     <script src="ask.js" data-endpoint="https://ask-gaurav.<your-subdomain>.workers.dev" defer></script>
   Uses the site's CSS tokens (site.css), with fallbacks so it also works standalone.
   Access codes: share a link like https://gsj24983.github.io/?c=ANIL7 - the code is remembered on that browser.
   Kill switch: on every page load the widget asks the Worker's /status; if the assistant is off or has
   reached its daily budget, the button is simply not shown. */
(function () {
  var script = document.currentScript;
  var ENDPOINT = (script && script.dataset.endpoint || "").replace(/\/$/, "");
  var PERSONAS = [
    { k: "ft", label: "Full-time" },
    { k: "con", label: "Consulting" },
    { k: "tr", label: "Training" },
    { k: "explore", label: "Exploring" },
  ];
  var STARTERS = { unknown: [], ft: [], con: [], tr: [], explore: [] };   // filled from the Worker (worker/src/starters.js)
  var CONTACT = "email kavee.gauravjoshi@gmail.com";
  var CONTACT_URL = "https://gsj24983.github.io/contact.html";
  var NAME = "OWL";
  // The site's owl mark, drawn inline so the widget works on every page
  var OWL = '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 24C39 24 29 43 29 64c0 23 14 35 31 35s31-12 31-35c0-21-10-40-31-40z" fill="#2A1740"/><path d="M35 33l9-15 7 17zM85 33l-9-15-7 17z" fill="#2A1740"/><circle cx="50" cy="56" r="11" fill="#F3ECDF"/><circle cx="70" cy="56" r="11" fill="#F3ECDF"/><circle cx="50" cy="56" r="4.4" fill="#2A1740"/><circle cx="70" cy="56" r="4.4" fill="#2A1740"/><path d="M60 63l-5 8h10z" fill="#C69A4C"/></svg>';

  // ---------- state (sessionStorage keeps the chat across page changes; safe if blocked) ----------
  function get(k, d) { try { var v = sessionStorage.getItem("ask-" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function set(k, v) { try { sessionStorage.setItem("ask-" + k, JSON.stringify(v)); } catch (e) {} }
  var session = get("session", null) || (Math.random().toString(36).slice(2) + Date.now().toString(36));
  set("session", session);
  var history = get("history", []);       // [{q, a, links, status}]
  var leadDone = get("lead", false);
  function sitePersona() {
    var p = new URLSearchParams(location.search).get("for");
    if (!p) { try { p = sessionStorage.getItem("gj-for"); } catch (e) {} }
    return ["ft", "con", "tr"].indexOf(p) > -1 ? p : null;
  }
  var INLINE = !!document.getElementById("ask-gaurav-inline");
  // On the landing page (embedded chat) nobody has said why they are here yet, so start neutral
  var persona = get("persona", null) || sitePersona() || (INLINE ? "unknown" : "ft");
  // Long-lived per-browser id and access code (localStorage), so daily limits hold across visits
  function lget(k) { try { return localStorage.getItem("ask-" + k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem("ask-" + k, v); } catch (e) {} }
  var vid = lget("vid");
  if (!vid) { vid = "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36); lset("vid", vid); }
  var urlCode = new URLSearchParams(location.search).get("c");
  if (urlCode && /^[A-Za-z0-9-]{3,24}$/.test(urlCode)) lset("code", urlCode);
  var code = lget("code") || "";

  // ---------- styles ----------
  var css = "\
.ag-btn{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:60;display:flex;align-items:center;gap:10px;background:var(--plum,#2A1740);color:#F3ECDF;border:0;border-radius:999px;padding:8px 18px 8px 8px;font:600 14px var(--sans,system-ui,sans-serif);box-shadow:0 10px 28px rgba(24,11,41,.3);cursor:pointer;transition:transform .15s}\
.ag-btn:hover{background:var(--plum-deep,#180B29);transform:translateY(-1px)}\
.ag-btn .ag-av{width:30px;height:30px}\
.ag-av{flex:none;width:30px;height:30px;border-radius:50%;background:var(--cream,#F3ECDF);display:grid;place-items:center;box-shadow:inset 0 0 0 1px rgba(42,23,64,.08)}.ag-av svg{width:74%;height:74%;margin-top:6%}\
.ag-panel{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:61;width:400px;max-width:calc(100vw - 32px);height:min(640px,calc(100vh - 40px));display:flex;flex-direction:column;background:var(--paper-2,#FBFAF6);color:var(--ink,#211A2B);border:1px solid var(--line,#E1DCD0);border-radius:20px;box-shadow:0 24px 60px -12px rgba(24,11,41,.35);overflow:hidden;font:15px/1.55 var(--sans,system-ui,sans-serif)}\
.ag-panel[hidden],.ag-btn[hidden]{display:none}\
.ag-head{position:relative;background:linear-gradient(135deg,var(--plum,#2A1740) 0%,var(--plum-deep,#180B29) 100%);color:#F3ECDF;padding:16px 18px;display:flex;gap:12px;align-items:center}\
.ag-head::after{content:'';position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,var(--ochre,#C69A4C),transparent 70%)}\
.ag-head .ag-av{width:44px;height:44px}\
.ag-title{min-width:0}\
.ag-title h2{display:flex;align-items:center;gap:8px;font:600 21px/1.1 var(--disp,Georgia,serif);letter-spacing:.06em;margin:0;color:#fff}\
.ag-live{width:8px;height:8px;border-radius:50%;background:#5FC39A;box-shadow:0 0 0 3px rgba(95,195,154,.2)}\
.ag-title p{margin:5px 0 0;font-size:14.5px;font-weight:500;color:#F3EDF9;line-height:1.35}.ag-panel:not(.ag-inline) .ag-title p{font-size:13px}\
.ag-trust{margin-left:auto;flex:none;display:flex;align-items:center;gap:6px;font:600 11.5px var(--sans,system-ui,sans-serif);color:#F3ECDF;border:1px solid rgba(243,236,223,.28);border-radius:999px;padding:5px 11px;white-space:nowrap}\
.ag-trust svg{width:13px;height:13px}\
.ag-x{margin-left:6px;background:rgba(255,255,255,.08);border:0;color:#F3ECDF;font-size:20px;line-height:1;cursor:pointer;width:32px;height:32px;border-radius:50%}\
.ag-x:hover{background:rgba(255,255,255,.16)}\
.ag-who{display:flex;gap:6px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--line,#E1DCD0);background:var(--paper,#F1EEE6)}\
.ag-who button{border:1px solid var(--rule,#D2CCC0);background:transparent;color:var(--ink-soft,#6A6076);border-radius:999px;padding:4px 11px;font:500 12.5px var(--sans,system-ui,sans-serif);cursor:pointer}\
.ag-who button[aria-pressed=true]{background:var(--spruce,#2E6F63);border-color:var(--spruce,#2E6F63);color:#fff}\
.ag-log{flex:1;overflow-y:auto;padding:20px 18px 16px;display:flex;flex-direction:column;gap:14px;scroll-behavior:smooth}\
.ag-row{display:flex;gap:10px;align-items:flex-start;max-width:92%}\
.ag-row .ag-av{width:30px;height:30px;margin-top:2px}\
.ag-m{padding:11px 14px;border-radius:16px;word-wrap:break-word;min-width:0}\
.ag-m p{margin:0 0 8px}.ag-m p:last-child{margin:0}.ag-m ul{margin:4px 0 6px;padding-left:18px}.ag-m li{margin:3px 0}\
.ag-q{align-self:flex-end;max-width:82%;background:var(--plum,#2A1740);color:#F6F1E8;border-bottom-right-radius:5px}\
.ag-a{background:#fff;border:1px solid var(--line,#E1DCD0);border-top-left-radius:5px;box-shadow:0 1px 2px rgba(24,11,41,.04)}\
.ag-a.ag-soft{background:var(--cream,#F3ECDF);border-color:transparent}\
.ag-hello p:first-child{font-weight:500}\
.ag-meta{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;margin-top:10px;padding-top:9px;border-top:1px dashed var(--line,#E1DCD0);font-size:12px;color:var(--ink-soft,#6A6076)}\
.ag-ok{display:inline-flex;align-items:center;gap:5px;color:var(--spruce,#2E6F63);font-weight:600}.ag-ok svg{width:13px;height:13px}\
.ag-links{display:flex;gap:6px;flex-wrap:wrap}\
.ag-links a{font-size:12.5px;font-weight:600;color:var(--spruce,#2E6F63);background:rgba(46,111,99,.07);border:1px solid rgba(46,111,99,.25);border-radius:999px;padding:3px 10px;text-decoration:none}\
.ag-links a.ag-out::after{content:' \\2197';font-weight:400}.ag-links a.ag-go::after{content:' \\2192';font-weight:400}\
.ag-links a:hover{background:var(--spruce,#2E6F63);color:#fff}\
.ag-fb{display:flex;align-items:center;gap:4px;margin:-8px 0 0 40px;font-size:12px;color:var(--ink-soft,#6A6076)}\
.ag-fb button{background:none;border:1px solid transparent;border-radius:8px;padding:1px 6px;font-size:14px;cursor:pointer;line-height:1.3;filter:grayscale(1);opacity:.6}\
.ag-fb button:hover{border-color:var(--rule,#D2CCC0);filter:none;opacity:1}\
.ag-intro{margin:2px 0 -4px 40px;font:600 11px var(--sans,system-ui,sans-serif);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft,#6A6076)}\
.ag-starters{display:flex;flex-wrap:wrap;gap:8px;margin-left:40px}\
.ag-starters button{display:inline-flex;align-items:center;gap:8px;text-align:left;background:#fff;border:1px solid var(--rule,#D2CCC0);border-radius:999px;padding:8px 14px;font:500 13.5px var(--sans,system-ui,sans-serif);color:var(--ink,#211A2B);cursor:pointer;transition:all .15s}\
.ag-starters button::after{content:'\\2192';color:var(--ochre,#C69A4C);font-weight:700;font-size:16px;line-height:1;transition:transform .15s}\
.ag-starters button:hover{border-color:var(--plum,#2A1740);background:var(--lilac,#ECE7F1)}.ag-starters button:hover::after{transform:translateX(2px)}\
.ag-think{background:#fff;border:1px solid var(--line,#E1DCD0);border-radius:16px;border-top-left-radius:5px;padding:12px 14px;font-size:13.5px;min-width:240px}\
.ag-step{display:flex;align-items:center;gap:9px;color:var(--ink-soft,#6A6076);opacity:.45;margin:3px 0;transition:opacity .3s}\
.ag-step i{flex:none;width:14px;height:14px;border-radius:50%;border:2px solid var(--rule,#D2CCC0)}\
.ag-step.on{opacity:1;color:var(--ink,#211A2B)}.ag-step.on i{border-color:var(--ochre,#C69A4C);border-top-color:transparent;animation:agspin .8s linear infinite}\
.ag-step.done{opacity:1}.ag-step.done i{border-color:var(--spruce,#2E6F63);background:var(--spruce,#2E6F63) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 8.5l2.5 2.5L12 5.5' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E\") center/100% no-repeat}\
.ag-wait{margin-top:8px;padding-top:8px;border-top:1px dashed var(--line,#E1DCD0);font-size:12px;color:var(--ink-soft,#6A6076)}.ag-wait b{font-variant-numeric:tabular-nums;color:var(--ink,#211A2B);font-weight:600}\
@keyframes agspin{to{transform:rotate(360deg)}}\
@media(prefers-reduced-motion:reduce){.ag-step.on i{animation:none}}\
.ag-left{font-size:12px;color:var(--ink-soft,#6A6076);margin:-6px 0 0 40px}\
.ag-lead{font-size:13px;color:var(--ink-soft,#6A6076);margin-left:40px}\
.ag-lead button.ag-link{background:none;border:0;padding:0;color:var(--spruce,#2E6F63);font:600 13px var(--sans,system-ui,sans-serif);cursor:pointer;text-decoration:underline}\
.ag-form{display:flex;flex-direction:column;gap:6px;background:#fff;border:1px solid var(--line,#E1DCD0);border-radius:14px;padding:12px;margin-left:40px}\
.ag-form input,.ag-form textarea{font:14px var(--sans,system-ui,sans-serif);border:1px solid var(--rule,#D2CCC0);border-radius:8px;padding:8px 10px;background:var(--paper-2,#FBFAF6);color:var(--ink,#211A2B)}\
.ag-form .ag-row{max-width:none;justify-content:flex-end;gap:8px}\
.ag-in{padding:12px 16px 12px;background:var(--paper-2,#FBFAF6);border-top:1px solid var(--line,#E1DCD0)}\
.ag-in form{display:flex;gap:6px;align-items:flex-end;background:#fff;border:1px solid var(--rule,#D2CCC0);border-radius:16px;padding:6px 6px 6px 14px;transition:border-color .15s,box-shadow .15s}\
.ag-in form:focus-within{border-color:var(--plum,#2A1740);box-shadow:0 0 0 4px rgba(42,23,64,.08)}\
.ag-in textarea{flex:1;resize:none;max-height:110px;min-height:24px;font:16px/1.45 var(--sans,system-ui,sans-serif);border:0;outline:0;padding:7px 0;background:transparent;color:var(--ink,#211A2B)}\
.ag-send{flex:none;width:38px;height:38px;display:grid;place-items:center;background:var(--plum,#2A1740);color:#fff;border:0;border-radius:12px;cursor:pointer;transition:background .15s}\
.ag-send:hover{background:var(--plum-deep,#180B29)}.ag-send svg{width:18px;height:18px}\
.ag-form .ag-primary{background:var(--plum,#2A1740);color:#fff;border:0;border-radius:10px;padding:9px 14px;font:600 14px var(--sans,system-ui,sans-serif);cursor:pointer}\
.ag-send:disabled{opacity:.35;cursor:default}\
.ag-ghost{background:none;border:1px solid var(--rule,#D2CCC0);border-radius:10px;padding:7px 12px;font:500 13px var(--sans,system-ui,sans-serif);cursor:pointer;color:var(--ink-soft,#6A6076)}\
.ag-note{font-size:11.5px;color:var(--ink-soft,#6A6076);margin:8px 4px 0;line-height:1.4}.ag-note a{color:var(--spruce,#2E6F63);font-weight:600}\
#ask-gaurav-inline[hidden]{display:none!important}#ask-gaurav-inline{display:grid;gap:10px}\
.ag-panel.ag-inline{position:static;width:100%;max-width:none;height:auto;max-height:600px;box-shadow:0 30px 60px -30px rgba(24,11,41,.35),0 2px 6px rgba(24,11,41,.05);text-align:left}\
.ag-inline .ag-x{display:none}\
.ag-panel:not(.ag-inline) .ag-trust{display:none}\
[data-ask]{display:none!important}html.ag-on [data-ask]{display:revert!important}\
.ag-inline .ag-who{display:none}.ag-inline .ag-log{flex:1 1 auto;min-height:0}\
@media(max-width:560px){.ag-trust{display:none}.ag-log{padding:16px 14px}.ag-row{max-width:100%}.ag-intro,.ag-starters,.ag-lead,.ag-form{margin-left:0}.ag-fb,.ag-left{margin-left:40px}.ag-starters button{font-size:13px}}\
@media(max-width:560px){.ag-panel.ag-inline{height:auto;max-height:640px;width:100%;border:1px solid var(--line,#E1DCD0);border-radius:18px}}\
@media(max-width:560px){.ag-panel:not(.ag-inline){right:0;bottom:0;width:100vw;max-width:100vw;height:100dvh;border-radius:0;border:0}.ag-btn{right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px))}}\
@media print{.ag-btn,.ag-panel{display:none!important}}";
  var TICK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l5 2v4c0 3.2-2.1 5.6-5 6.9-2.9-1.3-5-3.7-5-6.9v-4z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.6 8.1l1.7 1.7 3.2-3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  function av() { var a = document.createElement("span"); a.className = "ag-av"; a.innerHTML = OWL; return a; }
  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  // ---------- DOM ----------
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "text") e.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  var btn = el("button", { class: "ag-btn", type: "button", "aria-haspopup": "dialog", onclick: open },
    [av(), el("span", { text: "Ask about Gaurav" })]);
  var log = el("div", { class: "ag-log", "aria-live": "polite" });
  var who = el("div", { class: "ag-who", role: "group", "aria-label": "I'm here because I'm..." });
  var ta = el("textarea", { rows: "1", maxlength: "500", placeholder: "Ask anything about Gaurav", "aria-label": "Your question" });
  var send = el("button", { class: "ag-send", type: "submit", "aria-label": "Ask" });
  send.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4M4.5 9.5L10 4l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var form = el("form", {}, [ta, send]);
  var trust = el("span", { class: "ag-trust" }); trust.innerHTML = TICK + "Every fact checked";
  var note = el("p", { class: "ag-note" });
  note.appendChild(document.createTextNode("Questions are logged to improve OWL and deleted after 12 months - no names, unless you share your email or use a personal invite link. Feedback on me? "));
  note.appendChild(el("a", { href: CONTACT_URL, text: "Tell Gaurav" }));
  var panel = el("div", { class: "ag-panel", role: "dialog", "aria-modal": "false", "aria-label": NAME + " - Gaurav's AI assistant", hidden: "" }, [
    el("div", { class: "ag-head" }, [
      av(),
      el("div", { class: "ag-title" }, [el("h2", {}, [document.createTextNode(NAME), el("span", { class: "ag-live", title: "Online", "aria-hidden": "true" })]),
        el("p", { text: "Gaurav's AI assistant. Answers only from his portfolio." })]),
      trust,
      el("button", { class: "ag-x", type: "button", "aria-label": "Close", text: "×", onclick: close }),
    ]),
    who, log,
    el("div", { class: "ag-in" }, [form,
      note]),
  ]);
  btn.hidden = true;   // shown only after /status says the assistant is online
  // Embedded mode: a page with <section id="ask-gaurav-inline" hidden> gets the chat inside it
  // (used on the landing page). The section stays hidden unless the assistant is online.
  var inlineHost = document.getElementById("ask-gaurav-inline");
  if (inlineHost) { panel.classList.add("ag-inline"); inlineHost.appendChild(panel); }
  else document.body.appendChild(panel);
  document.body.appendChild(btn);

  PERSONAS.forEach(function (p) {
    who.appendChild(el("button", { type: "button", "data-k": p.k, "aria-pressed": String(p.k === persona), text: p.label,
      onclick: function () { persona = p.k; set("persona", persona); syncWho(); if (!history.length) renderIntro(); } }));
  });
  function syncWho() { who.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.k === persona)); }); }

  // ---------- rendering ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function md(text) {
    var html = "", list = false;
    esc(text).split(/\n+/).forEach(function (line) {
      line = line.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
      var m = line.match(/^\s*[-*•]\s+(.*)/);
      if (m) { if (!list) { html += "<ul>"; list = true; } html += "<li>" + m[1] + "</li>"; }
      else { if (list) { html += "</ul>"; list = false; } if (line.trim()) html += "<p>" + line + "</p>"; }
    });
    return html + (list ? "</ul>" : "");
  }
  function bubbleQ(q) { log.appendChild(el("div", { class: "ag-m ag-q", text: q })); }
  function botRow(node) { var r = el("div", { class: "ag-row" }, [av(), node]); log.appendChild(r); return r; }
  function bubbleA(a, links, status, id, q, voted, approved) {
    var b = el("div", { class: "ag-m ag-a" + (status && status !== "answer" && status !== "clarify" ? " ag-soft" : "") });
    b.innerHTML = md(a);
    var good = (links || []).filter(function (l) { return /^https:\/\//.test(l.url); });
    if (status === "answer" || good.length) {
      var meta = el("div", { class: "ag-meta" });
      if (status === "answer") { var ok = el("span", { class: "ag-ok" }); ok.innerHTML = TICK + (approved ? "Gaurav's own answer" : "Checked against his portfolio"); meta.appendChild(ok); }
      if (good.length) {
        var box = el("div", { class: "ag-links" });
        good.forEach(function (l) {
          // Pages on Gaurav's own site open in the same tab (the chat carries over); PDFs and other sites open a new tab
          var own = l.url.indexOf("https://gsj24983.github.io/") === 0 && !/\.pdf(#|$)/i.test(l.url);
          box.appendChild(el("a", own ? { href: l.url, text: l.label, class: "ag-go", onclick: function () { set("open", true); } } : { href: l.url, target: "_blank", rel: "noopener", text: l.label, class: "ag-out" }));
        });
        meta.appendChild(box);
      }
      b.appendChild(meta);
    }
    botRow(b);
    if (id) log.appendChild(feedbackRow(id, q, status, voted));
  }
  // Thumbs up/down under each reply (idea carried over from the Safari assistant)
  function feedbackRow(id, q, status, voted) {
    var row = el("div", { class: "ag-fb" });
    if (voted) { row.textContent = "Thanks for the feedback."; return row; }
    row.appendChild(el("span", { text: "Helpful?" }));
    [["up", "\uD83D\uDC4D", "Helpful"], ["down", "\uD83D\uDC4E", "Not helpful"]].forEach(function (v) {
      row.appendChild(el("button", { type: "button", "aria-label": v[2], title: v[2], text: v[1], onclick: function () {
        post("/feedback", { id: id, session: session, vote: v[0], question: q, status: status }).catch(function () {});
        history.forEach(function (h) { if (h.id === id) h.voted = true; }); set("history", history);
        row.textContent = "Thanks for the feedback.";
      } }));
    });
    return row;
  }
  function renderIntro() {
    log.innerHTML = "";
    var hello = el("div", { class: "ag-m ag-a ag-hello" });
    hello.appendChild(el("p", { text: "Hi, I'm " + NAME + ", Gaurav's AI assistant." }));
    hello.appendChild(el("p", { text: "Ask about his work, roles or availability. I answer only from his portfolio, and say so when something isn't there." }));
    botRow(hello);
    log.appendChild(el("div", { class: "ag-intro", text: "Try asking" }));
    var s = el("div", { class: "ag-starters" });
    ((STARTERS[persona] && STARTERS[persona].length ? STARTERS[persona] : STARTERS.unknown || STARTERS.ft) || []).forEach(function (q) { s.appendChild(el("button", { type: "button", text: q, onclick: function () { ask(q); } })); });
    log.appendChild(s);
  }
  function renderAll() {
    if (!history.length) return renderIntro();
    log.innerHTML = "";
    history.forEach(function (h) { bubbleQ(h.q); bubbleA(h.a, h.links, h.status, h.id, h.q, h.voted, h.approved); });
    maybeLead();
  }
  function scroll() { log.scrollTop = log.scrollHeight; }

  // ---------- optional follow-up (name + email) ----------
  function maybeLead() {
    if (leadDone || !history.some(function (h) { return h.status === "answer"; }) || log.querySelector(".ag-lead")) return;
    var box = el("div", { class: "ag-lead" });
    box.appendChild(document.createTextNode("Want Gaurav to follow up? "));
    box.appendChild(el("button", { class: "ag-link", type: "button", text: "Leave your email (optional)", onclick: function () { box.replaceWith(leadForm()); scroll(); } }));
    log.appendChild(box);
  }
  function leadForm() {
    var name = el("input", { type: "text", placeholder: "Name", maxlength: "80", "aria-label": "Name", autocomplete: "name" });
    var email = el("input", { type: "email", placeholder: "Email", maxlength: "120", required: "", "aria-label": "Email", autocomplete: "email" });
    var note = el("textarea", { rows: "2", placeholder: "Anything Gaurav should know? (optional)", maxlength: "300", "aria-label": "Note" });
    var msg = el("div", { class: "ag-note" });
    var f = el("form", { class: "ag-form" }, [name, email, note, msg, el("div", { class: "ag-row" }, [
      el("button", { class: "ag-ghost", type: "button", text: "Not now", onclick: function () { f.remove(); } }),
      el("button", { class: "ag-primary", type: "submit", text: "Send" })])]);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      post("/lead", { session: session, persona: persona, page: location.pathname, name: name.value, email: email.value, note: note.value })
        .then(function (r) {
          if (r.ok) { leadDone = true; set("lead", true); f.replaceWith(el("div", { class: "ag-lead", text: "Thanks - Gaurav will be in touch." })); }
          else msg.textContent = r.error || "Couldn't send that - please try again.";
        }).catch(function () { msg.textContent = "Couldn't send that - please try again."; });
    });
    return f;
  }

  // ---------- +5 questions for an email (shown when the daily limit is reached) ----------
  function unlockForm() {
    var name = el("input", { type: "text", placeholder: "Name (optional)", maxlength: "80", "aria-label": "Name", autocomplete: "name" });
    var email = el("input", { type: "email", placeholder: "Email", maxlength: "120", required: "", "aria-label": "Email", autocomplete: "email" });
    var msg = el("div", { class: "ag-note" });
    var f = el("form", { class: "ag-form" }, [name, email, msg, el("div", { class: "ag-row" }, [
      el("button", { class: "ag-ghost", type: "button", text: "No thanks", onclick: function () { f.remove(); } }),
      el("button", { class: "ag-primary", type: "submit", text: "Unlock more questions" })])]);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      post("/unlock", { vid: vid, session: session, persona: persona, page: location.pathname, name: name.value, email: email.value })
        .then(function (r) {
          if (r.ok) { leadDone = true; set("lead", true); f.replaceWith(el("div", { class: "ag-lead", text: "Done - " + r.added + " more questions for today. Go ahead." })); ta.focus(); }
          else msg.textContent = r.error || "Couldn't unlock - please try again.";
          scroll();
        }).catch(function () { msg.textContent = "Couldn't unlock - please try again."; });
    });
    return f;
  }

  // ---------- network ----------
  function post(path, body) {
    return fetch(ENDPOINT + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  var busy = false;
  // Honest progress: three stages and a running clock, so a 10-20 second wait never looks stuck
  function thinking() {
    var steps = ["Reading Gaurav's portfolio", "Drafting an answer", "Checking every fact"];
    var box = el("div", { class: "ag-think", role: "status" });
    var rows = steps.map(function (t) { var r = el("div", { class: "ag-step" }, [el("i"), el("span", { text: t })]); box.appendChild(r); return r; });
    var secs = el("b", { text: "0s" });
    box.appendChild(el("div", { class: "ag-wait" }, [document.createTextNode("New questions take 10-20 seconds. Every fact is checked before you see it. "), secs]));
    var row = botRow(box), t0 = Date.now();
    function paint() {
      var s = Math.floor((Date.now() - t0) / 1000), stage = s < 2 ? 0 : s < 6 ? 1 : 2;
      rows.forEach(function (r, i) { r.className = "ag-step" + (i < stage ? " done" : i === stage ? " on" : ""); });
      secs.textContent = s + "s";
    }
    paint(); var timer = setInterval(paint, 500);
    return { remove: function () { clearInterval(timer); row.remove(); } };
  }
  function ask(q) {
    q = (q || "").trim();
    if (!q || busy) return;
    if (!history.length) log.innerHTML = "";
    busy = true; send.disabled = true; ta.value = ""; grow();
    bubbleQ(q);
    var typing = thinking(); scroll();
    post("/ask", { question: q, persona: persona, page: location.pathname, session: session, vid: vid, code: code,
      history: history.map(function (h) { return { q: h.q, a: h.a }; }) })
      .then(function (r) {
        typing.remove();
        var a = r.answer || "Something went wrong. You can reach Gaurav - " + CONTACT + ".";
        var counted = ["answer", "navigate", "clarify", "interview", "not_covered", "handoff", "off_topic", "unverified"].indexOf(r.status) > -1;
        history.push({ q: q, a: a, links: r.links || [], status: r.status, id: counted ? r.id : null, approved: !!r.approved }); set("history", history);
        bubbleA(a, r.links, r.status, counted ? r.id : null, q, false, !!r.approved);
        if (r.status === "limit_unlock") log.appendChild(unlockForm());
        else if (r.status === "offline" || r.status === "paused") { form.hidden = true; }
        else if (typeof r.left === "number" && r.left <= 3) log.appendChild(el("div", { class: "ag-left",
          text: r.left === 0 ? "That was your last question for today." : r.left + " question" + (r.left === 1 ? "" : "s") + " left today." }));
        if (r.status !== "limit_unlock") maybeLead();
      })
      .catch(function () {
        typing.remove();
        bubbleA("I couldn't reach the assistant just now. You can reach Gaurav directly - " + CONTACT + ".", [], "error");
      })
      .then(function () { busy = false; send.disabled = false; scroll(); ta.focus(); });
  }

  // ---------- events ----------
  function grow() { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 110) + "px"; }
  ta.addEventListener("input", grow);
  ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(ta.value); } });
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(ta.value); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });

  function open() {
    var p = sitePersona();
    if (p && !history.length && !get("persona", null)) { persona = p; syncWho(); }
    panel.hidden = false; btn.hidden = true; set("open", true);
    renderAll(); scroll(); ta.focus();
  }
  var online = false;
  function close() { if (inlineHost) return; panel.hidden = true; btn.hidden = !online; set("open", false); if (online) btn.focus(); }

  // 'Ask about this' buttons anywhere on the site: <button data-ask="Walk me through the dairy case">
  // They only appear while the assistant is online.
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-ask]");
    if (!t || !online) return;
    e.preventDefault();
    if (inlineHost) inlineHost.scrollIntoView({ behavior: "smooth", block: "center" }); else if (panel.hidden) open();
    ask(t.getAttribute("data-ask"));
  });
  syncWho();

  // ---------- kill switch: show the button only if the Worker says the assistant is online ----------
  function applyStatus(st) {
    if (st.starters) STARTERS = st.starters;
    online = !!st.online;
    document.documentElement.classList.toggle("ag-on", online);
    if (inlineHost) {
      inlineHost.hidden = !online;
      if (online && panel.hidden) { panel.hidden = false; renderAll(); }
      return;   // no floating button on a page that has the embedded chat
    }
    if (!st.online) { btn.hidden = true; if (!panel.hidden) { form.hidden = true; } return; }
    form.hidden = false;
    if (panel.hidden) btn.hidden = false;
    if (get("open", false) && window.innerWidth > 560 && panel.hidden) open();
  }
  var cached = get("status", null);   // re-checked at most once a minute per tab
  if (cached && Date.now() - cached.t < 60000) applyStatus(cached);
  else fetch(ENDPOINT + "/status").then(function (r) { return r.json(); })
    .then(function (st) { st.t = Date.now(); set("status", st); applyStatus(st); })
    .catch(function () { /* Worker unreachable - keep the button hidden */ });
})();
