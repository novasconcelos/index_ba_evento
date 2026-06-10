from pathlib import Path

f = Path('proposta_in9_pdf_branco.html')
html = f.read_text(encoding='utf-8')

# ── 1. Adicionar #quem-somos ao seletor landscape ─────────────────────────────
old_sel = """      #visao-geral,
      #frentes,
      #o-que-muda,
      #etapas,
      #suporte,
      #prototipos {
        page: landscape-page;
      }"""

new_sel = """      #visao-geral,
      #frentes,
      #o-que-muda,
      #etapas,
      #suporte,
      #prototipos,
      #quem-somos {
        page: landscape-page;
      }"""

assert old_sel in html, 'seletor landscape não encontrado'
html = html.replace(old_sel, new_sel)

# ── 2. Adicionar CSS print para #quem-somos ───────────────────────────────────
# Inserir logo antes do fechamento do @media print
# Achar um trecho estável perto do fim do @media print
anchor = '  </style>'
assert anchor in html, 'anchor </style> não encontrado'

contact_print_css = """
      /* Contatos: landscape, centralizado, bordado */
      #quem-somos {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 182mm !important;
        padding: 0 !important;
      }
      #quem-somos .wrap {
        width: 100% !important;
        max-width: 240mm !important;
        padding: 14mm 0 !important;
      }
      #quem-somos .contact-border {
        position: absolute !important;
        inset: 7mm !important;
        border: 1.5px solid rgba(127,151,247,0.35) !important;
        border-radius: 6px !important;
        pointer-events: none !important;
        z-index: 3 !important;
      }

"""

html = html.replace(anchor, contact_print_css + anchor, 1)

# ── 3. Adicionar .contact-border div na seção #quem-somos ────────────────────
old_close = '</div>\n</section>\n\n<script'
# find it after quem-somos
qs_idx = html.find('id="quem-somos"')
close_idx = html.find('</section>', qs_idx)
section_end = html[close_idx:close_idx + len('</section>')]

old_block = html[close_idx:close_idx + len('</section>')]
new_block = '\n  <div class="contact-border"></div>\n</section>'

html = html[:close_idx] + new_block + html[close_idx + len('</section>'):]

f.write_text(html, encoding='utf-8')
print('CONTATOS OK')
