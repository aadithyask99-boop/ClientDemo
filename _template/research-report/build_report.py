#!/usr/bin/env python3
"""Build a Maximus Mediascape research report (branded HTML + PDF) from <client>/research-report.md.

Usage: python3 _template/research-report/build_report.py <client>/research-report.md
- Put <!--MANIFEST--> where the evidence manifest (file, size, SHA-256) should appear.
- Tags [A] [R] [H] [N] in the text become coloured chips.
Needs: pip install markdown playwright (and a Chromium; set CHROMIUM_PATH if needed).
"""
import hashlib, os, re, sys
from pathlib import Path
import markdown

BRAND = Path(__file__).resolve().parent.parent / "brand"
DESC = {"sources": "Source capture (public site or record)", "competitors": "Competitor capture", "lighthouse": "Lighthouse report", "pa11y": "Pa11y (axe) results", "tech-scan": "Technology scan (wappalyzer-next)", "jev-seo-charts": "jev-seo chart"}
SKIP = {".html"}


def manifest(base):
    rows = ["| File | What it is | Size (KB) | SHA-256 (first 16) |", "|---|---|---|---|"]
    for f in sorted((base / "assets").rglob("*")):
        if not f.is_file() or f.suffix in SKIP or f.name.startswith("."):
            continue
        rel = f.relative_to(base)
        kind = DESC.get(f.parent.name, "Tool output or screenshot")
        rows.append(f"| `{rel}` | {kind} | {f.stat().st_size // 1024} | `{hashlib.sha256(f.read_bytes()).hexdigest()[:16]}` |")
    return "\n".join(rows)


def main():
    src = Path(sys.argv[1]).resolve()
    base = src.parent
    text = src.read_text().replace("<!--MANIFEST-->", "All captures are dated 13 October 2026 unless the file name says otherwise.\n\n" + manifest(base))
    body = markdown.markdown(text, extensions=["tables", "sane_lists"])
    for k, c in (("A", "a"), ("R", "r"), ("H", "h"), ("N", "n")):
        body = body.replace(f"[{k}]", f'<b class="chip {c}">{k}</b>')
    body = re.sub(r"<h1>(.*?)</h1>", r'<div class="band"><img class="logo" src="logo-m.png"><h1>\1</h1></div>', body, count=1)
    css = (BRAND / "brand.css").read_text()
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Lead research report</title><style>{css}
*{{box-sizing:border-box}}body{{margin:0;background:var(--cream);color:var(--ink);font:12px/1.5 var(--body)}}
.wrap{{padding:0 26px 30px}}.band{{background:var(--red);color:var(--cream);margin:0 -26px 16px;padding:22px 26px 18px}}.band .logo{{height:30px;display:block;margin-bottom:10px}}.band h1{{font:400 46px/.95 var(--display);margin:0;text-transform:uppercase}}
h2{{font:400 28px/1 var(--display);margin:22px 0 8px;text-transform:uppercase;border-bottom:3px solid var(--red);padding-bottom:3px;break-after:avoid}}h3{{font:400 20px var(--display);margin:14px 0 4px;letter-spacing:.3px;break-after:avoid}}
table{{border-collapse:collapse;width:100%;background:#fff;font-size:10.8px;margin:6px 0 10px}}th{{background:var(--ink);color:var(--cream);text-align:left;font:400 14px var(--display);padding:4px 7px}}td{{border:1px solid #e6dccf;padding:4px 7px;vertical-align:top}}tr{{break-inside:avoid}}
img{{max-width:100%;border:1px solid #cfc6ba;display:block;margin:6px 0 12px;background:#fff}}.band img{{border:0;margin:0 0 10px;background:none}}
.chip{{display:inline-block;min-width:15px;text-align:center;border-radius:99px;font-size:9.5px;padding:0 5px}}.a{{background:var(--ink);color:var(--cream)}}.r{{background:var(--dot)}}.h{{background:var(--butter)}}.n{{background:#fff;border:1px solid var(--red);color:var(--red)}}
code{{font-size:10px;word-break:break-all}}li{{margin:2px 0}}a{{color:var(--red)}}
footer{{background:var(--ink);color:var(--cream);margin:20px -26px -30px;padding:14px 26px;font:400 22px var(--display);letter-spacing:1px}}
</style></head><body><div class="wrap">{body}<footer>Maximus Mediascape</footer></div></body></html>"""
    (base / "logo-m.png").write_bytes((BRAND / "logo-m.png").read_bytes()) if (BRAND / "logo-m.png").exists() else None
    out = base / "research-report.html"
    out.write_text(html)
    print("wrote", out)
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            kw = {"args": ["--no-sandbox"]}
            if os.environ.get("CHROMIUM_PATH"):
                kw["executable_path"] = os.environ["CHROMIUM_PATH"]
            b = p.chromium.launch(**kw)
            pg = b.new_page()
            pg.goto(out.resolve().as_uri())
            pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(2000)
            pdf = base / "assets" / "research-report.pdf"
            pg.pdf(path=str(pdf), format="A4", print_background=True, margin={"top": "10mm", "bottom": "10mm", "left": "0", "right": "0"})
            b.close()
        print("wrote", pdf)
    except Exception as e:
        print("PDF skipped:", e)


if __name__ == "__main__":
    main()
