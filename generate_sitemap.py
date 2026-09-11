#!/usr/bin/env python3
"""Regenerate sitemap.xml from Data/artworks.json.

Run from repo root:
    python3 generate_sitemap.py

Reads:
  - Data/artworks.json (canonical artwork list)
Writes:
  - sitemap.xml (overwrites)

Static pages and the artwork detail URL pattern are baked in here.
"""
import json
from datetime import date

SITE = "https://nihongadreams.com"
TODAY = date.today().isoformat()

STATIC_PAGES = [
    {"loc": f"{SITE}/", "priority": "1.0", "changefreq": "monthly"},
    {"loc": f"{SITE}/privacy.html", "priority": "0.3", "changefreq": "yearly"},
]


def main():
    with open("Data/artworks.json", encoding="utf-8") as f:
        artworks = json.load(f)

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

    for page in STATIC_PAGES:
        lines += [
            "  <url>",
            f"    <loc>{page['loc']}</loc>",
            f"    <lastmod>{TODAY}</lastmod>",
            f"    <changefreq>{page['changefreq']}</changefreq>",
            f"    <priority>{page['priority']}</priority>",
            "  </url>",
        ]

    for art in artworks:
        slug = art.get("slug")
        if not slug:
            continue
        lines += [
            "  <url>",
            f"    <loc>{SITE}/artwork.html?slug={slug}</loc>",
            f"    <lastmod>{TODAY}</lastmod>",
            "    <changefreq>monthly</changefreq>",
            "    <priority>0.8</priority>",
            "  </url>",
        ]

    lines.append("</urlset>")
    lines.append("")

    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Wrote sitemap.xml: {len(STATIC_PAGES)} static + {len(artworks)} artworks")


if __name__ == "__main__":
    main()
