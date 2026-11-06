"""One-off edit: native CSS cursor (always visible), and remove the hand-drawn cheese drips (a video replaces them)."""
import re, urllib.parse
root = '/home/user/ClientDemo/smashlads/'

def rd(p): return open(root + p).read()
def wr(p, s): open(root + p, 'w').write(s)

arrow = ('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">'
         '<path d="M9 6 L9 36 L16.5 29 L21.5 41.5 L28.5 38.5 L23.5 26.5 L33.5 26 Z" fill="#1F3FD9"/>'
         '<path d="M6 3 L6 33 L13.5 26 L18.5 38.5 L25.5 35.5 L20.5 23.5 L30.5 23 Z" fill="#FFFFFF" stroke="#14162B" stroke-width="3.2" stroke-linejoin="round"/>'
         '<path d="M10 10 L10 21" stroke="#D5DAF7" stroke-width="3" stroke-linecap="round"/></svg>')
hand = ('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">'
        '<path d="M20 6 A4.2 4.2 0 0 1 28.4 6 V18 A3.6 3.6 0 0 1 35.4 17.5 A3.6 3.6 0 0 1 42.4 19.5 A3.4 3.4 0 0 1 48 22 V33 Q48 45 36 45 H26 Q17 45 12.5 37 L6 27.5 A3.3 3.3 0 0 1 11.5 24 L20 30 Z" fill="#1F3FD9"/>'
        '<path d="M17 4 A4.2 4.2 0 0 1 25.4 4 V17 A3.6 3.6 0 0 1 32.4 16.5 A3.6 3.6 0 0 1 39.4 18.5 A3.4 3.4 0 0 1 45 21 V32 Q45 44 33 44 H23 Q14 44 9.5 36 L3 26.5 A3.3 3.3 0 0 1 8.5 23 L17 29 Z" fill="#FFFFFF" stroke="#14162B" stroke-width="3" stroke-linejoin="round"/>'
        '<path d="M25 22 V30 M32 22 V30 M39 24 V30" stroke="#14162B" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.5"/></svg>')
q = lambda s: "url(\"data:image/svg+xml," + urllib.parse.quote(s, safe="/:=' ") .replace('"', "'") + "\")"
A, H = q(arrow), q(hand)

c = rd('src/styles/global.css')
a = c.index('/* ---------- cartoon cursor (mouse only)')
b = c.index('/* ---------- locations and contact overlays')
c = c[:a] + (
    '/* ---------- cartoon cursor: the browser\'s own cursor with a drawn arrow and glove, so it can never go missing ---------- */\n'
    f'html, body {{ cursor: {A} 5 3, auto; }}\n'
    f'a, button, [data-part], .chip, .layer, .cat__name, .card, .pill, summary, select, label[for], .game {{ cursor: {H} 12 3, pointer; }}\n'
    'input, textarea { cursor: text; }\n\n'
) + c[b:]
# remove the drip styles
a = c.index('/* ---------- melting cheese ---------- */')
b = c.index('/* ---------- cart ---------- */')
c = c[:a] + c[b:]
c = c.replace('.game { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 4; cursor: crosshair; touch-action: pan-y; }',
              '.game { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 4; touch-action: pan-y; }')
c = c.replace('button { background: none; border: 0; cursor: pointer; }', 'button { background: none; border: 0; }')
wr('src/styles/global.css', c)

p = rd('src/pages/index.astro')
a = p.index('<div class="cursor" data-cursor aria-hidden="true">'); b = p.index('</div>', p.index('cur--hand', a)) + 6
p = p[:a] + p[b:].lstrip('\n')
p = re.sub(r'\n\s*<div class="drips" aria-hidden="true" data-hdrips>.*?</div>', '', p, flags=re.S)
p = p.replace('    <div class="cap" aria-hidden="true" data-cap></div>\n', '')
wr('src/pages/index.astro', p)

m = rd('src/scripts/main.ts')
m = m.replace("import { initCursor } from './cursor';\n", '').replace('initCursor(reduce);\n', '')
a = m.index('/* ---------------- melting cheese')
b = m.index('/* ---------------- in-page links')
m = m[:a] + m[b:]
wr('src/scripts/main.ts', m)
print('ok', 'drips' in p, 'data-cursor' in p)
