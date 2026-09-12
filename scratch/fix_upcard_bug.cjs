const AdmZip = require('C:/Users/xrjpr/Desktop/InstanceScratch-js/backend-js/node_modules/adm-zip');
const fs = require('fs');

console.log('=== Step 1: Loading project/resource/FCE2.1.sb3 ===');
const zip = new AdmZip('project/resource/FCE2.1.sb3');
const project = JSON.parse(zip.readAsText('project.json'));
const stage = project.targets.find(t => t.isStage);
const main = project.targets.find(t => t.name === 'Main');
const card = project.targets.find(t => t.name === 'Card');

let blockCounter = 8000;
function newId(prefix = 'b_') {
  return prefix + (blockCounter++) + '_' + Math.random().toString(36).slice(2, 6);
}

function createCommentCall(target, text, parentId, nextId = null) {
  const bId = newId('cmt_');
  const isCard = target.name === 'Card';
  const argId = isCard ? 'iZ34`o)X:Vf*CAI]klb;' : 'Ek-A~/NfZp~;(J!%e|GM';
  target.blocks[bId] = {
    opcode: 'procedures_call',
    next: nextId,
    parent: parentId,
    inputs: {
      [argId]: [1, [10, text]]
    },
    fields: {},
    shadow: false,
    topLevel: false,
    mutation: {
      tagName: 'mutation',
      children: [],
      proccode: '// %s',
      argumentids: `["${argId}"]`,
      warp: 'true'
    }
  };
  return bId;
}

function createSetVar(target, varName, value, parentId, nextId = null) {
  const stageVarEntry = Object.entries(stage.variables).find(([k, v]) => v[0] === varName);
  const targetVarEntry = Object.entries(target.variables).find(([k, v]) => v[0] === varName);
  const varId = stageVarEntry ? stageVarEntry[0] : (targetVarEntry ? targetVarEntry[0] : varName);

  const bId = newId('set_');
  target.blocks[bId] = {
    opcode: 'data_setvariableto',
    next: nextId,
    parent: parentId,
    inputs: {
      VALUE: [1, [10, String(value)]]
    },
    fields: {
      VARIABLE: [varName, varId]
    },
    shadow: false,
    topLevel: false
  };
  return bId;
}

// ============================================================
// FIX A: Reset IsFinish? to 0 at the start of PlayLevelStory in Main
// ============================================================
console.log('=== Step 2: Resetting IsFinish? at start of PlayLevelStory ===');
const plsDef = Object.values(main.blocks).find(b => b.opcode === 'procedures_definition' && main.blocks[b.inputs.custom_block[1]].mutation.proccode.includes('PlayLevelStory'));
const firstPlsBlockId = plsDef.next;

const cmtPlsReset = createCommentCall(main, '【关卡生命周期】进入新关卡，复位关卡通关状态 IsFinish?=0', plsDef.id || Object.keys(main.blocks).find(k => main.blocks[k] === plsDef), null);
const setPlsReset = createSetVar(main, 'IsFinish?', '0', cmtPlsReset, firstPlsBlockId);
main.blocks[cmtPlsReset].next = setPlsReset;
plsDef.next = cmtPlsReset;
if (firstPlsBlockId && main.blocks[firstPlsBlockId]) {
  main.blocks[firstPlsBlockId].parent = setPlsReset;
}
console.log('PlayLevelStory now initializes IsFinish? = 0 at start.');

// ============================================================
// FIX B: Clean up premature IsFinish?=1 in Node 1-2, 1-4, 1-6
// ============================================================
console.log('=== Step 3: Cleaning premature IsFinish?=1 before reward states ===');

// Node 1-2: Cu -> Cv(IsFinish?=1) -> Cw(GameDetail=M) -> Cx(Main=add) -> ^L(Condition=inhand)
// Change to: Cu -> Cw -> Cx
if (main.blocks['Cu'] && main.blocks['Cv']) {
  main.blocks['Cu'].next = 'Cw';
  main.blocks['Cw'].parent = 'Cu';
  delete main.blocks['Cv'];
  if (main.blocks['Cx'] && main.blocks['^L']) {
    main.blocks['Cx'].next = null;
    delete main.blocks['^L'];
  }
  console.log('Node 1-2: Removed premature IsFinish?=1 and redundant Condition=inhand.');
}

// Node 1-4 Choice 1: C) -> C*(IsFinish?=1) -> C+(GameDetail=S) -> ^T(Main=add)
// Change to: C) -> C+ -> ^T
if (main.blocks['C)'] && main.blocks['C*']) {
  main.blocks['C)'].next = 'C+';
  main.blocks['C+'].parent = 'C)';
  delete main.blocks['C*'];
  console.log('Node 1-4 Choice 1: Removed premature IsFinish?=1.');
}

// Node 1-6: Dl -> Dm(IsFinish?=1) -> ^#(Main=level)
// Change to: Dl -> ^#
if (main.blocks['Dl'] && main.blocks['Dm']) {
  main.blocks['Dl'].next = '^#';
  main.blocks['^#'].parent = 'Dl';
  delete main.blocks['Dm'];
  console.log('Node 1-6: Removed premature IsFinish?=1.');
}

// ============================================================
// FIX C: Reset IsFinish? to 0 after Map Settlement in g.
// ============================================================
console.log('=== Step 4: Resetting IsFinish? after Map Node Settlement ===');
// In Main, block g. substack has @z (UpdateSaveCode)
if (main.blocks['@z']) {
  const cmtMapReset = createCommentCall(main, '【大地图结算】结算完成后复位关卡完成状态 IsFinish?=0', '@z', null);
  const setMapReset = createSetVar(main, 'IsFinish?', '0', cmtMapReset, null);
  main.blocks[cmtMapReset].next = setMapReset;
  main.blocks['@z'].next = cmtMapReset;
  console.log('Map settlement (g.): Appended IsFinish?=0 reset after UpdateSaveCode.');
}

// ============================================================
// FIX D: Ensure Card StartAddcard, StartLevelup, StartEnhance reset IsFinish?=0
// ============================================================
console.log('=== Step 5: Resetting IsFinish? in Card StartAddcard, StartLevelup, StartEnhance ===');

// In Card StartAddcard: %p (delete all of InhandCard) -> card_set_temp1_0 -> eF
// We insert "set IsFinish? to 0" right after %p
const setCardAddReset = createSetVar(card, 'IsFinish?', '0', '%p', main.blocks['%p']?.next || card.blocks['%p']?.next);
const origPNext = card.blocks['%p'].next;
card.blocks['%p'].next = setCardAddReset;
card.blocks[setCardAddReset].next = origPNext;
if (origPNext && card.blocks[origPNext]) {
  card.blocks[origPNext].parent = setCardAddReset;
}

// In Card StartLevelup: #[ (delete all of InhandCard) -> #] (temp_Start=0)
const setCardLvlReset = createSetVar(card, 'IsFinish?', '0', '#[', card.blocks['#['].next);
const origLvlNext = card.blocks['#['].next;
card.blocks['#['].next = setCardLvlReset;
card.blocks[setCardLvlReset].next = origLvlNext;
if (origLvlNext && card.blocks[origLvlNext]) {
  card.blocks[origLvlNext].parent = setCardLvlReset;
}

// In Card StartEnhance: #E (delete all of InhandCard) -> #F (temp_Start=0)
const setCardEnhReset = createSetVar(card, 'IsFinish?', '0', '#E', card.blocks['#E'].next);
const origEnhNext = card.blocks['#E'].next;
card.blocks['#E'].next = setCardEnhReset;
card.blocks[setCardEnhReset].next = origEnhNext;
if (origEnhNext && card.blocks[origEnhNext]) {
  card.blocks[origEnhNext].parent = setCardEnhReset;
}

console.log('Card: StartAddcard, StartLevelup, and StartEnhance now explicitly reset IsFinish? = 0.');

// Save updated project
zip.updateFile('project.json', Buffer.from(JSON.stringify(project)));
zip.writeZip('project/resource/FCE2.1.sb3');
console.log('project/resource/FCE2.1.sb3 successfully updated and written!');
