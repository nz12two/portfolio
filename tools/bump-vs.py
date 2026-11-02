# -*- coding: utf-8 -*-
"""Bump de versao nos <link href> e <script src> de todo html do repo.

Uso: python -X utf8 tools/bump-vs.py 4

O GitHub Pages serve js/ e css/ com cache longo; sem trocar a query string o
navegador do NZ continua rodando o arquivo velho depois do push. A varredura e
por caminho (js/..., ../css/...), entao arquivo novo entra sem mexer aqui.
"""
import glob
import re
import sys

VER = sys.argv[1] if len(sys.argv) > 1 else "4"
ALVO = re.compile(
    r"((?:\.\./)*(?:js|css)/[A-Za-z0-9_.\-]+\.(?:js|css))(?:\?v=[\w.\-]+)?(?=[\"'])"
)

for f in glob.glob("**/*.html", recursive=True):
    h = open(f, encoding="utf-8").read()
    n = ALVO.sub(lambda m: m.group(1) + "?v=" + VER, h)
    if n != h:
        open(f, "w", encoding="utf-8", newline="").write(n)
        print("bumped:", f)
print("fim:", VER)
