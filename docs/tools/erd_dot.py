# Generates the Graphviz input for docs/ledgerflow-erd.{svg,png} from docs/schema.prisma.
# Usage: see render-erd.mjs in this folder.

import re, sys, html
schema = open(sys.argv[1]).read()
DOMAINS = {
  'IDENTITY & TENANCY': ('#2563eb', '#eff4ff'),
  'BILLING': ('#7c3aed', '#f4efff'),
  'USAGE': ('#059669', '#ecfdf5'),
  'ANALYTICS & OPERATIONS': ('#d97706', '#fff7e6'),
}
enums = set(re.findall(r'^enum (\w+)', schema, re.M))
# split by domain banners
models, order = {}, []
domain = None
for line in schema.splitlines():
    m = re.match(r'// =+ (.+?) =+$', line)
    if m: domain = m.group(1); continue
    m = re.match(r'^model (\w+) \{', line)
    if m: cur = m.group(1); models[cur] = {'domain': domain, 'lines': [], 'map': cur}; order.append(cur); continue
    if order and models[order[-1]].get('open', True) is not False:
        if line.startswith('}'):
            models[order[-1]]['open'] = False
        elif order:
            models[order[-1]]['lines'].append(line.strip())
for name, m in models.items():
    fields, relations, pk_extra, uq_extra = [], [], set(), set()
    for l in m['lines']:
        if not l or l.startswith('//'): continue
        mm = re.match(r'@@map\("(\w+)"\)', l)
        if mm: m['map'] = mm.group(1); continue
        mm = re.match(r'@@id\(\[([^\]]+)\]\)', l)
        if mm: pk_extra |= {x.strip() for x in mm.group(1).split(',')}; continue
        mm = re.match(r'@@unique\(\[([^\]]+)\]\)', l)
        if mm:
            cols = [x.strip() for x in mm.group(1).split(',')]
            if len(cols) == 1: uq_extra.add(cols[0])
            continue
        if l.startswith('@@'): continue
        parts = re.match(r'(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)', l)
        if not parts: continue
        fname, ftype, arr, opt, rest = parts.groups()
        rel = re.search(r'@relation\((?:"\w+",\s*)?fields:\s*\[(\w+)\]', rest)
        if ftype in models and not arr and rel:
            relations.append((ftype, rel.group(1), bool(opt)))
            continue
        if ftype in models: continue  # back-relation lists
        fields.append(dict(name=fname, type=ftype, opt=bool(opt), rest=rest))
    fk = {r[1] for r in relations}
    for f in fields:
        keys = []
        if '@id' in f['rest'] or f['name'] in pk_extra: keys.append('PK')
        if f['name'] in fk: keys.append('FK')
        if '@unique' in f['rest'] or f['name'] in uq_extra: keys.append('UQ')
        f['keys'] = keys
        t = f['type']
        f['sqltype'] = ('uuid' if t == 'String' and 'uuid()' in f['rest'] else
                        'date' if '@db.Date' in f['rest'] else
                        {'String':'varchar','Int':'int','BigInt':'bigint','DateTime':'timestamp','Boolean':'bool','Json':'jsonb'}.get(t, 'enum' if t in enums else t))
    m['fields'], m['relations'] = fields, relations

KEYCOL = {'PK': '#2563eb', 'FK': '#d97706', 'UQ': '#059669'}
out = ['digraph ERD {', '  graph [rankdir=TB, newrank=true, splines=spline, nodesep=0.35, ranksep=0.9, pad=0.4, bgcolor=white,',
       '         labelloc=t, fontname="Helvetica,sans-Serif",',
       f'         label=<<FONT POINT-SIZE="22"><B>LedgerFlow ERD</B></FONT><BR/><FONT POINT-SIZE="12" COLOR="#6b7280">{len(models)} tables · PostgreSQL + Prisma · crow&#39;s foot: ┼ one, ○ optional, ⋔ many</FONT>>];',
       '  node [shape=plaintext, fontname="Helvetica,sans-Serif"];',
       '  edge [color="#9ca3af", penwidth=1.2, dir=both, arrowsize=0.9];']
for name in order:
    m = models[name]; head, body = DOMAINS[m['domain']]
    rows = [f'<TR><TD COLSPAN="3" BGCOLOR="{head}" ALIGN="LEFT"><FONT COLOR="white" POINT-SIZE="13"><B>{m["map"]}</B></FONT></TD></TR>']
    for f in m['fields']:
        badge = ' '.join(f'<FONT COLOR="{KEYCOL[k]}" POINT-SIZE="9"><B>{k}</B></FONT>' for k in f['keys']) or ' '
        nm = html.escape(f['name'] + ('?' if f['opt'] else ''))
        nm = f'<B>{nm}</B>' if 'PK' in f['keys'] else nm
        rows.append(f'<TR><TD ALIGN="LEFT" WIDTH="34" BGCOLOR="{body}">{badge}</TD><TD ALIGN="LEFT" WIDTH="150" PORT="{f["name"]}" BGCOLOR="{body}"><FONT COLOR="#1f2937" POINT-SIZE="11">{nm}</FONT></TD><TD ALIGN="LEFT" WIDTH="72" BGCOLOR="{body}"><FONT COLOR="#6b7280" POINT-SIZE="10">{f["sqltype"]}</FONT></TD></TR>')
    out.append(f'  {m["map"]} [label=<<TABLE BORDER="1" COLOR="{head}" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4">{"".join(rows)}</TABLE>>];')
for name in order:
    m = models[name]
    for parent, fkfield, nullable in m['relations']:
        unique = any(f['name'] == fkfield and 'UQ' in f['keys'] for f in m['fields'])
        tail = 'teeodot' if nullable else 'teetee'
        head = 'teeodot' if unique else 'crowodot'
        out.append(f'  {models[parent]["map"]} -> {m["map"]}:{fkfield} [arrowtail={tail}, arrowhead={head}];')
ROWS = [
  ['users', 'organizations', 'plans', 'stripe_events', 'rate_limits'],
  ['refresh_tokens', 'email_tokens', 'memberships', 'invitations', 'subscriptions', 'mrr_snapshots'],
  ['api_keys', 'usage_events', 'usage_counters', 'usage_daily_rollups', 'invoices', 'audit_logs', 'email_outbox'],
]
for i, row in enumerate(ROWS):
    out.append('  { rank=same; ' + ' '.join(row) + ' }')
# Invisible edges keep each row in this left-to-right order and the rows stacked
for row in ROWS:
    for a, b in zip(row, row[1:]):
        out.append(f'  {a} -> {b} [style=invis, weight=4];')
for a, b in zip(ROWS, ROWS[1:]):
    out.append(f'  {a[0]} -> {b[0]} [style=invis];')
out.append('}')
print('\n'.join(out))
print(f"{len(models)} tables, {sum(len(m['relations']) for m in models.values())} relations", file=sys.stderr)
