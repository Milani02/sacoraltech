# -*- coding: utf-8 -*-
"""Capturas do guia 'Como criar sua conta' — SAC Oraltech."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from annotate import highlight, numbered_badges

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "..", "criar-conta", "img")
BASE = "http://localhost:3000"

NAME = "Rafael Andrade Lima"
EMAIL = "rafael.andrade@empresa.com.br"
PASSWORD = "RafaelSenha123"
SHORT_PASSWORD = "123456"


def shot(page, name, full=True):
    p = os.path.join(IMG, name)
    page.screenshot(path=p, full_page=full)
    print("shot:", name)
    return p


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, locale="pt-BR")
    page = ctx.new_page()

    # 01 — login, com "Cadastre-se" destacado
    page.goto(BASE + "/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(400)
    link_box = page.get_by_text("Cadastre-se", exact=True).bounding_box()
    path = shot(page, "01-tela-de-login.png")
    highlight(path, link_box)

    # 02 — tela de cadastro vazia, campos numerados 1-4
    page.click("text=Cadastre-se")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(400)
    boxes = [
        page.locator("#name").bounding_box(),
        page.locator("#email").bounding_box(),
        page.locator("#password").bounding_box(),
        page.get_by_role("button", name="Criar conta").bounding_box(),
    ]
    path = shot(page, "02-tela-de-cadastro.png")
    numbered_badges(path, boxes)

    # 03 — formulario preenchido, olho de mostrar senha destacado
    page.fill("#name", NAME)
    page.fill("#email", EMAIL)
    page.fill("#password", PASSWORD)
    eye_box = page.get_by_role("button", name="Mostrar senha").bounding_box()
    path = shot(page, "03-formulario-preenchido.png")
    highlight(path, eye_box)

    # 04 — erro de senha curta (tentativa a parte, nao usada na conta final)
    page.fill("#password", SHORT_PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_timeout(1200)
    shot(page, "04-erro-senha-curta.png")

    # 05 — corrige a senha, cria a conta de verdade e cai no painel
    page.fill("#password", PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_url("**/dashboard", timeout=20000)
    page.wait_for_load_state("networkidle")
    page.wait_for_selector("text=Abrir ticket", timeout=15000)
    page.wait_for_timeout(500)
    btn_box = page.get_by_role("link", name="Abrir ticket").bounding_box()
    path = shot(page, "05-painel-do-cliente.png")
    highlight(path, btn_box)

    browser.close()
print("criar-conta: capturas concluidas")
