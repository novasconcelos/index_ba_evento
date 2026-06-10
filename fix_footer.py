from pathlib import Path, re
import re

f = Path('proposta_in9_pdf_branco.html')
html = f.read_text(encoding='utf-8')

# ── 1. Reverter #quem-somos: remover do seletor landscape ────────────────────
html = html.replace(
    """      #visao-geral,
      #frentes,
      #o-que-muda,
      #etapas,
      #suporte,
      #prototipos,
      #quem-somos {
        page: landscape-page;
      }""",
    """      #visao-geral,
      #frentes,
      #o-que-muda,
      #etapas,
      #suporte,
      #prototipos {
        page: landscape-page;
      }"""
)

# ── 2. Reverter #quem-somos: remover div contact-border da seção ──────────────
html = html.replace(
    '\n  <div class="contact-border"></div>\n</section>\n\n<hr',
    '\n</section>\n\n<hr'
)

# ── 3. Reverter #quem-somos: remover CSS print adicionado ────────────────────
css_block = """
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
html = html.replace(css_block, '')

# ── 4. Adicionar #contato ao seletor landscape ───────────────────────────────
html = html.replace(
    """      #visao-geral,
      #frentes,
      #o-que-muda,
      #etapas,
      #suporte,
      #prototipos {
        page: landscape-page;
      }""",
    """      #visao-geral,
      #frentes,
      #o-que-muda,
      #etapas,
      #suporte,
      #prototipos,
      #contato {
        page: landscape-page;
      }"""
)

# ── 5. CSS print para footer #contato ────────────────────────────────────────
footer_print_css = """
      /* Footer: landscape, centralizado, bordado */
      #contato {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 182mm !important;
        padding: 0 !important;
        break-before: page !important;
      }
      #contato .wrap {
        width: 100% !important;
        max-width: 230mm !important;
        padding: 0 !important;
      }
      #contato .footer-border {
        position: absolute !important;
        inset: 7mm !important;
        border: 1.5px solid rgba(127,151,247,0.35) !important;
        border-radius: 6px !important;
        pointer-events: none !important;
        z-index: 3 !important;
      }

"""
html = html.replace('  </style>', footer_print_css + '  </style>', 1)

# ── 6. Adicionar div footer-border + centralizar footer-grid ─────────────────
# Trocar footer-right text-align e adicionar centralização ao footer-grid
# Adicionar footer-border div antes do </footer>
old_footer_close = '</footer>\n\n</body>'
new_footer_close = '  <div class="footer-border"></div>\n</footer>\n\n</body>'
assert old_footer_close in html, 'footer close não encontrado'
html = html.replace(old_footer_close, new_footer_close, 1)

# Centralizar o footer-grid via CSS global
footer_grid_old = '    .footer-grid {'
idx = html.find(footer_grid_old)
end = html.find('}', idx) + 1
old_rule = html[idx:end]
new_rule = old_rule.replace(
    'align-items: end;',
    'align-items: center;\n      justify-content: center;\n      text-align: center;'
)
html = html.replace(old_rule, new_rule, 1)

# Footer-right: centralizar texto
html = html.replace(
    '    .footer-right { text-align: right; }',
    '    .footer-right { text-align: center; }'
)

f.write_text(html, encoding='utf-8')
print('FOOTER OK')
