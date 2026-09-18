#!/usr/bin/env python3
"""
Descarga las fuentes de Google Fonts y genera las reglas @font-face locales.

Por qué self-hosted y no <link> a fonts.googleapis.com:
  · la app corre en el local, con wifi que se cae: si Google no responde, el
    navegador se queda sin tipografía (y con 2 peticiones externas bloqueantes);
  · 6 archivos woff2 (latin + latin-ext) pesan menos que el CSS + fuentes externas;
  · el navegador cachea los .woff2 igual, pero sin salir a internet.

Uso:
    python3 tools/fuentes-locales.py                 # regenera css/fuentes.css
    python3 tools/fuentes-locales.py "Fredoka:wght@500;600;700" "Nunito:wght@400;600;700"
"""
import re
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO_FUENTES = RAIZ / 'assets' / 'fonts'
DESTINO_CSS = RAIZ / 'css' / 'fuentes.css'
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

# solo los alfabetos que usamos: español necesita latin y latin-ext
SUBCONJUNTOS = ('latin', 'latin-ext')

PEDIDO = [
    'Fredoka:wght@500;600;700',
    'Nunito:wght@400;600;700',
]


def bajar(url: str) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def css_remoto(pedidos):
    url = 'https://fonts.googleapis.com/css2?family=' + '&family='.join(pedidos) + '&display=swap'
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8')


def main():
    pedidos = sys.argv[1:] or PEDIDO
    remoto = css_remoto(pedidos)
    DESTINO_FUENTES.mkdir(parents=True, exist_ok=True)

    bloques = re.findall(r'@font-face\s*\{(.*?)\}', remoto, re.S)
    crudos, bajados = [], {}

    for b in bloques:
        fam = re.search(r"font-family:\s*'([^']+)'", b)
        peso = re.search(r'font-weight:\s*(\d+)', b)
        # Google marca el subconjunto en un comentario justo antes del bloque
        inicio = remoto.find(b)
        contexto = remoto[max(0, inicio - 120):inicio]
        sub = re.search(r'/\*\s*([a-z-]+)\s*\*/', contexto)
        url = re.search(r'url\((https://[^)]+\.woff2)\)', b)
        if not (fam and peso and url):
            continue
        subconjunto = sub.group(1) if sub else 'latin'
        if subconjunto not in SUBCONJUNTOS:
            continue
        rango = re.search(r'unicode-range:\s*([^;]+);', b)
        crudos.append({
            'familia': fam.group(1), 'peso': int(peso.group(1)),
            'subconjunto': subconjunto, 'url': url.group(1),
            'rango': rango.group(1).strip() if rango else None,
        })

    # Fredoka es una fuente variable: Google entrega el MISMO archivo para 500/600/700.
    # Se guarda una sola vez y se declara un rango de pesos (`font-weight: 500 700`)
    # en vez de tres @font-face apuntando al mismo binario.
    import hashlib
    grupos = {}
    for f in crudos:
        datos = bajar(f['url'])
        clave = (f['familia'], f['subconjunto'], hashlib.sha256(datos).hexdigest())
        if clave not in bajados:
            archivo = f"{f['familia'].lower().replace(' ', '-')}-{f['peso']}-{f['subconjunto']}.woff2"
            (DESTINO_FUENTES / archivo).write_bytes(datos)
            bajados[clave] = {'archivo': archivo, 'datos': datos, 'rango': f['rango'], 'pesos': []}
        bajados[clave]['pesos'].append(f['peso'])

    # limpia archivos de corridas previas que ya no se referencian
    for viejo in DESTINO_FUENTES.glob('*.woff2'):
        if viejo.name not in {v['archivo'] for v in bajados.values()}:
            viejo.unlink()

    reglas = []
    for v in sorted(bajados.values(), key=lambda x: (x['archivo'])):
        familia = next(f['familia'] for f in crudos
                       if f['familia'].lower().replace(' ', '-') in v['archivo'])
        minimo, maximo = min(v['pesos']), max(v['pesos'])
        peso_css = f'{minimo}' if minimo == maximo else f'{minimo} {maximo}'
        reglas.append(
            '@font-face{\n'
            f"  font-family:'{familia}';\n"
            '  font-style:normal;\n'
            f'  font-weight:{peso_css};\n'
            '  font-display:swap;\n'
            f"  src:url('../assets/fonts/{v['archivo']}') format('woff2');\n"
            + (f'  unicode-range:{v["rango"]};\n' if v['rango'] else '')
            + '}'
        )

    cabecera = ('/* ==========================================================================\n'
                '   Tipografías servidas desde el propio sitio (Google Fonts, OFL).\n'
                '   Generado por tools/fuentes-locales.py — no editar a mano.\n'
                '   Sí: las descarga el script; el navegador ya no sale a internet.\n'
                '   ========================================================================== */\n\n')
    DESTINO_CSS.write_text(cabecera + '\n'.join(reglas) + '\n', encoding='utf-8')
    peso_total = sum(v['datos'] and len(v['datos']) for v in bajados.values()) / 1024
    print(f"{len(bajados)} archivos en assets/fonts ({peso_total:.0f} KB) "
          f"-> css/fuentes.css con {len(reglas)} reglas")


if __name__ == '__main__':
    main()
