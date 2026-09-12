const AdmZip = require('C:/Users/xrjpr/Desktop/InstanceScratch-js/backend-js/node_modules/adm-zip');
const fs = require('fs');

console.log('=== Step 1: Loading project/resource/FCE2.1.sb3 ===');
const zip = new AdmZip('project/resource/FCE2.1.sb3');
const project = JSON.parse(zip.readAsText('project.json'));
const stage = project.targets.find(t => t.isStage);
const main = project.targets.find(t => t.name === 'Main');
const card = project.targets.find(t => t.name === 'Card');

let blockCounter = 6000;
function newId(prefix = 'b_') {
  return prefix + (blockCounter++) + '_' + Math.random().toString(36).slice(2, 6);
}

// ==========================================
// FIX 1: Card StartAddcard Infinite Loop
// ==========================================
console.log('=== Step 2: Fixing Card StartAddcard Infinite Loop ===');
const temp1VarId = '+-x_$*lQ}3tNUPq#*|/M';
const inhandListId = 'S1wjL:x2o{L^3}$3X];b';

// 1. Insert "set temp1 to 0" before loop eF
const setTemp0Id = newId('card_set_temp1_0_');
card.blocks[setTemp0Id] = {
  opcode: 'data_setvariableto',
  next: 'eF',
  parent: '%p',
  inputs: {
    VALUE: [1, [10, '0']]
  },
  fields: {
    VARIABLE: ['temp1', temp1VarId]
  },
  shadow: false,
  topLevel: false
};
card.blocks['%p'].next = setTemp0Id;
card.blocks['eF'].parent = setTemp0Id;

// 2. Insert "change temp1 by 1" at the start of loop substack
const chgTemp1Id = newId('card_chg_temp1_1_');
const origSub = card.blocks['eF'].inputs.SUBSTACK[1];
card.blocks[chgTemp1Id] = {
  opcode: 'data_changevariableby',
  next: origSub,
  parent: 'eF',
  inputs: {
    VALUE: [1, [4, '1']]
  },
  fields: {
    VARIABLE: ['temp1', temp1VarId]
  },
  shadow: false,
  topLevel: false
};
if (origSub && card.blocks[origSub]) {
  card.blocks[origSub].parent = chgTemp1Id;
}
card.blocks['eF'].inputs.SUBSTACK = [2, chgTemp1Id];

// 3. Build bulletproof termination condition:
// < (not ((length of InhandCard / 5) < count)) or (temp1 > 100) >
const divId = newId('card_div_');
const ltId = newId('card_lt_');
const notId = newId('card_not_');
const gtId = newId('card_gt_');
const orId = newId('card_or_');

// div: length / 5
card.blocks[divId] = {
  opcode: 'operator_divide',
  next: null,
  parent: ltId,
  inputs: {
    NUM1: [3, 'ajx', [4, '']],
    NUM2: [1, [4, '5']]
  },
  fields: {},
  shadow: false,
  topLevel: false
};
card.blocks['ajx'].parent = divId;

// lt: (length / 5) < count
card.blocks[ltId] = {
  opcode: 'operator_lt',
  next: null,
  parent: notId,
  inputs: {
    OPERAND1: [3, divId, [10, '']],
    OPERAND2: [3, 'ajy', [10, '3']]
  },
  fields: {},
  shadow: false,
  topLevel: false
};
card.blocks['ajy'].parent = ltId;

// not: not ((length / 5) < count)  --> equivalent to (length / 5) >= count
card.blocks[notId] = {
  opcode: 'operator_not',
  next: null,
  parent: orId,
  inputs: {
    OPERAND: [2, ltId]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

// gt: temp1 > 100
card.blocks[gtId] = {
  opcode: 'operator_gt',
  next: null,
  parent: orId,
  inputs: {
    OPERAND1: [3, [12, 'temp1', temp1VarId], [10, '']],
    OPERAND2: [1, [4, '100']]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

// or: (length / 5 >= count) or (temp1 > 100)
card.blocks[orId] = {
  opcode: 'operator_or',
  next: null,
  parent: 'eF',
  inputs: {
    OPERAND1: [2, notId],
    OPERAND2: [2, gtId]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

card.blocks['eF'].inputs.CONDITION = [2, orId];
delete card.blocks['pR'];

console.log('Card StartAddcard fixed: loop condition upgraded to length/5 >= count with 100-attempt safety cutoff.');

// ==========================================
// FIX 2: Main Debug 'D' Key Skip Logic
// ==========================================
console.log('=== Step 3: Upgrading Main Debug "D" Key Skip Logic ===');

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

function createSetVar(varName, value, parentId, nextId = null) {
  const stageVarEntry = Object.entries(stage.variables).find(([k, v]) => v[0] === varName);
  const mainVarEntry = Object.entries(main.variables).find(([k, v]) => v[0] === varName);
  const varId = stageVarEntry ? stageVarEntry[0] : (mainVarEntry ? mainVarEntry[0] : varName);

  const bId = newId('set_');
  main.blocks[bId] = {
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

function createEquals(varName, val, parentId) {
  const stageVarEntry = Object.entries(stage.variables).find(([k, v]) => v[0] === varName);
  const mainVarEntry = Object.entries(main.variables).find(([k, v]) => v[0] === varName);
  const varId = stageVarEntry ? stageVarEntry[0] : (mainVarEntry ? mainVarEntry[0] : varName);

  const bId = newId('eq_');
  main.blocks[bId] = {
    opcode: 'operator_equals',
    next: null,
    parent: parentId,
    inputs: {
      OPERAND1: [3, [12, varName, varId], [10, '']],
      OPERAND2: [1, [10, String(val)]]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };
  return bId;
}

function createOr(cond1Id, cond2Id, parentId) {
  const bId = newId('or_');
  main.blocks[bId] = {
    opcode: 'operator_or',
    next: null,
    parent: parentId,
    inputs: {
      OPERAND1: [2, cond1Id],
      OPERAND2: [2, cond2Id]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };
  if (cond1Id && main.blocks[cond1Id]) main.blocks[cond1Id].parent = bId;
  if (cond2Id && main.blocks[cond2Id]) main.blocks[cond2Id].parent = bId;
  return bId;
}

// Find 'd' key hat block
const dKeyEntry = Object.entries(main.blocks).find(([id, b]) => b.opcode === 'event_whenkeypressed' && b.fields?.KEY_OPTION?.[0] === 'd');
if (!dKeyEntry) {
  throw new Error('Could not find event_whenkeypressed for d');
}
const [dKeyId, dKeyBlock] = dKeyEntry;

// Clean up old chain attached to dKey
function removeSubtree(startId) {
  let curr = startId;
  while (curr) {
    const b = main.blocks[curr];
    if (!b) break;
    const next = b.next;
    if (b.inputs?.SUBSTACK?.[1]) removeSubtree(b.inputs.SUBSTACK[1]);
    if (b.inputs?.SUBSTACK2?.[1]) removeSubtree(b.inputs.SUBSTACK2[1]);
    if (b.inputs?.CONDITION?.[1]) delete main.blocks[b.inputs.CONDITION[1]];
    if (b.inputs?.OPERAND1?.[1]) delete main.blocks[b.inputs.OPERAND1[1]];
    if (b.inputs?.OPERAND2?.[1]) delete main.blocks[b.inputs.OPERAND2[1]];
    delete main.blocks[curr];
    curr = next;
  }
}
if (dKeyBlock.next) {
  removeSubtree(dKeyBlock.next);
}

// Build new D key debug handler:
// dKey
//  -> topCmt
//  -> ifDebug (<DebugMode == 1>)
//       -> ifGame (<Main == "game">)
//            -> ifInhand (<Condition == "inhand">)
//                 SUBSTACK: cmtWin -> set Condition to "story_post"
//                 SUBSTACK2 (else): cmtSkipStory -> set IsFinish? to 1 -> set Main to "map"
//       -> (else substack of ifGame):
//            -> ifReward (<Main == "add" or (Main == "level" or Main == "enhance")>)
//                 SUBSTACK: cmtReward -> set IsFinish? to 1 -> set Main to "map"

const topCmtId = createCommentCall('【Debug跳关系统】按下D键：若在战斗中则直接战胜并触发后置剧情(story_post)与选牌；若在选牌或纯剧情中则直接结算回大地图', dKeyId, null);
dKeyBlock.next = topCmtId;

const ifDebugId = newId('if_dbg_');
main.blocks[topCmtId].next = ifDebugId;

const condDebug = createEquals('DebugMode', '1', ifDebugId);

// Inside ifDebug:
const ifGameId = newId('if_game_');
main.blocks[ifDebugId] = {
  opcode: 'control_if',
  next: null,
  parent: topCmtId,
  inputs: {
    CONDITION: [2, condDebug],
    SUBSTACK: [2, ifGameId]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

const condGame = createEquals('Main', 'game', ifGameId);

// Inside ifGame (if_else):
const ifInhandId = newId('if_inhand_');
const ifRewardId = newId('if_reward_');

main.blocks[ifGameId] = {
  opcode: 'control_if_else',
  next: null,
  parent: ifDebugId,
  inputs: {
    CONDITION: [2, condGame],
    SUBSTACK: [2, ifInhandId],
    SUBSTACK2: [2, ifRewardId]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

// Substack 1 of ifGame: if Condition == "inhand" (in combat)
const condInhand = createEquals('Condition', 'inhand', ifInhandId);

// Combat win branch (Substack of ifInhand):
const cmtWin = createCommentCall('战斗中按D：直接模拟战胜，触发后置剧情', ifInhandId, null);
const setPostStory = createSetVar('Condition', 'story_post', cmtWin, null);
main.blocks[cmtWin].next = setPostStory;

// Pure story skip branch (Substack2 of ifInhand):
const cmtSkipStory = createCommentCall('剧情中按D：直接跳过本关并结算回大地图', ifInhandId, null);
const setFinishStory = createSetVar('IsFinish?', '1', cmtSkipStory, null);
const setMapStory = createSetVar('Main', 'map', setFinishStory, null);
main.blocks[cmtSkipStory].next = setFinishStory;
main.blocks[setFinishStory].next = setMapStory;

main.blocks[ifInhandId] = {
  opcode: 'control_if_else',
  next: null,
  parent: ifGameId,
  inputs: {
    CONDITION: [2, condInhand],
    SUBSTACK: [2, cmtWin],
    SUBSTACK2: [2, cmtSkipStory]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

// Substack 2 of ifGame: check reward screen:
// Condition: Main == "add" or (Main == "level" or Main == "enhance")
const eqAdd = createEquals('Main', 'add', null);
const eqLevel = createEquals('Main', 'level', null);
const eqEnhance = createEquals('Main', 'enhance', null);
const orLevelEnhance = createOr(eqLevel, eqEnhance, null);
const condReward = createOr(eqAdd, orLevelEnhance, ifRewardId);

// Substack of ifReward:
const cmtReward = createCommentCall('选牌/升级/强化结算界面按D：直接完成关卡并结算回大地图', ifRewardId, null);
const setFinishReward = createSetVar('IsFinish?', '1', cmtReward, null);
const setMapReward = createSetVar('Main', 'map', setFinishReward, null);
main.blocks[cmtReward].next = setFinishReward;
main.blocks[setFinishReward].next = setMapReward;

main.blocks[ifRewardId] = {
  opcode: 'control_if',
  next: null,
  parent: ifGameId,
  inputs: {
    CONDITION: [2, condReward],
    SUBSTACK: [2, cmtReward]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

console.log('Main "D" key debug system successfully built with nested conditions and full comments.');

// Save updated project.json into FCE2.1.sb3
zip.updateFile('project.json', Buffer.from(JSON.stringify(project)));
zip.writeZip('project/resource/FCE2.1.sb3');
console.log('project/resource/FCE2.1.sb3 successfully written!');
