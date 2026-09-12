const cases = {
  onclick_goto: 'onclick {\n  goto_random_position;\n}',
  onflag_goto: 'onflag {\n  goto_random_position;\n}',
  mouse_down: 'onflag {\n  if (mouse_down) {\n    move(5);\n  }\n}',
};
for (const [name, src] of Object.entries(cases)) {
  const res = await fetch('http://localhost:8000/compile', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({source: src}),
  });
  console.log('\n=== ' + name + ' -> ' + res.status);
  if (!res.ok) { console.log((await res.text()).slice(0, 300)); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  const JSZipMod = await import('@turbowarp/jszip');
  const zip = await (JSZipMod.default || JSZipMod).loadAsync(buf);
  const proj = JSON.parse(await zip.file('project.json').async('string'));
  for (const t of proj.targets) {
    if (!t.blocks || !Object.keys(t.blocks).length) continue;
    console.log('sprite:', t.name);
    for (const [bid, b] of Object.entries(t.blocks)) {
      if (!b || typeof b !== 'object') continue;
      console.log('  ' + b.opcode + '  topLevel=' + JSON.stringify(b.topLevel)
        + '  inputs=' + JSON.stringify(b.inputs)
        + '  fields=' + JSON.stringify(b.fields));
    }
  }
}
