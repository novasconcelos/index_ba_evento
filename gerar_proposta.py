# -*- coding: utf-8 -*-
"""
Gerador da Proposta Comercial — INDEX Bahia (versão por etapas).
Saída: C:/Users/natha/Downloads/Proposta-INDEX-Bahia.pdf
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Image, Flowable,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas as pdfcanvas
from datetime import date

# ---------- paleta INDEX ----------
NAVY = colors.HexColor("#2d2a8c")
NAVY_DARK = colors.HexColor("#1b1568")
LIME = colors.HexColor("#c6e84d")
TEAL = colors.HexColor("#0ea5e9")
GRAY_50 = colors.HexColor("#f8fafc")
GRAY_100 = colors.HexColor("#f1f5f9")
GRAY_200 = colors.HexColor("#e2e8f0")
GRAY_500 = colors.HexColor("#64748b")
GRAY_700 = colors.HexColor("#334155")
GRAY_900 = colors.HexColor("#0f172a")
GREEN = colors.HexColor("#16a34a")
AMBER = colors.HexColor("#f59e0b")
RED = colors.HexColor("#ef4444")

OUTPUT = r"C:\Users\natha\Downloads\Proposta-INDEX-Bahia.pdf"

# ---------- header/footer ----------
def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    # rodapé
    canvas.setFillColor(GRAY_500)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(2 * cm, 1.2 * cm, "Proposta Comercial — INDEX Bahia · [SUA EMPRESA]")
    canvas.drawRightString(w - 2 * cm, 1.2 * cm, f"Página {doc.page}")
    # linha topo
    canvas.setStrokeColor(NAVY)
    canvas.setLineWidth(0.6)
    canvas.line(2 * cm, h - 1.6 * cm, w - 2 * cm, h - 1.6 * cm)
    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(2 * cm, h - 1.3 * cm, "[SUA EMPRESA]")
    canvas.setFillColor(GRAY_500)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 2 * cm, h - 1.3 * cm, "Proposta para INDEX Bahia · 2026")
    canvas.restoreState()


# ---------- estilos ----------
styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
                    fontSize=20, leading=24, textColor=NAVY, spaceBefore=4, spaceAfter=10)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                    fontSize=14, leading=18, textColor=NAVY_DARK, spaceBefore=14, spaceAfter=6)
H3 = ParagraphStyle("H3", parent=styles["Heading3"], fontName="Helvetica-Bold",
                    fontSize=11, leading=14, textColor=NAVY, spaceBefore=8, spaceAfter=3)
BODY = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica",
                      fontSize=10, leading=14, textColor=GRAY_900,
                      alignment=TA_JUSTIFY, spaceAfter=6)
BODY_S = ParagraphStyle("BodyS", parent=BODY, fontSize=9, leading=12, textColor=GRAY_700)
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=14, bulletIndent=2,
                        spaceAfter=2)
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=8, leading=10, textColor=GRAY_500)
COVER_TITLE = ParagraphStyle("CT", fontName="Helvetica-Bold", fontSize=34, leading=38,
                             textColor=colors.white, alignment=TA_LEFT)
COVER_SUB = ParagraphStyle("CS", fontName="Helvetica", fontSize=14, leading=18,
                           textColor=LIME, alignment=TA_LEFT)
COVER_META = ParagraphStyle("CM", fontName="Helvetica", fontSize=10, leading=14,
                            textColor=colors.white, alignment=TA_LEFT)
QUOTE = ParagraphStyle("Quote", parent=BODY, fontSize=11, leading=16, textColor=NAVY_DARK,
                       leftIndent=12, rightIndent=12, spaceBefore=6, spaceAfter=10,
                       italic=True)


# ---------- helpers ----------
def b(text):
    return Paragraph(text, BODY)

def bs(text):
    return Paragraph(text, BODY_S)

def bullet(text):
    return Paragraph(f"• {text}", BULLET)

def section_table(rows, col_widths, header_bg=NAVY, header_fg=colors.white,
                  zebra=True, body_font=9):
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, 0), header_fg),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9),
        ("FONT", (0, 1), (-1, -1), "Helvetica", body_font),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.4, GRAY_200),
    ]
    if zebra:
        for r in range(1, len(rows)):
            if r % 2 == 0:
                style.append(("BACKGROUND", (0, r), (-1, r), GRAY_50))
    t.setStyle(TableStyle(style))
    return t


class ColorBlock(Flowable):
    """Bloco colorido com título e texto — usado nos destaques."""
    def __init__(self, title, text, width, color=NAVY, accent=LIME):
        super().__init__()
        self.title = title
        self.text = text
        self.width = width
        self.color = color
        self.accent = accent
        self.height = 1.6 * cm

    def draw(self):
        c = self.canv
        c.setFillColor(self.color)
        c.roundRect(0, 0, self.width, self.height, 6, stroke=0, fill=1)
        c.setFillColor(self.accent)
        c.rect(0, 0, 4, self.height, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(14, self.height - 14, self.title)
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#e0e7ff"))
        c.drawString(14, self.height - 30, self.text)


# ---------- conteúdo ----------
doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=2 * cm, bottomMargin=1.8 * cm,
    title="Proposta INDEX Bahia",
    author="[SUA EMPRESA]",
)

story = []

# =============== CAPA (desenhada via onFirstPage no canvas) ===============
def draw_cover(c, _doc):
    w, h = A4
    c.saveState()
    # fundo navy ocupa página inteira
    c.setFillColor(NAVY_DARK)
    c.rect(0, 0, w, h, stroke=0, fill=1)
    # faixa lime decorativa lateral
    c.setFillColor(LIME)
    c.rect(0, h - 4.5 * cm, 2.8 * cm, 0.55 * cm, stroke=0, fill=1)
    # tagline
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2 * cm, h - 4.2 * cm, "PROPOSTA COMERCIAL")
    # título principal
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 36)
    c.drawString(2 * cm, h - 7 * cm, "Plataforma de stands")
    c.drawString(2 * cm, h - 8.2 * cm, "para o INDEX Bahia")
    # subtítulo
    c.setFillColor(LIME)
    c.setFont("Helvetica", 13)
    c.drawString(2 * cm, h - 9.5 * cm,
                 "Entrega em etapas · Sob medida · Cliente dono do código")
    # bloco do cliente
    c.setFillColor(NAVY)
    c.roundRect(2 * cm, h - 16 * cm, 11 * cm, 4 * cm, 10, stroke=0, fill=1)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(2.6 * cm, h - 12.7 * cm, "CLIENTE")
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(2.6 * cm, h - 13.5 * cm, "INDEX Bahia")
    c.setFillColor(colors.HexColor("#cbd5ff"))
    c.setFont("Helvetica", 10)
    c.drawString(2.6 * cm, h - 14.2 * cm,
                 "FIEB / SEBRAE — Centro de Convenções de Salvador")
    c.drawString(2.6 * cm, h - 14.8 * cm,
                 "INDEX 2027 · 5–7 de maio de 2027")
    # bloco proponente
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(2 * cm, h - 18.5 * cm, "PROPONENTE")
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(2 * cm, h - 19.3 * cm, "[SUA EMPRESA]")
    c.setFillColor(colors.HexColor("#cbd5ff"))
    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, h - 19.9 * cm,
                 "[SEU NOME] · [seu@email.com] · [(71) 90000-0000]")
    # data
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(2 * cm, h - 22 * cm, "DATA")
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 11)
    c.drawString(2 * cm, h - 22.7 * cm, date.today().strftime("%d/%m/%Y"))
    # rodapé pequeno
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Helvetica", 8)
    c.drawString(2 * cm, 1.2 * cm,
                 "Documento confidencial — para uso exclusivo do INDEX Bahia.")
    c.restoreState()


# Página 1 ficará só com a capa (desenhada pelo callback onFirstPage).
story.append(PageBreak())

# =============== SUMÁRIO EXECUTIVO ===============
story.append(Paragraph("Sumário executivo", H1))
story.append(Paragraph(
    "Esta proposta apresenta uma plataforma <b>sob medida</b> para a operação de vendas de stands "
    "do <b>INDEX Bahia</b>, entregue em <b>quatro etapas evolutivas</b>. O modelo permite que o "
    "INDEX comece a vender stands online em cerca de <b>30 dias</b> e só avance para as próximas "
    "etapas conforme constatar o retorno de cada uma delas.", BODY))

story.append(Paragraph("Visão resumida das etapas:", H3))

rows_resumo = [
    ["Etapa", "O que entrega", "Prazo", "Investimento"],
    ["1 — MVP", "Vendas de stand online + painel de gestão completo", "4–6 semanas", "R$ 32.000"],
    ["2 — Pagamento", "Cobrança online (Pix/Boleto/Cartão) + assinatura digital de contratos", "3–4 semanas", "R$ 22.000"],
    ["3 — App mobile", "Aplicativo para visitantes e expositores (opcional)", "6–8 semanas", "R$ 48.000"],
    ["4 — Operação", "Credenciamento, controle de acesso e gestão no dia do evento (opcional)", "8–10 semanas", "R$ 65.000"],
]
story.append(section_table(rows_resumo, [2.2 * cm, 8.5 * cm, 2.8 * cm, 3.2 * cm]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>Etapas 1 + 2 juntas:</b> R$ 54.000, cobrindo o ciclo comercial completo — do primeiro "
    "contato do expositor até o pagamento confirmado. As Etapas 3 e 4 são <b>opcionais</b> e "
    "contratáveis separadamente.", BODY_S))

story.append(Paragraph(
    "A plataforma carrega a identidade visual do INDEX, as regras específicas de captação "
    "(FIEB / SEBRAE / Bahia Eventos), a tipologia de stands (ASA A/B/Foyer · Estande/Piso) e "
    "o mapa interativo real do evento. Ao final do projeto, <b>o código-fonte pertence ao "
    "INDEX</b> — sem licença anual, sem dependência de fornecedor.", QUOTE))

# =============== ENTENDIMENTO ===============
story.append(Paragraph("1. O que o INDEX Bahia precisa", H1))
story.append(Paragraph(
    "A plataforma precisa cobrir <b>três frentes</b> da operação:", BODY))

story.append(Paragraph("Frente 1 — Comercial / vendas de stands", H3))
story.append(bullet("Mostrar o mapa do evento online para qualquer interessado, com disponibilidade em tempo real."))
story.append(bullet("Capturar contato (e-mail / WhatsApp) de quem ainda não fechou — gerar funil de leads para o time comercial (FIEB, SEBRAE, Bahia Eventos)."))
story.append(bullet("Fechar a reserva, cadastrar a empresa, gerar e enviar o contrato sem papel."))
story.append(bullet("Receber o pagamento online (Pix, boleto, cartão) e dar baixa automática."))

story.append(Paragraph("Frente 2 — Gestão (painel administrativo)", H3))
story.append(bullet("Painel executivo: receita, stands vendidos, leads, conversão, metas."))
story.append(bullet("Editor visual do mapa de stands (arraste e configure áreas sobre a planta do evento)."))
story.append(bullet("Lista de pedidos por etapa do processo (reserva → contrato → pagamento)."))
story.append(bullet("Lista de leads para o time comercial acompanhar e contatar."))
story.append(bullet("Relatório financeiro: receita prevista vs. recebida, inadimplência, fechamento por período."))

story.append(Paragraph("Frente 3 — Operação no dia (futuro, opcional)", H3))
story.append(bullet("Aplicativo para visitantes e expositores encontrarem stands e ver a programação."))
story.append(bullet("Credenciamento por QR Code (código de barras bidimensional lido pela câmera), controle de acesso e totens de autoatendimento."))
story.append(bullet("Operação avançada: documentação legal (ART, ASO, NR), previsão de carga elétrica, controle de veículos."))

story.append(PageBreak())

# =============== VISÃO GERAL DAS ETAPAS ===============
story.append(Paragraph("2. Visão geral — entrega em 4 etapas", H1))
story.append(Paragraph(
    "Cada etapa é uma entrega independente, em produção (no ar, funcionando de verdade), "
    "validada com o INDEX antes da próxima começar. Você só contrata o que faz sentido no momento.", BODY))

rows = [
    ["Etapa", "Escopo", "Prazo", "Investimento"],
    ["1", "MVP — Reservar stand online + painel de gestão completo", "4–6 semanas", "R$ 32.000"],
    ["2", "Pagamento online (Pix/Boleto/Cartão) + assinatura digital", "3–4 semanas", "R$ 22.000"],
    ["3", "Aplicativo mobile do evento (visitantes e expositores)", "6–8 semanas", "R$ 48.000"],
    ["4", "Operação no dia: credenciamento, veículos, documentação legal, energia", "8–10 semanas", "R$ 65.000"],
]
story.append(section_table(rows, [1.2 * cm, 9.5 * cm, 3 * cm, 3 * cm]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>Combinado Etapas 1 + 2:</b> R$ 54.000 — já entrega a operação comercial completa. "
    "Etapas 3 e 4 são opcionais e contratáveis separadamente.", BODY_S))

# =============== ETAPA 1 ===============
story.append(PageBreak())
story.append(Paragraph("3. Etapa 1 — MVP \"Reservar stand online\"", H1))
story.append(Paragraph("Investimento: <b>R$ 32.000</b> · Prazo: <b>4–6 semanas</b> após assinatura", BODY_S))
story.append(Paragraph(
    "Entrega a plataforma básica funcional e no ar: o INDEX consegue <b>vender stand "
    "online no primeiro dia</b>, com captação de leads e administração completa.",
    BODY))

story.append(Paragraph("O que o expositor vê e faz", H3))
story.append(bullet("Site público do evento com a identidade visual INDEX 2027."))
story.append(bullet("<b>Mapa 3D interativo</b> sobre a planta real do evento, com seleção visual de stands."))
story.append(bullet("Filtros por <b>Tipo</b> (Estande / Piso / Tech / Restaurante etc.), <b>ASA</b> (A / B / Foyer) e <b>Localização</b>."))
story.append(bullet("Status do stand em tempo real: disponível, reservado, vendido, patrocínio, bloqueado, cedido."))
story.append(bullet("<b>Captura de lead obrigatória</b> (e-mail + WhatsApp) na primeira seleção — alimenta automaticamente o funil comercial."))
story.append(bullet("Cadastro da empresa expositora (CNPJ, dados de contato, responsável, marca)."))
story.append(bullet("<b>Contrato gerado automaticamente</b> em PDF a partir do modelo do INDEX."))
story.append(bullet("Área do expositor com acesso por senha — ele volta ao sistema para acompanhar o pedido e baixar o contrato."))
story.append(bullet("Link de acompanhamento público (ver o status do pedido sem precisar de login)."))

story.append(Paragraph("O que o admin vê e faz", H3))
story.append(bullet("<b>Painel executivo</b>: receita prevista, stands vendidos, leads captados, taxa de conversão (percentual de leads que fecharam), metas por ASA e segmento."))
story.append(bullet("<b>Editor visual do mapa</b>: arraste e redimensione áreas de stand sobre a imagem da planta; salve a configuração por ASA."))
story.append(bullet("Cadastro completo de stands (código, ASA, tipo, localização, metragem, preço, status)."))
story.append(bullet("Listas configuráveis pelo admin (tipos de estande, ASAs, localizações)."))
story.append(bullet("Lista de <b>pedidos</b> com etapa do processo; abrir um pedido mostra todos os dados do expositor, stands escolhidos, contrato e situação do pagamento."))
story.append(bullet("Lista de <b>leads</b> com status (Novo, Contatado, Convertido) e exportação para planilha do time comercial."))
story.append(bullet("Lista de <b>expositores</b> com filtros por captador (FIEB / SEBRAE / Bahia Eventos)."))
story.append(bullet("<b>Relatório financeiro básico</b>: receita por status, total previsto, total recebido (baixa manual nesta etapa)."))
story.append(bullet("Login de admin com perfis de acesso (Admin / Staff) e registro das operações realizadas."))

story.append(Paragraph("Infraestrutura e suporte iniciais", H3))
story.append(bullet("Hospedagem em nuvem (servidores na internet) com domínio do INDEX, certificado de segurança (SSL) e cópias de segurança diárias."))
story.append(bullet("E-mails automáticos: confirmação de reserva, envio de contrato, link de acompanhamento."))
story.append(bullet("Banco de dados gerenciado (armazenamento seguro e escalável das informações)."))
story.append(bullet("Treinamento da equipe administrativa (2 sessões online + manual em vídeo)."))
story.append(bullet("Suporte intensivo nas 2 primeiras semanas após a entrada em operação."))

story.append(Paragraph(
    "<b>Agilidade na entrega:</b> aproximadamente 70% deste escopo já está construído "
    "como base reutilizável, o que viabiliza o prazo curto e o investimento abaixo do mercado.",
    QUOTE))

# =============== ETAPA 2 ===============
story.append(PageBreak())
story.append(Paragraph("4. Etapa 2 — Pagamento online + assinatura digital", H1))
story.append(Paragraph("Investimento: <b>R$ 22.000</b> · Prazo: <b>3–4 semanas</b> após aceite da Etapa 1", BODY_S))
story.append(Paragraph(
    "Fecha o ciclo de vendas online sem qualquer operação manual: contrato assinado eletronicamente "
    "+ pagamento processado + baixa automática no painel administrativo.", BODY))

story.append(Paragraph("Entregáveis", H3))
story.append(bullet("Integração com <b>plataforma de pagamento</b> (sugestão: Asaas ou Pagar.me) — Pix, boleto e cartão de crédito/débito."))
story.append(bullet("Geração de cobrança automática a partir do pedido, com link enviado por e-mail e WhatsApp ao expositor."))
story.append(bullet("Conciliação automática: pagamento confirmado → pedido muda para \"Pago\" → notificação para o admin."))
story.append(bullet("Integração com <b>assinatura digital</b> (sugestão: Clicksign ou Autentique) — o contrato vai e volta assinado sem papel."))
story.append(bullet("Notificações automáticas por <b>WhatsApp</b> e e-mail em cada mudança de status (contrato assinado, pagamento aprovado, boleto vencido)."))
story.append(bullet("<b>Relatório financeiro avançado</b>: previsto × realizado, inadimplência, fechamento por período, exportação para planilha (CSV/Excel)."))
story.append(bullet("Área do expositor mostra situação do pagamento, segunda via de boleto e comprovantes."))

story.append(Paragraph(
    "Os custos da plataforma de pagamento e do serviço de assinatura são pagos diretamente pelo INDEX "
    "(referência: ~1,99% por Pix · ~R$ 4 por documento assinado). A integração e configuração estão inclusas no valor da etapa.",
    BODY_S))

# =============== ETAPA 3 ===============
story.append(PageBreak())
story.append(Paragraph("5. Etapa 3 — Aplicativo mobile do evento (opcional)", H1))
story.append(Paragraph("Investimento: <b>R$ 48.000</b> · Prazo: <b>6–8 semanas</b>", BODY_S))
story.append(Paragraph(
    "Aplicativo para celular (iOS e Android) — ou versão web instalável no smartphone (PWA), "
    "conforme o cliente preferir — para <b>visitantes e expositores</b> usarem antes, durante e "
    "depois do evento.", BODY))

story.append(Paragraph("Entregáveis", H3))
story.append(bullet("Apps disponíveis para download na App Store (Apple) e Google Play (Android) com a marca INDEX."))
story.append(bullet("<b>Mapa 3D do evento</b> na palma da mão, com filtro por ASA, segmento e tipo de stand."))
story.append(bullet("Localização de stand específico (\"Onde fica H17?\") com indicação visual no mapa."))
story.append(bullet("Catálogo de expositores: logotipo, contato, segmento, redes sociais, link para WhatsApp."))
story.append(bullet("Programação do evento (palestras, talks, gastronomia) com lembretes no celular."))
story.append(bullet("QR Code de credenciamento do visitante / expositor (preparado para integrar com a Etapa 4)."))
story.append(bullet("<b>Notificações push</b> (alertas direto na tela do celular) segmentadas — por exemplo: \"a palestra X começa em 15 min\"."))
story.append(bullet("Modo offline para mapa e catálogo (visitantes sem sinal de internet consultam mesmo assim)."))
story.append(bullet("Painel admin para enviar notificações, editar programação e gerenciar o catálogo de expositores."))

story.append(Paragraph(
    "Inclusos os custos das contas de publicação Apple Developer (US$ 99/ano) e Google Play (US$ 25, "
    "pagamento único) do primeiro ano. Renovações ficam por conta do INDEX.", BODY_S))

# =============== ETAPA 4 ===============
story.append(PageBreak())
story.append(Paragraph("6. Etapa 4 — Operação no dia (opcional, modular)", H1))
story.append(Paragraph("Investimento: <b>R$ 65.000</b> · Prazo: <b>8–10 semanas</b>", BODY_S))
story.append(Paragraph(
    "Tudo o que o INDEX precisa para a operação <b>dentro do evento</b>. Cada bloco é independente "
    "e pode ser contratado individualmente conforme prioridade.", BODY))

story.append(Paragraph("Blocos disponíveis (escolha quais ativar)", H3))
story.append(bullet("<b>Credenciamento físico</b>: emissão de crachá com QR Code, totens de autoatendimento, leitura na entrada."))
story.append(bullet("<b>Controle de acesso</b>: integração com catracas (entrada e saída por QR Code), histórico em tempo real."))
story.append(bullet("<b>Controle de veículos</b>: registro por QR Code, contagem de tempo de permanência, alertas de prazo excedido."))
story.append(bullet("<b>Documentação legal centralizada</b>: ART (Anotação de Responsabilidade Técnica), ASO (Atestado de Saúde Ocupacional), NR (Normas Regulamentadoras), EPI e contratos por expositor — aprovação online sem papel."))
story.append(bullet("<b>Previsão de carga elétrica</b>: cálculo por estande, alerta de sobrecarga por setor, mapa de risco."))
story.append(bullet("<b>CRM + atendimento automatizado por WhatsApp</b> (CRM = sistema de gestão de relacionamento com o cliente): nutrição de leads e integração com inteligência artificial."))
story.append(bullet("<b>Painel executivo ao vivo</b> com visualizações em tela grande para a organização do evento."))
story.append(bullet("Integrações com sistemas internos do INDEX (a definir conforme necessidade)."))

story.append(Paragraph(
    "Esta etapa pode ser dividida em sub-entregas — por exemplo: só credenciamento + controle de "
    "acesso (R$ 28.000); ou só documentação + energia (R$ 22.000). Detalhamento disponível sob demanda.", BODY_S))

# =============== SUPORTE ===============
story.append(PageBreak())
story.append(Paragraph("7. Suporte e manutenção mensal", H1))
story.append(Paragraph(
    "Após o aceite da Etapa 1, oferecemos um plano de suporte mensal para garantir disponibilidade "
    "e pequenas evoluções:", BODY))

rows = [
    ["Item", "Coberto"],
    ["Disponibilidade da plataforma (disponível ≥ 99,5% do tempo)", "Sim"],
    ["Correção de erros em produção", "Sim, sem limite"],
    ["Atualizações de segurança e dependências", "Sim, mensal"],
    ["Cópias de segurança diárias verificadas", "Sim"],
    ["Pequenas melhorias e ajustes (até 10h/mês)", "Sim"],
    ["Suporte por e-mail/WhatsApp (resposta em até 8h úteis)", "Sim"],
    ["Suporte presencial durante o evento (24h, sem custo adicional)", "Sim"],
    ["Melhorias acima de 10h/mês", "Pacote de horas: R$ 220/h"],
]
story.append(section_table(rows, [11 * cm, 5.7 * cm]))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "<b>Valor:</b> R$ 2.800 / mês · Início após aceite da Etapa 1 · Contrato mensal, "
    "rescindível com 30 dias de aviso.", BODY))

# =============== DIFERENCIAIS ===============
story.append(PageBreak())
story.append(Paragraph("8. Diferenciais desta proposta", H1))

story.append(Paragraph("Pagamento vinculado à entrega", H3))
story.append(Paragraph(
    "Cada etapa é paga apenas quando está no ar e validada pelo INDEX. Você não compromete "
    "orçamento com entregas futuras antes de ver o resultado da etapa atual.", BODY))

story.append(Paragraph("Plataforma sob medida para o INDEX", H3))
story.append(Paragraph(
    "A plataforma é desenvolvida com a identidade visual do INDEX, as regras específicas de "
    "captação (FIEB / SEBRAE / Bahia Eventos), a tipologia de stands (ASA A/B/Foyer · "
    "Estande/Piso) e o mapa interativo real do evento — não é um sistema genérico adaptado.", BODY))

story.append(Paragraph("Propriedade do código", H3))
story.append(Paragraph(
    "Ao final do projeto, o código-fonte completo da plataforma pertence ao INDEX. "
    "Não há licença anual, não há dependência de fornecedor para manter o sistema funcionando.", BODY))

story.append(Paragraph("Início rápido", H3))
story.append(Paragraph(
    "Aproximadamente 70% do escopo da Etapa 1 já está construído como base reutilizável. "
    "Isso permite entrar em operação em 4 a 6 semanas após a assinatura — bem antes do ciclo "
    "comercial do INDEX 2027.", BODY))

story.append(Paragraph("Comunicação direta com quem desenvolve", H3))
story.append(Paragraph(
    "O time responsável pelo desenvolvimento é o mesmo que atende o cliente. "
    "Sem intermediários, sem fila de suporte corporativo.", BODY))

# =============== INVESTIMENTO RESUMO ===============
story.append(PageBreak())
story.append(Paragraph("9. Resumo do investimento", H1))

rows = [
    ["#", "Etapa", "Prazo", "Valor"],
    ["1", "MVP — Reservar stand online + painel de gestão", "4–6 sem.", "R$ 32.000"],
    ["2", "Pagamento online + assinatura digital", "3–4 sem.", "R$ 22.000"],
    ["", "Subtotal Etapas 1+2 (operação comercial completa)", "", "R$ 54.000"],
    ["3", "Aplicativo mobile (opcional)", "6–8 sem.", "R$ 48.000"],
    ["4", "Operação no dia (opcional, modular)", "8–10 sem.", "R$ 65.000"],
    ["", "Total se contratar todas as etapas", "", "R$ 167.000"],
    ["", "Suporte mensal pós-Etapa 1", "mensal", "R$ 2.800"],
]
t = Table(rows, colWidths=[1 * cm, 9.5 * cm, 2.5 * cm, 3.7 * cm], repeatRows=1)
ts = [
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9),
    ("FONT", (0, 1), (-1, -1), "Helvetica", 9),
    ("BACKGROUND", (0, 3), (-1, 3), LIME),
    ("FONT", (0, 3), (-1, 3), "Helvetica-Bold", 9.5),
    ("BACKGROUND", (0, 6), (-1, 6), NAVY),
    ("TEXTCOLOR", (0, 6), (-1, 6), colors.white),
    ("FONT", (0, 6), (-1, 6), "Helvetica-Bold", 9.5),
    ("BACKGROUND", (0, 7), (-1, 7), GRAY_100),
    ("FONT", (0, 7), (-1, 7), "Helvetica-Bold", 9),
    ("ALIGN", (-1, 1), (-1, -1), "RIGHT"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ("GRID", (0, 0), (-1, -1), 0.4, GRAY_200),
]
t.setStyle(TableStyle(ts))
story.append(t)
story.append(Spacer(1, 10))

# =============== CONDIÇÕES ===============
story.append(Paragraph("Condições comerciais", H2))
story.append(Paragraph("Forma de pagamento por etapa", H3))
story.append(bullet("<b>40%</b> na assinatura do contrato (início dos trabalhos)."))
story.append(bullet("<b>40%</b> na entrega para homologação (revisão e aprovação pelo INDEX antes do go-live)."))
story.append(bullet("<b>20%</b> no aceite final da etapa em produção."))

story.append(Paragraph("Outras condições", H3))
story.append(bullet("Validade desta proposta: <b>30 dias</b> a partir da data de envio."))
story.append(bullet("Reajuste anual pelo IPCA (índice oficial de inflação), aplicável apenas ao suporte mensal."))
story.append(bullet("Contrato com cláusula de nível de serviço (SLA), confidencialidade e transferência de propriedade intelectual ao INDEX no aceite final."))
story.append(bullet("Notas fiscais emitidas por [SUA EMPRESA] (CNPJ a informar)."))

# =============== CRONOGRAMA ===============
story.append(PageBreak())
story.append(Paragraph("10. Cronograma sugerido", H1))
story.append(Paragraph(
    "Considerando assinatura em <b>junho/2026</b> e o evento INDEX 2027 em <b>maio/2027</b>:",
    BODY))
rows = [
    ["Mês", "Etapa em execução", "Status"],
    ["Jun/2026", "Etapa 1 — início, configuração do mapa e painel admin", "Em desenvolvimento"],
    ["Jul/2026", "Etapa 1 — validação e entrada em operação", "Vendendo stand online"],
    ["Ago/2026", "Etapa 2 — integração pagamento + assinatura digital", "Em desenvolvimento"],
    ["Set/2026", "Etapa 2 — entrada em operação", "Ciclo comercial 100% online"],
    ["Out–Nov/2026", "Etapa 3 — Aplicativo mobile (opcional)", "Em desenvolvimento"],
    ["Dez/2026", "Etapa 3 — publicação nas lojas", "App disponível"],
    ["Jan–Abr/2027", "Etapa 4 — operação no dia (modular, opcional)", "Em desenvolvimento"],
    ["Mai/2027", "INDEX 2027 — operação ao vivo", "Suporte presencial"],
]
story.append(section_table(rows, [3 * cm, 10 * cm, 4 * cm], body_font=9))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Etapas 3 e 4 só entram caso contratadas. Etapas 1 + 2 sozinhas já garantem a venda online "
    "completa para o INDEX 2027.", BODY_S))

# =============== SEGURANÇA ===============
story.append(Paragraph("11. Segurança", H1))
story.append(Paragraph(
    "A plataforma adota boas práticas de segurança da informação desde a primeira etapa:", BODY))
story.append(bullet(
    "<b>Autenticação</b> (controle de quem acessa o sistema): NextAuth com tokens seguros "
    "(JWT) e senhas criptografadas (bcrypt) — sessões completamente separadas para admin e expositor."))
story.append(bullet(
    "<b>LGPD</b> (Lei Geral de Proteção de Dados): dados armazenados em servidores no Brasil, "
    "criptografia na transmissão e no armazenamento, política de retenção e descarte de dados."))
story.append(bullet("Cópias de segurança diárias com capacidade de restauração rápida em caso de falha."))
story.append(bullet("Monitoramento contínuo de erros e disponibilidade da plataforma."))

# =============== PRÓXIMOS PASSOS ===============
story.append(PageBreak())
story.append(Paragraph("12. Próximos passos", H1))
story.append(Paragraph("Para começarmos:", BODY))
story.append(bullet("Reunião de apresentação da proposta (1h, online ou presencial)."))
story.append(bullet("Demonstração da plataforma já em estágio MVP (link de acesso disponível)."))
story.append(bullet("Ajustes finais de escopo e prazos."))
story.append(bullet("Assinatura do contrato e emissão da primeira nota fiscal (40% da Etapa 1)."))
story.append(bullet("Início dos trabalhos em até 5 dias úteis após assinatura."))

# =============== CONTATO ===============
story.append(Spacer(1, 20))
story.append(Paragraph("Contato", H2))
contact_data = [
    [Paragraph("<b>[SUA EMPRESA]</b>", BODY),
     Paragraph("[CNPJ a informar]", BODY_S)],
    [Paragraph("[SEU NOME]", BODY), Paragraph("Responsável técnico e comercial", BODY_S)],
    [Paragraph("[seu@email.com]", BODY), Paragraph("[(71) 90000-0000]", BODY_S)],
]
t = Table(contact_data, colWidths=[9 * cm, 7.7 * cm])
t.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LINEBELOW", (0, 0), (-1, -1), 0.3, GRAY_200),
]))
story.append(t)

story.append(Spacer(1, 30))
story.append(Paragraph(
    "Agradecemos a oportunidade. Estamos prontos para começar imediatamente após o aceite.",
    QUOTE))
story.append(Paragraph(
    f"Salvador, {date.today().strftime('%d/%m/%Y')}",
    SMALL))

# ---------- gera ----------
doc.build(story, onFirstPage=draw_cover, onLaterPages=header_footer)
print(f"OK -> {OUTPUT}")
