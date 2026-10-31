# -*- coding: utf-8 -*-
"""Bump de versao nos <script src> para vencer o cache do http.server local."""
import re, glob

for f in glob.glob('**/*.html', recursive=True):
    h = open(f, encoding='utf-8').read()
    n = re.sub(r'(js/(?:catalogo|studio|produto-shell)\.js)(["?])', r'\1?v=3\2', h)
    # evita duplo bump se ?v=3 ja presente (o regex acima com "|" cobre; seguranca extra)
    n = n.replace('.js?v=3?v=3', '.js?v=3')
    if n != h:
        open(f, 'w', encoding='utf-8', newline='').write(n)
        print('bumped:', f)
print('fim')
