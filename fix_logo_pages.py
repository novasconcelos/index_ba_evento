from pathlib import Path
import re

f = Path('proposta_in9_pdf_branco.html')
html = f.read_text(encoding='utf-8')

# ── 1. Remover CSS global #wm-logo ───────────────────────────────────────────
html = html.replace('\n    #wm-logo { display: none; }\n\n', '\n')

# ── 2. Remover CSS print do wm-logo e cover-logo-mask ────────────────────────
old_css = """
      /* Watermark logo: todas as páginas em print */
      #wm-logo {
        display: block !important;
        position: fixed;
        bottom: 8mm;
        left: 14mm;
        height: 26px;
        width: auto;
        opacity: 0.75;
        z-index: 100;
      }
      /* Mascarar logo na capa (cover tem fundo escuro + logo própria) */
      .cover-logo-mask {
       .cover-logo-mask {
        position: absolute;
        bottom: 5mm;
        left: 10mm;
        width: 100px;
        height: 44px;
        background: #0c0e18;
        z-index: 200;
        pointer-events: none;
      }

"""
html = html.replace(old_css, '\n')

# ── 3. Remover div cover-logo-mask da hero-print ─────────────────────────────
html = html.replace('  <div class="cover-logo-mask"></div>\n\n</section>\n\n<hr',
                    '\n</section>\n\n<hr')

# ── 4. Manter <img id="wm-logo"> oculto (apenas para o JS ler o src) ─────────
# Adicionar CSS para ocultá-lo
hide_css = '    #wm-logo { display: none !important; }\n'
html = html.replace('  </style>', hide_css + '  </style>', 1)

# ── 5. CSS print para .page-logo-wm ──────────────────────────────────────────
logo_print_css = """
      /* Logo marca-d'água: injetada por JS em cada seção (exceto capa) */
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
html = html.replace('  </style>', logo_print_css + '  </style>', 1)

# ── 6. Adicionar <script> de injeção no final do body ───────────────────────
inject_script = """
<script>
(function () {
  var src = document.getElementById('wm-logo').src;
  var targets = document.querySelectorAll(
    'section:not(.hero-print), footer#contato'
  );
  targets.forEach(function (el) {
    var img = document.createElement('img');
    img.src = src;
    img.className = 'page-logo-wm';
    el.appendChild(img);
  });
})();
</script>
"""

html = html.replace('\n</body>', inject_script + '\n</body>', 1)

f.write_text(html, encoding='utf-8')
print('LOGO PAGES OK')
