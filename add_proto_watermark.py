from pathlib import Path
import base64, re

f = Path('proposta_in9_pdf_branco.html')
html = f.read_text(encoding='utf-8')

# ── Logo base64 (fundo transparente) ─────────────────────────────────────────
logo_b64 = base64.b64encode(
    Path(r'G:\Meu Drive\NATHAN\Projetos\Fieb\Index\logo\Logo.png').read_bytes()
).decode()
logo_uri = f'data:image/png;base64,{logo_b64}'

wm_img = f'<img class="proto-wm" src="{logo_uri}" alt="">'

# ── 1. Adicionar position: relative ao .proto-card ───────────────────────────
html = html.replace(
    '    .proto-card {\n      display: flex;\n      flex-direction: column;\n      gap: 6px;\n    }',
    '    .proto-card {\n      position: relative;\n      display: flex;\n      flex-direction: column;\n      gap: 6px;\n    }'
)

# ── 2. CSS para a marca d'água ────────────────────────────────────────────────
wm_css = """
    .proto-wm {
      position: absolute;
      bottom: 10px;
      right: 12px;
      height: 22px;
      width: auto;
      opacity: 0.28;
      pointer-events: none;
      filter: invert(1) brightness(2);
      z-index: 2;
    }

"""
html = html.replace('  </style>', wm_css + '  </style>', 1)

# ── 3. Injetar <img class="proto-wm"> dentro de cada proto-card ──────────────
# Cada proto-card tem exatamente um <img> (a foto). Inserir após esse img.
count = 0
search_from = 0
while True:
    card_start = html.find('<div class="proto-card">', search_from)
    if card_start == -1:
        break
    # Fim do <img ...> dentro deste card: procurar '>' após o src de imagem
    img_start = html.find('<img ', card_start)
    img_end   = html.find('>', img_start) + 1
    html = html[:img_end] + '\n          ' + wm_img + html[img_end:]
    search_from = img_end + len(wm_img) + 20
    count += 1

f.write_text(html, encoding='utf-8')
print(f'WATERMARK OK — {count} imagens atualizadas')
