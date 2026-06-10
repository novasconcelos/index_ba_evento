from pathlib import Path
import base64

f = Path('proposta_in9_pdf_branco.html')
html = f.read_text(encoding='utf-8')

# ── Logo base64 ───────────────────────────────────────────────────────────────
logo_path = Path(r'G:\Meu Drive\NATHAN\Projetos\Fieb\Index\logo\Logo fundo branco.png')
logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
logo_uri = f'data:image/png;base64,{logo_b64}'

# ── 1. Inserir <img> watermark no body (antes de </body>) ─────────────────────
watermark_img = f'\n<img id="wm-logo" src="{logo_uri}" alt="In9">\n'
html = html.replace('\n</body>', watermark_img + '</body>', 1)

# ── 2. CSS global: oculto em tela ─────────────────────────────────────────────
css_global = """
    #wm-logo { display: none; }

"""
# Inserir antes de </style>
html = html.replace('  </style>', css_global + '  </style>', 1)

# ── 3. CSS print: fixed bottom-left em todas as páginas ──────────────────────
css_print = """
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
html = html.replace('  </style>', css_print + '  </style>', 1)

# ── 4. Adicionar div mascarador dentro da section.hero-print ─────────────────
# Inserir antes do </section> da capa
hero_close_search = '</div>\n\n  <div class="cover-border"></div>\n</section>'
hero_close_replace = '</div>\n\n  <div class="cover-border"></div>\n  <div class="cover-logo-mask"></div>\n</section>'

if hero_close_search in html:
    html = html.replace(hero_close_search, hero_close_replace, 1)
    print('mask div adicionado')
else:
    # fallback: buscar cover-border + </section>
    import re
    m = re.search(r'(<div class="cover-border"></div>\n)(</section>)', html)
    if m:
        html = html[:m.start(2)] + '  <div class="cover-logo-mask"></div>\n' + html[m.start(2):]
        print('mask div adicionado (fallback)')
    else:
        print('AVISO: cover-border + </section> não encontrado')

f.write_text(html, encoding='utf-8')
print('WATERMARK OK')
