# -*- coding: utf-8 -*-
"""
Gerador da Proposta Comercial — INDEX Bahia.
Converte proposta_in9_pdf_branco.html → PDF via Playwright (Chromium headless).
Saída: C:/Users/natha/Downloads/Proposta-INDEX-Bahia.pdf
"""
import base64
import pathlib
from playwright.sync_api import sync_playwright

HTML_FILE = pathlib.Path(__file__).parent / "proposta_in9_pdf_branco.html"
OUTPUT = r"C:\Users\natha\Downloads\Proposta INDEX Bahia - In9 tecnologia.pdf"

LOGO_PATH = pathlib.Path(r"G:\Meu Drive\NATHAN\Projetos\Fieb\Index\logo\Logo fundo branco.png")


def gerar():
    logo_b64 = base64.b64encode(LOGO_PATH.read_bytes()).decode()
    logo_uri = f"data:image/png;base64,{logo_b64}"

    footer_template = f"""
    <div style="
        display: flex;
        align-items: center;
        width: 100%;
        padding: 0 14mm;
        box-sizing: border-box;
        height: 100%;
    ">
        <img src="{logo_uri}"
             style="height: 20px; width: auto; opacity: 0.65; display: block;">
    </div>
    """

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        page.goto(HTML_FILE.as_uri(), wait_until="networkidle")

        page.pdf(
            path=OUTPUT,
            format="A4",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "12mm", "left": "0"},
            display_header_footer=True,
            header_template="<span></span>",
            footer_template=footer_template,
        )

        browser.close()
    print(f"OK -> {OUTPUT}")


if __name__ == "__main__":
    gerar()
