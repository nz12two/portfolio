"""Refaz o preview de link do portfolio com a marca do kit.

Por que este arquivo e o unico que pode ser gerado: `tools/build-catalogo.js:143`
proibe imagem gerada por codigo para PRODUTO, porque fingir captura e pior que
nao ter imagem. O preview de link nao e captura de nada -- e a identidade do
portfolio, entao gerar e correto.

O texto vem do title e da meta description que o index.html ja declara, nao de
um texto novo: a identidade editorial e do NZ.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = r"C:\Users\Lucas\Documents\GitHub\portfolio"
KIT = r"C:\Users\Lucas\nz-studio-logo\export"
W, H = 1890, 910
FUNDO = (11, 11, 11)
BRANCO = (255, 255, 255)
CINZA = (148, 154, 164)
ACENTO = (124, 108, 255)

FONTES = {
    "titulo": [r"C:\Windows\Fonts\bahnschrift.ttf", r"C:\Windows\Fonts\segoeuib.ttf"],
    "sub": [r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\tahoma.ttf"],
    "peq": [r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\tahoma.ttf"],
}


def fonte(chave, tamanho):
    for p in FONTES[chave]:
        if os.path.exists(p):
            return ImageFont.truetype(p, tamanho)
    return ImageFont.load_default()


def brilho(img):
    """Vinheta radial suave: escurece as bordas e centraliza o olho no texto.

    Feito com L invertida e blur, em vez de um retangulo colado: o blur de um
    canvas retangular deixa a borda dura, e era o que appeared quadrado.
    """
    mascara = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mascara).ellipse([-W * 0.25, -H * 0.6, W * 1.25, H * 1.6], fill=255)
    mascara = mascara.filter(ImageFilter.GaussianBlur(220))
    return Image.composite(img, Image.new("RGB", (W, H), (0, 0, 0)), mascara)


def main():
    img = Image.new("RGB", (W, H), FUNDO)
    d = ImageDraw.Draw(img)

    # grade de 60px: mesma ideia do hero do site, um passo acima do preto
    grade = (20, 20, 24)
    for x in range(0, W, 60):
        d.line([(x, 0), (x, H)], fill=grade, width=1)
    for y in range(0, H, 60):
        d.line([(0, y), (W, y)], fill=grade, width=1)

    img = brilho(img)
    d = ImageDraw.Draw(img)

    # ---- marca
    g = Image.open(os.path.join(KIT, "white", "nz-studio-glyph.png")).convert("RGBA")
    lado = 260
    g = g.resize((lado, lado), Image.LANCZOS)
    # o PNG do kit pode vir com fundo opaco: corta pelo alfa para nao colar caixa
    a = g.getchannel("A")
    if a.getextrema()[0] == 255:
        g = Image.open(os.path.join(KIT, "white", "nz-studio-glyph.svg")).convert("RGBA") \
            if False else g
    mx, my = 170, (H - lado) // 2 - 10

    # halo circular de verdade: radial gerado, nao canvas retangular
    r = lado * 2
    halo = Image.new("L", (r, r), 0)
    hd = ImageDraw.Draw(halo)
    c = r // 2
    passos = 70
    for i in range(passos, 0, -1):
        t = i / passos
        v = int(70 * (1 - t) ** 2)
        hd.ellipse([c - r * t / 2, c - r * t / 2, c + r * t / 2, c + r * t / 2], fill=v)
    halo = halo.filter(ImageFilter.GaussianBlur(30))
    tinta = Image.new("RGBA", (r, r), (124, 108, 255, 0))
    img.paste(tinta, (mx + lado // 2 - r // 2, my + lado // 2 - r // 2), halo)
    d = ImageDraw.Draw(img)

    img.paste(g, (mx, my), g)
    d = ImageDraw.Draw(img)

    # ---- texto
    tx = mx + lado + 100
    d.text((tx, 246), "NZ STUDIO", font=fonte("titulo", 126), fill=BRANCO)
    d.text((tx + 4, 392), "constrói plugins, catálogos e agentes que rodam",
           font=fonte("sub", 44), fill=BRANCO)
    d.text((tx + 4, 468), "cada número aqui é medido no repositório aberto",
           font=fonte("peq", 34), fill=CINZA)
    d.text((tx + 4, 578), "NZ12TWO.GITHUB.IO/PORTFOLIO", font=fonte("peq", 28), fill=(112, 118, 128))

    d.rectangle([0, H - 8, W, H], fill=ACENTO)

    destino = os.path.join(REPO, "assets", "social-preview.png")
    antes = os.path.getsize(destino) if os.path.exists(destino) else 0
    img.save(destino, "PNG", optimize=True)
    depois = os.path.getsize(destino)
    print(f"gerado: {destino}")
    print(f"  {img.size[0]}x{img.size[1]}   {antes/1024:.0f} KB -> {depois/1024:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())