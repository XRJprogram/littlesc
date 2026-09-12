const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AdmZip = require('../backend-js/node_modules/adm-zip');

const zip = new AdmZip('project/resource/FCE2.3.sb3');
const pj = JSON.parse(zip.readAsText('project.json'));
const stage = pj.targets.find(t => t.isStage);
const main = pj.targets.find(t => t.name === 'Main');

if (!main) {
  console.error('Main target not found!');
  process.exit(1);
}

// ===========================================================================
// PART 1: Add costume 'button//skip' to Main
// ===========================================================================
const skipButtonSvg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="68" height="24" viewBox="0,0,68,24"><g transform="translate(-286,-168)"><rect x="287" y="169" width="66" height="22" rx="4" ry="4" fill="#141418" fill-opacity="0.88" stroke="#ff3b30" stroke-width="1.5"/><text transform="translate(320,185) scale(0.45,0.45)" font-size="36" xml:space="preserve" fill="#ffffff" font-family="&quot;BOUTIQUEBITMAP9X9_1&quot;, Sans Serif" font-weight="bold" text-anchor="middle">跳过 &gt;&gt;</text></g></svg>`;

const skipSvgBuf = Buffer.from(skipButtonSvg, 'utf8');
const skipAssetId = crypto.createHash('md5').update(skipSvgBuf).digest('hex');
const skipFileName = `${skipAssetId}.svg`;

zip.addFile(skipFileName, skipSvgBuf);

// Check if costume already exists
let skipCostumeIdx = main.costumes.findIndex(c => c.name === 'button//skip');
if (skipCostumeIdx === -1) {
  main.costumes.push({
    name: 'button//skip',
    dataFormat: 'svg',
    assetId: skipAssetId,
    md5ext: skipFileName,
    rotationCenterX: 34,
    rotationCenterY: 12
  });
  console.log('Added button//skip costume to Main');
}

// ===========================================================================
// PART 2: Declare variables needed for CheckCanLevelup in Main
// ===========================================================================
if (!main.variables['var_can_levelup_id']) {
  main.variables['var_can_levelup_id'] = ['canLevelup', 0];
}
if (!main.variables['var_check_index_id']) {
  main.variables['var_check_index_id'] = ['checkIndex', 0];
}
if (!main.variables['var_card_name_id']) {
  main.variables['var_card_name_id'] = ['cardName', ''];
}
if (!main.variables['var_card_lv_id']) {
  main.variables['var_card_lv_id'] = ['cardLv', 0];
}
if (!main.variables['var_card_type_id']) {
  main.variables['var_card_type_id'] = ['cardType', ''];
}

// Stage list IDs
const possessListId = 'S@1+upf2loa?j8MTcXSz'; // PossessCard[name,lv,damage,hp,e]
const cardListId = 'yGi^NM3j)Qou,8Y+$k96';    // *CardList[name,type,[3]]

// ===========================================================================
// PART 3: Define procedure CheckCanLevelup in Main
// ===========================================================================
// Check if CheckCanLevelup definition already exists
let existingDef = Object.entries(main.blocks).find(([id, b]) => 
  b.opcode === 'procedures_definition' && b.inputs && b.inputs.custom_block &&
  main.blocks[b.inputs.custom_block[1]] && main.blocks[b.inputs.custom_block[1]].mutation &&
  main.blocks[b.inputs.custom_block[1]].mutation.proccode === 'CheckCanLevelup'
);

if (!existingDef) {
  const defId = 'ck_def';
  const protoId = 'ck_proto';

  main.blocks[protoId] = {
    opcode: 'procedures_prototype',
    next: null,
    parent: defId,
    inputs: {},
    fields: {},
    shadow: true,
    topLevel: false,
    mutation: {
      tagName: 'mutation',
      children: [],
      proccode: 'CheckCanLevelup',
      argumentids: '[]',
      argumentnames: '[]',
      argumentdefaults: '[]',
      warp: 'true'
    }
  };

  main.blocks[defId] = {
    opcode: 'procedures_definition',
    next: 'ck_c0',
    parent: null,
    inputs: { custom_block: [ 1, protoId ] },
    fields: {},
    shadow: false,
    topLevel: true,
    x: 48,
    y: 8000
  };

  // ck_c0: // "【算法】遍历PossessCard检查是否存在类型为P且1<=等级<3的角色牌"
  main.blocks['ck_c0'] = {
    opcode: 'procedures_call',
    next: 'ck_s1',
    parent: defId,
    inputs: {
      'Ek-A~/NfZp~;(J!%e|GM': [ 1, [ 10, '【算法】遍历PossessCard检查是否存在类型为P且1<=等级<3的角色牌' ] ]
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

  // ck_s1: set canLevelup = 0
  main.blocks['ck_s1'] = {
    opcode: 'data_setvariableto',
    next: 'ck_s2',
    parent: 'ck_c0',
    inputs: { VALUE: [ 1, [ 10, '0' ] ] },
    fields: { VARIABLE: [ 'canLevelup', 'var_can_levelup_id' ] },
    shadow: false,
    topLevel: false
  };

  // ck_s2: set checkIndex = 1
  main.blocks['ck_s2'] = {
    opcode: 'data_setvariableto',
    next: 'ck_rep',
    parent: 'ck_s1',
    inputs: { VALUE: [ 1, [ 10, '1' ] ] },
    fields: { VARIABLE: [ 'checkIndex', 'var_check_index_id' ] },
    shadow: false,
    topLevel: false
  };

  // ck_rep: repeat until <(checkIndex > length of PossessCard) or (canLevelup == 1)>
  // ck_cond_gt: checkIndex > length of PossessCard
  // ck_len: length of PossessCard
  main.blocks['ck_len'] = {
    opcode: 'data_lengthoflist',
    next: null,
    parent: 'ck_cond_gt',
    inputs: {},
    fields: { LIST: [ 'PossessCard[name,lv,damage,hp,e]', possessListId ] },
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_cond_gt'] = {
    opcode: 'operator_gt',
    next: null,
    parent: 'ck_rep_or',
    inputs: {
      OPERAND1: [ 3, [ 12, 'checkIndex', 'var_check_index_id' ], [ 10, '' ] ],
      OPERAND2: [ 3, 'ck_len', [ 10, '' ] ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_cond_eq1'] = {
    opcode: 'operator_equals',
    next: null,
    parent: 'ck_rep_or',
    inputs: {
      OPERAND1: [ 3, [ 12, 'canLevelup', 'var_can_levelup_id' ], [ 10, '' ] ],
      OPERAND2: [ 1, [ 10, '1' ] ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_rep_or'] = {
    opcode: 'operator_or',
    next: null,
    parent: 'ck_rep',
    inputs: {
      OPERAND1: [ 2, 'ck_cond_gt' ],
      OPERAND2: [ 2, 'ck_cond_eq1' ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_rep'] = {
    opcode: 'control_repeat_until',
    next: null,
    parent: 'ck_s2',
    inputs: {
      CONDITION: [ 2, 'ck_rep_or' ],
      SUBSTACK: [ 2, 'ck_get_name' ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  // Inside repeat:
  // ck_get_name: set cardName = item (checkIndex) of PossessCard
  main.blocks['ck_item_name'] = {
    opcode: 'data_itemoflist',
    next: null,
    parent: 'ck_get_name',
    inputs: {
      INDEX: [ 3, [ 12, 'checkIndex', 'var_check_index_id' ], [ 7, 1 ] ]
    },
    fields: { LIST: [ 'PossessCard[name,lv,damage,hp,e]', possessListId ] },
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_get_name'] = {
    opcode: 'data_setvariableto',
    next: 'ck_get_lv',
    parent: 'ck_rep',
    inputs: { VALUE: [ 3, 'ck_item_name', [ 10, '' ] ] },
    fields: { VARIABLE: [ 'cardName', 'var_card_name_id' ] },
    shadow: false,
    topLevel: false
  };

  // ck_get_lv: set cardLv = item (checkIndex + 1) of PossessCard
  main.blocks['ck_idx_plus1'] = {
    opcode: 'operator_add',
    next: null,
    parent: 'ck_item_lv',
    inputs: {
      NUM1: [ 3, [ 12, 'checkIndex', 'var_check_index_id' ], [ 4, '' ] ],
      NUM2: [ 1, [ 4, '1' ] ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_item_lv'] = {
    opcode: 'data_itemoflist',
    next: null,
    parent: 'ck_get_lv',
    inputs: {
      INDEX: [ 3, 'ck_idx_plus1', [ 7, 1 ] ]
    },
    fields: { LIST: [ 'PossessCard[name,lv,damage,hp,e]', possessListId ] },
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_get_lv'] = {
    opcode: 'data_setvariableto',
    next: 'ck_get_type',
    parent: 'ck_get_name',
    inputs: { VALUE: [ 3, 'ck_item_lv', [ 10, '' ] ] },
    fields: { VARIABLE: [ 'cardLv', 'var_card_lv_id' ] },
    shadow: false,
    topLevel: false
  };

  // ck_get_type: set cardType = item ((item # of cardName in *CardList) + 1) of *CardList
  main.blocks['ck_find_name'] = {
    opcode: 'data_itemnumoflist',
    next: null,
    parent: 'ck_type_idx',
    inputs: {
      ITEM: [ 3, [ 12, 'cardName', 'var_card_name_id' ], [ 10, '' ] ]
    },
    fields: { LIST: [ '*CardList[name,type,[3]]', cardListId ] },
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_type_idx'] = {
    opcode: 'operator_add',
    next: null,
    parent: 'ck_item_type',
    inputs: {
      NUM1: [ 3, 'ck_find_name', [ 4, '' ] ],
      NUM2: [ 1, [ 4, '1' ] ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_item_type'] = {
    opcode: 'data_itemoflist',
    next: null,
    parent: 'ck_get_type',
    inputs: {
      INDEX: [ 3, 'ck_type_idx', [ 7, 1 ] ]
    },
    fields: { LIST: [ '*CardList[name,type,[3]]', cardListId ] },
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_get_type'] = {
    opcode: 'data_setvariableto',
    next: 'ck_if_p',
    parent: 'ck_get_lv',
    inputs: { VALUE: [ 3, 'ck_item_type', [ 10, '' ] ] },
    fields: { VARIABLE: [ 'cardType', 'var_card_type_id' ] },
    shadow: false,
    topLevel: false
  };

  // ck_if_p: if <(cardType == "P") and <(cardLv > 0) and (cardLv < 3)>> then: set canLevelup = 1
  main.blocks['ck_cond_type_p'] = {
    opcode: 'operator_equals',
    next: null,
    parent: 'ck_cond_and1',
    inputs: {
      OPERAND1: [ 3, [ 12, 'cardType', 'var_card_type_id' ], [ 10, '' ] ],
      OPERAND2: [ 1, [ 10, 'P' ] ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_cond_lv_gt0'] = {
    opcode: 'operator_gt',
    next: null,
    parent: 'ck_cond_and2',
    inputs: {
      OPERAND1: [ 3, [ 12, 'cardLv', 'var_card_lv_id' ], [ 10, '' ] ],
      OPERAND2: [ 1, [ 10, '0' ] ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_cond_lv_lt3'] = {
    opcode: 'operator_lt',
    next: null,
    parent: 'ck_cond_and2',
    inputs: {
      OPERAND1: [ 3, [ 12, 'cardLv', 'var_card_lv_id' ], [ 10, '' ] ],
      OPERAND2: [ 1, [ 10, '3' ] ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_cond_and2'] = {
    opcode: 'operator_and',
    next: null,
    parent: 'ck_cond_and1',
    inputs: {
      OPERAND1: [ 2, 'ck_cond_lv_gt0' ],
      OPERAND2: [ 2, 'ck_cond_lv_lt3' ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_cond_and1'] = {
    opcode: 'operator_and',
    next: null,
    parent: 'ck_if_p',
    inputs: {
      OPERAND1: [ 2, 'ck_cond_type_p' ],
      OPERAND2: [ 2, 'ck_cond_and2' ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_set_can1'] = {
    opcode: 'data_setvariableto',
    next: null,
    parent: 'ck_if_p',
    inputs: { VALUE: [ 1, [ 10, '1' ] ] },
    fields: { VARIABLE: [ 'canLevelup', 'var_can_levelup_id' ] },
    shadow: false,
    topLevel: false
  };

  main.blocks['ck_if_p'] = {
    opcode: 'control_if',
    next: 'ck_inc_idx',
    parent: 'ck_get_type',
    inputs: {
      CONDITION: [ 2, 'ck_cond_and1' ],
      SUBSTACK: [ 2, 'ck_set_can1' ]
    },
    fields: {},
    shadow: false,
    topLevel: false
  };

  // ck_inc_idx: change checkIndex by 5
  main.blocks['ck_inc_idx'] = {
    opcode: 'data_changevariableby',
    next: null,
    parent: 'ck_if_p',
    inputs: { VALUE: [ 1, [ 4, '5' ] ] },
    fields: { VARIABLE: [ 'checkIndex', 'var_check_index_id' ] },
    shadow: false,
    topLevel: false
  };

  console.log('Defined CheckCanLevelup procedure in Main');
}

// ===========================================================================
// PART 4: Patch Node 1-6 (bC) in PlayLevelStory
// ===========================================================================
// Currently:
// yx -> yy (HideDialog) -> yz (set IsFinish?=1) -> :, (set Main="level")
// We replace yz and :, with CheckCanLevelup check and conditional branch!
main.blocks['bC_patch_com'] = {
  opcode: 'procedures_call',
  next: 'bC_call_chk',
  parent: 'yy',
  inputs: {
    'Ek-A~/NfZp~;(J!%e|GM': [ 1, [ 10, '【升级角色牌补丁】检查背包中是否有等级<3的角色牌；若无可升牌则自动跳过升级回退大地图' ] ]
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

main.blocks['bC_call_chk'] = {
  opcode: 'procedures_call',
  next: 'bC_if_can',
  parent: 'bC_patch_com',
  inputs: {},
  fields: {},
  shadow: false,
  topLevel: false,
  mutation: {
    tagName: 'mutation',
    children: [],
    proccode: 'CheckCanLevelup',
    argumentids: '[]',
    argumentnames: '[]',
    argumentdefaults: '[]',
    warp: 'true'
  }
};

main.blocks['bC_cond_eq1'] = {
  opcode: 'operator_equals',
  next: null,
  parent: 'bC_if_can',
  inputs: {
    OPERAND1: [ 3, [ 12, 'canLevelup', 'var_can_levelup_id' ], [ 10, '' ] ],
    OPERAND2: [ 1, [ 10, '1' ] ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

// SUBSTACK 1: canLevelup == 1 -> set IsFinish? to 0, set Main to "level"
main.blocks['bC_set_fin0'] = {
  opcode: 'data_setvariableto',
  next: 'bC_set_main_lvl',
  parent: 'bC_if_can',
  inputs: { VALUE: [ 1, [ 10, '0' ] ] },
  fields: { VARIABLE: [ 'IsFinish?', 'W8v)wPO!(Z}}=K*Eipmm' ] },
  shadow: false,
  topLevel: false
};

main.blocks['bC_set_main_lvl'] = {
  opcode: 'data_setvariableto',
  next: null,
  parent: 'bC_set_fin0',
  inputs: { VALUE: [ 1, [ 10, 'level' ] ] },
  fields: { VARIABLE: [ 'Main', 'o;f`h!6uY=ydP0(7EPr{' ] },
  shadow: false,
  topLevel: false
};

// SUBSTACK 2: canLevelup == 0 -> set IsFinish? to 1, set Main to "map"
main.blocks['bC_set_fin1'] = {
  opcode: 'data_setvariableto',
  next: 'bC_set_main_map',
  parent: 'bC_if_can',
  inputs: { VALUE: [ 1, [ 10, '1' ] ] },
  fields: { VARIABLE: [ 'IsFinish?', 'W8v)wPO!(Z}}=K*Eipmm' ] },
  shadow: false,
  topLevel: false
};

main.blocks['bC_set_main_map'] = {
  opcode: 'data_setvariableto',
  next: null,
  parent: 'bC_set_fin1',
  inputs: { VALUE: [ 1, [ 10, 'map' ] ] },
  fields: { VARIABLE: [ 'Main', 'o;f`h!6uY=ydP0(7EPr{' ] },
  shadow: false,
  topLevel: false
};

main.blocks['bC_if_can'] = {
  opcode: 'control_if_else',
  next: null,
  parent: 'bC_call_chk',
  inputs: {
    CONDITION: [ 2, 'bC_cond_eq1' ],
    SUBSTACK: [ 2, 'bC_set_fin0' ],
    SUBSTACK2: [ 2, 'bC_set_fin1' ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

// Rehook yy.next to bC_patch_com
main.blocks['yy'].next = 'bC_patch_com';

// Delete obsolete yz and :,
delete main.blocks['yz'];
delete main.blocks[':,'];

console.log('Patched Node 1-6 with CheckCanLevelup condition');

// ===========================================================================
// PART 5: Spawn skip button clone in vJ
// ===========================================================================
// In vJ:
// gW (wait until <SwitchMain == 0>) was connected to vS
// We insert:
// gW -> spw_com -> spw_set -> spw_cln -> vS
main.blocks['spw_com'] = {
  opcode: 'procedures_call',
  next: 'spw_set',
  parent: 'gW',
  inputs: {
    'Ek-A~/NfZp~;(J!%e|GM': [ 1, [ 10, '【生成一键跳关按钮】黑屏遮罩淡出后生成跳关操纵钮' ] ]
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

main.blocks['spw_set'] = {
  opcode: 'data_setvariableto',
  next: 'spw_cln',
  parent: 'spw_com',
  inputs: { VALUE: [ 1, [ 10, 'skip_button' ] ] },
  fields: { VARIABLE: [ 'cloneType', '!btgA?tHj]1+_*)8Jl]m' ] },
  shadow: false,
  topLevel: false
};

main.blocks['spw_cln_opt'] = {
  opcode: 'control_create_clone_of_menu',
  next: null,
  parent: 'spw_cln',
  inputs: {},
  fields: { CLONE_OPTION: [ '_myself_', null ] },
  shadow: true,
  topLevel: false
};

main.blocks['spw_cln'] = {
  opcode: 'control_create_clone_of',
  next: 'vS',
  parent: 'spw_set',
  inputs: { CLONE_OPTION: [ 1, 'spw_cln_opt' ] },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['gW'].next = 'spw_com';
main.blocks['vS'].parent = 'spw_cln';

console.log('Spawn skip button clone hooked into vJ');

// ===========================================================================
// PART 6: Add skip button clone handler in Main
// ===========================================================================
main.blocks['skp_hat'] = {
  opcode: 'control_start_as_clone',
  next: 'skp_com',
  parent: null,
  inputs: {},
  fields: {},
  shadow: false,
  topLevel: true,
  x: 48,
  y: 9000
};

main.blocks['skp_com'] = {
  opcode: 'procedures_call',
  next: 'skp_if',
  parent: 'skp_hat',
  inputs: {
    'Ek-A~/NfZp~;(J!%e|GM': [ 1, [ 10, '【一键跳关按钮监听】全程常驻，点击立即通关当前关卡（含剧情与战斗）' ] ]
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

main.blocks['skp_cnd_eq'] = {
  opcode: 'operator_equals',
  next: null,
  parent: 'skp_if',
  inputs: {
    OPERAND1: [ 3, [ 12, 'cloneType', '!btgA?tHj]1+_*)8Jl]m' ], [ 10, '' ] ],
    OPERAND2: [ 1, [ 10, 'skip_button' ] ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

// Inside skp_if SUBSTACK:
main.blocks['skp_cst_menu'] = {
  opcode: 'looks_costume',
  next: null,
  parent: 'skp_cst',
  inputs: {},
  fields: { COSTUME: [ 'button//skip', null ] },
  shadow: true,
  topLevel: false
};

main.blocks['skp_cst'] = {
  opcode: 'looks_switchcostumeto',
  next: 'skp_pos',
  parent: 'skp_if',
  inputs: { COSTUME: [ 1, 'skp_cst_menu' ] },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_pos'] = {
  opcode: 'motion_gotoxy',
  next: 'skp_siz',
  parent: 'skp_cst',
  inputs: {
    X: [ 1, [ 4, '200' ] ],
    Y: [ 1, [ 4, '155' ] ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_siz'] = {
  opcode: 'looks_setsizeto',
  next: 'skp_frt',
  parent: 'skp_pos',
  inputs: { SIZE: [ 1, [ 4, '100' ] ] },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_frt'] = {
  opcode: 'looks_gotofrontback',
  next: 'skp_shw',
  parent: 'skp_siz',
  inputs: {},
  fields: { FRONT_BACK: [ 'front', null ] },
  shadow: false,
  topLevel: false
};

main.blocks['skp_shw'] = {
  opcode: 'looks_show',
  next: 'skp_rep',
  parent: 'skp_frt',
  inputs: {},
  fields: {},
  shadow: false,
  topLevel: false
};

// skp_rep: repeat until <(Main == "map") or (Main == "main")>
main.blocks['skp_eq_map'] = {
  opcode: 'operator_equals',
  next: null,
  parent: 'skp_or_term',
  inputs: {
    OPERAND1: [ 3, [ 12, 'Main', 'o;f`h!6uY=ydP0(7EPr{' ], [ 10, '' ] ],
    OPERAND2: [ 1, [ 10, 'map' ] ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_eq_main'] = {
  opcode: 'operator_equals',
  next: null,
  parent: 'skp_or_term',
  inputs: {
    OPERAND1: [ 3, [ 12, 'Main', 'o;f`h!6uY=ydP0(7EPr{' ], [ 10, '' ] ],
    OPERAND2: [ 1, [ 10, 'main' ] ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_or_term'] = {
  opcode: 'operator_or',
  next: null,
  parent: 'skp_rep',
  inputs: {
    OPERAND1: [ 2, 'skp_eq_map' ],
    OPERAND2: [ 2, 'skp_eq_main' ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

// Inside skp_rep loop:
// Check mouse hovering
main.blocks['skp_touch_m'] = {
  opcode: 'sensing_touchingobjectmenu',
  next: null,
  parent: 'skp_touch',
  inputs: {},
  fields: { TOUCHINGOBJECTMENU: [ '_mouse_', null ] },
  shadow: true,
  topLevel: false
};

main.blocks['skp_touch'] = {
  opcode: 'sensing_touchingobject',
  next: null,
  parent: 'skp_ck_hov',
  inputs: { TOUCHINGOBJECTMENU: [ 1, 'skp_touch_m' ] },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_set_brt30'] = {
  opcode: 'looks_seteffectto',
  next: 'skp_ck_clk',
  parent: 'skp_ck_hov',
  inputs: { VALUE: [ 1, [ 4, '30' ] ] },
  fields: { EFFECT: [ 'BRIGHTNESS', null ] },
  shadow: false,
  topLevel: false
};

main.blocks['skp_m_down'] = {
  opcode: 'sensing_mousedown',
  next: null,
  parent: 'skp_ck_clk',
  inputs: {},
  fields: {},
  shadow: false,
  topLevel: false
};

// Click handling:
main.blocks['skp_not_m'] = {
  opcode: 'operator_not',
  next: null,
  parent: 'skp_wt_up',
  inputs: { OPERAND: [ 2, 'skp_m_down2' ] },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_m_down2'] = {
  opcode: 'sensing_mousedown',
  next: null,
  parent: 'skp_not_m',
  inputs: {},
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_wt_up'] = {
  opcode: 'control_wait_until',
  next: 'skp_act_com',
  parent: 'skp_ck_clk',
  inputs: { CONDITION: [ 2, 'skp_not_m' ] },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_act_com'] = {
  opcode: 'procedures_call',
  next: 'skp_set_fin1',
  parent: 'skp_wt_up',
  inputs: {
    'Ek-A~/NfZp~;(J!%e|GM': [ 1, [ 10, '【执行一键跳关】设置IsFinish?=1，重置Condition，返回map大地图' ] ]
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

main.blocks['skp_set_fin1'] = {
  opcode: 'data_setvariableto',
  next: 'skp_set_cnd',
  parent: 'skp_act_com',
  inputs: { VALUE: [ 1, [ 10, '1' ] ] },
  fields: { VARIABLE: [ 'IsFinish?', 'W8v)wPO!(Z}}=K*Eipmm' ] },
  shadow: false,
  topLevel: false
};

main.blocks['skp_set_cnd'] = {
  opcode: 'data_setvariableto',
  next: 'skp_set_main',
  parent: 'skp_set_fin1',
  inputs: { VALUE: [ 1, [ 10, 'inhand' ] ] },
  fields: { VARIABLE: [ 'Condition', 'JWl`Aemb~ZBcRV-c9-yT' ] },
  shadow: false,
  topLevel: false
};

main.blocks['skp_set_main'] = {
  opcode: 'data_setvariableto',
  next: null,
  parent: 'skp_set_cnd',
  inputs: { VALUE: [ 1, [ 10, 'map' ] ] },
  fields: { VARIABLE: [ 'Main', 'o;f`h!6uY=ydP0(7EPr{' ] },
  shadow: false,
  topLevel: false
};

main.blocks['skp_ck_clk'] = {
  opcode: 'control_if',
  next: null,
  parent: 'skp_set_brt30',
  inputs: {
    CONDITION: [ 2, 'skp_m_down' ],
    SUBSTACK: [ 2, 'skp_wt_up' ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_rst_brt'] = {
  opcode: 'looks_seteffectto',
  next: null,
  parent: 'skp_ck_hov',
  inputs: { VALUE: [ 1, [ 4, '0' ] ] },
  fields: { EFFECT: [ 'BRIGHTNESS', null ] },
  shadow: false,
  topLevel: false
};

main.blocks['skp_ck_hov'] = {
  opcode: 'control_if_else',
  next: 'skp_wt005',
  parent: 'skp_rep',
  inputs: {
    CONDITION: [ 2, 'skp_touch' ],
    SUBSTACK: [ 2, 'skp_set_brt30' ],
    SUBSTACK2: [ 2, 'skp_rst_brt' ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_wt005'] = {
  opcode: 'control_wait',
  next: null,
  parent: 'skp_ck_hov',
  inputs: { DURATION: [ 1, [ 5, '0.05' ] ] },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_rep'] = {
  opcode: 'control_repeat_until',
  next: 'skp_del',
  parent: 'skp_shw',
  inputs: {
    CONDITION: [ 2, 'skp_or_term' ],
    SUBSTACK: [ 2, 'skp_ck_hov' ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_del'] = {
  opcode: 'control_delete_this_clone',
  next: null,
  parent: 'skp_rep',
  inputs: {},
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['skp_if'] = {
  opcode: 'control_if',
  next: null,
  parent: 'skp_com',
  inputs: {
    CONDITION: [ 2, 'skp_cnd_eq' ],
    SUBSTACK: [ 2, 'skp_cst' ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

console.log('Added skip button clone handler in Main');

// ===========================================================================
// PART 7: Fast unblock for story dialog when Main == "map"
// ===========================================================================
// In v. (AddText waitclick):
// g) had CONDITION: [2, "/u"] (/u is sensing_mousedown)
// We change g) to: <mouse down or (Main == "map")>
main.blocks['txt_eq_map'] = {
  opcode: 'operator_equals',
  next: null,
  parent: 'txt_or_m_or_map',
  inputs: {
    OPERAND1: [ 3, [ 12, 'Main', 'o;f`h!6uY=ydP0(7EPr{' ], [ 10, '' ] ],
    OPERAND2: [ 1, [ 10, 'map' ] ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['txt_or_m_or_map'] = {
  opcode: 'operator_or',
  next: null,
  parent: 'g)',
  inputs: {
    OPERAND1: [ 2, '/u' ],
    OPERAND2: [ 2, 'txt_eq_map' ]
  },
  fields: {},
  shadow: false,
  topLevel: false
};

main.blocks['/u'].parent = 'txt_or_m_or_map';
main.blocks['g)'].inputs.CONDITION = [ 2, 'txt_or_m_or_map' ];

console.log('Story dialogue fast-break on Main == "map" configured');

// ===========================================================================
// PART 8: Validate all blocks across all targets
// ===========================================================================
let errors = 0;
for (const target of pj.targets) {
  const blocks = target.blocks;
  const blockIds = new Set(Object.keys(blocks));

  for (const [id, b] of Object.entries(blocks)) {
    if (b.parent) {
      if (!blockIds.has(b.parent)) {
        console.error(target.name + ' block ' + id + ' has non-existent parent ' + b.parent);
        errors++;
      } else {
        const p = blocks[b.parent];
        let found = (p.next === id);
        if (!found && p.inputs) {
          for (const inp of Object.values(p.inputs)) {
            if (Array.isArray(inp) && (inp[1] === id || inp[2] === id)) {
              found = true;
              break;
            }
          }
        }
        if (!found) {
          console.error(target.name + ' block ' + id + ' parent ' + b.parent + ' does not reference it!');
          errors++;
        }
      }
    }
    if (b.next) {
      if (!blockIds.has(b.next)) {
        console.error(target.name + ' block ' + id + ' has non-existent next ' + b.next);
        errors++;
      } else {
        const n = blocks[b.next];
        if (n.parent !== id) {
          console.error(target.name + ' block ' + id + ' next is ' + b.next + ', but child parent is ' + n.parent);
          errors++;
        }
      }
    }
    if (b.inputs) {
      for (const [k, inp] of Object.entries(b.inputs)) {
        if (Array.isArray(inp)) {
          if (inp[0] === 1 || inp[0] === 2 || inp[0] === 3) {
            if (typeof inp[1] === 'string' && !blockIds.has(inp[1])) {
              console.error(target.name + ' block ' + id + ' input ' + k + ' references missing ' + inp[1]);
              errors++;
            }
            if (inp[2] && typeof inp[2] === 'string' && !blockIds.has(inp[2])) {
              console.error(target.name + ' block ' + id + ' input ' + k + ' shadow references missing ' + inp[2]);
              errors++;
            }
          }
        }
      }
    }
  }
}

console.log('Total validation errors:', errors);

if (errors === 0) {
  zip.updateFile('project.json', Buffer.from(JSON.stringify(pj)));
  zip.writeZip('project/resource/FCE2.3.sb3');
  console.log('SUCCESS: All patches cleanly applied to project/resource/FCE2.3.sb3');
} else {
  console.error('FAILED: Validation errors detected, did not save!');
}
