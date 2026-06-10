from pathlib import Path
import base64, re

f = Path('proposta_in9_pdf_branco.html')
html = f.read_text(encoding='utf-8')

# ── Logo INDEX base64 (fundo branco, invertida para fundo escuro) ─────────────
logo_b64 = base64.b64encode(
    Path(r'G:\Meu Drive\NATHAN\Projetos\Fieb\Index\logo\Logo.png').read_bytes()
).decode()
logo_uri = f'data:image/png;base64,{logo_b64}'

# ── Novo SVG: planta de feira com circuit traces ──────────────────────────────
def make_floor_plan():
    # Paleta
    N = 'rgba(127,151,247,0.07)'    # normal fill
    NS= 'rgba(255,255,255,0.11)'    # normal stroke
    B = 'rgba(127,151,247,0.24)'    # sold (blue)
    BS= 'rgba(127,151,247,0.75)'    # sold stroke
    G = 'rgba(70,210,154,0.20)'     # active (green)
    GS= 'rgba(70,210,154,0.72)'     # active stroke

    # Stands definidos como (x, y, w, h, fill, stroke, label)
    # Usar coordenadas absolutas para layout orgânico de feira
    stands = [
        # ── Zona A (topo esquerda) ─────────────────
        (  8, 10, 44, 38, N, NS, 'A01'),
        ( 58, 10, 44, 38, N, NS, 'A02'),
        (108, 10, 28, 38, B, BS, 'A03'),
        (142, 10, 28, 38, N, NS, 'A04'),
        (176, 10, 44, 38, N, NS, 'A05'),
        (226, 10, 28, 38, N, NS, 'A06'),
        (260, 10, 44, 38, B, BS, 'A07'),
        (310, 10, 44, 38, N, NS, 'A08'),
        (360, 10, 28, 38, N, NS, 'A09'),
        (394, 10, 60, 38, G, GS, 'A10'),  # grande ativo

        # ── Zona B (topo direita) ──────────────────
        (  8, 54, 28, 58, N, NS, 'B01'),
        ( 42, 54, 60, 28, G, GS, 'B02'),  # largo ativo
        ( 42, 88, 60, 24, N, NS, 'B03'),
        (108, 54, 44, 58, B, BS, 'B04'),  # tall sold
        (158, 54, 28, 28, N, NS, 'B05'),
        (192, 54, 44, 28, N, NS, 'B06'),
        (158, 88, 78, 24, N, NS, 'B07'),
        (242, 54, 28, 58, N, NS, 'B08'),
        (276, 54, 60, 28, B, BS, 'B09'),
        (276, 88, 60, 24, N, NS, 'B10'),
        (342, 54, 44, 28, N, NS, 'B11'),
        (342, 88, 44, 24, G, GS, 'B12'),  # ativo
        (392, 54, 62, 58, N, NS, 'B13'),  # grande

        # ── Corredor (espaço implícito entre 118 e 128) ─────
        # linha horizontal sutil já vai separar

        # ── Zona C (baixo) ────────────────────────────────
        (  8,128, 60, 34, N, NS, 'C01'),
        ( 74,128, 28, 34, B, BS, 'C02'),
        (108,128, 44, 34, N, NS, 'C03'),
        (158,128, 44, 34, N, NS, 'C04'),
        (208,128, 28, 34, N, NS, 'C05'),
        (242,128, 60, 34, G, GS, 'C06'),  # largo ativo
        (308,128, 28, 34, N, NS, 'C07'),
        (342,128, 44, 34, B, BS, 'C08'),
        (392,128, 62, 34, N, NS, 'C09'),

        # ── Zona D (baixo extra) ──────────────────────────
        (  8,168, 44, 30, N, NS, 'D01'),
        ( 58,168, 44, 30, N, NS, 'D02'),
        (108,168, 76, 30, B, BS, 'D03'),  # muito largo, sold
        (190,168, 44, 30, N, NS, 'D04'),
        (240,168, 28, 30, N, NS, 'D05'),
        (274,168, 44, 30, G, GS, 'D06'),
        (324,168, 44, 30, N, NS, 'D07'),
        (374,168, 80, 30, N, NS, 'D08'),  # grande
    ]

    # Nodes de circuit nos stands destacados
    highlighted = [(s[0],s[1],s[2],s[3],s[5]) for s in stands if s[5] in (BS, GS)]

    # Traces de circuit entre stands próximos destacados
    traces = []
    for i, s in enumerate(highlighted):
        x1 = s[0]+s[2]//2; y1 = s[1]+s[3]//2
        for j, s2 in enumerate(highlighted):
            if j <= i: continue
            x2 = s2[0]+s2[2]//2; y2 = s2[1]+s2[3]//2
            dist = ((x2-x1)**2 + (y2-y1)**2)**0.5
            if dist < 120:
                # L-shaped trace
                mx = x1
                traces.append((x1, y1, mx, y2, x2, y2, s[4]))

    # SVG
    VW, VH = 460, 210
    rect_els = []
    for (x, y, w, h, fi, st, lbl) in stands:
        sw = 1.8 if fi != N else 1.0
        rect_els.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" '
            f'fill="{fi}" stroke="{st}" stroke-width="{sw}"/>'
        )
        # Label inside stand
        lbl_color = 'rgba(127,151,247,0.7)' if fi == B else ('rgba(70,210,154,0.7)' if fi == G else 'rgba(255,255,255,0.18)')
        rect_els.append(
            f'<text x="{x+w//2}" y="{y+h//2+4}" text-anchor="middle" '
            f'font-family="monospace" font-size="7" fill="{lbl_color}" '
            f'letter-spacing="0.06em">{lbl}</text>'
        )

    # Corredor line
    rect_els.append('<line x1="0" y1="118" x2="460" y2="118" stroke="rgba(255,255,255,0.05)" stroke-width="8"/>')
    rect_els.append('<line x1="0" y1="122" x2="460" y2="122" stroke="rgba(255,255,255,0.03)" stroke-width="1" stroke-dasharray="4,6"/>')

    # Circuit traces
    trace_els = []
    for (x1, y1, mx, my, x2, y2, col) in traces:
        c = 'rgba(127,151,247,0.35)' if col == BS else 'rgba(70,210,154,0.32)'
        trace_els.append(
            f'<polyline points="{x1},{y1} {mx},{my} {x2},{y2}" '
            f'fill="none" stroke="{c}" stroke-width="0.8" stroke-dasharray="3,3"/>'
        )
        # node dots
        for (nx, ny) in [(x1,y1),(x2,y2)]:
            dc = 'rgba(127,151,247,0.8)' if col == BS else 'rgba(70,210,154,0.8)'
            trace_els.append(f'<circle cx="{nx}" cy="{ny}" r="2" fill="{dc}" opacity="0.6"/>')

    # Scan-line overlay (tech aesthetic)
    scan_els = []
    for yy in range(0, VH, 6):
        scan_els.append(f'<line x1="0" y1="{yy}" x2="{VW}" y2="{yy}" stroke="rgba(127,151,247,0.025)" stroke-width="0.5"/>')

    rects_str   = '\n    '.join(rect_els)
    traces_str  = '\n    '.join(trace_els)
    scans_str   = '\n    '.join(scan_els)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;">
  <defs>
    <linearGradient id="mapFade2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="black" stop-opacity="1"/>
      <stop offset="28%"  stop-color="black" stop-opacity="0.9"/>
      <stop offset="55%"  stop-color="white" stop-opacity="1"/>
      <stop offset="100%" stop-color="white" stop-opacity="1"/>
    </linearGradient>
    <mask id="mapMask2">
      <rect width="{VW}" height="{VH}" fill="url(#mapFade2)"/>
    </mask>
  </defs>
  <!-- Scan lines (tech) -->
  <g mask="url(#mapMask2)" opacity="0.6">
    {scans_str}
  </g>
  <!-- Stands -->
  <g mask="url(#mapMask2)">
    {rects_str}
  </g>
  <!-- Circuit traces -->
  <g mask="url(#mapMask2)">
    {traces_str}
  </g>
</svg>'''

new_map_svg = make_floor_plan()

# ── Substituir SVG do mapa no HTML ────────────────────────────────────────────
# Localizar o bloco <div class="cover-map-wrap"> ... </div>
start_m = html.find('<div class="cover-map-wrap">')
end_m   = html.find('</div>', start_m) + len('</div>')
assert start_m != -1

new_map_block = f'<div class="cover-map-wrap">\n    {new_map_svg}\n  </div>'
html = html[:start_m] + new_map_block + html[end_m:]

# ── Usar Logo.png maior na área da marca (top-left) ───────────────────────────
# A logo INDEX vai ser a imagem principal, removendo o SVG in9 que criamos
# E adicionamos a logo como img maior
# Substituir o bloco cover-brand
old_brand_start = html.find('<div class="cover-brand">')
old_brand_end   = html.find('</div>', html.find('</div>', html.find('</div>', old_brand_start) + 1) + 1) + len('</div>')

# Rebuild brand block with actual logo image (bigger)
new_brand = f'''<div class="cover-brand">
        <img class="cover-logo-img" src="{logo_uri}" alt="INDEX Bahia">
        <div class="cover-brand-text">
          <span class="cover-brand-name">In9 Tecnologia</span>
          <span class="cover-brand-sub">PLATAFORMAS SOB MEDIDA</span>
        </div>
      </div>'''
html = html[:old_brand_start] + new_brand + html[old_brand_end:]

# ── Remover a cover-index-logo separada (logo duplicada) ─────────────────────
html = re.sub(
    r'\s*<img class="cover-index-logo"[^>]+>',
    '',
    html
)

# ── Atualizar CSS: cover-in9 não precisa mais, adicionar cover-logo-img ───────
html = html.replace(
    '    .cover-in9 {\n'
    '      width: 40px; height: 40px;\n'
    '      background: #10121f;\n'
    '      border: 1.5px solid #a78bfa;\n'
    '      border-radius: 22%;\n'
    '      display: flex; align-items: center; justify-content: center;\n'
    '      font-family: \'JetBrains Mono\', monospace;\n'
    '      font-size: 13px; font-weight: 500;\n'
    '      color: #a78bfa;\n'
    '      letter-spacing: -0.02em;\n'
    '      box-shadow: 0 0 10px rgba(167,139,250,0.25);\n'
    '      flex-shrink: 0;\n'
    '    }',
    '    .cover-logo-img {\n'
    '      height: 52px; width: auto;\n'
    '      filter: brightness(0) invert(1);\n'
    '      opacity: 0.92;\n'
    '      flex-shrink: 0;\n'
    '    }'
)

# ── cover-index-logo CSS pode ser removido ─────────────────────────────────────
html = html.replace(
    '    .cover-index-logo { height: 26px; width: auto; opacity: 0.5; filter: brightness(0) invert(1); }',
    ''
)

f.write_text(html, encoding='utf-8')
print('COVER2 OK')
