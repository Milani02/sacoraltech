# -*- coding: utf-8 -*-
"""Capturas do guia 'Como abrir um ticket' — SAC Oraltech."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from annotate import highlight

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "..", "abrir-ticket", "img")
BASE = "http://localhost:3000"
EMAIL = "rafael.andrade@empresa.com.br"
PASSWORD = "RafaelSenha123"

RAZAO = "Empresa Exemplo Ltda"
CNPJ = "12.345.678/0001-90"
ENDERECO = "Rua das Flores, 123 - Centro, São Paulo/SP - CEP 01001-000"
NF = "45678"
PRODUTO = "Oraltech - Lote ABC123"
DESCRICAO = ("O produto chegou com a embalagem violada e parte do conteúdo vazou. "
             "Foto do lote em anexo. Peço orientação sobre a troca.")


def shot(page, name, full=True):
    p = os.path.join(IMG, name)
    page.screenshot(path=p, full_page=full)
    print("shot:", name)
    return p


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, locale="pt-BR")
    page = ctx.new_page()

    page.goto(BASE + "/login")
    page.wait_for_load_state("networkidle")
    page.fill('input[type="email"]', EMAIL)
    page.fill('input[type="password"]', PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_url("**/dashboard", timeout=20000)
    page.wait_for_load_state("networkidle")
    page.wait_for_selector("text=Abrir ticket", timeout=15000)
    page.wait_for_timeout(500)

    # 01 — painel, botao "Abrir ticket" destacado (igual ao 05 do outro guia)
    btn_box = page.locator("text=Abrir ticket").first.bounding_box()
    path = shot(page, "01-painel-botao-abrir-ticket.png")
    highlight(path, btn_box)

    # 02 — lista de assuntos aberta
    page.get_by_role("link", name="Abrir ticket").first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_selector("text=Selecione o assunto", timeout=15000)
    page.wait_for_timeout(300)
    page.click("text=Selecione o assunto")
    page.wait_for_selector('[role="listbox"]', timeout=5000)
    page.wait_for_timeout(300)
    listbox_box = page.locator('[role="listbox"]').bounding_box()
    path = shot(page, "02-escolher-assunto.png")
    highlight(path, listbox_box, pad=4)

    # 03 — assunto escolhido, campos vazios
    page.keyboard.type("Produto com desvio")
    page.wait_for_timeout(200)
    page.keyboard.press("Enter")
    page.wait_for_timeout(400)
    shot(page, "03-campos-do-formulario.png")

    # 04 — campos obrigatorios vazios (recorte, como no guia original)
    page.click('button:has-text("Abrir ticket")')
    page.wait_for_timeout(600)
    page.screenshot(path=os.path.join(IMG, "04-campo-obrigatorio.png"), full_page=False)
    print("shot: 04-campo-obrigatorio.png")

    # 05 — formulario preenchido
    page.fill("#razao_social", RAZAO)
    page.fill("#cnpj", CNPJ)
    page.fill("#endereco", ENDERECO)
    page.fill("#nf", NF)
    page.fill("#produto", PRODUTO)
    page.fill("#descricao", DESCRICAO)
    shot(page, "05-formulario-preenchido.png")

    # 06 — ticket aberto
    page.click('button:has-text("Abrir ticket")')
    page.wait_for_url("**/chamados/*", timeout=15000)
    page.wait_for_load_state("networkidle")
    page.wait_for_selector("text=Detalhes", timeout=30000)
    page.wait_for_timeout(500)
    ticket_url = page.url
    ticket_id = ticket_url.rsplit("/", 1)[-1]
    print("ticket:", ticket_id)
    shot(page, "06-ticket-aberto.png")

    # 07 — area de conversa destacada
    box_area = page.locator('textarea[placeholder*="Escreva sua mensagem"]').bounding_box()
    path = shot(page, "07-responder-equipe.png")
    highlight(path, box_area)

    # 08 — lista de tickets, codigo destacado
    page.goto(BASE + "/chamados")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)
    code_box = page.locator(f"text=SAC-").first.bounding_box()
    path = shot(page, "08-lista-de-tickets.png")
    highlight(path, code_box)

    with open(os.path.join(HERE, "_ticket_id.txt"), "w") as f:
        f.write(ticket_id)

    browser.close()
print("abrir-ticket: capturas concluidas")
