#!/usr/bin/env python3
"""Builds the three sites from _src/ into finished HTML.

  python3 _src/build.py            # writes the site into the repo root
  python3 _src/build.py --out DIR  # writes a full copy somewhere else (preview)

Shared content lives once in _src/blocks/. Pages are listed in PAGES below.
In a page:  <!--#include name-->  pulls in _src/blocks/name.html
In a block or page:  {{key}}  is filled from the page's vars, then the site's vars.
GitHub Pages skips folders that start with '_', so _src/ is never served.
"""
import os, re, sys, shutil, html

SRC = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SRC)
BASE = 'https://gsj24983.github.io/'
ENDPOINT = 'https://ask-gaurav.gauravjoshi-pm.workers.dev'
COPY = ('&copy; 2026 Gaurav Joshi. All rights reserved. Swanubhava&trade; is a trademark of Gaurav Joshi. '
        'Content on this site may not be reproduced without permission.')

# ---------------------------------------------------------------- sites
FT_FACTS = ('<div class="facts"><div><span>Phone</span><b>+91-98234 66677</b></div><div><span>Based in</span><b>Pune, India</b></div>'
            '<div><span>Available from</span><b>Immediately</b></div><div class="long"><span>Location flexibility</span><b>Pune preferred. '
            'Open to Bengaluru, Hyderabad, remote or hybrid. For the right role, I&rsquo;d relocate internationally (with employer visa sponsorship).</b></div>'
            '<div class="long"><span>Open to</span><b>Director / VP / Head of Product, or senior Product Manager roles where the scope is real. '
            'And select engagements.</b></div><div><span>LinkedIn</span><b>in/gsjoshi</b></div></div>')
SHORT_FACTS = ('<div class="facts"><div><span>Phone</span><b>+91-98234 66677</b></div><div><span>Based in</span><b>Pune, India</b></div>'
               '<div><span>LinkedIn</span><b>in/gsjoshi</b></div></div>')

def dl(items):
    out = []
    for href, label, hint in items:
        h = ' <em class="hint">- %s</em>' % hint if hint else ''
        out.append('<a href="%s" target="_blank" rel="noopener">%s%s<span>PDF</span></a>' % (href, label, h))
    return '<div class="dl">' + ''.join(out) + '</div>\n</div></section>'

R_PM = ('resume.pdf', 'R&eacute;sum&eacute;: Product Manager', 'product leadership roles')
R_AI = ('resume-ai-product.pdf', 'R&eacute;sum&eacute;: AI Product Manager', 'AI product roles')
R_TR = ('resume-transformation.pdf', 'R&eacute;sum&eacute;: Transformation Consultant', 'transformation and consulting work')
CASE_PDFS = [('dairy-case-study.pdf', 'Case: dairy platform - full deck', ''),
             ('dairy-annexure.pdf', 'Case: dairy platform - annexure and research', ''),
             ('whatsapp-feature-recommendation.pdf', 'Case: WhatsApp groups within groups - full deck', ''),
             ('discord-vs-whatsapp-analysis.pdf', 'Case: Discord vs WhatsApp analysis', ''),
             ('the-puppeteer-deck.pdf', 'Case: The Puppeteer - full deck', '')]

RES = '<p style="margin:14px 0 0;font-size:14px">R&eacute;sum&eacute; (PDF): %s</p>'
LNK = '<a href="%s" target="_blank" rel="noopener">%s</a>'

FW_SWAN_LI = '<li>Swanubhava&trade;<small>My product management behavioural model</small></li>'
FW_GBT_LI = '<li>Goal-based travel package model<small>Build a trip around the traveller&rsquo;s goal, not the destination.</small></li>'

ENGAGE = ('<p class="sub" style="margin:22px 0 8px">Thinking of an engagement? See how it would run.</p>\n'
          '<div class="cta-row"><button class="btn" type="button" data-dialog="book-dlg">Book a call</button>%s</div>')

SITES = {
    'ft': dict(dir='', persona='ft', theme=None, name='Gaurav Joshi', ink='#17201D', paper='#E9EAE6', accent='#1D6657',
               nav=[('index.html', 'Home'), ('who-am-i.html', 'Who I am'), ('how-i-think.html', 'How I think'),
                    ('in-their-words.html', 'In their words'), ('contact.html', 'Get in touch')],
               also='Also: <a href="swanubhava/">Swanubhava&trade; training</a> &middot; <a href="consulting/">Product consulting</a>',
               og='assets/og-owl.png',
               vars=dict(journey_resumes=RES % (LNK % ('resume.pdf', 'Product Manager') + ' | ' + LNK % ('resume-ai-product.pdf', 'AI Product Manager')),
                         deeper_note='Each of these opens the full version on How I think.', deeper_fw_first=FW_SWAN_LI,
                         swan_href='swanubhava/', contact_belief='Open to senior product and transformation roles.',
                         reach_engage='', facts=FT_FACTS, book_note='', open_cls='open lite')),
    'con': dict(dir='consulting/', persona='con', theme='theme-con.css', name='Gaurav Joshi', ink='#1F1A14', paper='#ECE7DD', accent='#8A4B12',
                tag='Product consulting',
                nav=[('index.html', 'Home'), ('work.html', 'Work'), ('proof.html', 'Proof'),
                     ('thought-process.html', 'Thought process'), ('contact.html', 'Get in touch')],
                also='Also: <a href="../swanubhava/">Swanubhava&trade; training</a> &middot; <a href="../">Full-time roles</a>',
                og='assets/og-owl.png',
                vars=dict(journey_resumes=RES % (LNK % ('resume-transformation.pdf', 'Transformation Consultant')),
                          deeper_note='Each of these opens the full version on Proof or Thought process.', deeper_fw_first=FW_GBT_LI,
                          contact_belief='Open to consulting, fractional and advisory product engagements.',
                          reach_engage=ENGAGE % '<button class="btn" type="button" data-dialog="hw-con">How we&rsquo;d work</button>',
                          facts=SHORT_FACTS, book_note='For consulting conversations.', open_cls='open lite')),
    'sw': dict(dir='swanubhava/', persona='tr', theme='theme-sw.css', name='Swanubhava&trade;', ink='#1D1726', paper='#ECE9F0', accent='#5B2A7A',
               nav=[('index.html', 'Home'), ('scenarios.html', 'Try a scenario'), ('trainer.html', 'The trainer'), ('contact.html', 'Get in touch')],
               also='<a href="%s">About Gaurav</a>' % BASE,
               og='assets/og-swanubhava.png', selfcontained=True,
               vars=dict(journey_resumes='', contact_belief='Open to Swanubhava&trade; training and coaching for corporate teams, MBA programmes and individuals.',
                         reach_engage=ENGAGE % '<button class="btn" type="button" data-dialog="hw-tr">How we&rsquo;d work</button>',
                         facts=SHORT_FACTS, book_note='For training conversations.', open_cls='open sw-hero')),
}

RECS = '<section id="recs"><div class="wrap">%s\n<!--#include recs-foot-->\n</div></section>'
RECS_ALL = RECS % '\n'.join('<!--#include recs-%s-->' % k for k in ['managers', 'peers', 'clients', 'mentored', 'mba'])
RECS_MENTOR_FIRST = RECS % '\n'.join('<!--#include recs-%s-->' % k for k in ['mentored', 'managers', 'peers', 'clients', 'mba'])
CASES_ALL = '<!--#include cases-head-->\n<!--#include case-dairy-->\n<!--#include case-whatsapp-->\n<!--#include case-puppeteer-->\n<!--#include cases-foot-->'
INLINE_OWL = '<div class="owl-home"><div class="wrap"><section id="ask-gaurav-inline" hidden></section></div></div>'
SR = '<h1 class="sr-only">%s</h1>\n'

# (site, file, nav key, title, description, body, dialogs, extras)
PAGES = [
    ('ft', 'index.html', 'index.html', 'Gaurav Joshi - Product & transformation leader',
     '18+ years turning abstract problems into shipped products and aligned teams. Ex-VP Product, JPMorgan Chase. Pune, India.',
     '<div id="landing" class="home-hero">\n<!--#include landing-brand-->\n<section id="ask-gaurav-inline" hidden style="width:100%;margin:0 0 4px"></section>\n</div>\n'
     '<!--#include pitch-ft-->\n<!--#include day-one-->\n<!--#include pm-view-ft-->\n<!--#include quote-ft-->', [], ['gsap']),
    ('ft', 'who-am-i.html', 'who-am-i.html', 'Who I am - Gaurav Joshi', 'Results, AI work, career journey and skill map.',
     SR % 'Who I am' + '<!--#include moved-->\n<!--#include quote-glenn-->\n<!--#include ai-->\n<!--#include journey-->\n<!--#include skills-->\n<!--#include deeper-->\n<!--#include who-signoff-->', [], ['gsap']),
    ('ft', 'how-i-think.html', 'how-i-think.html', 'How I think - Gaurav Joshi', 'Three cases, frameworks and 28 articles.',
     SR % 'How I think' + CASES_ALL + '\n<!--#include fw-head-->\n<!--#include fw-swan-->\n<!--#include fw-list-->\n<!--#include articles-->\n<!--#include hit-signoff-->', [], []),
    ('ft', 'in-their-words.html', 'in-their-words.html', 'In their words - Gaurav Joshi', 'Sixteen LinkedIn recommendations, exactly as written.',
     SR % 'In their words' + '<!--#include themes-->\n' + RECS_ALL + '\n<!--#include itw-signoff-->', [], ['gsap']),
    ('ft', 'contact.html', 'contact.html', 'Get in touch - Gaurav Joshi', 'Contact details, availability and downloads.',
     '<!--#include contact-head-->\n<!--#include contact-reach-->\n<!--#include downloads-head-->\n' + dl([R_PM, R_AI] + CASE_PDFS) + '\n<!--#include curious-->\n<!--#include owl-signoff-->', [], []),

    ('con', 'index.html', 'index.html', 'Product consulting - Gaurav Joshi',
     'Fractional and advisory product leadership: faster than a hire can ramp. Gaurav Joshi, Pune, India.',
     '<!--#include pitch-con-->\n' + INLINE_OWL + '\n<!--#include first-week-->\n<!--#include pm-view-con-->\n<!--#include skills-->\n<!--#include quote-con-->',
     ['book', 'hw-con'], []),
    ('con', 'work.html', 'work.html', 'Work - Product consulting - Gaurav Joshi', 'Results and the career journey behind them.',
     SR % 'Work' + '<!--#include moved-->\n<!--#include journey-->\n<!--#include deeper-->\n<!--#include who-signoff-->', [], ['gsap']),
    ('con', 'proof.html', 'proof.html', 'Proof - Product consulting - Gaurav Joshi', 'AI work, three cases and sixteen recommendations.',
     SR % 'Proof' + '<!--#include ai-->\n' + CASES_ALL + '\n<!--#include themes-->\n' + RECS_ALL + '\n<!--#include itw-signoff-->', [], ['gsap']),
    ('con', 'thought-process.html', 'thought-process.html', 'Thought process - Product consulting - Gaurav Joshi', 'Frameworks and 28 articles.',
     SR % 'Thought process' + '<!--#include fw-head-->\n<!--#include fw-list-->\n<!--#include articles-->\n<!--#include hit-signoff-->', [], []),
    ('con', 'contact.html', 'contact.html', 'Get in touch - Product consulting - Gaurav Joshi', 'Book a call, how an engagement runs, contact details.',
     '<!--#include contact-head-->\n<!--#include contact-reach-->\n<!--#include book-call-->\n<!--#include downloads-head-->\n' + dl([R_TR]) + '\n<!--#include curious-->\n<!--#include owl-signoff-->',
     ['book', 'hw-con'], []),

    ('sw', 'index.html', 'index.html', 'Swanubhava™ - product management behavioural training by Gaurav Joshi',
     'Most PM training teaches what to deliver. Swanubhava™ trains how you behave when it gets hard.',
     '<!--#include pitch-tr-->\n' + INLINE_OWL + '\n<div class="swtr">\n<!--#include tr-content-->\n<!--#include tr-delivery-->\n<!--#include tr-flow-->\n<!--#include tr-science-->\n</div>\n<!--#include quote-tr-->\n<!--#include sw-signoff-->',
     ['tr-model', 'book', 'hw-tr'], ['training', 'gsap']),
    ('sw', 'scenarios.html', 'scenarios.html', 'Try a scenario - Swanubhava™', 'Play a Swanubhava™ scenario: make the calls in a real product moment.',
     SR % 'Try a scenario' + '<div class="swtr">\n<!--#include tr-delivery-->\n</div>\n<section id="cases"><div class="wrap">\n<h2 class="head">The platform behind the scenarios</h2>\n<!--#include case-puppeteer-->\n</div></section>\n<!--#include sw-signoff-->',
     ['book', 'hw-tr'], []),
    ('sw', 'trainer.html', 'trainer.html', 'The trainer - Swanubhava™', 'Gaurav Joshi: career journey and what people say about working with him.',
     SR % 'The trainer' + '<!--#include journey-->\n<!--#include themes-->\n' + RECS_MENTOR_FIRST + '\n<!--#include curious-->\n<!--#include sw-signoff-->',
     ['book', 'hw-tr'], ['gsap']),
    ('sw', 'contact.html', 'contact.html', 'Get in touch - Swanubhava™', 'Book a call about Swanubhava™ training, formats and how an engagement starts.',
     '<!--#include contact-head-->\n<!--#include contact-reach-->\n<!--#include book-call-->\n<!--#include owl-signoff-->',
     ['book', 'hw-tr'], []),
]

# old addresses -> new homes (the old Overview tabs and pages)
REDIRECTS = {
    'work-with-me.html': 'consulting/',
    'swanubhava.html': 'swanubhava/',
    # compassion fare hidden 24 Nov 2026 (about a month); restore from git d899283
    'scenarios/compassion-fare.html': '../swanubhava/scenarios.html',
    'swanubhava/scenarios/compassion-fare.html': '../scenarios.html',
}
OVERVIEW_JS = '''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Moved</title>
<meta name="robots" content="noindex"><link rel="canonical" href="https://gsj24983.github.io/">
<script>(function(){var q=new URLSearchParams(location.search),f=q.get('for'),h=location.hash||'';
var tr=['#tr-content','#tr-delivery','#tr-flow','#tr-science','#method','#pillarsA'],con=['#first-week'];
if(!f){if(tr.indexOf(h)>-1)f='tr';else if(con.indexOf(h)>-1)f='con';}
var to=f==='tr'?'swanubhava/':f==='con'?'consulting/':'index.html';if(h==='#method')h='#tr-content';
q.delete('for');var s=q.toString();location.replace(to+(s?'?'+s:'')+h);})();</script>
<meta http-equiv="refresh" content="0;url=index.html"></head><body><a href="index.html">Gaurav Joshi</a></body></html>
'''

# Swanubhava is self-contained: these are copied into swanubhava/, everything else it links to is absolute
SW_COPY = ['site.css', 'training.css', 'site.js', 'training.js', 'ask.js', 'js/gsap.min.js', 'js/ScrollTrigger.min.js', 'js/moments.js',
           'fonts/schibsted-grotesk.woff2', 'fonts/tiro-devanagari-marathi-swanubhava.woff2', 'fonts/OFL-schibsted-grotesk.txt',
           'fonts/OFL-tiro-devanagari-marathi.txt', 'assets/split.css', 'assets/theme-sw.css', 'assets/og-swanubhava.png']
SW_MOVE = []  # compassion fare hidden 24 Nov 2026; was ['scenarios/compassion-fare.html']

# links from FT pages into each site's own pages
LINKMAP = {
    'con': [(r'how-i-think\.html#(frameworks|fw-[a-z]+|articles)', r'thought-process.html#\1'),
            (r'how-i-think\.html(#[a-z-]+)?', r'proof.html\1'),
            (r'who-am-i\.html#ai', 'proof.html#ai'),
            (r'who-am-i\.html(#[a-z-]+)?', r'work.html\1'),
            (r'in-their-words\.html(#[a-z-]+)?', 'proof.html#recs')],
    'sw': [(r'how-i-think\.html#case-puppeteer', 'scenarios.html#case-puppeteer'),
           (r'(who-am-i|in-their-words)\.html(#[a-z-]+)?', r'trainer.html'),
           (r'overview\.html\?for=tr(#[a-z-]+)?', r'index.html\1')],
}

# ---------------------------------------------------------------- build
def block(name):
    p = os.path.join(SRC, 'blocks', name + '.html')
    return open(p, encoding='utf-8').read().rstrip('\n')

def expand(s, seen=()):
    def inc(m):
        n = m.group(1)
        assert n not in seen, 'include loop: ' + n
        return expand(block(n), seen + (n,))
    return re.sub(r'<!--#include ([a-z0-9-]+)-->', inc, s)

def fill(s, vars_, where):
    def rep(m):
        k = m.group(1)
        if k not in vars_:
            raise SystemExit('missing {{%s}} in %s' % (k, where))
        return vars_[k]
    return re.sub(r'\{\{([a-z_]+)\}\}', rep, s)

def owl_symbol(c):
    return ('<svg style="display:none"><symbol id="owl" viewBox="0 0 120 120">\n'
            '<line x1="24" y1="99" x2="96" y2="99" stroke="{ink}" stroke-width="4" stroke-linecap="round"/>\n'
            '<path d="M60 24 C39 24 29 43 29 64 C29 87 43 99 60 99 C77 99 91 87 91 64 C91 43 81 24 60 24 Z" fill="{ink}"/>\n'
            '<path d="M35 33 L44 18 L51 35 Z" fill="{ink}"/><path d="M85 33 L76 18 L69 35 Z" fill="{ink}"/>\n'
            '<circle cx="50" cy="56" r="11" fill="{paper}"/><circle cx="70" cy="56" r="11" fill="{paper}"/>\n'
            '<circle cx="50" cy="56" r="4.4" fill="{ink}"/><circle cx="70" cy="56" r="4.4" fill="{ink}"/>\n'
            '<path d="M60 63 L55 71 L65 71 Z" fill="{accent}"/></symbol></svg>').format(**c)

def favicon(c):
    svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><path d='M60 24C39 24 29 43 29 64c0 23 14 35 31 35s31-12 31-35c0-21-10-40-31-40z' fill='{ink}'/>"
           "<path d='M35 33l9-15 7 17zM85 33l-9-15-7 17z' fill='{ink}'/><circle cx='50' cy='56' r='11' fill='{paper}'/><circle cx='70' cy='56' r='11' fill='{paper}'/>"
           "<circle cx='50' cy='56' r='4.4' fill='{ink}'/><circle cx='70' cy='56' r='4.4' fill='{ink}'/><path d='M60 63l-5 8h10z' fill='{accent}'/></svg>").format(**c)
    return 'data:image/svg+xml,' + svg.replace('<', '%3C').replace('>', '%3E').replace('#', '%23')

def nav(site, c, current):
    if site == 'sw':
        brand = '<a class="brand" href="index.html"><span class="deva" lang="mr">स्वानुभव</span><span class="name">Swanubhava&trade;</span></a>'
    else:
        tag = '<span class="site-tag">%s</span>' % c['tag'] if c.get('tag') else ''
        brand = '<a class="brand" href="index.html"><svg class="owl" aria-hidden="true"><use href="#owl"/></svg><span class="name">Gaurav Joshi</span>%s</a>' % tag
    links = ''.join('<a href="%s"%s>%s</a>' % (h, ' class=on aria-current=page' if h == current else '', t) for h, t in c['nav'])
    return ('<header class="nav"><div class="wrap">%s\n<button class="menu-btn" aria-expanded="false">Menu</button><nav class="links">%s</nav></div></header>'
            % (brand, links))

def rewrite_links(s, site, c, depth_prefix):
    """Point links at the right place for this site's folder."""
    for pat, rep in LINKMAP.get(site, []):
        s = re.sub(r'href="' + pat + '"', lambda m: 'href="' + m.expand(rep) + '"', s)
    own = {h for h, _ in c['nav']}
    local = set(SW_COPY) if site == 'sw' else set()

    def fix(m):
        attr, url = m.group(1), m.group(2)
        if re.match(r'^(https?:|mailto:|tel:|data:|#|//|\.\./)', url) or not url:
            return m.group(0)
        path = re.split(r'[?#]', url)[0]
        if site == 'ft' or path in own or path in local:
            return m.group(0)
        if c.get('selfcontained'):
            return '%s="%s%s"' % (attr, BASE, url)
        return '%s="%s%s"' % (attr, depth_prefix, url)
    return re.sub(r'\b(href|src|poster)="([^"]*)"', fix, s)

def page(site, fname, cur, title, desc, body, dialogs, extras):
    c = SITES[site]
    url = BASE + c['dir'] + ('' if fname == 'index.html' else fname)
    pre = '../' if c['dir'] and not c.get('selfcontained') else ''
    css = '<link rel="stylesheet" href="site.css"><link rel="stylesheet" href="training.css"><link rel="stylesheet" href="assets/split.css">'
    if c['theme']:
        css += '<link rel="stylesheet" href="assets/%s">' % c['theme']
    t = html.escape(title, quote=True)
    d = html.escape(desc, quote=True)
    head = ('<!DOCTYPE html>\n<html lang="en" data-site="%s"><head>\n'
            '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<title>%s</title><meta name="description" content="%s">\n'
            '<meta property="og:type" content="website"><meta property="og:title" content="%s"><meta property="og:description" content="%s"><meta property="og:url" content="%s">\n'
            '<meta property="og:image" content="%s"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">\n'
            '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="%s">\n'
            '<link rel="canonical" href="%s">\n<link rel="icon" href="%s">\n'
            '<link rel="preload" href="fonts/schibsted-grotesk.woff2" as="font" type="font/woff2" crossorigin>\n'
            '<meta name="theme-color" content="%s">\n%s\n</head>\n<body>\n'
            % (c['persona'], t, d, t, d, url, BASE + (c['dir'] if c.get('selfcontained') else '') + c['og'], BASE + (c['dir'] if c.get('selfcontained') else '') + c['og'],
               url, favicon(c), c['paper'], css))
    main = '<main>\n' + body + '\n</main>'
    dlg = '\n'.join('<!--#include dlg-%s-->' % x for x in dialogs)
    scripts = '<script src="site.js"></script>'
    if 'training' in extras:
        scripts += '\n<script src="training.js" defer></script>'
    if 'gsap' in extras:
        scripts += '\n<script src="js/gsap.min.js" defer></script><script src="js/ScrollTrigger.min.js" defer></script><script src="js/moments.js" defer></script>'
    foot = ('<footer class="site-foot"><!--#include foot-links-->\n<div class="foot-also">%s</div>%s</footer>' % (c['also'], COPY))
    if site == 'sw':
        foot = '<footer class="site-foot"><div class="foot-also">%s</div>%s</footer>' % (c['also'], COPY)
    out = (head + owl_symbol(c) + '\n' + nav(site, c, cur) + '\n' + main + '\n' + dlg + '\n' + scripts + '\n' + foot +
           '\n<script src="ask.js" data-endpoint="%s" defer></script>\n</body></html>\n' % ENDPOINT)
    out = expand(out)
    out = fill(out, dict(c['vars']), site + '/' + fname)
    out = re.sub(r'data-dialog="book"', 'data-dialog="book-dlg"', out)
    out = rewrite_links(out, site, c, pre)
    # site-relative assets in consulting/ live one level up
    return out

def redirect(to):
    return ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Moved</title><meta name="robots" content="noindex">'
            '<meta http-equiv="refresh" content="0;url=%s"><link rel="canonical" href="%s">'
            '<script>location.replace("%s"+location.search+location.hash)</script></head>'
            '<body><a href="%s">This page has moved</a></body></html>\n' % (to, to, to, to))

def main():
    out = ROOT
    if '--out' in sys.argv:
        out = os.path.abspath(sys.argv[sys.argv.index('--out') + 1])
        if os.path.exists(out):
            shutil.rmtree(out)
        shutil.copytree(ROOT, out, ignore=shutil.ignore_patterns('.git', '_src'))
    os.makedirs(os.path.join(out, 'assets'), exist_ok=True)
    for f in ['split.css', 'theme-con.css', 'theme-sw.css']:
        shutil.copy(os.path.join(SRC, 'themes', f), os.path.join(out, 'assets', f))
    for d in ['consulting', 'swanubhava']:
        os.makedirs(os.path.join(out, d), exist_ok=True)
    # Swanubhava's own copies (scenario page moves in once; afterwards its source is swanubhava/scenarios/)
    for f in SW_COPY:
        dst = os.path.join(out, 'swanubhava', f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy(os.path.join(out, f), dst)
    for f in SW_MOVE:
        src, dst = os.path.join(out, f), os.path.join(out, 'swanubhava', f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if 'http-equiv="refresh"' not in open(src, encoding='utf-8').read()[:600]:
            shutil.copy(src, dst)
    n = 0
    for p in PAGES:
        s = page(*p)
        path = os.path.join(out, SITES[p[0]]['dir'], p[1])
        open(path, 'w', encoding='utf-8').write(s)
        n += 1
    open(os.path.join(out, 'overview.html'), 'w', encoding='utf-8').write(OVERVIEW_JS)
    for f, to in REDIRECTS.items():
        open(os.path.join(out, f), 'w', encoding='utf-8').write(redirect(to))
    print('built %d pages into %s' % (n, out))

if __name__ == '__main__':
    main()
