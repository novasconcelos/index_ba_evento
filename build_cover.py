from pathlib import Path
import base64, re

f = Path('proposta_in9_pdf_branco.html')
html = f.read_text(encoding='utf-8')

# ── 1. Logo base64 ────────────────────────────────────────────────────────────
logo_b64 = base64.b64encode(
    Path(r'G:\Meu Drive\NATHAN\Projetos\Fieb\Index\logo\Logo.png').read_bytes()
).decode()
logo_uri = f'data:image/png;base64,{logo_b64}'

# ── 2. Adicionar fontes ───────────────────────────────────────────────────────
html = html.replace(
    'family=Fraunces:ital,opsz,wght@1,9..144,400&family=Inter:opsz,wght@14..32,400;14..32,500&family=JetBrains+Mono:wght@400;500&display=swap',
    'family=Fraunces:ital,opsz,wght@1,9..144,400&family=Hanken+Grotesk:wght@400;500;600;700;800&family=Inter:opsz,wght@14..32,400;14..32,500&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,wght@1,400;1,500;1,600&display=swap'
)

# ── 3. SVG mapa de stands ─────────────────────────────────────────────────────
def make_stands_svg():
    cw, ch, g = 52, 44, 7
    ox, oy = 12, 14

    # (col, row, w_cells, h_cells, style 0=normal 1=blue/sold 2=green/active)
    layout = [
        (0,0,1,1,0),(1,0,2,1,1),(3,0,1,1,0),(4,0,1,1,0),(5,0,2,1,0),(7,0,1,1,1),(8,0,1,1,0),
        (0,1,1,1,0),(1,1,1,1,0),(2,1,1,2,0),(3,1,1,1,0),(4,1,1,1,2),(5,1,1,1,0),(6,1,1,1,0),(7,1,2,1,0),
        (0,2,1,1,2),(1,2,1,1,0),(3,2,2,1,1),(5,2,1,1,0),(6,2,1,1,0),(7,2,1,1,0),(8,2,1,1,0),
        (0,3,1,1,0),(1,3,1,1,0),(2,3,1,1,0),(3,3,2,1,2),(5,3,1,1,0),(6,3,2,1,0),(8,3,1,1,0),
        (0,4,2,1,0),(2,4,1,1,0),(3,4,1,1,0),(4,4,2,1,1),(6,4,1,1,0),(7,4,2,1,0),
    ]
    FILL = ['rgba(127,151,247,0.06)','rgba(127,151,247,0.22)','rgba(70,210,154,0.18)']
    STRK = ['rgba(255,255,255,0.13)','rgba(127,151,247,0.65)','rgba(70,210,154,0.65)']
    SW   = [1, 1.5, 1.5]
    rects = []
    for (col, row, wc, hc, s) in layout:
        x = ox + col*(cw+g)
        y = oy + row*(ch+g)
        w = wc*cw + (wc-1)*g
        h = hc*ch + (hc-1)*g
        rects.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" '
            f'fill="{FILL[s]}" stroke="{STRK[s]}" stroke-width="{SW[s]}"/>'
        )
    vw = ox + 9*(cw+g) - g + ox
    vh = oy + 5*(ch+g) - g + oy
    rects_str = '\n    '.join(rects)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;">
  <defs>
    <linearGradient id="mapFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="black" stop-opacity="1"/>
      <stop offset="35%"  stop-color="black" stop-opacity="0.85"/>
      <stop offset="62%"  stop-color="white" stop-opacity="1"/>
      <stop offset="100%" stop-color="white" stop-opacity="1"/>
    </linearGradient>
    <mask id="mapMask">
      <rect width="{vw}" height="{vh}" fill="url(#mapFade)"/>
    </mask>
  </defs>
  <g mask="url(#mapMask)">
    {rects_str}
  </g>
</svg>'''

stands_svg = make_stands_svg()

# ── 4. HTML da capa ───────────────────────────────────────────────────────────
new_hero = f'''<section class="hero-print">

  <div class="cover-map-wrap">
    {stands_svg}
  </div>

  <div class="cover-content">

    <div class="cover-header">
      <div class="cover-brand">
        <div class="cover-in9">in9</div>
        <div class="cover-brand-text">
          <span class="cover-brand-name">In9 Tecnologia</span>
          <span class="cover-brand-sub">PLATAFORMAS SOB MEDIDA</span>
        </div>
      </div>
      <div class="cover-pill">
        <span class="cover-pill-dot"></span>
        PROPOSTA COMERCIAL · 2026
      </div>
    </div>

    <div class="cover-main">
      <div class="cover-guide">PROPOSTA PARA O INDEX BAHIA 2027</div>
      <div class="cover-title">
        <div class="cover-title-sans">Plataforma</div>
        <div class="cover-title-serif">INDEX Bahia.</div>
      </div>
      <p class="cover-sub">Comercial, gestão e operação integrados numa só plataforma.</p>
      <img class="cover-index-logo" src="{logo_uri}" alt="INDEX Bahia">
    </div>

    <div class="cover-footer">
      <div class="cover-footer-cols">
        <div class="cover-footer-col">
          <span class="cover-footer-label">CLIENTE</span>
          <span class="cover-footer-val">INDEX Bahia · FIEB / SEBRAE</span>
        </div>
        <div class="cover-footer-sep"></div>
        <div class="cover-footer-col">
          <span class="cover-footer-label">PROPONENTE</span>
          <span class="cover-footer-val">In9 Tecnologia</span>
        </div>
        <div class="cover-footer-sep"></div>
        <div class="cover-footer-col">
          <span class="cover-footer-label">VALIDADE</span>
          <span class="cover-footer-val">30 dias a partir do envio</span>
        </div>
      </div>
      <div class="cover-conf">CONFIDENCIAL · USO EXCLUSIVO DO DESTINATÁRIO</div>
    </div>

  </div>

  <div class="cover-border"></div>

</section>'''

old_s = html.find('<section class="hero-print"')
old_e = html.find('</section>', old_s) + len('</section>')
assert old_s != -1, 'hero-print not found'
html = html[:old_s] + new_hero + html[old_e:]

# ── 5. CSS global ─────────────────────────────────────────────────────────────
cover_css = r"""
    /* ══════════════ CAPA ══════════════ */
    .hero-print {
      position: relative;
      min-height: 100vh;
      background: #0c0e18;
      background-image: radial-gradient(ellipse 80% 80% at -5% -5%, rgba(127,151,247,0.22) 0%, transparent 55%);
      overflow: hidden;
      display: flex;
      align-items: stretch;
    }
    .cover-map-wrap {
      position: absolute;
      right: -2%;
      top: 0;
      width: 58%;
      height: 100%;
      display: flex;
      align-items: center;
    }
    .cover-content {
      position: relative;
      z-index: 2;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 44px 52px;
    }
    .cover-header { display: flex; justify-content: space-between; align-items: center; }
    .cover-brand { display: flex; align-items: center; gap: 14px; }
    .cover-in9 {
      width: 40px; height: 40px;
      background: #10121f;
      border: 1.5px solid #a78bfa;
      border-radius: 22%;
      display: flex; align-items: center; justify-content: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px; font-weight: 500;
      color: #a78bfa;
      letter-spacing: -0.02em;
      box-shadow: 0 0 10px rgba(167,139,250,0.25);
      flex-shrink: 0;
    }
    .cover-brand-text { display: flex; flex-direction: column; gap: 1px; }
    .cover-brand-name {
      font-family: 'Hanken Grotesk', 'Inter', sans-serif;
      font-size: 14px; font-weight: 600; color: #e8eaf6; letter-spacing: -0.01em;
    }
    .cover-brand-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.16em; color: #4a5472;
    }
    .cover-pill {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 14px;
      border: 1px solid rgba(127,151,247,0.3);
      border-radius: 999px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px; letter-spacing: 0.1em; color: #8892b0;
      background: rgba(127,151,247,0.05);
    }
    .cover-pill-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #7f97f7;
      box-shadow: 0 0 6px rgba(127,151,247,0.8);
      flex-shrink: 0;
    }
    .cover-main { display: flex; flex-direction: column; gap: 0; }
    .cover-guide {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase;
      color: #4a5472; margin-bottom: 14px;
    }
    .cover-title { line-height: 0.93; margin-bottom: 18px; }
    .cover-title-sans {
      font-family: 'Hanken Grotesk', 'Inter', sans-serif;
      font-size: clamp(56px, 7vw, 88px); font-weight: 800;
      color: #f0f2ff; letter-spacing: -0.03em;
    }
    .cover-title-serif {
      font-family: 'Newsreader', 'Fraunces', Georgia, serif;
      font-style: italic; font-size: clamp(58px, 7.2vw, 90px); font-weight: 500;
      color: #7f97f7; letter-spacing: -0.02em;
    }
    .cover-sub {
      font-family: 'Newsreader', Georgia, serif;
      font-style: italic; font-size: 16px; color: #6b7490; margin-bottom: 20px;
    }
    .cover-index-logo { height: 26px; width: auto; opacity: 0.5; filter: brightness(0) invert(1); }
    .cover-footer { display: flex; flex-direction: column; gap: 12px; }
    .cover-footer-cols {
      display: flex; align-items: center; gap: 28px;
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .cover-footer-sep { width: 1px; height: 28px; background: rgba(255,255,255,0.1); flex-shrink: 0; }
    .cover-footer-col { display: flex; flex-direction: column; gap: 3px; }
    .cover-footer-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: #4a5472;
    }
    .cover-footer-val {
      font-family: 'Hanken Grotesk', 'Inter', sans-serif;
      font-size: 12px; font-weight: 500; color: #8892b0;
    }
    .cover-conf {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: #2e3348;
    }
    .cover-border {
      position: absolute; inset: 10mm;
      border: 1.5px solid rgba(127,151,247,0.35);
      border-radius: 6px; pointer-events: none; z-index: 3;
    }

"""

# Remove old cover CSS blocks if they exist
html = re.sub(r'\n    /\* ══+[^*]*CAPA[^*]*══+[^*]*\*/.*?(?=\n    /\* )', '\n    ', html, flags=re.DOTALL)
html = re.sub(r'\n    /\* ── Capa ── \*/.*?\.cover-meta__value[^}]*\}\n', '\n', html, flags=re.DOTALL)

html = html.replace('\n    /* ── Protótipos ── */', cover_css + '\n    /* ── Protótipos ── */')

# ── 6. CSS print ──────────────────────────────────────────────────────────────
old_print = (
    '      /* Capa: landscape, dark, full-height */\n'
    '      section.hero-print {\n'
    '        page: landscape-page;\n'
    '        min-height: 182mm !important;\n'
    '        padding: 0 !important;\n'
    '        background: #0c0e18 !important;\n'
    '        border: none !important;\n'
    '        box-shadow: none !important;\n'
    '        border-radius: 0 !important;\n'
    '      }\n'
    '      section.hero-print .cover-border { inset: 7mm; }\n'
    '      section.hero-print .cover-content { padding: 18mm 22mm !important; }\n'
    '      .hero-right { display: none !important; }'
)
# Also handle legacy print rule patterns
for old in [
    old_print,
    ('      /* Hero: anula a altura de viewport (era min-height:100vh inline) */\n'
     '      section.hero-print { min-height: 0 !important; padding: 30px 34px !important; }\n'
     '      .hero-right { display: none !important; }'),
]:
    if old in html:
        html = html.replace(old,
            '      /* Capa: landscape, dark, full-height */\n'
            '      section.hero-print {\n'
            '        page: landscape-page;\n'
            '        min-height: 182mm !important;\n'
            '        padding: 0 !important;\n'
            '        background: #0c0e18 !important;\n'
            '        background-image: radial-gradient(ellipse 80% 80% at -5% -5%, rgba(127,151,247,0.22) 0%, transparent 55%) !important;\n'
            '        border: none !important;\n'
            '        box-shadow: none !important;\n'
            '        border-radius: 0 !important;\n'
            '        print-color-adjust: exact;\n'
            '        -webkit-print-color-adjust: exact;\n'
            '      }\n'
            '      section.hero-print .cover-border { inset: 7mm; }\n'
            '      section.hero-print .cover-content { padding: 16mm 20mm !important; }\n'
            '      .hero-right { display: none !important; }'
        )

f.write_text(html, encoding='utf-8')
print('COVER OK')
