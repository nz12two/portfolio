# -*- coding: utf-8 -*-
"""Bump de versao nos <link>/<script src> para vencer o cache do http.server local."""
import re, glob

for f in glob.glob('**/*.html', recursive=True):
    h = open(f, encoding='utf-8').read()
    n = re.sub(r'(js/(?:catalogo|studio|produto-shell)\.js)(["?])', r'\1?v=3\2', h)
    n = re.sub(r'(css/(?:catalogo|studio|produto|conta)\.css)(")', r'\1?v=3\2', n)
    n = n.replace('.js?v=3?v=3', '.js?v=3').replace('.css?v=3?v=3', '.css?v=3')
    if n != h:
        open(f, 'w', encoding='utf-8', newline='').write(n)
        print('bumped:', f)
print('fim')
