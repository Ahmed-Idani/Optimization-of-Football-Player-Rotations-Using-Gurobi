"""
Fill in player photos the Premier League CDN doesn't publish, using Wikimedia.

The PL photo CDN covers roughly two thirds of the league — mostly missing
recent signings and academy players. This tops the rest up from Wikimedia
Commons, and *only* accepts freely licensed images (CC0 / CC BY / CC BY-SA /
public domain). Anything under a restrictive licence is skipped and the
generated avatar is kept.

Attribution for every image used is appended to
frontend/public/images/players/ATTRIBUTION.md, as those licences require.

Resumable: progress is written after each player, so it can be re-run safely
and will simply pick up whoever still needs an image.

    python fetch_wiki_photos.py [--limit N]
"""

import csv
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
CSV_FILE = HERE / "players_scaffold.csv"
PUBLIC = HERE.parent / "frontend" / "public"
ATTRIBUTION = PUBLIC / "images" / "players" / "ATTRIBUTION.md"

UA = {"User-Agent": "FootballRotationPlanner/1.0 (university project; contact: local)"}
FREE_LICENCES = ("cc0", "cc by", "cc-by", "public domain", "pd-", "attribution")
FIELDS = ["team_name", "player_name", "age", "nationality",
          "potential_goals_per_game", "physicality", "image_path",
          "data_source", "photo_source"]
PAUSE = 0.7


def api(host, params):
    url = f"https://{host}/w/api.php?" + urllib.parse.urlencode(params)
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(request, timeout=20) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                time.sleep(5 * (attempt + 1))
                continue
            return {}
        except Exception:
            return {}
    return {}


def strip_html(value):
    return re.sub("<[^>]+>", "", value or "").strip()


def lookup(name, club):
    """Resolve the player's article and lead image in a single request.

    The search endpoint is aggressively rate limited, so we go straight to the
    title (redirects=1 handles spelling variants like Ekitike -> Ekitiké) and
    pull the intro text in the same call to confirm it's the right person.
    """
    found = api("en.wikipedia.org", {
        "action": "query", "format": "json",
        "prop": "pageimages|extracts", "piprop": "original",
        "exintro": 1, "explaintext": 1,
        "titles": name, "redirects": 1,
    })
    time.sleep(PAUSE)
    page = next(iter(found.get("query", {}).get("pages", {}).values()), {})
    if "missing" in page:
        return None, None

    text = (page.get("extract") or "").lower()
    if "football" not in text:
        return None, None
    # Guard against namesakes: the club or the league should be mentioned.
    if club.split()[0].lower() not in text and "premier league" not in text:
        return None, None

    return page.get("title", name), page.get("original", {}).get("source")


def free_image_for(source):
    """Return (bytes, licence, author, page_url, file_url) if freely licensed."""
    if not source:
        return None

    # The API appends tracking params (?utm_source=...) — strip them or the
    # File: title won't resolve on Commons.
    bare = source.split("?", 1)[0]
    filename = "File:" + urllib.parse.unquote(bare.rsplit("/", 1)[-1])
    meta_response = api("commons.wikimedia.org", {
        "action": "query", "format": "json", "prop": "imageinfo",
        "iiprop": "extmetadata|url", "iiurlwidth": 400, "titles": filename,
    })
    time.sleep(PAUSE)
    info = next(iter(meta_response.get("query", {}).get("pages", {}).values()), {})
    info = (info.get("imageinfo") or [{}])[0]
    meta = info.get("extmetadata", {})
    licence = strip_html(meta.get("LicenseShortName", {}).get("value", ""))

    if not any(free in licence.lower() for free in FREE_LICENCES):
        return None, licence

    url = info.get("thumburl") or source
    try:
        request = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read()
    except Exception:
        return None, licence

    author = strip_html(meta.get("Artist", {}).get("value", "")) or "unknown"
    return data, licence, author, info.get("descriptionurl", ""), url


def main():
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])

    rows = list(csv.DictReader(open(CSV_FILE, encoding="utf-8")))
    pending = [r for r in rows
               if not r.get("photo_source", "").startswith(("premierleague", "Wikimedia"))]
    if limit:
        pending = pending[:limit]

    print(f"{len(pending)} players still need a photo")
    added = 0

    for row in pending:
        name, club = row["player_name"], row["team_name"]
        title, source = lookup(name, club)
        if not title:
            print(f"  {name:26} no matching article")
            continue
        if not source:
            print(f"  {name:26} article has no photo")
            continue

        result = free_image_for(source)
        if not result or result[0] is None:
            licence = result[1] if result and len(result) > 1 else "none"
            print(f"  {name:26} no free image ({licence or 'unknown'})")
            continue

        data, licence, author, page_url, file_url = result
        suffix = ".jpg" if file_url.lower().split("?")[0].endswith((".jpg", ".jpeg")) else ".png"
        target = (PUBLIC / row["image_path"].lstrip("/")).with_suffix(suffix)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)

        row["image_path"] = "/" + str(target.relative_to(PUBLIC))
        row["photo_source"] = f"Wikimedia Commons ({licence})"
        added += 1
        print(f"  {name:26} OK  {licence}")

        # Save after every player so an interruption costs nothing.
        with open(CSV_FILE, "w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(rows)

        ATTRIBUTION.parent.mkdir(parents=True, exist_ok=True)
        if not ATTRIBUTION.exists():
            ATTRIBUTION.write_text(
                "# Player photo attribution\n\n"
                "Photos below come from Wikimedia Commons under free licences.\n"
                "Credit is given as those licences require.\n\n", encoding="utf-8")
        with ATTRIBUTION.open("a", encoding="utf-8") as handle:
            handle.write(f"- **{name}** — [{title}]({page_url}) by {author}, {licence}\n")

    print(f"\nadded {added} photos")


if __name__ == "__main__":
    main()
