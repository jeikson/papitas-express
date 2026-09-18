#!/usr/bin/env python3
"""
Construye el sprite SVG de la app a partir de los iconos reales de Lucide.

Por qué así y no con CDN o el paquete npm en runtime:
  · la app es estática y debe funcionar sin internet (el local del negocio);
  · un sprite inline pesa ~6 KB, se cachea con el HTML y no agrega peticiones;
  · el JS sigue usando `ic('nombre')` → <use href="#i-nombre">, sin acoplarse a Lucide.

Uso:
    npm i lucide-static --prefix /tmp/icons        # solo la primera vez
    python3 tools/sprite-iconos.py                 # reescribe el sprite en index.html
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
INDEX = RAIZ / 'index.html'
ICONOS = Path('/tmp/icons/node_modules/lucide-static/icons')
VERSION = Path('/tmp/icons/node_modules/lucide-static/package.json')

# id en el sprite  ->  archivo de Lucide
MAPA = {
    'cart': 'shopping-bag',
    'bag': 'shopping-cart',
    'plus': 'plus',
    'minus': 'minus',
    'check': 'check',
    'check-circle': 'circle-check',
    'x': 'x',
    'back': 'arrow-left',
    'chevron': 'chevron-right',
    'search': 'search',
    'clock': 'clock',
    'home': 'house',
    'scooter': 'bike',
    'store': 'store',
    'pin': 'map-pin',
    'wa': 'message-circle',
    'copy': 'copy',
    'trash': 'trash-2',
    'flame': 'flame',
    'star': 'star',
    'cash': 'banknote',
    'card': 'credit-card',
    'receipt': 'receipt',
    'utensils': 'utensils',
    'download': 'download',
    'smartphone': 'smartphone',
}

# Iconos que Lucide ya no incluye (retiró los de marcas en 1.x):
# misma rejilla de 24x24 y mismo trazo que el resto, para que no desentonen.
MANUALES = {
    'instagram': '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>'
                 '<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>'
                 '<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
}

# atributos que definen la geometría; el resto (stroke, fill, class…) lo pone el CSS
GEOMETRIA = {'d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
             'width', 'height', 'points', 'transform'}


def limpiar(contenido: str) -> str:
    """Deja solo la geometría, con los atributos en un orden estable."""
    # el archivo de Lucide trae un comentario de licencia y un <svg> raíz con
    # width/height/xmlns propios: anidados dentro del sprite escalarían y se recortarían
    contenido = re.sub(r'<!--.*?-->', '', contenido, flags=re.S)
    contenido = re.sub(r'<svg\b[^>]*>|</svg>', '', contenido)

    def por_elemento(m):
        etiqueta, attrs = m.group(1), m.group(2)
        pares = re.findall(r'([a-zA-Z-]+)="([^"]*)"', attrs)
        utiles = [(k, v) for k, v in pares if k in GEOMETRIA]
        if not utiles:
            return ''
        texto = ' '.join(f'{k}="{v}"' for k, v in utiles)
        return f'<{etiqueta} {texto}/>'
    contenido = re.sub(r'<(path|circle|rect|line|polyline|polygon|ellipse)\s+([^>]*?)/?>',
                       por_elemento, contenido)
    contenido = re.sub(r'<(g|title|desc)\b[^>]*>|</(g|title|desc)>', '', contenido)
    return re.sub(r'\s+', ' ', contenido).strip()


def construir() -> str:
    if not ICONOS.is_dir():
        sys.exit(f'No encuentro los iconos de Lucide en {ICONOS}\n'
                 'Instálalos con: npm i lucide-static --prefix /tmp/icons')
    version = json.loads(VERSION.read_text())['version'] if VERSION.exists() else '?'
    lineas = [f'<!-- sprite de iconos: Lucide {version} (MIT) — generado por tools/sprite-iconos.py -->',
              '<!-- no editar a mano: corre el script para regenerarlo -->',
              '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">',
              '  <defs>']
    faltantes = []
    for alias, archivo in MAPA.items():
        ruta = ICONOS / f'{archivo}.svg'
        if not ruta.exists():
            faltantes.append(archivo)
            continue
        cuerpo = limpiar(ruta.read_text(encoding='utf-8'))
        lineas.append(f'    <g id="i-{alias}">{cuerpo}</g>')
    for alias, cuerpo in MANUALES.items():
        lineas.append(f'    <g id="i-{alias}">{cuerpo}</g>')
    lineas += ['  </defs>', '</svg>']
    if faltantes:
        print(f'AVISO: faltan en Lucide: {", ".join(faltantes)}', file=sys.stderr)
    return '\n'.join(lineas)


def main():
    sprite = construir()
    html = INDEX.read_text(encoding='utf-8')
    # Reemplaza todo el bloque del sprite hasta el <header> que viene después.
    # (Delimitar por el primer </svg> es frágil: si el bloque quedó con restos de
    # una corrida anterior, el recorte deja basura en el archivo.)
    patron = re.compile(
        r'<!-- (?:sprite de iconos|=+ iconos \(sprite SVG\)).*?(?=<header class="top">)',
        re.S)
    if not patron.search(html):
        sys.exit('No encontré el bloque del sprite en index.html')
    html = patron.sub(lambda _: sprite + '\n\n', html, count=1)
    INDEX.write_text(html, encoding='utf-8')
    print(f'sprite actualizado: {len(MAPA) + len(MANUALES)} iconos, {len(sprite)} bytes')


if __name__ == '__main__':
    main()
