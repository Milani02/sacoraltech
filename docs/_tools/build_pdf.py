# -*- coding: utf-8 -*-
"""Converte um README.md de guia do cliente em PDF com a identidade visual
do SAC Oraltech (azul-oraltech, callouts, legendas de imagem)."""
import os
import re
import sys
import markdown
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))

CSS = """
@page { size: A4; margin: 22mm 20mm; }
* { box-sizing: border-box; }
body {
  font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  color: #1f2933;
  font-size: 14px;
  line-height: 1.55;
}
h1 {
  color: oklch(0.42 0.13 255);
  font-size: 26px;
  font-weight: 800;
  border-bottom: 3px solid oklch(0.42 0.13 255);
  padding-bottom: 10px;
  margin: 0 0 18px;
}
h2 {
  color: oklch(0.42 0.13 255);
  font-size: 19px;
  font-weight: 700;
  margin: 28px 0 10px;
}
hr { border: none; border-top: 1px solid oklch(0.9 0.012 255); margin: 22px 0; }
p { margin: 10px 0; }
a { color: oklch(0.42 0.13 255); }
code {
  background: oklch(0.95 0.012 255);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 13px;
}
pre {
  background: oklch(0.22 0.05 255);
  color: oklch(0.96 0.02 255);
  border-radius: 8px;
  padding: 14px 18px;
  text-align: center;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 14px;
  overflow-wrap: break-word;
}
pre code { background: none; color: inherit; padding: 0; }
blockquote {
  background: oklch(0.95 0.02 255);
  border-left: 4px solid oklch(0.42 0.13 255);
  margin: 16px 0;
  padding: 4px 18px;
  border-radius: 0 8px 8px 0;
}
blockquote p { margin: 8px 0; }
blockquote > p:first-child strong:first-child { display: inline-block; }
table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0 18px;
  font-size: 13px;
}
th, td {
  border: 1px solid oklch(0.85 0.015 255);
  padding: 7px 10px;
  text-align: left;
  vertical-align: top;
}
th { background: oklch(0.95 0.02 255); color: oklch(0.42 0.13 255); }
figure { margin: 12px 0 20px; text-align: center; page-break-inside: avoid; }
figure img {
  max-width: 100%;
  border: 1px solid oklch(0.85 0.015 255);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.08);
}
figcaption { font-size: 12px; font-style: italic; color: oklch(0.5 0.02 255); margin-top: 8px; }
"""

HTML_TEMPLATE = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><style>{css}</style></head>
<body>{content}</body></html>
"""


def md_to_pdf(md_path, pdf_path):
    with open(md_path, "r", encoding="utf-8") as f:
        text = f.read()

    html = markdown.markdown(text, extensions=["tables", "fenced_code", "nl2br"])

    # transforma <img alt="..." src="..."> em <figure><img><figcaption>
    def img_to_figure(m):
        tag = m.group(0)
        alt = re.search(r'alt="([^"]*)"', tag)
        src = re.search(r'src="([^"]*)"', tag)
        alt_text = alt.group(1) if alt else ""
        src_path = src.group(1) if src else ""
        abs_src = os.path.abspath(os.path.join(os.path.dirname(md_path), src_path))
        uri = "file:///" + abs_src.replace("\\", "/")
        return f'<figure><img src="{uri}"><figcaption>{alt_text}</figcaption></figure>'

    html = re.sub(r"<img[^>]*>", img_to_figure, html)
    # remove o <p> vazio ao redor da figure (markdown embrulha imagem solta em <p>)
    html = re.sub(r"<p>(<figure>.*?</figure>)</p>", r"\1", html, flags=re.S)

    full_html = HTML_TEMPLATE.format(css=CSS, content=html)
    html_path = pdf_path.replace(".pdf", "_tmp.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(full_html)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("file:///" + os.path.abspath(html_path).replace("\\", "/"))
        page.wait_for_timeout(300)
        page.pdf(path=pdf_path, format="A4", print_background=True,
                 margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
        browser.close()

    os.remove(html_path)
    print("gerado:", pdf_path)


if __name__ == "__main__":
    md_path = sys.argv[1]
    pdf_path = sys.argv[2]
    md_to_pdf(md_path, pdf_path)
