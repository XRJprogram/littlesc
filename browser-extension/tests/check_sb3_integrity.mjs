// SB3 structural integrity check: verifies a compiled SB3 has no dangling
// block references and every procedures_call matches a defined procedure
// (matched by mutation.proccode — the scratch-vm convention).
import JSZip from 'jszip';

export async function checkSb3Integrity(arrayBuffer) {
  const issues = [];
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const pj = JSON.parse(await zip.file('project.json').async('string'));
    for (const target of pj.targets) {
      const blocks = target.blocks || {};
      const ids = new Set(Object.keys(blocks));
      const definedProcCodes = new Set();
      const callProcCodes = [];
      for (const id of ids) {
        const b = blocks[id];
        if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
        if (b.opcode === 'procedures_definition') {
          const proto = b.inputs && (b.inputs.custom_block || b.inputs.definition) && Array.isArray(b.inputs.custom_block || b.inputs.definition) ? blocks[(b.inputs.custom_block || b.inputs.definition)[1]] : null;
          if (proto && proto.opcode === 'procedures_prototype' && proto.mutation && proto.mutation.proccode) {
            definedProcCodes.add(proto.mutation.proccode);
          }
        }
        if (b.opcode === 'procedures_call' && b.mutation && b.mutation.proccode) {
          callProcCodes.push(b.mutation.proccode);
        }
        // reference integrity
        if (b.next && !ids.has(b.next)) issues.push(`${target.name}: block ${id} next→missing ${b.next}`);
        if (b.parent && !ids.has(b.parent)) issues.push(`${target.name}: block ${id} parent→missing ${b.parent}`);
        for (const [k, input] of Object.entries(b.inputs || {})) {
          if (input && Array.isArray(input)) {
            for (const el of input) {
              if (typeof el === 'string' && !ids.has(el)) issues.push(`${target.name}: block ${id} input.${k}→missing ${el}`);
            }
          }
        }
      }
      for (const pc of callProcCodes) {
        if (!definedProcCodes.has(pc)) issues.push(`${target.name}: procedures_call ${pc} has no matching definition`);
      }
    }
  } catch (e) {
    issues.push('SB3 parse error: ' + e.message);
  }
  return issues;
}
