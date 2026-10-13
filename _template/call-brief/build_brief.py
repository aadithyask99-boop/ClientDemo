#!/usr/bin/env python3
"""Render a Maximus Mediascape call brief (2 pages: brief + script) from a JSON file.

Usage: python3 _template/call-brief/build_brief.py <client>/call-brief.json [--out <client>/assets]
Writes call-brief.html, call-brief-p1.png, call-brief-p2.png and call-brief.pdf (needs Playwright + Chromium; set CHROMIUM_PATH if needed).
Evidence tags in the JSON: A = observed (saved file), R = research (link), H = hypothesis, N = not checked yet.
"""
import argparse, base64, html, json, os
from pathlib import Path

BRAND = Path(__file__).resolve().parent.parent / "brand"
e = html.escape


def tag(t):
    return f'<b class="chip {t.lower()}">{t}</b>' if t else ""


def table(head, rows, widths=None):
    h = "".join(f"<th>{e(c)}</th>" for c in head)
    body = ""
    for r in rows:
        cells = ""
        for i, c in enumerate(r):
            cells += f"<td>{tag(c) if head[i] == 'Tag' else e(c)}</td>"
        body += f"<tr>{cells}</tr>"
    return f"<table><thead><tr>{h}</tr></thead><tbody>{body}</tbody></table>"


def ul(items):
    return "<ul>" + "".join(f"<li>{e(i)}</li>" for i in items) + "</ul>"


def build(d):
    css = (BRAND / "brand.css").read_text()
    logo = ""
    lp = BRAND / "logo-m.png"
    if lp.exists():
        logo = '<img class="logo" src="data:image/png;base64,%s">' % base64.b64encode(lp.read_bytes()).decode()
    s = d["script"]
    f = d["first_touch"]
    shots = ''.join('<figure><div class="shot%s"><img src="%s"></div><figcaption><b>%s</b> %s &middot; %s &middot; %s</figcaption></figure>' % (' m' if x.get('mobile') else '', e(x['file']), e(x['title']), tag(x['tag']), e(x['source']), e(x['note'])) for x in d['evidence'])
    ev_html = f'''<div class="page" id="p2"><div class="band">{logo}<h1>Evidence: what we saw</h1><div class="meta">{e(d['client'])} &middot; captured {e(d['date'])} &middot; full-size files are in assets/</div></div>
<div class="in"><div class="shots">{shots}</div><div class="box warn" style="margin-top:12px"><h4 style="margin-top:0">Not captured (blocked or not checked)</h4>{ul(d['not_captured'])}</div></div>
<div class="foot"><b>Maximus Mediascape</b><span>Page 2 of 4 &middot; internal</span></div></div>
'''
    ft_html = f'''<div class="page" id="p4"><div class="band">{logo}<h1>First touch kit</h1><div class="meta">{e(d['client'])} &middot; messages to send around the first call &middot; drafts, edit before sending</div></div>
<div class="in"><div class="box"><h4 style="margin-top:0">Rules for these messages</h4>{ul(f['rules'])}</div>
<div class="grid" style="margin-top:12px"><div class="box"><h4 style="margin-top:0">WhatsApp or text (only if her form allows it)</h4><div class="msg">{e(f['whatsapp'])}</div></div><div class="box"><h4 style="margin-top:0">Voicemail (20 to 30 seconds)</h4><div class="msg">{e(f['voicemail'])}</div></div></div>
<div class="box" style="margin-top:12px"><h4 style="margin-top:0">Email: {e(f['email_subject'])}</h4><div class="msg">{e(f['email_body'])}</div></div>
<h2>Follow-up plan</h2>{table(['When','What to send or do','Tag'],f['cadence'])}
<div class="box warn" style="margin-top:12px"><h4 style="margin-top:0">Consent and records</h4>{ul(f['compliance'])}</div></div>
<div class="foot"><b>Maximus Mediascape</b><span>Page 4 of 4 &middot; internal</span></div></div>
'''
    qs = "".join(f"<div class='qg'><h4>{e(g['group'])}</h4>{ul(g['items'])}</div>" for g in s["questions"])
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Call brief: {e(d['client'])}</title><style>{css}
@page{{size:A4;margin:0}}*{{box-sizing:border-box}}body{{margin:0;background:#ddd;color:var(--ink);font:11.5px/1.42 var(--body)}}
.page{{width:794px;min-height:1123px;background:var(--cream);margin:0 auto 20px;position:relative;page-break-after:always;overflow:hidden}}
.band{{background:var(--red);color:var(--cream);padding:20px 28px 16px}}.band .logo{{height:28px;display:block;margin-bottom:10px}}
.band h1{{font:400 44px/.95 var(--display);margin:0;text-transform:uppercase}}.band .meta{{margin-top:8px;font-size:12px}}
.in{{padding:14px 28px 56px}}h2{{font:400 22px/1 var(--display);margin:14px 0 6px;text-transform:uppercase;letter-spacing:.3px}}h4{{font:400 16px var(--display);margin:8px 0 3px;letter-spacing:.3px}}
table{{border-collapse:collapse;width:100%;background:#fff;font-size:10.8px}}th{{background:var(--ink);color:var(--cream);text-align:left;font:400 14px var(--display);padding:4px 7px}}td{{border:1px solid #e6dccf;padding:4px 7px;vertical-align:top}}
.chip{{display:inline-block;min-width:16px;text-align:center;border-radius:99px;font-size:10px;padding:0 6px}}.a{{background:var(--ink);color:var(--cream)}}.r{{background:var(--dot)}}.h{{background:var(--butter)}}.n{{background:#fff;border:1px solid var(--red);color:var(--red)}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}.box{{background:#fff;border:1px solid #e6dccf;border-radius:10px;padding:8px 12px}}.box.red{{border-color:var(--red);border-width:2px}}.box.warn{{background:var(--blush)}}
ul{{margin:3px 0 0;padding-left:16px}}li{{margin:2px 0}}.big{{font-size:12.5px}}
.foot{{position:absolute;left:0;right:0;bottom:0;background:var(--ink);color:var(--cream);padding:9px 28px;display:flex;justify-content:space-between;font-size:10.5px}}.foot b{{font:400 20px var(--display);letter-spacing:1px}}
.cb:before{{content:"";display:inline-block;width:10px;height:10px;border:1.5px solid var(--ink);margin-right:6px;vertical-align:-1px}}
.q{{columns:2;column-gap:14px}}.qg{{break-inside:avoid}}
.shots{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}figure{{margin:0;background:#fff;border:1px solid #e6dccf;border-radius:10px;padding:8px}}.shot{{height:250px;overflow:hidden;border:1px solid #cfc6ba;background:#fff}}.shot img{{width:100%;display:block}}.shot.m img{{width:46%;margin:0 auto}}figcaption{{font-size:10.5px;margin-top:5px}}
.msg{{white-space:pre-line}}
</style></head><body>
<div class="page" id="p1"><div class="band">{logo}<h1>Call brief: {e(d['client'])}</h1><div class="meta">{e(d['contact_name'])} &middot; prepared {e(d['date'])} &middot; verified by: {e(d.get('verified_by','__________'))} &middot; evidence: {tag('A')} observed {tag('R')} research {tag('H')} hypothesis {tag('N')} not checked</div></div>
<div class="in">
<div class="grid"><div class="box red big"><h4 style="margin-top:0">Why now and what she asked</h4>{e(d['why'])}</div><div class="box big"><h4 style="margin-top:0">Lead score: {e(d['score']['label'])}</h4>{e(d['score']['why'])}</div></div>
<h2>Business snapshot</h2>{table(['Item','What we found','Tag','Source'],d['snapshot'])}
<h2>Three things she will recognise</h2>{table(['What','Why it matters to her','Tag','Source'],d['headlines'])}
<div class="grid" style="margin-top:12px"><div class="box"><h4 style="margin-top:0">Angle (one sentence)</h4>{e(d['angle'])}</div><div class="box"><h4 style="margin-top:0">Offer guardrails</h4>{ul(d['offer'])}</div></div>
<div class="grid" style="margin-top:12px"><div class="box warn"><h4 style="margin-top:0">Do not say</h4>{ul(d['dont_say'])}</div><div class="box"><h4 style="margin-top:0">Check before dialling</h4><ul>{''.join('<li class=cb>'+e(i)+'</li>' for i in d['verify_first'])}</ul></div></div>
</div><div class="foot"><b>Maximus Mediascape</b><span>Page 1 of 4 &middot; internal</span></div></div>
{ev_html}<div class="page" id="p3"><div class="band">{logo}<h1>Call plan and script</h1><div class="meta">{e(d['client'])} &middot; goal: {e(s['goal'])}</div></div>
<div class="in"><h2>Opening (first 30 seconds)</h2><div class="box big">{e(s['opener'])}</div>
<h2>Questions to ask (listen more than talk)</h2><div class="q">{qs}</div>
<h2>If she says&hellip;</h2>{table(['She says','You say'],s['objections'])}
<div class="grid" style="margin-top:12px"><div class="box"><h4 style="margin-top:0">Close</h4>{e(s['close'])}</div><div class="box"><h4 style="margin-top:0">Follow-up email (send same day)</h4>{e(s['followup'])}</div></div>
<h2>Log the call</h2><div class="box"><span class="cb">Reached her</span> &nbsp; <span class="cb">Voicemail</span> &nbsp; <span class="cb">Booked next step</span> &nbsp; <span class="cb">Not a fit</span> &nbsp; Date/time: __________ &nbsp; Real budget: __________ &nbsp; Main pain: __________ &nbsp; Next step and date: __________ &nbsp; Corrections to this brief: ______________________________</div>
</div><div class="foot"><b>Maximus Mediascape</b><span>Page 3 of 4 &middot; internal</span></div></div>
{ft_html}</body></html>"""


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("json"); ap.add_argument("--out")
    a = ap.parse_args(); src = Path(a.json); out = Path(a.out) if a.out else src.parent / "assets"
    out.mkdir(parents=True, exist_ok=True)
    h = out / "call-brief.html"; h.write_text(build(json.loads(src.read_text()))); print("wrote", h)
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            kw = {"args": ["--no-sandbox"]}
            if os.environ.get("CHROMIUM_PATH"): kw["executable_path"] = os.environ["CHROMIUM_PATH"]
            b = p.chromium.launch(**kw); pg = b.new_page(viewport={"width": 900, "height": 1200}, device_scale_factor=2)
            pg.goto(h.resolve().as_uri()); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(1500)
            for i in (1, 2, 3, 4): pg.locator(f"#p{i}").screenshot(path=str(out / f"call-brief-p{i}.png"))
            hs = pg.evaluate("[...document.querySelectorAll('.page')].map(e=>Math.ceil(e.getBoundingClientRect().height))")
            pg.add_style_tag(content="".join(f"@page p{i+1}{{size:794px {h}px;margin:0}}#p{i+1}{{page:p{i+1};min-height:0;margin:0}}" for i, h in enumerate(hs)) + "body{background:none}")
            pg.pdf(path=str(out / "call-brief.pdf"), prefer_css_page_size=True, print_background=True); b.close()
        print("wrote PNG pages and PDF")
    except Exception as ex:
        print("PNG/PDF skipped:", ex)

if __name__ == "__main__":
    main()
