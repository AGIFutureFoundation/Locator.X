# Contacts (CRM)

`contacts.csv` lists every organization and role the repo names: state HFAs, LIHTC
allocators and SHPOs, federal agencies, lenders, data vendors, competitors, county
record offices and the group entities. It is built by `build_crm.py` from the source
documents. Each row carries its `source_file`, so regenerate the CSV rather than editing it:

```bash
python3 crm/build_crm.py
```

- **No invented contact details.** The docs give no email, phone number or named person
  for any outside organization, so those columns stay empty. Fill them from the
  organization's own current page, not from a guess.
- **No PII.** Property owners are never contacts; the ingest pipeline strips owner
  fields (`data/README.md`).
- **Verify before relying.** The facts are as the docs date them (2026-09). A row names
  an institution, not an endorsement or a recommendation.
