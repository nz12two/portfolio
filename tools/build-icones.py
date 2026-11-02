# -*- coding: utf-8 -*-
"""Baixa os icones de tecnologia (simple-icons) e grava js/icones.js.

Rodar: python -X utf8 tools/build-icones.py
Saida: js/icones.js  ->  window.NZICONES = { chave: "<path d=...>" }
       window.NZICONE(texto)  ->  <svg> inline (currentColor, 24x24)

Sem dependencia: urllib da stdlib. Se a rede falhar, o arquivo antigo fica.
"""
import json
import os
import re
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "js", "icones.js")

# chave interna -> slug do simple-icons
FONTE = {
    "java": "openjdk",
    "gradle": "gradle",
    "sql": "mysql",
    "python": "python",
    "javascript": "javascript",
    "typescript": "typescript",
    "gha": "githubactions",
    "astro": "astro",
    "react": "react",
    "tailwind": "tailwindcss",
    "fastapi": "fastapi",
    "osm": "openstreetmap",
    "next": "nextdotjs",
    "vercel": "vercel",
    "node": "nodedotjs",
    "bun": "bun",
    "obsidian": "obsidian",
    "ws": "socketdotio",
}

# Glifos proprios (nao existem no simple-icons): Paper API e fallback generico.
PROPRIOS = {
    # pilha de folhas = Paper API
    "paper": "M4 5h10l4 4v10H4zM14 5v4h4M7 13h7M7 16h5",
    # engrenagem simples = otimizacao/tuning
    "tune": "M12 3v4m0 10v4M5 12H3m6 0H7m14 0h-2m-2 0h-2M12 8a4 4 0 100 8 4 4 0 000-8z",
    # icones de prateleira do marketplace
    "box": "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9",
    "bolt": "M13 2 4 14h7l-1 8 9-12h-7l1-8z",
    "gear": "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3m0 14v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1",
    "wrench": "M14.5 6a3.5 3.5 0 1 0 4.9 3.2L21 8l-1 4.4-4.4 1L6 21l-3-3 7.6-7.6z",
    "plug": "M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5",
    "bot": "M7 8h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM12 4v4M9 13h.01M15 13h.01M9.5 16h5",
    "pad": "M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4c-1.4 0-2-1-3-1H9c-1 0-1.6 1-3 1a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4zM8 11h2m-1-1v2M15 12h.01M17.5 12h.01",
    "briefcase": "M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8zM9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M3 13h18",
}

CABECALHO = """/* Gerado por tools/build-icones.py -- nao editar a mao.
   Icones de tecnologia em currentColor (sem CDN, sem dependencia de rede no
   navegador). Fonte: simple-icons (CC0). Glifos proprios marcados com *stroke*.
   Uso: document.getElementById('x').innerHTML = NZICONE('java'); */
"""


def baixa(slug):
    url = "https://cdn.jsdelivr.net/npm/simple-icons@13/icons/%s.svg" % slug
    with urllib.request.urlopen(url, timeout=30) as r:
        svg = r.read().decode("utf-8")
    m = re.search(r'\sd="([^"]+)"', svg)
    if not m:
        raise RuntimeError("sem path: " + slug)
    return m.group(1)


def main():
    paths = {}
    falhou = []
    for chave, slug in FONTE.items():
        try:
            paths[chave] = {"d": baixa(slug)}
        except Exception as e:  # rede/trademark: o icone cai no fallback
            falhou.append("%s (%s): %s" % (chave, slug, e))
    for chave, d in PROPRIOS.items():
        paths[chave] = {"d": d, "stroke": True}

    corpo = CABECALHO
    corpo += "window.NZICONES = " + json.dumps(paths, ensure_ascii=True, separators=(",", ":")) + ";\n"
    corpo += r"""
(function () {
  'use strict';
  // normaliza o nome da tecnologia do catalogo ("React 19" -> "react")
  var ALIAS = {
    'paper api': 'paper',
    'sqlite/mysql/mariadb/postgresql': 'sql',
    'sqlite': 'sql', 'mysql': 'sql', 'postgresql': 'sql', 'mariadb': 'sql', 'sql': 'sql',
    'github actions': 'gha',
    'next.js': 'next', 'next': 'next',
    'node.js': 'node', 'node': 'node',
    'obsidian/vault': 'obsidian', 'obsidian': 'obsidian',
    'openstreetmap': 'osm', 'osmnx': 'osm',
    'websocket': 'ws', 'socket.io': 'ws',
    'astro': 'astro', 'react': 'react', 'vue': 'react',
    'tailwind': 'tailwind', 'tailwindcss': 'tailwind',
    'typescript': 'typescript', 'ts': 'typescript',
    'javascript': 'javascript', 'js': 'javascript',
    'python': 'python', 'java': 'java', 'gradle': 'gradle',
    'fastapi': 'fastapi', 'vercel': 'vercel', 'bun': 'bun'
  };
  function chave(nome) {
    var n = String(nome || '').toLowerCase().trim()
      .replace(/\s*\d+(\.\d+)?$/, '')
      .replace(/\s+/g, ' ');
    if (window.NZICONES[n]) return n;
    return ALIAS[n] || null;
  }
  function svg(nome, tam) {
    var k = chave(nome), ic = k && window.NZICONES[k];
    var t = tam || 18;
    if (!ic) return '';
    var attrs = ic.stroke
      ? 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'
      : 'fill="currentColor"';
    return '<svg class="ico" width="' + t + '" height="' + t + '" viewBox="0 0 24 24" ' +
      attrs + ' aria-hidden="true"><path d="' + ic.d + '"/></svg>';
  }
  window.NZICONE = svg;
})();
"""
    with open(SAIDA, "w", encoding="utf-8") as f:
        f.write(corpo)
    print("icones:", len(paths), "->", SAIDA)
    if falhou:
        print("falhou:")
        for f in falhou:
            print("  ", f)


if __name__ == "__main__":
    main()
