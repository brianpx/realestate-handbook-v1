#!/usr/bin/env python3
"""Draws the handbook diagrams described in docs/chapter-reviews/ as SVG files.

Usage: python3 docs/diagrams/build_diagrams.py public/images/diagrams
Standard library only. Also writes manifest.json (file, alt text, caption).
"""
import html
import json
import math
import pathlib
import sys

OUT = pathlib.Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)

NAVY, BLUE, DEEP, SLATE, GREY, AMBER, PANEL = (
    "#0F172A", "#2563EB", "#1E3A8A", "#334155", "#CBD5E1", "#B45309", "#F8FAFC")
KINDS = {  # fill, stroke, text
    "blue": (BLUE, BLUE, "#FFFFFF"),
    "deep": (DEEP, DEEP, "#FFFFFF"),
    "light": ("#DBEAFE", BLUE, NAVY),
    "pale": ("#EFF6FF", GREY, NAVY),
    "warn": ("#FFFFFF", AMBER, AMBER),
    "warnfill": ("#FEF3C7", AMBER, "#78350F"),
    "grey": ("#F1F5F9", GREY, SLATE),
    "white": ("#FFFFFF", GREY, NAVY),
}
COLORS = {"blue": BLUE, "amber": AMBER, "grey": "#94A3B8", "deep": DEEP}
FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
esc = lambda s: html.escape(s, quote=False)
ITAL = ' font-style="italic"'
DASHC = ' stroke-dasharray="6 5"'


def wrap(text, maxw, fs, bold=False):
    cw = fs * (0.58 if bold else 0.54)
    limit = max(4, int(maxw / cw))
    out = []
    for para in text.split("\n"):
        line = ""
        for word in para.split(" "):
            cand = (line + " " + word).strip()
            if len(cand) <= limit or not line:
                line = cand
            else:
                out.append(line)
                line = word
        out.append(line)
    return out


def block(cx, cy, paras, maxw, anchor="middle", color=NAVY):
    """paras: list of (text, fs, weight, fill[, italic]). Vertically centred on cy."""
    lines = []
    for p in paras:
        text, fs, wt, fill = p[:4]
        ital = len(p) > 4 and p[4]
        for ln in wrap(text, maxw, fs, wt in ("600", "700")):
            lines.append((ln, fs, wt, fill, ital))
    total = sum(l[1] * 1.28 for l in lines)
    y = cy - total / 2
    out = []
    for ln, fs, wt, fill, ital in lines:
        y += fs * 1.28
        out.append(
            f'<text x="{cx}" y="{y - fs*0.28:.1f}" text-anchor="{anchor}" font-size="{fs}" '
            f'font-weight="{wt}" fill="{fill}"{ITAL if ital else ""}>{esc(ln)}</text>')
    return "".join(out)


def box(x, y, w, h, content, kind="light", fs=20, bold=True, r=14, dash=False, sw=2):
    fill, stroke, tc = KINDS[kind]
    if isinstance(content, str):
        paras = [(content, fs, "600" if bold else "400", tc)]
    else:
        title, body = content
        paras = [(title, fs, "700", tc), (body, max(14, fs - 3), "400", tc)]
    d = ' stroke-dasharray="8 6"' if dash else ""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"{d}/>' + block(x + w / 2, y + h / 2, paras, w - 24))


def label(x, y, text, fs=18, fill=SLATE, anchor="middle", wt="400", ital=False):
    st = ' font-style="italic"' if ital else ""
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-size="{fs}" font-weight="{wt}" fill="{fill}"{st}>{esc(text)}</text>'


def bullets(x, y, items, maxw, fs=18, fill=SLATE, gap=10):
    out, cy = [], y
    for it in items:
        lines = wrap(it, maxw - 20, fs)
        out.append(f'<circle cx="{x+5}" cy="{cy - fs*0.3:.1f}" r="3.5" fill="{BLUE}"/>')
        for i, ln in enumerate(lines):
            out.append(label(x + 20, cy, ln, fs, fill, "start"))
            cy += fs * 1.3
        cy += gap
    return "".join(out)


def path(d, color="blue", dash=False, width=3, head=True, fill="none"):
    c = COLORS.get(color, color)
    mk = f' marker-end="url(#ah-{color})"' if head and color in COLORS else ""
    ds = ' stroke-dasharray="9 7"' if dash else ""
    return f'<path d="{d}" fill="{fill}" stroke="{c}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"{ds}{mk}/>'


def arrow(x1, y1, x2, y2, color="blue", dash=False, width=3):
    return path(f"M{x1},{y1} L{x2},{y2}", color, dash, width)


def edge(cx, cy, w, h, tx, ty, pad=6):
    """Point on the rectangle boundary (centre cx,cy) in the direction of (tx,ty)."""
    dx, dy = tx - cx, ty - cy
    if dx == 0 and dy == 0:
        return cx, cy
    s = min((w / 2) / abs(dx) if dx else 1e9, (h / 2) / abs(dy) if dy else 1e9)
    d = math.hypot(dx, dy)
    k = s + pad / d
    return cx + dx * k, cy + dy * k


def link(a, b, color="blue", dash=False, width=3):
    """Arrow between two rect tuples (cx, cy, w, h)."""
    x1, y1 = edge(*a, b[0], b[1])
    x2, y2 = edge(*b, a[0], a[1], pad=8)
    return arrow(round(x1), round(y1), round(x2), round(y2), color, dash, width)


def diamond(cx, cy, w, h, text, fs=16, kind="white"):
    fill, stroke, tc = KINDS[kind]
    pts = f"{cx},{cy-h/2} {cx+w/2},{cy} {cx},{cy+h/2} {cx-w/2},{cy}"
    return (f'<polygon points="{pts}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
            + block(cx, cy, [(text, fs, "600", tc)], w * 0.56))


# The interactive widgets already draw these three, so no static copy is shipped.
SKIP = {"fig-nurture-timeline", "fig-pitfall-cycle", "fig-response-window"}


def page(name, title, caption, body, alt, w=1280, h=720, cap_color=SLATE):
    if name in SKIP:
        return
    defs = "".join(
        f'<marker id="ah-{k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>' for k, c in COLORS.items())
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" '
           f'aria-labelledby="t d" font-family="{FONT}">'
           f'<title id="t">{esc(title)}</title><desc id="d">{esc(alt)}</desc><defs>{defs}</defs>'
           f'<rect width="{w}" height="{h}" fill="#FFFFFF"/>'
           f'<rect x="14" y="14" width="{w-28}" height="{h-28}" rx="18" fill="{PANEL}" stroke="{GREY}" stroke-width="1.5"/>'
           f'{label(46, 66, title, 32, NAVY, "start", "700")}'
           f'{body}'
           f'{label(46, h-34, caption, 19, cap_color, "start", ital=True)}'
           f'</svg>')
    (OUT / f"{name}.svg").write_text(svg, encoding="utf-8")
    MANIFEST[name] = {"file": f"/images/diagrams/{name}.svg", "title": title, "alt": alt, "caption": caption}


MANIFEST = {}

# ---------------------------------------------------------------- preface
b = []
for i, (x, t, d) in enumerate([(80, "1  Find", "Sphere, open houses, online leads, farming"),
                               (480, "2  Nurture", "Calls, texts and emails over 90 days"),
                               (880, "3  Keep", "Post-close plan, anniversary, referrals")]):
    b.append(box(x, 140, 320, 190, (t, d), "light", fs=28))
b += [arrow(400, 235, 478, 235), arrow(800, 235, 878, 235),
      path("M1040,332 L1040,430 L240,430 L240,334", "deep", width=6),
      label(640, 468, "Referrals send new people back to Find", 22, DEEP, wt="700"),
      box(80, 510, 1120, 90, ("Your CRM", "Where every contact, task and follow-up plan lives"), "grey", fs=24)]
page("fig-lifecycle", "Figure 1. The client lifecycle", "Every chapter serves one of these three jobs.", "".join(b),
     "Three boxes in a loop: Find, Nurture, Keep. An arrow labelled Referrals leads from Keep back to Find. A bar beneath, labelled Your CRM, holds all three.")

cols = [("PART I", "Foundations", "Ch. 1", "Set a number"),
        ("PART II", "Find", "Ch. 2–3", "Start conversations"),
        ("PART III", "Your Operating System", "Ch. 4", "Set up your CRM"),
        ("PART IV", "Nurture", "Ch. 5–6", "Follow up and know what to say"),
        ("PART V", "Stay on Track", "Ch. 7–8", "Protect your week"),
        ("PART VI", "Serve and Keep", "Ch. 9–11", "Consult, stay in touch, follow the rules"),
        ("PART VII", "Execute", "Ch. 12–13", "Date the plan")]
cw, gap, x0 = 156, 16, 46
b = []
for i, (p, n, c, a) in enumerate(cols):
    x = x0 + i * (cw + gap)
    b.append(f'<rect x="{x}" y="250" width="{cw}" height="250" rx="14" fill="#FFFFFF" stroke="{GREY}" stroke-width="2"/>')
    b.append(block(x + cw / 2, 375, [(p, 14, "700", BLUE), (n, 20, "700", NAVY), (c, 16, "400", SLATE), (a, 17, "400", SLATE, True)], cw - 20))
for (s, e, name, kind, y) in [(1, 3, "Find", "blue", 140), (3, 5, "Nurture", "deep", 176), (5, 6, "Keep", "light", 212)]:
    xs, xe = x0 + s * (cw + gap), x0 + e * (cw + gap) + cw
    fill, stroke, tc = KINDS[kind]
    b.append(f'<rect x="{xs}" y="{y}" width="{xe-xs}" height="28" rx="14" fill="{fill}" stroke="{stroke}"/>')
    b.append(label((xs + xe) / 2, y + 20, name, 17, tc, wt="700"))
b.append(box(46, 535, 1188, 64, "Appendices A–F: scorecard, plan kits, checklists, glossary, tools, links", "grey", fs=19, bold=False))
page("fig-book-map", "How the handbook is organized", "Seven parts, three jobs: find, nurture, keep.", "".join(b),
     "Seven columns for Parts I to VII with their chapters and what the reader does. Brackets above show Find spanning Parts II to IV, Nurture spanning IV to VI, and Keep at Part VI. A bar below lists the appendices.")

# ---------------------------------------------------------------- ch1
rows = [("Income goal: $80,000", 880, "deep"), ("Closings: 13 (÷ $6,500 each)", 780, "deep"),
        ("Appointments: 39 (about 3 per closing)", 680, "blue"),
        ("Conversations: about 780 (about 20 per appointment)", 600, "blue"),
        ("Per week: about 16 (÷ 48 weeks)", 480, "blue"), ("Per day: 3 to 4", 380, "warnfill")]
b, y = [], 110
for t, w, k in rows:
    b.append(box(500 - w / 2, y, w, 62, t, k, fs=19))
    y += 76
b += [f'<path d="M965,110 L980,110 L980,320 L965,320" fill="none" stroke="{GREY}" stroke-width="3"/>',
      label(992, 222, "Lagging: results", 19, DEEP, "start", "700"),
      f'<path d="M965,338 L980,338 L980,548 L965,548" fill="none" stroke="{GREY}" stroke-width="3"/>',
      label(992, 450, "Leading: activity", 19, BLUE, "start", "700"),
      label(500, 598, "This is the only number you control today.", 22, AMBER, wt="700")]
page("fig-goal-ladder", "Figure 1.1. From an income goal to a daily number",
     "Work backward until you reach something you can do tomorrow morning.", "".join(b),
     "A funnel of six bars narrowing from an $80,000 income goal to 13 closings, 39 appointments, about 780 conversations, about 16 a week and 3 to 4 a day. The top three are lagging results and the bottom three are leading activity.")

# ---------------------------------------------------------------- ch2
b = [f'<rect x="140" y="110" width="760" height="480" fill="#FFFFFF" stroke="{GREY}" stroke-width="2"/>',
     f'<rect x="520" y="350" width="380" height="240" fill="#DBEAFE" opacity="0.6"/>',
     label(710, 578, "Where new agents start", 17, DEEP, wt="700"),
     label(520, 628, "Your time (low → high)", 20, SLATE, wt="600"),
     f'<text transform="translate(96,350) rotate(-90)" text-anchor="middle" font-size="20" font-weight="600" fill="{SLATE}">Your money (low → high)</text>']
for x, y, t, k in [(590, 505, "Sphere and referrals", "blue"), (590, 440, "Open houses", "blue"),
                   (570, 375, "Expired listings and FSBOs", "blue"), (330, 270, "Own website and ads", "deep"),
                   (170, 160, "Portal leads", "deep")]:
    b.append(box(x, y, 320 if "Expired" in t else 250, 46, t, k, fs=19, r=23))
b.append(box(930, 250, 310, 130, "Conversion rates vary by market and agent. Track your own.", "warn", fs=19, bold=False))
page("fig-lead-tradeoff", "Figure 2.1. Every lead source trades time for money",
     "Costs are relative. Replace this picture with your own cost per closed deal.", "".join(b),
     "A plot of your time against your money. Sphere, open houses and expired listings sit at high time and low money. Own website and ads sit in the middle. Portal leads sit at low time and high money. The high-time, low-money corner is shaded as where new agents start.")

b = []
for i, (t, d) in enumerate([("1  Announce", "One personal message, not a blast"),
                            ("2  Give", "A market update, a checklist, an introduction to a contractor"),
                            ("3  Ask", "After two or three helpful touches, ask for an introduction"),
                            ("4  Repeat", "Put everyone on a touch plan")]):
    x = 35 + i * 320
    b.append(box(x, 150, 250, 190, (t, d), "light", fs=26))
    if i < 3:
        b.append(arrow(x + 252, 245, x + 318, 245))
b += [path("M1120,342 L1120,440 L480,440 L480,344", "blue", width=4),
      label(800, 480, "Back to Give, not Announce. You announce only once.", 20, BLUE, wt="600"),
      box(35, 530, 1210, 70, "Two to three gives before one ask.", "deep", fs=26)]
page("fig-sphere-method", "Figure 2.2. Working your sphere", "Announce, give, ask, repeat.", "".join(b),
     "Four boxes in a row: Announce, Give, Ask, Repeat. An arrow returns from Repeat to Give, not to Announce. A bar below says two to three gives before one ask.")

b = []
zones = [("Before: the day before", ["Preview the home and five comparable sales", "Invite the 20 nearest neighbors", "Set up digital sign-in"]),
         ("During", ["Greet and ask one open question", "Capture name, phone and email", "Offer one concrete next step"]),
         ("After: within 24 hours", ["Text that evening", "Call the next morning", "Put every visitor on a follow-up plan", "Log it as a lead source"])]
for i, (t, items) in enumerate(zones):
    x = 40 + i * 410
    b.append(f'<rect x="{x}" y="120" width="370" height="370" rx="14" fill="#FFFFFF" stroke="{GREY}" stroke-width="2"/>')
    b.append(f'<path d="M{x},176 L{x},134 Q{x},120 {x+14},120 L{x+356},120 Q{x+370},120 {x+370},134 L{x+370},176 Z" fill="{DEEP}"/>')
    b.append(label(x + 185, 156, t, 23, "#FFFFFF", wt="700"))
    b.append(bullets(x + 24, 220, items, 330, 20, gap=14))
    if i < 2:
        b.append(arrow(x + 372, 305, x + 408, 305, width=3))
b.append(box(300, 520, 680, 74, "Then measure it: cost per closed deal for this source", "light", fs=21))
page("fig-open-house", "Figure 2.3. The open house is a three-day event", "Preparation and follow-up are where the leads are made.", "".join(b),
     "A three-stage timeline. Before: preview the home, invite neighbors, set up digital sign-in. During: greet, capture contact details, offer a next step. After: text that evening, call next morning, start a follow-up plan, log the lead source. A final box says to measure cost per closed deal.")

# ---------------------------------------------------------------- ch3
b = []
ctr = (640, 315, 400, 150)
b.append(box(440, 240, 400, 150, ("Your home base", "Agent Site and client app"), "deep", fs=28))
for x, y, t in [(50, 120, "Social profiles"), (50, 250, "Email signature"), (50, 380, "Business card"),
                (970, 170, "Mailers and yard signs"), (970, 330, "Listing posts")]:
    b.append(box(x, y, 260, 72, t, "light", fs=21))
    if x < 400:
        b.append(arrow(x + 262, y + 36, 438, 315 if y == 250 else (290 if y < 250 else 340)))
    else:
        b.append(arrow(x - 2, y + 36, 842, 290 if y < 250 else 340))
b += [arrow(640, 392, 640, 468), box(440, 470, 400, 90, "Your CRM catches every inquiry", "grey", fs=22),
      label(656, 436, "Every link points here", 18, BLUE, "start", "700")]
page("fig-home-base", "Figure 3.1. One home base, many doors", "Send every door to the same room.", "".join(b),
     "A central box, Your home base, with five boxes pointing in: social profiles, email signature, business card, mailers and yard signs, and listing posts. An arrow from the home base leads to your CRM, which catches every inquiry.")

b = [f'<path d="M60,360 L1220,360" stroke="{GREY}" stroke-width="5"/>']
stops = [(150, "Coming soon"), (365, "Just listed"), (580, "Open house"), (795, "Under contract"), (1010, "Just sold")]
for i, (x, t) in enumerate(stops):
    b.append(box(x - 85, 334, 170, 52, t, "deep", fs=20, r=26))
for x in (150, 365, 580):
    b += [arrow(x, 330, x, 262, "blue", width=4), label(x, 240, "Buyer leads", 18, BLUE, wt="700")]
for x in (365, 580, 1010):
    b += [arrow(x, 390, x, 458, "deep", width=4), label(x, 490, "Seller leads", 18, DEEP, wt="700")]
b += [box(70, 530, 590, 62, "Mail or knock on the 50 nearest homes before the open house", "pale", fs=19, bold=False),
      box(880, 520, 340, 90, "Best seller-lead post: say how many showings or offers it received", "warnfill", fs=18, bold=False)]
page("fig-listing-timeline", "Figure 3.2. One listing, five posts, two kinds of leads", "Every stage of a listing is a chance to be seen.", "".join(b),
     "A timeline of five posts for one listing: coming soon, just listed, open house, under contract, just sold. Blue arrows mark where buyer leads arise and deep-blue arrows mark where seller leads arise. A callout says the just sold post is the best seller-lead post.")

b = []
cx0, cwid, cgap = 300, 230, 8
for w in range(4):
    x = cx0 + w * (cwid + cgap)
    b.append(box(x, 110, cwid, 44, f"Week {w+1}", "deep", fs=21, r=10))
labels = [("Market note", ["What sold, what is new, what surprised you"] * 4),
          ("Educational tip", ["One tip: inspection, financing, timing, preparing a home"] * 4),
          ("Monthly, quarterly or per listing", ["Monthly market update (email)", "", "Quarterly local guide", "Listing posts as needed"])]
for r, (lab, cells) in enumerate(labels):
    y = 166 + r * 128
    b.append(box(40, y, 250, 116, lab, "grey", fs=20, r=10))
    for w, c in enumerate(cells):
        x = cx0 + w * (cwid + cgap)
        b.append(box(x, y, cwid, 116, c or "—", "light" if c else "pale", fs=17, bold=False, r=10))
b.append(box(40, 560, 1200, 56, "Eight posts a month, plus the monthly update. Batch the whole month in one sitting.", "deep", fs=21))
page("fig-content-calendar", "Figure 3.3. Four weeks, eight posts", "A calendar you can keep on your busiest week.", "".join(b),
     "A grid of four weeks by three rows. Every week has a market note and an educational tip. The third row holds a monthly market update in week one, a quarterly local guide in week three and listing posts as needed in week four.")

# ---------------------------------------------------------------- ch4
b = []
items = [("Your CRM", "Open", 120, "deep"), ("Review dashboard and tasks", "15 min", 170, "light"),
         ("Clear follow-up tasks", "45–60 min", 210, "light"), ("Prospect", "60–90 min", 230, "light"),
         ("Appointments", "as scheduled", 190, "blue"), ("Your CRM", "Close", 120, "deep")]
x, xs = 60, []
for t, d, w, k in items:
    b.append(box(x, 230, w, 150, (t, d), k, fs=19))
    xs.append((x, w))
    x += w + 26
for i in range(5):
    b.append(arrow(xs[i][0] + xs[i][1] + 2, 305, xs[i + 1][0] - 2, 305, width=3))
b += [path(f"M{xs[1][0]},212 L{xs[3][0]+xs[3][1]},212", "amber", head=False, width=4),
      label((xs[1][0] + xs[3][0] + xs[3][1]) / 2, 192, "Protect these three before you accept an appointment", 19, AMBER, wt="700"),
      path(f"M{xs[5][0]+60},384 L{xs[5][0]+60},470 L{xs[0][0]+60},470 L{xs[0][0]+60},386", "blue", width=4),
      label(640, 510, "Tomorrow's top three", 21, BLUE, wt="700")]
page("fig-crm-day", "Figure 3. Your day opens and closes in your CRM", "Follow-ups come before new prospecting.", "".join(b),
     "A left-to-right sequence: open your CRM, review the dashboard (15 minutes), clear follow-up tasks (45 to 60 minutes), prospect (60 to 90 minutes), appointments, then close your CRM. A return arrow labelled Tomorrow's top three leads back to the start. A bracket marks the first three blocks as protected.")

b = [f'<rect x="160" y="120" width="260" height="420" fill="#DBEAFE"/><rect x="420" y="120" width="300" height="420" fill="#EFF6FF"/><rect x="720" y="120" width="400" height="420" fill="#E2E8F0"/>',
     f'<rect x="160" y="120" width="960" height="420" fill="none" stroke="{GREY}" stroke-width="2"/>',
     label(290, 152, "0–5 min: highest", 19, DEEP, wt="700"), label(570, 152, "5–30 min: still strong", 19, DEEP, wt="700"),
     label(920, 152, "After 30 min: sharp drop", 19, SLATE, wt="700"),
     path("M165,195 C300,200 380,225 420,260 C520,330 610,390 720,432 C850,478 1000,500 1115,508", "blue", width=5, head=False)]
for x, t in [(200, "1"), (420, "5"), (720, "30"), (920, "60")]:
    b += [f'<path d="M{x},540 L{x},550" stroke="{SLATE}" stroke-width="2"/>', label(x, 572, t, 19, SLATE)]
b += [label(640, 604, "Minutes after the inquiry", 20, SLATE, wt="600"),
      label(150, 130, "higher", 17, SLATE, "end"), label(150, 540, "lower", 17, SLATE, "end"),
      f'<text transform="translate(88,330) rotate(-90)" text-anchor="middle" font-size="19" font-weight="600" fill="{SLATE}">Chance of a conversation</text>',
      box(176, 398, 232, 100, "Layer 1: automated reply within 1 minute", "blue", fs=17),
      box(436, 430, 266, 100, "Layer 2: your live call, within 5 minutes when possible", "deep", fs=17)]
page("fig-response-window", "Figure 4.2. The sooner you answer, the better your chance",
     "Illustrative shape, not measured data. Add a source before treating it as a statistic.", "".join(b),
     "A falling curve of chance of a conversation against minutes since the inquiry, in three bands: highest in the first five minutes, still strong from five to thirty, and a sharp drop after thirty. Callouts mark the automated reply at one minute and the live call at five. The shape is illustrative.", cap_color=AMBER)

b = [f'<path d="M180,130 L180,590" stroke="{GREY}" stroke-width="5"/>']
steps = [("Profile", "Photo, bio, phone, email, license number, brand colors"),
         ("Import and tag contacts", "Deduplicate, then tag by relationship and by source"),
         ("Follow-up plans", "8x8, quarterly call plan, new-lead plan, post-close plan"),
         ("Lead routing", "Teams only: inquiries reach the right person instantly"),
         ("Pipeline stages", "New, Contacted, Appointment set, Active, Under contract, Closed"),
         ("Mobile app and notifications", "New leads and due tasks, on your phone")]
for i, (t, d) in enumerate(steps):
    y = 150 + i * 84
    dash = i == 3
    b.append(f'<circle cx="180" cy="{y}" r="28" fill="{"#FFFFFF" if dash else BLUE}" stroke="{BLUE}" stroke-width="3"{DASHC if dash else ""}/>')
    b.append(label(180, y + 9, str(i + 1), 26, BLUE if dash else "#FFFFFF", wt="700"))
    b.append(label(240, y - 4, t, 24, NAVY, "start", "700"))
    b.append(label(240, y + 24, d, 18, SLATE, "start"))
b.append(box(900, 250, 320, 160, ("One week", "Do these in order. Appendix C turns them into a checklist."), "light", fs=26))
page("fig-crm-setup", "Figure 4.3. Six steps, one week", "Set it up completely once, then let it run your day.", "".join(b),
     "A vertical path of six numbered steps: profile, import and tag contacts, follow-up plans, lead routing for teams only, pipeline stages, and mobile app with notifications. A side box says to do them in order in one week.")

# ---------------------------------------------------------------- ch5
b = [f'<path d="M100,380 L660,380" stroke="{GREY}" stroke-width="5"/><path d="M700,380 L1160,380" stroke="{GREY}" stroke-width="5"/>',
     f'<path d="M672,364 L684,396 M682,364 L694,396" stroke="{SLATE}" stroke-width="3"/>']
touches = [(100, 380, "T+E", 0), (100, 450, "C", 0), (140, 380, "E", 1), (220, 380, "T", 3), (380, 380, "C", 7), (500, 380, "E", 10),
           (660, 380, "T", 14)]
later = [(21, "C"), (30, "E"), (45, "T"), (60, "C"), (75, "E"), (90, "C")]
for d, ch in later:
    touches.append((round(660 + (d - 14) * 6.4 + 8), 380, ch, d))
values = {3, 6, 9, 12}
for n, (x, y, ch, d) in enumerate(touches, 1):
    k = "deep" if n in values else "blue"
    b.append(f'<circle cx="{x}" cy="{y}" r="20" fill="{DEEP if n in values else BLUE}"/>')
    b.append(label(x, y + 7, str(n), 19, "#FFFFFF", wt="700"))
    if y == 380:
        b.append(label(x, 338, ch, 17, SLATE, wt="700"))
        b.append(label(x, 428, f"{d}", 16, SLATE))
    else:
        b.append(label(x + 30, y + 6, ch, 17, SLATE, "start", "700"))
b.append(label(100, 502, "Day 0", 16, SLATE))
b += [path("M100,290 L660,290", "blue", head=False, width=3), label(380, 266, "7 touches in 14 days: front-loaded", 20, BLUE, wt="700"),
      path("M708,290 L1160,290", "deep", head=False, width=3), label(934, 266, "6 touches in 76 days: spaced out", 20, DEEP, wt="700"),
      arrow(1170, 380, 1250, 380, "grey"), label(1205, 404, "Quarterly", 16, SLATE), label(1205, 424, "plan", 16, SLATE),
      '<circle cx="100" cy="598" r="13" fill="#2563EB"/>', label(124, 604, "Ask or check in", 18, SLATE, "start"),
      '<circle cx="330" cy="598" r="13" fill="#1E3A8A"/>', label(354, 604, "Value: you give before you ask", 18, SLATE, "start"),
      label(700, 604, "C = call   T = text   E = email", 18, SLATE, "start")]
page("fig-nurture-timeline", "Figure 5.1. 13 touches in 90 days",
     "Not to scale: the first two weeks are enlarged. Every third touch is a gift.", "".join(b),
     "A timeline from day 0 to day 90 with thirteen numbered touches, each marked call, text or email. Seven fall in the first fourteen days and six in the remaining weeks. Touches 3, 6, 9 and 12 are value touches. After day 90 the contact moves to the quarterly plan.")

b = [box(50, 300, 230, 90, "Qualifying conversation", "deep", fs=22),
     arrow(282, 345, 330, 345), diamond(480, 345, 300, 190, "Pre-approved or cash, and moving within about 60 days?", 16),
     arrow(480, 250, 480, 196), label(494, 228, "Yes", 18, BLUE, "start", "700"),
     box(330, 110, 300, 86, ("Active", "Calls, showings, a consultation this week"), "blue", fs=21),
     arrow(630, 345, 730, 345), label(680, 330, "No", 18, AMBER, wt="700"),
     diamond(880, 345, 300, 190, "Is there a reason and a rough date?", 16),
     arrow(880, 250, 880, 196), label(894, 228, "Yes", 18, BLUE, "start", "700"),
     box(730, 110, 300, 86, ("Nurture with a date", "The plan, plus a check on that date"), "light", fs=21),
     arrow(880, 440, 880, 494), label(894, 472, "No", 18, AMBER, "start", "700"),
     box(730, 496, 300, 86, ("Long-term nurture", "The quarterly plan"), "grey", fs=21)]
page("fig-stage-lead", "Figure 5.2. After four questions: active or nurture?", "Both are valuable. They need different attention this week.", "".join(b),
     "A decision flow after the qualifying conversation. If the lead is pre-approved or cash and moving within about 60 days, they are active. Otherwise, if there is a reason and a rough date, they are nurture with a date. If neither, they go on the long-term quarterly plan.")

# ---------------------------------------------------------------- ch6
b = [label(60 + 320, 122, "A new-lead phone script", 20, SLATE, wt="700"), label(920, 122, "Why it works", 20, SLATE, wt="700")]
parts = [("1  Name them", "“Hi [Name], this is [Your Name] with [Brokerage].”", "People answer to their name.", "blue"),
         ("2  Show you read it", "“I just saw your inquiry about [address or area].”", "Specific proves a human read it.", "blue"),
         ("3  Ask one question", "“Do you have a couple of minutes so I can answer your questions?”", "A message with no question rarely gets a reply.", "deep"),
         ("4  Stop", "Wait. Let them answer.", "Silence is where they decide to engage.", "deep")]
for i, (t, q, why, k) in enumerate(parts):
    y = 140 + i * 118
    b.append(f'<rect x="60" y="{y}" width="660" height="102" rx="14" fill="#FFFFFF" stroke="{GREY}" stroke-width="2"/>')
    b.append(f'<path d="M60,{y+14} Q60,{y} 74,{y} L88,{y} L88,{y+102} L74,{y+102} Q60,{y+102} 60,{y+88} Z" fill="{BLUE if k=="blue" else DEEP}"/>')
    b.append(block(404, y + 51, [(t, 21, "700", NAVY), (q, 18, "400", SLATE, i == 3)], 600))
    b.append(box(760, y, 470, 102, why, "pale", fs=19, bold=False))
page("fig-script-anatomy", "Figure 6.1. Every script has four parts", "Take any script apart and you will find these four.", "".join(b),
     "The new-lead phone script split into four stacked parts: name them, show you read their inquiry, ask one question, then stop. Beside each part is the reason it works.")

# ---------------------------------------------------------------- ch7
cx, cy = 640, 400
pos = {"Slow follow-up": (640, 190), "Lost leads": (954, 335), "Empty pipeline": (834, 570),
       "Discouragement": (446, 570), "Unstructured days": (326, 335)}
order = list(pos)
rects = {k: (v[0], v[1], 220, 62) for k, v in pos.items()}
b = []
for k, r in rects.items():
    b.append(box(r[0] - 110, r[1] - 31, 220, 62, k, "warn", fs=19, sw=3))
for i in range(5):
    b.append(link(rects[order[i]], rects[order[(i + 1) % 5]], "amber", width=4))
centre = (cx, cy, 190, 76)
b.append(box(cx - 95, cy - 38, 190, 76, "Your system", "blue", fs=22))
fixes = {"Slow follow-up": ("CRM and follow-up plans", (640, 124)), "Unstructured days": ("Protected daily block", (210, 262)),
         "Discouragement": ("Track activity, not closings", (446, 640)), "Empty pipeline": ("Friday review", (834, 640))}
for k, (t, (px, py)) in fixes.items():
    b.append(link(centre, rects[k], "blue", dash=True, width=3))
    b.append(box(px - 145, py - 19, 290, 38, t, "light", fs=16, r=19))
page("fig-pitfall-cycle", "Figure 7.1. The new-agent pitfall cycle", "The loop runs on its own. The system interrupts it.", "".join(b),
     "Five amber boxes form a loop: slow follow-up, lost leads, empty pipeline, discouragement, unstructured days, and back to slow follow-up. A blue box in the middle, Your system, sends dashed arrows to four of them labelled with the fix: CRM and follow-up plans, protected daily block, track activity not closings, and Friday review.")

# ---------------------------------------------------------------- ch8
b = []
days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
cw8, g8, x8 = 210, 8, 156
for i, d in enumerate(days):
    b.append(box(x8 + i * (cw8 + g8), 100, cw8, 36, d, "deep", fs=19, r=10))
rows8 = [("8:00", "CRM dashboard, plan the day", "light"), ("8:30", "Follow-up plan tasks", "light"),
         ("9:30", None, None), ("11:00", "Lunch, errands, email", "grey"), ("13:00", None, None),
         ("16:00", "Client work, transaction tasks", "pale"), ("17:30", "End-of-day CRM update, top three for tomorrow", "light")]
W = 5 * cw8 + 4 * g8
for r, (tm, txt, k) in enumerate(rows8):
    y = 144 + r * 62
    b.append(label(140, y + 36, tm, 18, SLATE, "end", "700"))
    if txt:
        b.append(box(x8, y, W, 54, txt, k, fs=18, bold=False, r=10))
    elif tm == "9:30":
        b.append(box(x8, y, 4 * cw8 + 3 * g8, 54, "Prospecting, 90 minutes (protected)", "deep", fs=18, r=10))
        b.append(box(x8 + 4 * (cw8 + g8), y, cw8, 54, "Prospecting, then pipeline review", "deep", fs=16, r=10))
    else:
        for i, d in enumerate(days):
            t = "Content batch, marketing" if d == "Wed" else "Appointments"
            b.append(box(x8 + i * (cw8 + g8), y, cw8, 54, t, "blue" if t == "Appointments" else "light", fs=18, bold=False, r=10))
b.append(label(640, 610, "Mornings are yours. Afternoons belong to clients.", 22, BLUE, wt="700"))
page("fig-week-glance", "Figure 8.1. A week with lead generation first", "Lead generation sits in the same place every day.", "".join(b),
     "A Monday to Friday grid. Each morning starts with the CRM dashboard at 8:00 and follow-up tasks at 8:30, then a protected 90-minute prospecting block at 9:30; on Friday it is followed by the pipeline review. Afternoons hold appointments, with a content batch on Wednesday, then client work and an end-of-day CRM update.")

b = [f'<rect x="160" y="120" width="940" height="400" fill="#FFFFFF" stroke="{GREY}" stroke-width="2"/>',
     path("M160,500 C300,430 420,340 560,290 S900,200 1100,160 L1100,520 L160,520 Z", "#DBEAFE", head=False, width=0, fill="#DBEAFE"),
     path("M160,500 C300,430 420,340 560,290 S900,200 1100,160", "blue", width=5, head=False),
     path("M160,520 L708,520 C800,520 880,500 1100,430", "grey", width=5, head=False),
     label(600, 480, "The wait. Watch the blue line.", 21, DEEP, wt="700"),
     label(1105, 140, "Activity: conversations, appointments set", 18, BLUE, "end", "700"),
     label(1105, 418, "Closings", 18, SLATE, "end", "700")]
for d in (0, 30, 60, 90, 120):
    x = 160 + d * 940 / 120
    b += [f'<path d="M{x},520 L{x},530" stroke="{SLATE}" stroke-width="2"/>', label(x, 552, f"Day {d}", 17, SLATE)]
b.append(label(630, 590, "Time since you started", 19, SLATE, wt="600"))
page("fig-scoreboard", "Figure 8.2. What your scoreboard shows in the first 90 days", "The blue line moves every day you do the work.", "".join(b),
     "Two lines over 120 days. A blue line for activity climbs from the first day. A grey line for closings stays at zero until around day 70 and then rises. The gap between them is shaded and labelled the wait.")

# ---------------------------------------------------------------- ch9
b = []
segs = [("Frame", 10, "Agree the agenda", "light"), ("Ask", 25, "Timeline, motivation, financing, must-haves", "blue"),
        ("Listen", 25, "Repeat back what you heard", "blue"), ("Present", 30, "How it works, comparables, your plan", "light"), ("Agree", 10, "Next steps", "light")]
x, total = 60, 1160
pos9 = []
for n, p, d, k in segs:
    w = total * p / 100
    b.append(f'<rect x="{x}" y="190" width="{w}" height="86" fill="{KINDS[k][0]}" stroke="#FFFFFF" stroke-width="3"/>')
    b.append(block(x + w / 2, 233, [(n, 20, "700", KINDS[k][2])], w - 10))
    b.append(block(x + w / 2, 325, [(d, 16, "400", SLATE)], w - 14))
    pos9.append((x, w))
    x += w
ax = pos9[1][0]
b += [f'<path d="M{ax},170 L{ax},160 L{pos9[2][0]+pos9[2][1]},160 L{pos9[2][0]+pos9[2][1]},170" fill="none" stroke="{BLUE}" stroke-width="3"/>',
      label((ax + pos9[2][0] + pos9[2][1]) / 2, 142, "At least half the meeting", 21, BLUE, wt="700"),
      label(60, 420, "A rushed meeting", 19, SLATE, "start", "700")]
x = 60
for n, p, k in [("Frame", 5, "grey"), ("Present", 75, "grey"), ("Agree", 20, "grey")]:
    w = total * p / 100
    b.append(f'<rect x="{x}" y="440" width="{w}" height="64" fill="#E2E8F0" stroke="#FFFFFF" stroke-width="3"/>')
    b.append(block(x + w / 2, 472, [(n, 18 if w > 100 else 13, "700", SLATE)], w - 2))
    x += w
b.append(label(640, 548, "Where trust is lost: asking and listening are skipped.", 21, AMBER, wt="700"))
page("fig-consultation-time", "Figure 9.1. Spend half the meeting listening", "Proportions are illustrative. The rule is at least half for asking and listening.", "".join(b),
     "A bar for a one-hour consultation split into Frame, Ask, Listen, Present and Agree, with Ask and Listen bracketed as at least half the meeting. A second grey bar shows a rushed meeting that is mostly presenting.")

b = []
steps9 = [("1  Acknowledge", "“That makes sense.”", "That's a common thought."), ("2  Clarify", "“Can I ask what's behind that?”", "What would need to happen for you to feel ready?"),
          ("3  Respond", "Facts, a story or a demonstration", "Here is what similar homes have done recently."), ("4  Check", "“Does that address it?”", "Does that help? Then stop talking.")]
for i, (t, q, ex) in enumerate(steps9):
    x = 40 + i * 310
    b.append(box(x, 200, 270, 130, (t, q), "blue" if i < 3 else "deep", fs=24))
    b.append(box(x, 380, 270, 110, ex, "pale", fs=18, bold=False))
    b.append(arrow(x + 135, 332, x + 135, 378, "grey", width=2))
    if i < 3:
        b.append(arrow(x + 272, 265, x + 308, 265, width=4))
b += [path("M420,198 C420,140 550,140 550,198", "blue", width=3), label(485, 122, "Ask again until you hear the real concern", 18, BLUE, wt="700"),
      label(640, 536, "Example objection: “We want to wait for the market to improve.” The real concern: “We're nervous.”", 20, SLATE, ital=True)]
page("fig-objection-pattern", "Figure 9.2. An objection is a question in disguise", "Acknowledge, clarify, respond, check. Then be quiet.", "".join(b),
     "Four boxes: acknowledge, clarify, respond, check, each with an example line beneath for the objection about waiting for the market to improve. A loop on clarify says to ask again until you hear the real concern.")

# ---------------------------------------------------------------- ch10
cx, cy = 600, 390
pos = [("Closing day", "Note and gift", (600, 170)), ("1 week", "How is the move?", (886, 275)), ("30 days", "Ask for a review", (886, 490)),
       ("Quarterly", "A call with a reason", (600, 600)), ("Anniversary", "Updated home value", (314, 490)), ("Introduction", "They send you someone", (314, 275))]
rects = [(p[0], p[1], 230, 66) for _, _, p in pos]
b = []
for (t, d, p) in pos:
    b.append(box(p[0] - 115, p[1] - 33, 230, 66, (t, d), "deep" if t == "Introduction" else "light", fs=19))
for i in range(5):
    b.append(link(rects[i], rects[i + 1], "blue", width=3))
b.append(box(24, 120, 180, 66, ("New client", "back to Find"), "blue", fs=19))
b += [link(rects[5], (114, 153, 180, 66), "deep", width=5), link((114, 153, 180, 66), rects[0], "deep", width=5),
      f'<circle cx="{cx}" cy="{cy}" r="78" fill="#FFFFFF" stroke="{GREY}" stroke-width="2"/>',
      block(cx, cy, [("Be useful, not salesy", 19, "700", NAVY)], 120)]
page("fig-referral-flywheel", "Figure 10.1. How a closing becomes your next lead", "Every touch earns the right to the next one.", "".join(b),
     "Six steps in a circle: closing day note and gift, one week call, 30 days review request, quarterly calls, home anniversary, and finally an introduction. A heavy arrow from the introduction leads to a New client box that returns to Find and back to closing day.")

b = [f'<path d="M80,350 L1190,350" stroke="{GREY}" stroke-width="5"/>']
tl = [(110, "Closing day", "Handwritten note and gift. Ask for an introduction.", "deep"), (260, "Week 1", "Call: how is the move going?", "blue"),
      (410, "Day 30", "Call or visit. Ask for a review. Second referral ask.", "deep"), (560, "Month 3", "Call with a reason: market, season.", "blue"),
      (710, "Month 6", "Call with a reason.", "blue"), (860, "Month 9", "Call with a reason.", "blue"),
      (1010, "Month 12", "Home anniversary: card or call with an updated home value.", "blue")]
for x, t, d, k in tl:
    b.append(f'<circle cx="{x}" cy="350" r="15" fill="{DEEP if k=="deep" else BLUE}"/>')
    b.append(arrow(x, 332, x, 296, "grey", width=2))
    b.append(box(x - 70, 140, 140, 154, d, "pale", fs=16, bold=False, r=10))
    b.append(label(x, 392, t, 18, NAVY, wt="700"))
b += [arrow(1190, 350, 1250, 350, "grey"), box(960, 430, 290, 74, "Then: an annual appreciation event and quarterly calls, indefinitely", "grey", fs=16, bold=False),
      '<circle cx="110" cy="590" r="13" fill="#1E3A8A"/>', label(134, 596, "Touches that ask for something", 18, SLATE, "start"),
      '<circle cx="470" cy="590" r="13" fill="#2563EB"/>', label(494, 596, "Touches that only give", 18, SLATE, "start")]
page("fig-postclose-timeline", "Figure 10.2. The first year after closing", "Notice how few touches ask.", "".join(b),
     "A timeline from closing day to month twelve: handwritten note and gift on closing day, a call at one week, a call and review request at 30 days, quarterly calls at months 3, 6 and 9, and the home anniversary at month 12. Only closing day and day 30 ask for something. After the first year come an annual event and quarterly calls.")

# ---------------------------------------------------------------- ch11
b = [f'<path d="M110,170 L1170,170" stroke="{GREY}" stroke-width="5"/>']
stops = [(140, "First inquiry", "Consent before automated texts. Honor every opt-out."),
         (390, "First substantive conversation", "Agency disclosure. Record the date."),
         (640, "Before you tour homes", "Written buyer agreement. Your state and broker set when."),
         (890, "Making an offer", "Document each offer and the client's instruction."),
         (1140, "After closing", "Keep client information confidential.")]
for x, t, d in stops:
    b.append(block(x, 110, [(t, 19, "700", NAVY)], 220))
    b.append(f'<circle cx="{x}" cy="170" r="14" fill="{BLUE}"/>')
    b.append(arrow(x, 190, x, 236, "grey", width=2))
    b.append(box(x - 108, 240, 216, 190, d, "light", fs=19, bold=False))
b.append(box(140, 490, 1000, 70, "When unsure, ask your broker before you act.", "warnfill", fs=26))
page("fig-rule-moments", "Figure 11.1. Rules that arrive at each stage", "Your state and broker set the details. This shows when to look for them.", "".join(b),
     "A timeline of a client relationship with five stops and the rule that applies at each: consent for texts at first inquiry, agency disclosure at the first substantive conversation, a written buyer agreement before touring, documenting offers when making an offer, and confidentiality after closing. A bar says to ask your broker when unsure.")

b = [box(40, 300, 240, 84, "Something feels unusual", "deep", fs=21),
     arrow(282, 342, 340, 342), diamond(500, 342, 320, 200, "Does it involve money, a contract, a disclosure or a protected class?", 16),
     arrow(500, 242, 500, 196), label(514, 224, "Yes", 18, BLUE, "start", "700"),
     box(330, 108, 340, 88, "Stop. Ask your broker before you act.", "warnfill", fs=21),
     arrow(660, 342, 760, 342), label(710, 326, "No", 18, AMBER, wt="700"),
     diamond(920, 342, 320, 200, "Would I be comfortable if my broker read the note I am about to write?", 16),
     path("M920,242 L920,152 L672,152", "amber", width=3), label(934, 222, "No", 18, AMBER, "start", "700"),
     arrow(920, 442, 920, 504), label(934, 478, "Yes", 18, BLUE, "start", "700"),
     box(770, 506, 300, 80, "Proceed. Log it in your CRM today.", "grey", fs=21)]
page("fig-ask-broker", "Figure 11.2. When do I ask my broker?", "Two questions, asked in order.", "".join(b),
     "A flow starting at something feels unusual. If it involves money, a contract, a disclosure or a protected class, stop and ask your broker. Otherwise, if the agent would not be comfortable with the broker reading the note, also ask the broker. Otherwise proceed and log it in the CRM today.")

# ---------------------------------------------------------------- ch12
b = []
phases = [("Days 1–30", "Install the system", ["CRM set up", "Contacts tagged", "Follow-up plans live", "50 sphere conversations", "One open house", "Speed-to-lead tested"], "#93C5FD", NAVY),
          ("Days 31–60", "Build the rhythm", ["Morning blocks 4 of 5 days", "15 to 25 conversations a week", "First consultations held", "Buyer agreement signed"], BLUE, "#FFFFFF"),
          ("Days 61–90", "Grow the pipeline", ["5 or more active opportunities", "First contract written", "Post-close plan built", "Lead sources evaluated"], DEEP, "#FFFFFF")]
for i, (d, t, items, fill, tc) in enumerate(phases):
    x = 40 + i * 410
    b.append(f'<rect x="{x}" y="190" width="380" height="300" rx="14" fill="#FFFFFF" stroke="{GREY}" stroke-width="2"/>')
    b.append(f'<path d="M{x},256 L{x},204 Q{x},190 {x+14},190 L{x+366},190 Q{x+380},190 {x+380},204 L{x+380},256 Z" fill="{fill}"/>')
    b.append(block(x + 190, 223, [(d, 16, "700", tc), (t, 23, "700", tc)], 350))
    b.append(bullets(x + 24, 294, items, 340, 19, gap=8))
    if i < 2:
        b.append(arrow(x + 382, 340, x + 408, 340, width=4))
    b.append(f'<path d="M{x+380},150 L{x+380},176" stroke="{DEEP}" stroke-width="3"/><path d="M{x+380},150 L{x+358},158 L{x+380},166 Z" fill="{DEEP}"/>')
    b.append(label(x + 350, 142, f"Day {30*(i+1)}", 18, DEEP, "end", "700"))
b += [box(40, 520, 1200, 60, "Every Friday: the scorecard. First working day of each month: a one-hour review.", "light", fs=21),
      label(1240, 612, "Closings usually follow in the second 90 days →", 19, SLATE, "end", "700")]
page("fig-roadmap-90", "Figure 12.1. Install, build rhythm, grow pipeline", "Thirty days each. Date it on your calendar.", "".join(b),
     "A three-phase roadmap. Days 1 to 30 install the system, days 31 to 60 build the rhythm, and days 61 to 90 grow the pipeline, each with its milestones and a flag at days 30, 60 and 90. A bar below says to fill in the scorecard every Friday and hold a monthly review.")

b = []
for k, (x, ttl, kind, items) in enumerate([(40, "Every Friday", "blue", ["Fill in the scorecard", "Compare to last week", "Choose one change", "Stop until Monday"]),
                                          (650, "Monthly, one hour", "deep", ["Which source gave the most appointments per hour?", "Which plan got the most replies?", "Where did leads stall?", "What one change this month?"])]):
    b.append(f'<rect x="{x}" y="100" width="590" height="440" rx="16" fill="#FFFFFF" stroke="{GREY}" stroke-width="2"/>')
    b.append(label(x + 295, 140, ttl, 26, DEEP if kind == "deep" else BLUE, wt="700"))
    rs = [(x + 160, 215, 250, 96), (x + 430, 215, 250, 96), (x + 430, 345, 250, 96), (x + 160, 345, 250, 96)]
    for i, (rx, ry, rw, rh) in enumerate(rs):
        b.append(box(rx - rw / 2, ry - rh / 2 + 40, rw, rh, items[i], "light" if kind == "blue" else "pale", fs=17, bold=False))
    ctr = [(r[0], r[1] + 40, r[2], r[3]) for r in rs]
    for i in range(4):
        b.append(link(ctr[i], ctr[(i + 1) % 4], kind, width=3))
b.append(label(640, 590, "Write the answers in your CRM as a note to yourself.", 21, BLUE, wt="700"))
page("fig-review-loops", "Figure 12.2. Two loops: weekly and monthly", "Small corrections every week, a bigger decision every month.", "".join(b),
     "Two cycles side by side. Every Friday: fill in the scorecard, compare to last week, choose one change, stop until Monday. Monthly, one hour: which source gave the most appointments per hour, which plan got the most replies, where leads stalled, and what one change to make this month.")

# ---------------------------------------------------------------- ch13
b = []
items = [(40, 110, "1", "Measure activity, not closings: 3 to 4 conversations a day"), (40, 225, "2", "Work your sphere first. Buy leads only when the system can catch them."),
         (40, 340, "3", "Your CRM is the only list. Open it first, update it last."),
         (860, 110, "4", "Respond to new leads in minutes. Then follow up 13 times over 90 days."),
         (860, 225, "5", "Ask, listen, present, agree. Objections are questions."),
         (860, 340, "6", "Every closed client goes on a post-close plan the day of closing.")]
for x, y, n, t in items:
    b.append(box(x, y, 380, 96, t, "pale", fs=18, bold=False))
    b.append(f'<circle cx="{x+380 if x<400 else x}" cy="{y+48}" r="19" fill="{BLUE}"/>')
    b.append(label(x + 380 if x < 400 else x, y + 55, n, 19, "#FFFFFF", wt="700"))
pills = {"Find": (520, 170), "Nurture": (760, 170), "Keep": (640, 380)}
rects = {k: (v[0], v[1], 150, 54) for k, v in pills.items()}
for k, r in rects.items():
    b.append(box(r[0] - 75, r[1] - 27, 150, 54, k, "deep", fs=21, r=27))
b += [link(rects["Find"], rects["Nurture"]), link(rects["Nurture"], rects["Keep"]), link(rects["Keep"], rects["Find"]),
      f'<circle cx="640" cy="250" r="38" fill="#FFFFFF" stroke="{BLUE}" stroke-width="3"/>', label(640, 257, "CRM", 20, BLUE, wt="700"),
      box(40, 470, 1200, 96, "7   Review every Friday. Fix one thing a month. Ask your broker before anything unusual.", "light", fs=22)]
page("fig-handbook-card", "Figure 13.1. The whole handbook on one card", "Print it. Put it where you work.", "".join(b),
     "The Find, Nurture, Keep loop with your CRM at the center, surrounded by seven numbered rules: measure activity, work your sphere first, your CRM is the only list, respond in minutes and follow up 13 times, ask-listen-present-agree, post-close plan for every client, and review every Friday.")

(OUT / "manifest.json").write_text(json.dumps(MANIFEST, indent=2), encoding="utf-8")
print(f"wrote {len(MANIFEST)} diagrams to {OUT}")
