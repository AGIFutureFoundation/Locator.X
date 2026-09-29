#!/usr/bin/env python3
"""Build crm/contacts.csv from the repo's own documents.

Every row is an organisation or role the docs already name, with the file it came
from. Nothing is invented: the docs name no person-level email, phone or address
for any outside organisation, so those columns stay empty until someone fills them
from the organisation's own current page. (The one email in the repo is the platform
owner's own.) The docs date their facts 2026-09; check a row before you rely on it.
"""
import csv, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
rows = []
def add(org, cat, typ, juris, rel, why, src, status="named", web="", person="", email="", notes=""):
    rows.append(dict(organization=org, category=cat, type=typ, jurisdiction=juris,
        relationship=rel, what_they_answer=why, contact_person=person, email=email,
        phone="", website=web, crm_status=status, source_file=src, notes=notes))

def table(path, ncols_min):
    out = []
    for line in (ROOT / path).read_text().splitlines():
        if line.startswith("|") and not re.match(r"^\|\s*-", line):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= ncols_min: out.append(cells)
    return out[1:]
strip = lambda s: re.sub(r"\*\*|\[([^\]]+)\]\([^)]+\)", lambda m: m.group(1) or "", s).strip()

# People / roles
add("AGI Future Foundation (platform owner)", "Internal", "Owner / repository account", "—",
    "Owner", "Owns the repo and supplies instructor notes and profile", "git log; session",
    status="active", email="x@agifuturefoundation.org", web="https://agifuturefoundation.github.io")
add("Chris Barideaux", "Internal", "Instructor (course byline)", "—", "Instructor",
    "Course byline; profile ships empty until supplied", "content/instructor-profile.json",
    status="profile not supplied", person="Chris Barideaux",
    notes="No role or bio in the repo. Don't add one until the person supplies it.")

# Group entities
for c in table("docs/company/CAPITAL_STRUCTURE.md", 5):
    if c[0].startswith("**") or c[0] == "Asset-level SPVs":
        add(strip(c[0]), "Group entity", "Affiliated entity", "—", "Affiliate",
            strip(c[1]), "docs/company/CAPITAL_STRUCTURE.md", status="internal",
            notes="Separate entity with its own rights; see the 'does NOT own' column in the source")

# State agencies: HFA, LIHTC allocator, SHPO
hfa = {c[0]: c[5] for c in table("docs/states/README.md", 6) if len(c) == 6 and c[0] not in ("Guide",)}
for c in table("docs/resources/state-administrators.md", 4):
    st, alloc, shpo, credit = c[0], strip(c[1]), strip(c[2]), c[3]
    if st in ("Federal program",) or len(c) != 4: continue
    h = hfa.get(st, "")
    if h and h.split(" (")[0] not in alloc:
        add(h, "Government — state", "Housing finance agency (HFA)", st, "Program administrator",
            "Buyer loans, DPA, bond multifamily, participating-lender list", "docs/states/README.md")
        add(alloc, "Government — state", "LIHTC allocator (differs from HFA)", st, "Program administrator",
            "Writes the QAP; awards 9%/4% credits", "docs/resources/state-administrators.md")
    else:
        add(alloc, "Government — state", "HFA + LIHTC allocator", st, "Program administrator",
            "Writes the QAP; awards 9%/4% credits; buyer/DPA programs", "docs/resources/state-administrators.md")
    if st.split()[0] not in shpo: shpo = f"{st} — {shpo}"
    add(shpo, "Government — state", "State Historic Preservation Office (SHPO)", st, "Program administrator",
        "Federal historic credit Part 1/2/3 review" + ("; state historic credit" if "✔" in credit else ""),
        "docs/resources/state-administrators.md", notes="State historic credit: " + credit)

# Federal agencies and national programs
FED = [("HUD / FHA", "Multifamily 223(f), 221(d)(4), 232; FHA 203(b)/(k); approved-lender roster; PHA directory; QCT/DDA"),
 ("Fannie Mae (DUS)", "Agency multifamily permanent debt via DUS lenders"),
 ("Freddie Mac (Optigo)", "Agency multifamily incl. Small Balance Loans"),
 ("USDA Rural Development (state offices)", "502, 515, 538, B&I, Community Facilities; eligibility maps"),
 ("SBA", "504 (via CDCs) and 7(a) owner-occupied commercial"),
 ("Dept. of Veterans Affairs", "VA loans (assumable)"),
 ("CDFI Fund (US Treasury)", "CDFI and NMTC award lists — mission capital near a parcel"),
 ("National Park Service", "Federal historic tax credit certification; SHPO directory"),
 ("EPA", "Brownfields assessment/cleanup grants"),
 ("FEMA / NFIP", "Flood maps (NFHL), Risk Rating 2.0, CDBG-DR context"),
 ("FFIEC", "Bank call reports / UBPR — CRE concentration screening"),
 ("NCUA", "Credit-union call reports"),
 ("FHFA", "House-price and agency data"),
 ("US Census Bureau", "ACS, LEHD/LODES, TIGER"), ("BLS", "QCEW / CES employment"), ("BEA", "Regional income"),
 ("IRS SOI", "Migration data"), ("SEC EDGAR", "Public-company and REIT filings"),
 ("PACER (federal bankruptcy courts)", "Bankruptcy dockets"), ("IPEDS (NCES)", "University enrollment")]
for o, w in FED:
    add(o, "Government — federal", "Federal agency / program", "US", "Data source / program",
        w, "docs/resources/federal-programs.md; lenders.md; property-data-sources.md",
        web="https://www.sec.gov" if o == "SEC EDGAR" else "")

# Lenders named
for o in ["Walker & Dunlop", "Berkadia", "Arbor", "Greystone", "CBRE"]:
    add(o, "Lender", "Agency multifamily lender (DUS/Optigo)", "US", "Prospective lender",
        "Fannie/Freddie multifamily, 5+ units", "docs/resources/lenders.md")
for o in ["LISC", "Enterprise Community Partners", "Reinvestment Fund", "IFF"]:
    add(o, "Lender", "CDFI / mission lender", "US", "Prospective lender",
        "Gap and predevelopment capital in underserved markets", "docs/resources/lenders.md")
for o, w in [("Trepp", "CMBS market prints"), ("NCREIF / NAREIT / Moody's CRE (REIS)", "Institutional CRE indices")]:
    add(o, "Data vendor", "Market research", "US", "Data source", w, "docs/resources/lenders.md; property-data-sources.md")

# Property-data vendors / platforms
VEND = ["Regrid", "CoStar", "LoopNet", "Crexi", "Brevitas", "TenX", "RealAuction", "GovEase", "SRI", "Bid4Assets",
        "Melissa", "Smarty", "Tyler Technologies (iasWorld / EagleWeb)", "Beacon / qPublic (Schneider)",
        "BS&A Online", "Vision Government Solutions", "actDataScout", "DEVNET wEdge", "Delta / Flagship",
        "Vanguard / GIS Workshop"]
for o in VEND:
    add(o, "Data vendor", "Listing / auction / county-records platform", "US", "Data source",
        "Listings, auctions, address hygiene or county assessor front-ends", "docs/resources/property-data-sources.md")

# Competitors
for c in table("docs/market/LANDSCAPE.md", 6):
    if len(c) != 6 or c[0] == "Status": continue
    m = re.search(r"\((https?://[^)]+)\)", c[4])
    add(strip(c[0]), "Competitor", strip(c[1]), "US", "Competitor (monitor)", strip(c[2]),
        "docs/market/LANDSCAPE.md", status="pricing " + c[5].strip("`"),
        web=re.sub(r"(https?://[^/]+).*", r"\1", m.group(1)) if m else "",
        notes="Price as reported: " + strip(c[3]))

# County / parish record offices named in the coverage inventories
COUNTY = [("Maricopa County", "AZ"), ("Marion County", "IN"), ("Tippecanoe County", "IN"),
 ("Orleans Parish Assessor", "LA"), ("Orleans Parish Clerk of Civil District Court (Land Records)", "LA"),
 ("City of New Orleans (CZO, STR registry, permits open data)", "LA"),
 ("East Baton Rouge Assessor / EBRGIS", "LA"), ("East Baton Rouge Clerk of Court", "LA"),
 ("Jefferson Parish Assessor / GIS", "LA"), ("Lafayette Parish Assessor", "LA"),
 ("St. Tammany Parish Assessor", "LA"), ("Caddo Parish Assessor", "LA"), ("Louisiana Tax Commission", "LA"),
 ("Clark County", "NV"), ("Washoe County", "NV"), ("Bernalillo County Assessor", "NM"),
 ("Sandoval County", "NM"), ("Onondaga County (via NYS Tax Parcels)", "NY"), ("New York City (DOF / ACRIS)", "NY"),
 ("Wake County", "NC"), ("Guilford County", "NC"), ("Chatham County", "NC"),
 ("Franklin County", "OH"), ("Mahoning County", "OH"), ("Trumbull County", "OH"), ("Utah County", "UT")]
for o, st in COUNTY:
    add(o, "Government — county/parish", "Public-record office (assessor/recorder/GIS)", st, "Data source",
        "Parcels, use codes, owner of record, values, filings", f"docs/states/coverage/",
        web="https://assessormap.bernco.gov" if o.startswith("Bernalillo") else "",
        notes="Coverage status per gate is in the state's coverage file")

seen, out = set(), []
for r in rows:
    k = (r["organization"], r["jurisdiction"], r["type"])
    if k not in seen: seen.add(k); out.append(r)
for i, r in enumerate(out, 1): r["id"] = f"C{i:04d}"
cols = ["id"] + list(rows[0].keys())
with open(ROOT / "crm/contacts.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(out)
print(len(out), "contacts")
