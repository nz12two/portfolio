# -*- coding: utf-8 -*-
"""Acrescenta a taxonomia de marketplace ao produtos.json (idempotente).

`categoria_mkt` = a prateleira do marketplace (plugins, modpacks, otimizacoes...).
`desde`        = quando o produto entrou no ar. Fonte medida:
                 - repo publico  -> created_at da API do GitHub (medido em 2026-11-01)
                 - repo fechado  -> data em que a pagina entrou no catalogo
"""
import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALVO = os.path.join(RAIZ, "catalogo", "dados", "produtos.json")

CATEGORIAS = [
    {"slug": "plugins", "rotulo": "Plugins", "vindo": False,
     "desc": "Extensão que entra num sistema que já existe e roda dentro dele."},
    {"slug": "modpacks", "rotulo": "Modpacks", "vindo": True,
     "desc": "Pacote de mods, config e ajuste pronto pra subir — o servidor já nasce montado."},
    {"slug": "otimizacoes", "rotulo": "Otimizações", "vindo": True,
     "desc": "Tuning de performance: menos lag, menos memória, mais TPS."},
    {"slug": "automacoes", "rotulo": "Automações", "vindo": True,
     "desc": "Serviço que roda sozinho — coleta, organiza e reage sem ninguém olhando."},
    {"slug": "ferramentas", "rotulo": "Ferramentas", "vindo": False,
     "desc": "Resolve um trabalho pontual, sem virar sistema."},
    {"slug": "apis", "rotulo": "APIs & dados", "vindo": False,
     "desc": "Índice, catálogo e conjunto de dados com a fonte aberta."},
    {"slug": "agentes", "rotulo": "Agentes", "vindo": False,
     "desc": "Programa que decide sozinho e responde pelo que fez."},
    {"slug": "jogos", "rotulo": "Jogos & simulações", "vindo": False,
     "desc": "Simulação com regra de verdade e dado real por baixo."},
    {"slug": "servicos", "rotulo": "Serviços", "vindo": False,
     "desc": "Trabalho sob medida pra um cliente, com prazo e entrega."},
]

MAPA = {
    "antixray": ("plugins", "2026-10-11"),
    "api-directory": ("apis", "2026-10-11"),
    "opendex": ("ferramentas", "2026-08-05"),
    "empresas-mundo": ("jogos", "2026-10-11"),
    "baccanas-hub": ("servicos", "2026-10-14"),
    "banzinho": ("agentes", "2026-10-14"),
}

NOTA = ("desde = created_at do repositorio publico (API do GitHub, medido em "
        "2026-11-01). Repositorio fechado usa a data em que a pagina entrou no "
        "catalogo. Nao e data inventada: e a primeira evidencia de existencia.")

def main():
    with open(ALVO, encoding="utf-8") as f:
        doc = json.load(f)

    doc["categorias_mkt"] = CATEGORIAS
    doc["_categorias_nota"] = (
        "Prateleira do marketplace. `categoria` (campo antigo) diz o TIPO de "
        "software; `categoria_mkt` diz a CATEGORIA da vitrine — e o que a pessoa "
        "procura. Categoria com `vindo: true` aparece vazia de proposito: mostra "
        "a prateleira que ainda vai ser abastecida.")
    doc["_desde_nota"] = NOTA

    for p in doc.get("produtos", []):
        slug = p.get("slug")
        if slug not in MAPA:
            raise SystemExit("produto sem categoria: " + str(slug))
        cat, desde = MAPA[slug]
        p["categoria_mkt"] = cat
        p["desde"] = desde

    with open(ALVO, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("ok:", len(doc["produtos"]), "produtos,", len(CATEGORIAS), "categorias")


if __name__ == "__main__":
    main()
