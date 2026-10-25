/* OWL ('Ask about Gaurav') - assistant for gsj24983.github.io
   Add to every page, just before </body>:
     <script src="ask.js" data-endpoint="https://ask-gaurav.<your-subdomain>.workers.dev" defer></script>
   Uses the site's CSS tokens (site.css), with fallbacks so it also works standalone.
   Access codes: share a link like https://gsj24983.github.io/?c=ANIL7 - the code is remembered on that browser.
   Kill switch: on every page load the widget asks the Worker's /status; if the assistant is switched off,
   the button is simply not shown. When the day's budget is spent, OWL stays up in 'free' mode: the suggested
   questions and Gaurav's approved answers still work, typed questions are paused.
   /status also hands the browser a signed visitor token (kept in localStorage); paid questions need it. */
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
  var OWL = '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 24C39 24 29 43 29 64c0 23 14 35 31 35s31-12 31-35c0-21-10-40-31-40z" fill="#17201D"/><path d="M35 33l9-15 7 17zM85 33l-9-15-7 17z" fill="#17201D"/><circle cx="50" cy="56" r="11" fill="#E9EAE6"/><circle cx="70" cy="56" r="11" fill="#E9EAE6"/><circle cx="50" cy="56" r="4.4" fill="#17201D"/><circle cx="70" cy="56" r="4.4" fill="#17201D"/><path d="M60 63l-5 8h10z" fill="#1D6657"/></svg>';

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
  // Signed visitor token from the Worker's /status (it counts daily limits per token, not per vid)
  var token = lget("token") || "";
  function statusUrl() { return ENDPOINT + "/status" + (token ? "?t=" + encodeURIComponent(token) : ""); }
  function takeToken(st) { if (st && st.token) { token = st.token; lset("token", token); } }
  var urlCode = new URLSearchParams(location.search).get("c");
  if (urlCode && /^[A-Za-z0-9-]{3,24}$/.test(urlCode)) lset("code", urlCode);
  var code = lget("code") || "";

  // ---------- styles ----------
  var css = "\
.ag-btn{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:60;display:flex;align-items:center;gap:10px;background:var(--plum,#17201D);color:#E9EAE6;border:0;border-radius:999px;padding:8px 18px 8px 8px;font:600 14px var(--sans,system-ui,sans-serif);box-shadow:0 10px 28px rgba(23,32,29,.3);cursor:pointer;transition:transform .15s}\
.ag-btn:hover{background:var(--plum-deep,#0F1513);transform:translateY(-1px)}\
.ag-btn .ag-av{width:30px;height:30px}\
.ag-av{flex:none;width:30px;height:30px;border-radius:50%;background:var(--cream,#E9EAE6);display:grid;place-items:center;box-shadow:inset 0 0 0 1px rgba(23,32,29,.08)}.ag-av svg{width:74%;height:74%;margin-top:6%}\
.ag-panel{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:61;width:400px;max-width:calc(100vw - 32px);height:min(640px,calc(100vh - 40px));display:flex;flex-direction:column;background:var(--paper-2,#F5F5F2);color:var(--ink,#17201D);border:1px solid var(--line,#D6D8D3);border-radius:20px;box-shadow:0 24px 60px -12px rgba(23,32,29,.35);overflow:hidden;font:15px/1.55 var(--sans,system-ui,sans-serif)}\
.ag-panel[hidden],.ag-btn[hidden]{display:none}\
.ag-head{position:relative;background:var(--plum-deep,#17201D);color:#E9EAE6;padding:16px 18px;display:flex;gap:12px;align-items:center}\
.ag-head .ag-av{width:44px;height:44px}\
.ag-title{min-width:0}\
.ag-title h2{display:flex;align-items:center;gap:8px;font:800 22px/1.1 var(--disp,Arial,sans-serif);letter-spacing:.02em;margin:0;color:#fff}\
.ag-live{width:8px;height:8px;border-radius:50%;background:#5FC39A;box-shadow:0 0 0 3px rgba(95,195,154,.2)}\
.ag-title p{margin:5px 0 0;font-size:14.5px;font-weight:500;color:#DDE2DF;line-height:1.35}.ag-panel:not(.ag-inline) .ag-title p{font-size:13px}\
.ag-trust{margin-left:auto;flex:none;display:flex;align-items:center;gap:6px;font:600 11.5px var(--sans,system-ui,sans-serif);color:#E9EAE6;border:1px solid rgba(242,243,239,.28);border-radius:999px;padding:5px 11px;white-space:nowrap}\
.ag-trust svg{width:13px;height:13px}\
.ag-x{margin-left:6px;background:rgba(255,255,255,.08);border:0;color:#E9EAE6;font-size:20px;line-height:1;cursor:pointer;width:32px;height:32px;border-radius:50%}\
.ag-x:hover{background:rgba(255,255,255,.16)}\
.ag-tools{margin-left:auto;flex:none;display:flex;gap:6px;align-items:center}.ag-tools .ag-x{margin-left:0}.ag-inline .ag-tools{margin-left:8px}\
.ag-max{background:rgba(255,255,255,.08);border:0;color:#E9EAE6;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0}\
.ag-max:hover{background:rgba(255,255,255,.16)}.ag-max svg{width:16px;height:16px}\
.ag-dim{position:fixed;inset:0;z-index:998;background:rgba(23,32,29,.55)}.ag-dim[hidden]{display:none}\
.ag-panel.ag-big,.ag-panel.ag-inline.ag-big{position:fixed;z-index:999;left:50%;top:50%;right:auto;bottom:auto;transform:translate(-50%,-50%);width:min(1000px,92vw);max-width:none;height:min(900px,90vh);max-height:none;border-radius:20px;font-size:16px}\
.ag-big .ag-log{padding:26px 34px 20px}.ag-big .ag-row{max-width:min(820px,94%)}.ag-big .ag-in{padding:14px 34px}\
.ag-big .ag-intro,.ag-big .ag-starters,.ag-big .ag-lead,.ag-big .ag-form{max-width:820px}\
.ag-who{display:flex;gap:6px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--line,#D6D8D3);background:var(--paper,#E9EAE6)}\
.ag-who button{border:1px solid var(--rule,#C4C7C1);background:transparent;color:var(--ink-soft,#535A56);border-radius:999px;padding:4px 11px;font:500 12.5px var(--sans,system-ui,sans-serif);cursor:pointer}\
.ag-who button[aria-pressed=true]{background:var(--spruce,#1D6657);border-color:var(--spruce,#1D6657);color:#fff}\
.ag-log{flex:1;overflow-y:auto;padding:20px 18px 16px;display:flex;flex-direction:column;gap:14px;scroll-behavior:smooth}\
.ag-row{display:flex;gap:10px;align-items:flex-start;max-width:92%}\
.ag-row .ag-av{width:30px;height:30px;margin-top:2px}\
.ag-m{padding:11px 14px;border-radius:16px;word-wrap:break-word;min-width:0}\
.ag-m p{margin:0 0 8px}.ag-m p:last-child{margin:0}.ag-m ul{margin:4px 0 6px;padding-left:18px}.ag-m li{margin:3px 0}\
.ag-q{align-self:flex-end;max-width:82%;background:var(--plum,#17201D);color:#F2F3EF;border-bottom-right-radius:5px}\
.ag-a{background:#fff;border:1px solid var(--line,#D6D8D3);border-top-left-radius:5px;box-shadow:0 1px 2px rgba(23,32,29,.04)}\
.ag-a.ag-soft{background:var(--cream,#E9EAE6);border-color:transparent}\
.ag-hello p:first-child{font-weight:500}\
.ag-meta{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;margin-top:10px;padding-top:9px;border-top:1px dashed var(--line,#D6D8D3);font-size:12px;color:var(--ink-soft,#535A56)}\
.ag-ok{display:inline-flex;align-items:center;gap:5px;color:var(--spruce,#1D6657);font-weight:600}.ag-ok svg{width:13px;height:13px}\
.ag-links{display:flex;gap:6px;flex-wrap:wrap}\
.ag-links a{font-size:12.5px;font-weight:600;color:var(--spruce,#1D6657);background:rgba(29,102,87,.07);border:1px solid rgba(29,102,87,.25);border-radius:999px;padding:3px 10px;text-decoration:none}\
.ag-links a.ag-out::after{content:' \\2197';font-weight:400}.ag-links a.ag-go::after{content:' \\2192';font-weight:400}\
.ag-links a:hover{background:var(--spruce,#1D6657);color:#fff}\
.ag-fb{display:flex;align-items:center;gap:4px;margin:-8px 0 0 40px;font-size:12px;color:var(--ink-soft,#535A56)}\
.ag-fb button{background:none;border:1px solid transparent;border-radius:8px;padding:1px 6px;font-size:14px;cursor:pointer;line-height:1.3;filter:grayscale(1);opacity:.6}\
.ag-fb button:hover{border-color:var(--rule,#C4C7C1);filter:none;opacity:1}\
.ag-intro{margin:2px 0 -4px 40px;font:600 11px var(--sans,system-ui,sans-serif);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft,#535A56)}\
.ag-starters{display:flex;flex-wrap:wrap;gap:8px;margin-left:40px}\
.ag-starters button{display:inline-flex;align-items:center;gap:8px;text-align:left;background:#fff;border:1px solid var(--rule,#C4C7C1);border-radius:999px;padding:8px 14px;font:500 13.5px var(--sans,system-ui,sans-serif);color:var(--ink,#17201D);cursor:pointer;transition:border-color .15s,background-color .15s}\
.ag-starters button::after{content:'\\2192';color:var(--ochre,#1D6657);font-weight:700;font-size:16px;line-height:1;transition:transform .15s}\
.ag-starters button:hover{border-color:var(--plum,#17201D);background:var(--lilac,#DDDFDA)}.ag-starters button:hover::after{transform:translateX(2px)}\
.ag-think{background:#fff;border:1px solid var(--line,#D6D8D3);border-radius:16px;border-top-left-radius:5px;padding:12px 14px;font-size:13.5px;min-width:240px}\
.ag-step{display:flex;align-items:center;gap:9px;color:var(--ink-soft,#535A56);opacity:.45;margin:3px 0;transition:opacity .3s}\
.ag-step i{flex:none;width:14px;height:14px;border-radius:50%;border:2px solid var(--rule,#C4C7C1)}\
.ag-step.on{opacity:1;color:var(--ink,#17201D)}.ag-step.on i{border-color:var(--ochre,#1D6657);border-top-color:transparent;animation:agspin .8s linear infinite}\
.ag-step.done{opacity:1}.ag-step.done i{border-color:var(--spruce,#1D6657);background:var(--spruce,#1D6657) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 8.5l2.5 2.5L12 5.5' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E\") center/100% no-repeat}\
.ag-wait{margin-top:8px;padding-top:8px;border-top:1px dashed var(--line,#D6D8D3);font-size:12px;color:var(--ink-soft,#535A56)}.ag-wait b{font-variant-numeric:tabular-nums;color:var(--ink,#17201D);font-weight:600}\
@keyframes agspin{to{transform:rotate(360deg)}}\
@media(prefers-reduced-motion:reduce){.ag-step.on i{animation:none}}\
.ag-left{font-size:12px;color:var(--ink-soft,#535A56);margin:-6px 0 0 40px}\
.ag-lead{font-size:13px;color:var(--ink-soft,#535A56);margin-left:40px}\
.ag-lead button.ag-link{background:none;border:0;padding:0;color:var(--spruce,#1D6657);font:600 13px var(--sans,system-ui,sans-serif);cursor:pointer;text-decoration:underline}\
.ag-form{display:flex;flex-direction:column;gap:6px;background:#fff;border:1px solid var(--line,#D6D8D3);border-radius:14px;padding:12px;margin-left:40px}\
.ag-form input,.ag-form textarea{font:16px var(--sans,system-ui,sans-serif);border:1px solid var(--rule,#C4C7C1);border-radius:8px;padding:8px 10px;background:var(--paper-2,#F5F5F2);color:var(--ink,#17201D)}\
.ag-form .ag-row{max-width:none;justify-content:flex-end;gap:8px}\
.ag-in{padding:12px 16px 12px;background:var(--paper-2,#F5F5F2);border-top:1px solid var(--line,#D6D8D3)}\
.ag-in form{display:flex;gap:6px;align-items:flex-end;background:#fff;border:1px solid var(--rule,#C4C7C1);border-radius:16px;padding:6px 6px 6px 14px;transition:border-color .15s,box-shadow .15s}\
.ag-in form:focus-within{border-color:var(--plum,#17201D);box-shadow:0 0 0 4px rgba(23,32,29,.08)}\
.ag-in textarea{flex:1;resize:none;max-height:110px;min-height:24px;font:16px/1.45 var(--sans,system-ui,sans-serif);border:0;outline:0;padding:7px 0;background:transparent;color:var(--ink,#17201D)}\
.ag-send{flex:none;width:38px;height:38px;display:grid;place-items:center;background:var(--plum,#17201D);color:#fff;border:0;border-radius:12px;cursor:pointer;transition:background .15s}\
.ag-send:hover{background:var(--plum-deep,#0F1513)}.ag-send svg{width:18px;height:18px}\
.ag-form .ag-primary{background:var(--plum,#17201D);color:#fff;border:0;border-radius:10px;padding:9px 14px;font:600 14px var(--sans,system-ui,sans-serif);cursor:pointer}\
.ag-send:disabled{opacity:.35;cursor:default}\
.ag-ghost{background:none;border:1px solid var(--rule,#C4C7C1);border-radius:10px;padding:7px 12px;font:500 13px var(--sans,system-ui,sans-serif);cursor:pointer;color:var(--ink-soft,#535A56)}\
.ag-count{font-size:11.5px;color:var(--ink-soft,#535A56);text-align:right;margin:4px 6px 0}.ag-count.over{color:#A2332B;font-weight:600}\
.ag-long{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.ag-long button,.ag-long a{font:600 13px var(--sans,system-ui,sans-serif);border-radius:999px;padding:7px 12px;cursor:pointer;text-decoration:none;border:1px solid var(--line,#D6D8D3);background:#fff;color:var(--ink,#17201D)}.ag-long a{background:var(--plum,#17201D);color:#fff;border-color:var(--plum,#17201D)}\
.ag-note.ag-foot{font-size:10.5px;line-height:1.35;margin-top:6px}\
.ag-note{font-size:11.5px;color:var(--ink-soft,#535A56);margin:8px 4px 0;line-height:1.4}.ag-note a{color:var(--spruce,#1D6657);font-weight:600}\
#ask-gaurav-inline[hidden]{display:none!important}#ask-gaurav-inline{display:grid;gap:10px}\
.ag-panel.ag-inline{position:static;width:100%;max-width:none;height:auto;max-height:600px;box-shadow:none;text-align:left}\
.ag-inline .ag-x{display:none}\
.ag-panel:not(.ag-inline) .ag-trust{display:none}\
[data-ask]{display:none!important}html.ag-on [data-ask]{display:revert!important}\
.ag-inline .ag-who{display:none}.ag-inline .ag-log{flex:1 1 auto;min-height:0}\
@media(max-width:560px){.ag-trust{display:none}.ag-log{padding:16px 14px}.ag-row{max-width:100%}.ag-intro,.ag-starters,.ag-lead,.ag-form{margin-left:0}.ag-fb,.ag-left{margin-left:40px}.ag-starters button{font-size:13px}}\
@media(max-width:560px){.ag-panel.ag-inline{height:auto;max-height:640px;width:100%;border:1px solid var(--line,#D6D8D3);border-radius:18px}}\
@media(max-width:560px){.ag-panel:not(.ag-inline){right:0;bottom:0;width:100vw;max-width:100vw;height:100dvh;border-radius:0;border:0}.ag-btn{right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px))}}\
@media(max-width:560px){.ag-panel:not(.ag-inline) .ag-max{display:none}.ag-inline .ag-tools{margin-left:auto}.ag-panel.ag-big,.ag-panel.ag-inline.ag-big{left:0;top:0;transform:none;width:100vw;height:100dvh;border-radius:0;border:0}.ag-big .ag-log{padding:16px 14px}.ag-big .ag-in{padding:12px 14px}}\
/* wait window (Oct 2026): water globe, status lines, takes deck */\
.ag-wt{display:grid;grid-template-rows:1fr;transition:grid-template-rows .5s cubic-bezier(.23,1,.32,1),opacity .4s;flex:none}\
.ag-wt.ag-hide{grid-template-rows:0fr;opacity:0}.ag-wt[hidden]{display:none}\
.ag-wt>div{overflow:hidden;min-height:0}\
.ag-wt-in{position:relative;padding-top:41px;max-width:420px;width:100%;margin:0 auto}\
.ag-globe{position:absolute;left:50%;top:0;transform:translateX(-50%);width:83px;height:83px;z-index:1}.ag-globe svg{width:100%;height:100%;display:block}\
.ag-globe.ag-pop{animation:agpop .5s ease}@keyframes agpop{50%{transform:translateX(-50%) scale(1.07)}}\
.ag-wcard{background:#fff;border:1px solid var(--line,#D6D8D3);border-radius:16px;padding:50px 16px 14px}\
.ag-wstat{font-weight:600;font-size:13.5px;line-height:1.35;text-align:center;min-height:2.7em;display:flex;align-items:center;justify-content:center;text-wrap:balance;color:var(--ink,#17201D)}\
.ag-wstat span{transition:opacity .22s,transform .22s}.ag-wstat span.ag-out2{opacity:0;transform:translateY(4px)}\
.ag-wbars{display:flex;justify-content:center;gap:5px;margin-top:9px}.ag-wbars i{width:28px;height:4px;border-radius:2px;background:var(--line,#D6D8D3);transition:background .3s}.ag-wbars i.on{background:var(--spruce,#1D6657)}\
.ag-wcard.ag-deckon .ag-wnote{display:none}\
.ag-wnote{font-size:10.5px;color:var(--ink-soft,#535A56);margin:11px 0 0;line-height:1.45;text-align:center;text-wrap:balance}\
.ag-wqa{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s cubic-bezier(.23,1,.32,1),margin .45s}.ag-wqa.on{grid-template-rows:1fr;margin-top:14px}.ag-wqa>div{overflow:hidden;min-height:0}\
.ag-wqa-in{border-top:1px dashed var(--line,#D6D8D3);padding-top:12px}\
.ag-wlbl{display:flex;justify-content:space-between;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--spruce,#1D6657);margin-bottom:8px}.ag-wlbl span{color:var(--ink-soft,#535A56);letter-spacing:0;text-transform:none;font-weight:500}\
.ag-deck{position:relative;height:116px;touch-action:pan-y;user-select:none;-webkit-user-select:none}\
.ag-tc{position:absolute;inset:0;background:#17201D;color:#F2F3EF;border-radius:12px;padding:14px 15px 11px;display:flex;flex-direction:column;justify-content:space-between;cursor:grab;will-change:transform}\
.ag-tc p{font-size:inherit;line-height:1.45;font-weight:700;margin:0;text-wrap:balance}\
.ag-tc .ag-src{font-size:11px;color:#AEB6B1;display:flex;justify-content:space-between;align-items:center;gap:10px}.ag-tc .ag-src span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}\
.ag-tc .ag-src a{flex:none;color:#9EC4B7;font-weight:600;text-decoration:none;padding:4px 0 4px 8px}\
.ag-tc.b1{transform:translateY(6px) scale(.965);opacity:.55}.ag-tc.b2{transform:translateY(12px) scale(.93);opacity:.25}\
.ag-wnav{display:flex;align-items:center;justify-content:space-between;margin-top:15px}\
.ag-wnav button{width:36px;height:36px;border-radius:50%;border:1px solid var(--rule,#C4C7C1);background:#fff;color:var(--ink,#17201D);font-size:19px;line-height:1;cursor:pointer}\
.ag-wnav span{font-size:12px;color:var(--ink-soft,#535A56);font-variant-numeric:tabular-nums}\
.ag-wave{animation:agdrift 2.6s linear infinite}.ag-wave.b{animation-duration:3.8s;animation-direction:reverse}@keyframes agdrift{to{transform:translateX(-50px)}}\
@media(prefers-reduced-motion:reduce){.ag-wave,.ag-globe.ag-pop{animation:none}.ag-wt,.ag-wqa,.ag-wstat span{transition:none}}\
@media print{.ag-btn,.ag-panel,.ag-dim{display:none!important}}";
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
  // Questions are limited to MAXQ characters (the Worker has the same cap). The box accepts a longer paste on purpose,
  // so the visitor sees why it won't go through instead of having it silently cut off.
  var MAXQ = 500;
  var ta = el("textarea", { rows: "1", maxlength: "20000", placeholder: "Ask anything about Gaurav", "aria-label": "Your question" });
  var count = el("div", { class: "ag-count", "aria-live": "polite", hidden: "" });
  var send = el("button", { class: "ag-send", type: "submit", "aria-label": "Ask" });
  send.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4M4.5 9.5L10 4l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var form = el("form", {}, [ta, send]);
  var trust = el("span", { class: "ag-trust" }); trust.innerHTML = TICK + "Every fact checked";
  var note = el("p", { class: "ag-note ag-foot" });
  // Shown when today's budget is spent: typed questions pause, the suggested questions keep working
  var modeNote = el("p", { class: "ag-note", hidden: "", text: "Typed questions are paused for today - the suggested questions still work." });
  note.appendChild(document.createTextNode("Answers are written by Google Gemini and checked by Anthropic Claude. Questions are logged to improve OWL and deleted after 12 months - no names, unless you share your email or use a personal invite link. Feedback on me? "));
  note.appendChild(el("a", { href: CONTACT_URL, text: "Tell Gaurav" }));
  // Maximise: a large centred window for longer answers (full screen on phones). Purely layout.
  var ICON_BIG = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 3h5v5M8 17H3v-5M17 3l-6 6M3 17l6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_SMALL = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 9h-5V4M4 11h5v5M11 9l6-6M9 11l-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var maxBtn = el("button", { class: "ag-max", type: "button", "aria-label": "Expand", title: "Expand", "aria-pressed": "false", onclick: function () { setBig(!big); } });
  maxBtn.innerHTML = ICON_BIG;
  var dim = el("div", { class: "ag-dim", hidden: "", onclick: function () { setBig(false); } });
  var big = false;
  var panel = el("div", { class: "ag-panel", role: "dialog", "aria-modal": "false", "aria-label": NAME + " - Gaurav's AI assistant", hidden: "" }, [
    el("div", { class: "ag-head" }, [
      av(),
      el("div", { class: "ag-title" }, [el("h2", {}, [document.createTextNode(NAME), el("span", { class: "ag-live", title: "Online", "aria-hidden": "true" })]),
        el("p", { text: "Gaurav's AI assistant. Answers only from his portfolio." })]),
      trust,
      el("div", { class: "ag-tools" }, [maxBtn,
        el("button", { class: "ag-x", type: "button", "aria-label": "Close", text: "×", onclick: close })]),
    ]),
    who, log,
    el("div", { class: "ag-in" }, [modeNote, form, count,
      note]),
  ]);
  btn.hidden = true;   // shown only after /status says the assistant is online
  // Embedded mode: a page with <section id="ask-gaurav-inline" hidden> gets the chat inside it
  // (used on the landing page). The section stays hidden unless the assistant is online.
  var inlineHost = document.getElementById("ask-gaurav-inline");
  if (inlineHost) { panel.classList.add("ag-inline"); inlineHost.appendChild(panel); }
  else document.body.appendChild(panel);
  document.body.appendChild(btn);
  document.body.appendChild(dim);

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
    if (INLINE) hello.appendChild(el("p", { text: "Hi, I'm " + NAME + ". Ask about Gaurav's work, roles or availability - I answer only from his portfolio." }));
    else {
    hello.appendChild(el("p", { text: "Hi, I'm " + NAME + ", Gaurav's AI assistant." }));
    hello.appendChild(el("p", { text: "Ask about his work, roles or availability. I answer only from his portfolio, and say so when something isn't there." }));
    }
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
      post("/unlock", { vid: vid, token: token, session: session, persona: persona, page: location.pathname, name: name.value, email: email.value })
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
  // ---------- wait window (Oct 2026) ----------
  // Honest progress: every status line is true of every request, the globe fills fast then slows and never
  // reaches the top until the answer lands (so it can't run out like a countdown), and from 6 seconds the
  // visitor can swipe through Gaurav's own lines from his LinkedIn writing.
  var WAIT_LINES = [
    "Reading Gaurav's entire portfolio. Yes, all of it.",
    "Drafting an answer. Resisting the urge to embellish.",
    "Checking every quote word by word.",
    "A second AI is now cross-examining the first.",
    "Looking for anything I can't back up.",
    "If it isn't in the portfolio, it doesn't leave this room."
  ];
  var WAIT_LONG = "Still going. Longer answers mean more facts to check.";
  var LI = "https://www.linkedin.com/pulse/";
  var TAKE_SRC = {
    sp: ["Statistical Porn", LI + "statistical-porn-how-small-samples-fool-smart-people-gaurav-joshi-0vwhf/"],
    ai: ["Dear AI, it's not you. It's me", LI + "dear-ai-its-you-me-gaurav-joshi-bz80f/"],
    fb: ["I forgot the most fundamental thing", LI + "excitement-shipping-my-first-ai-product-i-forgot-most-gaurav-joshi-mgvdc/"],
    cx: ["The decision that cost me 3.75x more", LI + "product-decision-cost-me-375x-more-why-id-make-again-gaurav-joshi-apkvf/"],
    p1: ["Building my first AI product", LI + "ive-been-product-manager-18-years-building-my-first-ai-gaurav-joshi-qzyqf/"],
    kh: ["'Know-how' is not enough", LI + "know-how-enough-build-product-gaurav-joshi-oa4nf/"],
    li: ["Listening is overrated", LI + "listening-overrated-gaurav-joshi"],
    pr: ["The (almost) Perfect Predator", LI + "almost-perfect-predator-gaurav-joshi"],
    ad: ["Airplane Disembarking Disorder", LI + "airplane-disembarking-disorder-gaurav-joshi"],
    pf: ["LinkedIn post", "https://lnkd.in/p/dtpwM3RS"],
    ps: ["LinkedIn post", "https://lnkd.in/p/dgH-d2bG"]
  };
  var TAKES = [
    ["Users don't remember ten good answers. They remember the one cut-off.", "cx"],
    ["Always, always, and always check the sample size.", "sp"],
    ["One of my best product improvements involved zero AI. It was a dictionary.", "p1"],
    ["Can you measure how trustworthy your AI system is?", "ai"],
    ["Feedback is a product decision. Not a feature you add at the end.", "fb"],
    ["Know-how isn't enough to build a product. You need know-why and know-why-not.", "kh"],
    ["Scoping teaches you the shape of the problem. Building teaches you the texture.", "p1"],
    ["Statistical porn: findings that please the eye, with almost no truth behind them.", "sp"],
    ["Availability is a product decision, not an infrastructure problem.", "cx"],
    ["Interviews tell you what users think. Usage data tells you what they did.", "fb"],
    ["Ever heard of Airplane Disembarking Disorder?", "ad"],
    ["The system prompt is a product specification. Treat it like one.", "p1"],
    ["Seeing a trend? Ask what the opposite side looks like.", "sp"],
    ["Every parameter you set is a promise: completeness, availability, reliability.", "cx"],
    ["Listen. Comprehend. Communicate. Listening alone is only the input.", "li"],
    ["Data doesn't replace talking to users. It's a different kind of truth.", "fb"],
    ["Your users' words and your document's words are not the same.", "p1"],
    ["Don't architect for scale before you understand your usage.", "cx"],
    ["As a PM, what can you learn from a dragonfly?", "pr"],
    ["Before committing, ask: if this fails in six months, what's the likeliest reason?", "sp"],
    ["The right tool isn't the most sophisticated. It's the one that works where users are.", "cx"],
    ["Watch out for AI's flattery.", "pf"],
    ["Builder mindset and operator mindset are not the same.", "fb"],
    ["The deployment environment is the product context.", "cx"],
    ["Invisible stretch marks: what the brain carries after being stretched by consequences.", "ps"]
  ];
  var takeIdx = (parseInt(lget("take") || "0", 10) || 0) % TAKES.length;
  var waitSeq = 0, lastWait = null;
  function wavePath(amp, ph) { var d = "M0 0"; for (var x = 0; x <= 200; x += 10) d += " L" + x + " " + (amp * Math.sin((x + ph) / 50 * 2 * Math.PI)).toFixed(2); return d + " L200 130 L0 130 Z"; }
  function globeSvg(n) {
    var w1 = wavePath(2.4, 0), w2 = wavePath(2.8, 22), f = "font-family=\"Schibsted Grotesk,Helvetica Neue,Arial,sans-serif\"";
    var num = function (fill, id) { return '<text data-t="' + id + '" x="50" y="57" text-anchor="middle" ' + f + ' font-weight="800" font-size="26" fill="' + fill + '" style="font-variant-numeric:tabular-nums">0</text>'; };
    var lbl = function (fill) { return '<text x="50" y="70" text-anchor="middle" ' + f + ' font-weight="600" font-size="8.5" letter-spacing=".8" fill="' + fill + '">SEC</text>'; };
    var owl = OWL.replace('<svg viewBox="0 0 120 120" aria-hidden="true">', '<svg x="18" y="16" width="64" height="64" viewBox="0 0 120 120" opacity=".14">');
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="agg' + n + '"><circle cx="50" cy="50" r="46"/></clipPath>' +
      '<clipPath id="agw' + n + '"><path data-w="1" transform="translate(0,96)" d="' + w1 + '"/></clipPath></defs>' +
      '<g clip-path="url(#agg' + n + ')"><rect width="100" height="100" fill="#F5F5F2"/>' + owl +
      '<g data-w="1" transform="translate(0,96)"><path class="ag-wave b" d="' + w2 + '" fill="#5E9A8B" opacity=".55"/><path class="ag-wave" d="' + w1 + '" fill="#1D6657"/></g>' +
      num("#17201D", "a") + lbl("#535A56") + '<g clip-path="url(#agw' + n + ')">' + num("#F2F3EF", "b") + lbl("#CFE1DA") + '</g></g>' +
      '<circle cx="50" cy="50" r="46.5" fill="none" stroke="#17201D" stroke-width="4"/></svg>';
  }
  function thinking() {
    if (lastWait) { lastWait.kill(); lastWait = null; }
    var n = ++waitSeq, t0 = Date.now(), li = 0, lastTouch = -1e9, finished = false, timers = [];
    var globe = el("div", { class: "ag-globe" }); globe.innerHTML = globeSvg(n);
    var stat = el("span", { text: WAIT_LINES[0] });
    var bars = el("div", { class: "ag-wbars", "aria-hidden": "true" }, [el("i", { class: "on" }), el("i"), el("i")]);
    var deck = el("div", { class: "ag-deck", "aria-roledescription": "card deck" });
    var count = el("span");
    var qa = el("div", { class: "ag-wqa", "aria-hidden": "true" }, [el("div", {}, [el("div", { class: "ag-wqa-in" }, [
      el("div", { class: "ag-wlbl" }, [document.createTextNode("While you wait"), el("span", { text: "Gaurav's takes" })]),
      deck,
      el("div", { class: "ag-wnav" }, [
        el("button", { type: "button", "aria-label": "Previous take", text: "‹", onclick: function () { flip(-1, deck.lastChild); } }),
        count,
        el("button", { type: "button", "aria-label": "Next take", text: "›", onclick: function () { flip(1, deck.lastChild); } })
      ])
    ])])]);
    var card = el("div", { class: "ag-wcard" }, [el("div", { class: "ag-wstat", role: "status" }, [stat]), bars,
      el("p", { class: "ag-wnote", text: "New questions take 10-20 seconds. Every fact is checked against his portfolio, by code and a second AI, before you see it." }), qa]);
    var box = el("div", { class: "ag-wt", hidden: "" }, [el("div", {}, [el("div", { class: "ag-wt-in" }, [globe, card])])]);
    log.appendChild(box);
    var nums = globe.querySelectorAll("[data-t]"), waters = globe.querySelectorAll("[data-w]");
    function level(p) { var y = (96 - 92 * p).toFixed(2); for (var i = 0; i < waters.length; i++) waters[i].setAttribute("transform", "translate(0," + y + ")"); }
    function secs(v) { for (var i = 0; i < nums.length; i++) nums[i].textContent = String(v); }
    function renderDeck() {
      deck.innerHTML = "";
      for (var k = 2; k >= 0; k--) {
        var tk = TAKES[(takeIdx + k) % TAKES.length], src = TAKE_SRC[tk[1]];
        var link = el("a", { href: src[1], target: "_blank", rel: "noopener", text: "Read ›" });
        link.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
        var c = el("div", { class: "ag-tc" + (k === 1 ? " b1" : k === 2 ? " b2" : "") }, [el("p", { text: tk[0] }), el("div", { class: "ag-src" }, [el("span", { text: src[0] }), link])]);
        if (k === 0) drag(c);
        deck.appendChild(c);
      }
      count.textContent = (takeIdx + 1) + " / " + TAKES.length;
      lset("take", String(takeIdx));
    }
    function flip(dir, c) {
      lastTouch = Date.now();
      var go = function () { takeIdx = (takeIdx + dir + TAKES.length) % TAKES.length; renderDeck(); };
      if (!c) return go();
      c.style.transition = "transform .26s ease, opacity .26s ease";
      c.style.transform = "translateX(" + (dir > 0 ? -125 : 125) + "%) rotate(" + (dir > 0 ? -12 : 12) + "deg)";
      c.style.opacity = "0"; setTimeout(go, 240);
    }
    function drag(c) {
      var x0 = null, dx = 0;
      c.addEventListener("pointerdown", function (e) { x0 = e.clientX; dx = 0; try { c.setPointerCapture(e.pointerId); } catch (er) {} c.style.transition = "none"; lastTouch = Date.now(); });
      c.addEventListener("pointermove", function (e) { if (x0 === null) return; dx = e.clientX - x0; c.style.transform = "translateX(" + dx + "px) rotate(" + (dx / 20) + "deg)"; lastTouch = Date.now(); });
      function end() { if (x0 === null) return; x0 = null;
        if (Math.abs(dx) > 60) flip(dx < 0 ? 1 : -1, c);
        else if (Math.abs(dx) < 6) flip(1, c);
        else { c.style.transition = "transform .22s ease"; c.style.transform = ""; } }
      c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
    }
    function paint() {
      if (finished) return;
      var s = (Date.now() - t0) / 1000, stage = s < 4 ? 0 : s < 8 ? 1 : 2;
      for (var i = 0; i < 3; i++) bars.children[i].className = i <= stage ? "on" : "";
      secs(Math.floor(s)); level(Math.min(0.92, 1 - Math.exp(-s / 9)));
    }
    function nextLine() {
      if (finished) return;
      var s = (Date.now() - t0) / 1000; li++;
      stat.className = "ag-out2";
      setTimeout(function () { stat.textContent = s > 20 && li % 3 === 0 ? WAIT_LONG : WAIT_LINES[li % WAIT_LINES.length]; stat.className = ""; }, 200);
    }
    renderDeck(); paint();
    var tick = setInterval(paint, 250), lines = setInterval(nextLine, 2600);
    // Fast answers (approved, cached) never flash the window: it appears only after 0.6 s
    timers.push(setTimeout(function () { box.hidden = false; scroll(); }, 600));
    timers.push(setTimeout(function () { card.classList.add("ag-deckon"); qa.className = "ag-wqa on"; qa.setAttribute("aria-hidden", "false"); setTimeout(scroll, 520); }, 6000));
    function stop() { finished = true; clearInterval(tick); clearInterval(lines); timers.forEach(clearTimeout); }
    var api = {
      holding: false,
      remove: function () { stop(); box.remove(); if (lastWait === api) lastWait = null; },
      kill: function () { api.remove(); },
      // The answer has landed: fill the globe, put the answer above the window, and fold the window
      // away once the visitor has stopped swiping (never pull a card from under a finger).
      done: function (answerFirst) {
        if (box.hidden) return api.remove();
        stop(); level(1); secs(Math.max(1, Math.round((Date.now() - t0) / 1000)));
        for (var i = 0; i < 3; i++) bars.children[i].className = "on";
        stat.textContent = "Done. Every fact checked."; globe.classList.add("ag-pop");
        log.appendChild(box);
        if (answerFirst) log.scrollTop += answerFirst.getBoundingClientRect().top - log.getBoundingClientRect().top - 12;
        api.holding = true;
        (function waitIdle() {
          var idle = Date.now() - lastTouch;
          if (qa.className.indexOf("on") > -1 && idle < 2500) return setTimeout(waitIdle, 2550 - idle);
          setTimeout(function () { box.classList.add("ag-hide"); setTimeout(api.remove, 550); }, 700);
        })();
      }
    };
    lastWait = api;
    return api;
  }
  function ask(q) {
    q = (q || "").trim();
    if (!q || busy) return;
    if (q.length > MAXQ) return tooLong(q);
    if (!history.length) log.innerHTML = "";
    busy = true; send.disabled = true; ta.value = ""; grow(); updateCount();
    bubbleQ(q);
    var typing = thinking(); scroll();
    // history: ignored by the Worker from 1 Oct 2026 (it keeps the conversation itself, so it can't be forged).
    // Still sent so an older Worker keeps working during a switch-over; safe to remove later.
    function send(retried) {
      return post("/ask", { question: q, persona: persona, page: location.pathname, session: session, vid: vid, token: token, code: code,
        history: history.map(function (h) { return { q: h.q, a: h.a }; }) })
        .then(function (r) {
          // Missing or expired token: fetch a fresh one once and ask again, so the visitor never sees 'reload'
          if (r.status !== "reload" || retried) return r;
          token = ""; lset("token", "");
          return fetch(statusUrl()).then(function (x) { return x.json(); }).then(function (st) { takeToken(st); return token ? send(true) : r; }, function () { return r; });
        });
    }
    send(false)
      .then(function (r) {
        var firstNew = log.lastChild;
        var a = r.answer || "Something went wrong. You can reach Gaurav - " + CONTACT + ".";
        var counted = ["answer", "navigate", "clarify", "interview", "not_covered", "handoff", "off_topic", "unverified"].indexOf(r.status) > -1;
        history.push({ q: q, a: a, links: r.links || [], status: r.status, id: counted ? r.id : null, approved: !!r.approved }); set("history", history);
        bubbleA(a, r.links, r.status, counted ? r.id : null, q, false, !!r.approved);
        if (r.status === "limit_unlock") log.appendChild(unlockForm());
        else if (r.status === "offline") { form.hidden = true; }
        else if (r.status === "paused") { modeNote.hidden = false; }
        else if (typeof r.left === "number" && r.left <= 3) log.appendChild(el("div", { class: "ag-left",
          text: r.left === 0 ? "That was your last question for today." : r.left + " question" + (r.left === 1 ? "" : "s") + " left today." }));
        if (r.status !== "limit_unlock") maybeLead();
        // the first node added after the wait window is the answer's row
        var ansRow = firstNew && firstNew.nextSibling;
        typing.done(ansRow);
      })
      .catch(function () {
        typing.remove();
        bubbleA("I couldn't reach the assistant just now. You can reach Gaurav directly - " + CONTACT + ".", [], "error");
      })
      .then(function () { busy = false; send.disabled = false; if (!typing.holding) scroll(); ta.focus(); });
  }

  // Over the limit (often a pasted job description): fixed text, no model call, nothing counted or sent.
  // The text stays in the box so the visitor can trim it or pick one line.
  function tooLong(q) {
    if (!history.length && log.querySelector(".ag-starters")) log.innerHTML = "";
    var b = el("div", { class: "ag-m ag-a ag-soft" });
    b.appendChild(el("p", { text: "That's longer than I can take - questions are limited to " + MAXQ + " characters." }));
    b.appendChild(el("p", { text: "If it's a job description: matching a role to Gaurav's profile is a judgement he'd rather make with you personally. But I can help with the parts - ask about the skills that matter most, one at a time." }));
    var mail = "mailto:kavee.gauravjoshi@gmail.com?subject=" + encodeURIComponent("A role for you (from OWL)") + "&body=" + encodeURIComponent(q.slice(0, 1800));
    b.appendChild(el("div", { class: "ag-long" }, [
      el("button", { type: "button", text: "Has he led a loyalty platform?", onclick: function () { ta.value = ""; grow(); updateCount(); ask("Has he led a loyalty platform?"); } }),
      el("a", { href: mail, text: "Email it to Gaurav" }),
    ]));
    botRow(b); scroll(); ta.focus();
  }
  function updateCount() {
    var n = ta.value.trim().length;
    count.hidden = n < MAXQ - 100;
    count.className = "ag-count" + (n > MAXQ ? " over" : "");
    count.textContent = n > MAXQ ? n + " / " + MAXQ + " characters - too long to send" : n + " / " + MAXQ;
  }

  // ---------- events ----------
  function grow() { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 110) + "px"; }
  ta.addEventListener("input", grow);
  ta.addEventListener("input", updateCount);
  ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(ta.value); } });
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(ta.value); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { if (big) setBig(false); else close(); } });

  function open() {
    var p = sitePersona();
    if (p && !history.length && !get("persona", null)) { persona = p; syncWho(); }
    panel.hidden = false; btn.hidden = true; set("open", true);
    renderAll(); scroll(); ta.focus();
  }
  var online = false;
  function close() { if (big) setBig(false); if (inlineHost) return; panel.hidden = true; btn.hidden = !online; set("open", false); if (online) btn.focus(); }
  function setBig(on) {
    big = !!on;
    panel.classList.toggle("ag-big", big);
    dim.hidden = !big;
    document.documentElement.style.overflow = big ? "hidden" : "";
    maxBtn.innerHTML = big ? ICON_SMALL : ICON_BIG;
    maxBtn.setAttribute("aria-label", big ? "Shrink" : "Expand"); maxBtn.title = big ? "Shrink" : "Expand";
    maxBtn.setAttribute("aria-pressed", big ? "true" : "false");
    panel.setAttribute("aria-modal", big ? "true" : "false");
    scroll(); ta.focus();
  }

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
    modeNote.hidden = st.mode !== "free";
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
  var cached = get("status", null);   // re-checked at most once a minute per tab (always, until the browser has a token)
  if (cached && token && Date.now() - cached.t < 60000) applyStatus(cached);
  else fetch(statusUrl()).then(function (r) { return r.json(); })
    .then(function (st) { takeToken(st); delete st.token; st.t = Date.now(); set("status", st); applyStatus(st); })
    .catch(function () { /* Worker unreachable - keep the button hidden */ });
})();
