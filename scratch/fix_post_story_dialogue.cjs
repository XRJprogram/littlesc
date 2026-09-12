const AdmZip = require('C:/Users/xrjpr/Desktop/InstanceScratch-js/backend-js/node_modules/adm-zip');
const fs = require('fs');

console.log('=== Step 1: Loading project/resource/FCE2.1.sb3 ===');
const zip = new AdmZip('project/resource/FCE2.1.sb3');
const project = JSON.parse(zip.readAsText('project.json'));
const stage = project.targets.find(t => t.isStage);
const main = project.targets.find(t => t.name === 'Main');

let blockCounter = 7000;
function newId(prefix = 'b_') {
  return prefix + (blockCounter++) + '_' + Math.random().toString(36).slice(2, 6);
}

function createCommentCall(text, parentId, nextId = null) {
  const bId = newId('cmt_');
  main.blocks[bId] = {
    opcode: 'procedures_call',
    next: nextId,
    parent: parentId,
    inputs: {
      'Ek-A~/NfZp~;(J!%e|GM': [1, [10, text]]
    },
    fields: {},
    shadow: false,
    topLevel: false,
    mutation: {
      tagName: 'mutation',
      children: [],
      proccode: '// %s',
      argumentids: '["Ek-A~/NfZp~;(J!%e|GM"]',
      warp: 'true'
    }
  };
  return bId;
}

const condVarId = 'JWl`Aemb~ZBcRV-c9-yT';

// ============================================================
// FIX 1: Dialogue clone repeat until condition in Main (bN -> bQ)
// ============================================================
console.log('=== Step 2: Fixing Dialogue Clone Condition for story_post ===');
// Currently:
// bQ condition is hA: operator_or([M: showDialog == 0, z}: operator_not([N: Condition == "story"]))
// We upgrade z} input from [N to:
// or_cond: operator_or(Condition == "story", Condition == "story_post")

const eqStoryPost = newId('eq_story_post_');
main.blocks[eqStoryPost] = {
  opcode: 'operator_equals',
  next: null,
  parent: null,
  inputs: {
    OPERAND1: [3, [12, 'Condition', condVarId], [10, '']],
    OPERAND2: [1, [10, 'story_post']]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

const orStoryBoth = newId('or_story_both_');
main.blocks[orStoryBoth] = {
  opcode: 'operator_or',
  next: null,
  parent: 'z}',
  inputs: {
    OPERAND1: [2, '[N'],
    OPERAND2: [2, eqStoryPost]
  },
  fields: {},
  shadow: false,
  topLevel: false
};
main.blocks['[N'].parent = orStoryBoth;
main.blocks[eqStoryPost].parent = orStoryBoth;

// Connect to z} (operator_not)
main.blocks['z}'].inputs.OPERAND = [2, orStoryBoth];

// Insert comment block before bQ
const cmtDlgLife = createCommentCall('【对话框生命周期】支持前置剧情(story)与战后剧情(story_post)，避免战后对话框瞬间闪退', 'hz', 'bQ');
main.blocks['hz'].next = cmtDlgLife;
main.blocks['bQ'].parent = cmtDlgLife;

console.log('Dialogue clone condition updated: now supports both "story" and "story_post".');

// ============================================================
// FIX 2: Illustration clone repeat until condition in Main (hx -> bR)
// ============================================================
console.log('=== Step 3: Fixing Illustration Clone Condition for story_post ===');
// Currently:
// bR condition is hD: operator_or([T: showIllustration == 0, An: operator_not([U: Condition == "story"]))
// We upgrade An input from [U to:
// or_illust_both: operator_or(Condition == "story", Condition == "story_post")

const eqIllustStoryPost = newId('eq_illust_sp_');
main.blocks[eqIllustStoryPost] = {
  opcode: 'operator_equals',
  next: null,
  parent: null,
  inputs: {
    OPERAND1: [3, [12, 'Condition', condVarId], [10, '']],
    OPERAND2: [1, [10, 'story_post']]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

const orIllustBoth = newId('or_illust_both_');
main.blocks[orIllustBoth] = {
  opcode: 'operator_or',
  next: null,
  parent: 'An',
  inputs: {
    OPERAND1: [2, '[U'],
    OPERAND2: [2, eqIllustStoryPost]
  },
  fields: {},
  shadow: false,
  topLevel: false
};
main.blocks['[U'].parent = orIllustBoth;
main.blocks[eqIllustStoryPost].parent = orIllustBoth;

// Connect to An (operator_not)
main.blocks['An'].inputs.OPERAND = [2, orIllustBoth];

// Insert comment block before bR
const cmtIllustLife = createCommentCall('【插画生命周期】支持前置剧情(story)与战后剧情(story_post)，与对话框生命周期严格对齐', 'Al', 'bR');
main.blocks['Al'].next = cmtIllustLife;
main.blocks['bR'].parent = cmtIllustLife;

console.log('Illustration clone condition updated: now supports both "story" and "story_post".');

// ============================================================
// CLEANUP: In Node 1-1 tail, remove ^J (set Condition to inhand)
// to align with user modification in 1-3, 1-5, 1-6, 1-7
// ============================================================
console.log('=== Step 4: Aligning Node 1-1 Tail ===');
if (main.blocks['^J'] && main.blocks['Cj']?.next === '^J') {
  main.blocks['Cj'].next = null;
  delete main.blocks['^J'];
  const cmtAlign = createCommentCall('【奖励流转】战后交由Card自身切换Main=add时统一管理Condition状态机', 'Cj', null);
  main.blocks['Cj'].next = cmtAlign;
  console.log('Node 1-1: removed duplicate set Condition to inhand, appended comment block.');
}

// Save updated project
zip.updateFile('project.json', Buffer.from(JSON.stringify(project)));
zip.writeZip('project/resource/FCE2.1.sb3');
console.log('project/resource/FCE2.1.sb3 successfully updated and written!');
