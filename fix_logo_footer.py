from pathlib import Path
import re

f = Path('proposta_in9_pdf_branco.html')
html = f.read_text(encoding='utf-8')

# ── 1. Remover CSS #wm-logo global ───────────────────────────────────────────
html = re.sub(r'\n    #wm-logo \{ display: none !important; \}\n', '\n', html)

# ── 2. Remover CSS .page-logo-wm e position: relative das sections ───────────
old_css = """
      /* Logo marca-d’água: injetada por JS em cada seção (exceto capa) */
      .page-logo-wm {
        display: block !important;
        position: absolute;
        bottom: 10mm;
        left: 14mm;
        height: 24px;
        width: auto;
        opacity: 0.70;
        z-index: 50;
        pointer-events: none;
      }
      section, footer#contato { position: relative !important; }

"""
html = html.replace(old_css, '\n')

# ── 3. Remover <img id="wm-logo" ...> do body ────────────────────────────────
html = re.sub(r'\n<img id="wm-logo"[^>]+>\n', '\n', html)

# ── 4. Remover <script> de injeção ───────────────────────────────────────────
html = re.sub(r'\n<script>\n\(function \(\)[^<]+</script>\n', '\n', html, flags=re.DOTALL)

# ── 5. Adicionar @page :first para suprimir footer na capa ───────────────────
first_page_css = """
      @page :first { margin-bottom: 0 !important; }

"""
html = html.replace('  </style>', first_page_css + '  </style>', 1)

f.write_text(html, encoding='utf-8')
print('HTML LIMPO OK')
