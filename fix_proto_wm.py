from pathlib import Path
import re

f = Path('proposta_in9_pdf_branco.html')
html = f.read_text(encoding='utf-8')

# ── 1. Remover position: relative do .proto-card ─────────────────────────────
html = html.replace(
    '    .proto-card {\n      position: relative;\n      display: flex;\n      flex-direction: column;\n      gap: 6px;\n    }',
    '    .proto-card {\n      display: flex;\n      flex-direction: column;\n      gap: 6px;\n    }'
)

# ── 2. Atualizar CSS: proto-img-wrap position relative ───────────────────────
old_wm_css = """
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
new_wm_css = """
    .proto-img-wrap {
      position: relative;
      display: block;
      line-height: 0;
    }
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
html = html.replace(old_wm_css, new_wm_css)

# ── 3. Mover proto-wm para dentro de um wrapper ao redor da img principal ────
# Padrão atual: <img src="data:image/jpeg..."> \n <img class="proto-wm"...>
# Novo: <div class="proto-img-wrap"><img src="..."><img class="proto-wm"...></div>
count = 0
search_from = 0
while True:
    card_start = html.find('<div class="proto-card">', search_from)
    if card_start == -1:
        break

    img_start = html.find('<img ', card_start)
    img_end   = html.find('>', img_start) + 1

    wm_start  = html.find('<img class="proto-wm"', img_end)
    wm_end    = html.find('>', wm_start) + 1

    # Extrair as duas imgs
    img_tag = html[img_start:img_end]
    wm_tag  = html[wm_start:wm_end]

    # Montar wrapper
    wrapped = (
        '          <div class="proto-img-wrap">\n'
        f'            {img_tag}\n'
        f'            {wm_tag}\n'
        '          </div>'
    )

    # Substituir o trecho original (img + espaço + wm)
    old_chunk = html[img_start:wm_end]
    html = html[:img_start] + wrapped + html[wm_end:]

    search_from = img_start + len(wrapped) + 10
    count += 1

f.write_text(html, encoding='utf-8')
print(f'FIX OK — {count} wrappers criados')
