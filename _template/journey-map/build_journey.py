#!/usr/bin/env python3
"""Render a Maximus Mediascape branded customer journey map.

Usage:  python3 _template/journey-map/build_journey.py <client>/journey.json [--out <client>/assets]
Writes customer-journey-map.html and (if Playwright + Chromium are available) customer-journey-map.png.
Set CHROMIUM_PATH to a Chromium/Chrome executable if Playwright's own browser is not installed.
"""
import argparse, base64, html, json, os, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BRAND = HERE.parent / "brand"
W = 1920
PAD = 40
LEFT = 150


def tag(text):
    t = html.escape(text)
    t = re.sub(r"\[R: ([^\]]*)\]", r'<b class="chip r">R</b> <i>\1</i>', t)
    for k, c in (("A", "a"), ("R", "r"), ("H", "h")):
        t = t.replace(f"[{k}]", f'<b class="chip {c}">{k}</b>')
    return t


def curve(vals, colw, y0=150, step=30):
    pts = [(LEFT + colw * i + colw / 2, y0 - (v - 1) * step) for i, v in enumerate(vals)]
    return pts


def path(pts, a=0, b=None):
    b = len(pts) - 1 if b is None else b
    return " ".join(("M" if i == a else "L") + f"{pts[i][0]:.0f} {pts[i][1]:.0f}" for i in range(a, b + 1))


def build(data):
    stages = data["stages"]
    n = len(stages)
    inner = W - 2 * PAD
    colw = (inner - LEFT) / n
    emo = data["emotion"]
    today = curve(emo["today"], colw)
    target = curve(emo["target"], colw)
    obs = int(emo.get("observed_until", n - 1))
    low = min(range(n), key=lambda i: emo["today"][i])
    dots = "".join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="6" fill="#e10600"/>' for x, y in today)
    dots += "".join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="6" fill="#064a2a"/>' for x, y in target)
    head = "".join(f'<th><div class="n">{html.escape(s["name"])}</div><div class="s">{html.escape(s["label"])}</div></th>' for s in stages)
    rows = ""
    for label, key, cls in (("What the customer does", "does", ""), ("Touchpoints", "touchpoints", ""),
                            ("Pain points today", "pain", "pain"), ("Opportunities", "opportunity", "opp")):
        rows += f'<tr class="{cls}"><th class="row">{label}</th>' + "".join(f"<td>{tag(s.get(key, ''))}</td>" for s in stages) + "</tr>"
    logo = ""
    lp = BRAND / "logo-m.png"
    if lp.exists():
        logo = '<img class="logo" alt="Maximus Mediascape" src="data:image/png;base64,%s">' % base64.b64encode(lp.read_bytes()).decode()
    css = (BRAND / "brand.css").read_text()
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{html.escape(data['title'])}: {html.escape(data['client'])}</title>
<style>{css}
*{{box-sizing:border-box}}
body{{margin:0;width:{W}px;background:var(--cream);color:var(--ink);font:14px/1.5 var(--body)}}
.band{{background:var(--red);color:var(--cream);padding:34px {PAD}px 30px;position:relative;overflow:hidden}}
.band .logo{{height:44px;display:block;margin-bottom:18px}}
.band h1{{font:400 76px/.95 var(--display);margin:0;letter-spacing:.5px;text-transform:uppercase}}
.band h1 em{{font:italic 500 62px var(--accent);text-transform:none;letter-spacing:0}}
.band .sub{{margin-top:12px;font-size:16px;max-width:1200px}}
.band .star{{position:absolute;right:70px;top:40px;width:130px;height:130px;opacity:.95}}
.band .badge{{position:absolute;right:230px;top:60px;background:var(--royal);color:var(--cream);font:400 30px/1 var(--display);padding:30px 24px;border-radius:50% 46% 52% 44%;transform:rotate(-8deg)}}
.wrap{{padding:26px {PAD}px 0}}
table{{border-collapse:collapse;width:100%;table-layout:fixed;background:#fff}}
th.row{{width:{LEFT}px;text-align:left;background:var(--cream);padding:10px;font:400 20px var(--display);letter-spacing:.5px}}
td,th{{border:1px solid #e6dccf;padding:10px;vertical-align:top}}
thead th{{background:var(--ink);color:var(--cream);text-align:left;border-color:var(--ink)}}
thead th.row{{background:var(--ink)}}
.n{{font:400 26px/1 var(--display);letter-spacing:.5px;color:var(--butter)}} .s{{font-size:12.5px;margin-top:4px}}
tr.pain td{{background:var(--blush)}} tr.opp td{{background:var(--mint)}}
.chip{{display:inline-block;min-width:17px;text-align:center;border-radius:99px;font-size:11px;padding:0 6px;margin-right:2px}}
.a{{background:var(--ink);color:var(--cream)}} .r{{background:var(--dot);color:var(--ink)}} .h{{background:var(--butter);color:var(--ink)}}
i{{font-style:normal;color:#5d5149}}
.emo{{margin-bottom:6px;border-radius:18px;background:#fff;border:1px solid #e6dccf;overflow:hidden}}
.key{{font-size:13px;margin:8px 0 18px}} .key span{{margin-right:22px;font-weight:700}}
.legend{{font-size:12.5px;color:#5d5149;padding:14px 0 18px}}
footer{{background:var(--ink);color:var(--cream);padding:22px {PAD}px;display:flex;justify-content:space-between;align-items:baseline}}
footer b{{font:400 44px var(--display);letter-spacing:1px}} footer span{{font:italic 500 18px var(--accent)}}
</style></head><body>
<div class="band">{logo}
<h1>{html.escape(data['title'])}: <em>{html.escape(data['client'])}</em></h1>
<div class="sub">{html.escape(data['subtitle'])}</div>
<svg class="star" viewBox="0 0 100 100"><g stroke="#064a2a" stroke-width="16" stroke-linecap="round"><path d="M50 8v84M13 29l74 42M13 71l74-42"/></g></svg></div>
<div class="wrap">
<table><thead><tr><th class="row"></th>{head}</tr></thead></table>
<div class="emo"><svg width="{inner}" height="200" viewBox="0 0 {inner} 200">
<text x="12" y="28" font-size="13" font-weight="700" fill="#17090a">Customer feeling</text>
<text x="12" y="62" font-size="11" fill="#a0948a">confident</text><text x="12" y="176" font-size="11" fill="#a0948a">frustrated</text>
<path d="{path(target)}" fill="none" stroke="#064a2a" stroke-width="4" stroke-dasharray="8 6"/>
<path d="{path(today,0,obs)}" fill="none" stroke="#e10600" stroke-width="4"/>
<path d="{path(today,obs)}" fill="none" stroke="#e10600" stroke-width="4" stroke-dasharray="2 7"/>
{dots}
<text x="{today[low][0]:.0f}" y="{today[low][1]+30:.0f}" text-anchor="middle" font-size="13" font-weight="800" fill="#e10600">{html.escape(emo.get('callout',''))}</text>
</svg></div>
<div class="key"><span style="color:#e10600">&#9644; Today (solid = observed, dotted = hypothesis)</span><span style="color:#064a2a">&#9644; Target after fixes (dashed)</span></div>
<table><tbody>{rows}</tbody></table>
<div class="legend">{tag(data.get('source_note',''))}</div></div>
<footer><b>Maximus Mediascape</b><span>Prepared {html.escape(data.get('date',''))}</span></footer>
</body></html>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("json")
    ap.add_argument("--out")
    a = ap.parse_args()
    src = Path(a.json)
    out = Path(a.out) if a.out else src.parent / "assets"
    out.mkdir(parents=True, exist_ok=True)
    data = json.loads(src.read_text())
    doc = build(data)
    h = out / "customer-journey-map.html"
    h.write_text(doc)
    print("wrote", h)
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            kw = {"args": ["--no-sandbox"]}
            if os.environ.get("CHROMIUM_PATH"):
                kw["executable_path"] = os.environ["CHROMIUM_PATH"]
            b = p.chromium.launch(**kw)
            pg = b.new_page(viewport={"width": W, "height": 1000})
            pg.goto(h.resolve().as_uri())
            pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(1500)
            png = out / "customer-journey-map.png"
            pg.screenshot(path=str(png), full_page=True)
            b.close()
        print("wrote", png)
    except Exception as e:
        print("PNG skipped (install playwright + chromium, or open the HTML and screenshot it):", e)


if __name__ == "__main__":
    main()
