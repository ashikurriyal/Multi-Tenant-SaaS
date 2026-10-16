// Renders docs/ledgerflow-erd.svg and .png from docs/schema.prisma.
//   cd docs/tools && npm i --no-save @hpcc-js/wasm-graphviz@1.6.1 @resvg/resvg-js@2.6.2
//   python3 erd_dot.py ../schema.prisma > erd.dot && node render-erd.mjs erd.dot ../ledgerflow-erd.svg ../ledgerflow-erd.png
import { readFileSync, writeFileSync } from 'node:fs';
import { Graphviz } from '@hpcc-js/wasm-graphviz';
import { Resvg } from '@resvg/resvg-js';

const [dotFile, svgOut, pngOut] = process.argv.slice(2);
const graphviz = await Graphviz.load();
const svg = graphviz.dot(readFileSync(dotFile, 'utf8'), 'svg');
writeFileSync(svgOut, svg);
const png = new Resvg(svg, {
  fitTo: { mode: 'zoom', value: 1.5 },
  background: 'white',
  font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica' },
})
  .render()
  .asPng();
writeFileSync(pngOut, png);
console.log(`wrote ${svgOut} and ${pngOut}`);
