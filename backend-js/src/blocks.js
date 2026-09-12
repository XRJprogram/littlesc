// blocks.js — Block definitions for the goboscript compiler
// Ported from goboscript/blocks.py

export class Menu {
  constructor(input, opcode, defaultValue, field) {
    this.input = input;
    this.opcode = opcode;
    this.default = defaultValue;
    this.field = field;
  }
}

// ---------------------------------------------------------------------------
// UnOp — unary operators
// ---------------------------------------------------------------------------

export const UnOp = {
  Not: 'Not',
  Length: 'Length',
  Round: 'Round',
  Abs: 'Abs',
  Floor: 'Floor',
  Ceil: 'Ceil',
  Sqrt: 'Sqrt',
  Sin: 'Sin',
  Cos: 'Cos',
  Tan: 'Tan',
  Asin: 'Asin',
  Acos: 'Acos',
  Atan: 'Atan',
  Ln: 'Ln',
  Log: 'Log',
  AntiLn: 'AntiLn',
  AntiLog: 'AntiLog',
  Minus: 'Minus',
};

const _UNOP_MATHOP = {
  [UnOp.Abs]: 'abs',
  [UnOp.Floor]: 'floor',
  [UnOp.Ceil]: 'ceiling',
  [UnOp.Sqrt]: 'sqrt',
  [UnOp.Sin]: 'sin',
  [UnOp.Cos]: 'cos',
  [UnOp.Tan]: 'tan',
  [UnOp.Asin]: 'asin',
  [UnOp.Acos]: 'acos',
  [UnOp.Atan]: 'atan',
  [UnOp.Ln]: 'ln',
  [UnOp.Log]: 'log',
  [UnOp.AntiLn]: 'e ^',
  [UnOp.AntiLog]: '10 ^',
};

export function unopOpcode(self) {
  if (self === UnOp.Not) return 'operator_not';
  if (self === UnOp.Length) return 'operator_length';
  if (self === UnOp.Round) return 'operator_round';
  if (_UNOP_MATHOP[self]) return 'operator_mathop';
  throw new Error(`UnOp.${self} has no opcode`);
}

export function unopInput(self) {
  if (self === UnOp.Not) return 'OPERAND';
  if (self === UnOp.Length) return 'STRING';
  if (self === UnOp.Round) return 'NUM';
  if (_UNOP_MATHOP[self]) return 'NUM';
  throw new Error(`UnOp.${self} has no input`);
}

export function unopFields(self) {
  const op = _UNOP_MATHOP[self];
  if (!op) return null;
  return { OPERATOR: [op, null] };
}

// ---------------------------------------------------------------------------
// BinOp — binary operators
// ---------------------------------------------------------------------------

export const BinOp = {
  Add: 'Add',
  Sub: 'Sub',
  Mul: 'Mul',
  Div: 'Div',
  Mod: 'Mod',
  Lt: 'Lt',
  Gt: 'Gt',
  Eq: 'Eq',
  And: 'And',
  Or: 'Or',
  Join: 'Join',
  In: 'In',
  Of: 'Of',
  Le: 'Le',
  Ge: 'Ge',
  Ne: 'Ne',
  FloorDiv: 'FloorDiv',
};

const _BINOP_OPCODE = {
  [BinOp.Add]: 'operator_add',
  [BinOp.Sub]: 'operator_subtract',
  [BinOp.Mul]: 'operator_multiply',
  [BinOp.Div]: 'operator_divide',
  [BinOp.Mod]: 'operator_mod',
  [BinOp.Lt]: 'operator_lt',
  [BinOp.Gt]: 'operator_gt',
  [BinOp.Eq]: 'operator_equals',
  [BinOp.And]: 'operator_and',
  [BinOp.Or]: 'operator_or',
  [BinOp.Join]: 'operator_join',
  [BinOp.In]: 'operator_contains',
  [BinOp.Of]: 'operator_letter_of',
};

const _BINOP_LHS = {
  [BinOp.Add]: 'NUM1',
  [BinOp.Sub]: 'NUM1',
  [BinOp.Mul]: 'NUM1',
  [BinOp.Div]: 'NUM1',
  [BinOp.Mod]: 'NUM1',
  [BinOp.Lt]: 'OPERAND1',
  [BinOp.Gt]: 'OPERAND1',
  [BinOp.Eq]: 'OPERAND1',
  [BinOp.And]: 'OPERAND1',
  [BinOp.Or]: 'OPERAND1',
  [BinOp.Join]: 'STRING1',
  [BinOp.In]: 'STRING2',
  [BinOp.Of]: 'STRING',
};

const _BINOP_RHS = {
  [BinOp.Add]: 'NUM2',
  [BinOp.Sub]: 'NUM2',
  [BinOp.Mul]: 'NUM2',
  [BinOp.Div]: 'NUM2',
  [BinOp.Mod]: 'NUM2',
  [BinOp.Lt]: 'OPERAND2',
  [BinOp.Gt]: 'OPERAND2',
  [BinOp.Eq]: 'OPERAND2',
  [BinOp.And]: 'OPERAND2',
  [BinOp.Or]: 'OPERAND2',
  [BinOp.Join]: 'STRING2',
  [BinOp.In]: 'STRING1',
  [BinOp.Of]: 'LETTER',
};

export function binopOpcode(self) {
  const op = _BINOP_OPCODE[self];
  if (!op) throw new Error(`BinOp.${self} has no opcode`);
  return op;
}

export function binopLhs(self) {
  const lhs = _BINOP_LHS[self];
  if (!lhs) throw new Error(`BinOp.${self} has no lhs input`);
  return lhs;
}

export function binopRhs(self) {
  const rhs = _BINOP_RHS[self];
  if (!rhs) throw new Error(`BinOp.${self} has no rhs input`);
  return rhs;
}

// ---------------------------------------------------------------------------
// Block — statement (stack) blocks
// ---------------------------------------------------------------------------

export const Block = {
  // motion
  Move: 'Move',
  TurnLeft: 'TurnLeft',
  TurnRight: 'TurnRight',
  GotoRandomPosition: 'GotoRandomPosition',
  GotoMousePointer: 'GotoMousePointer',
  Goto1: 'Goto1',
  Goto2: 'Goto2',
  Glide3: 'Glide3',
  Glide2: 'Glide2',
  GlideToRandomPosition: 'GlideToRandomPosition',
  GlideToMousePointer: 'GlideToMousePointer',
  PointInDirection: 'PointInDirection',
  PointTowardsMousePointer: 'PointTowardsMousePointer',
  PointTowardsRandomDirection: 'PointTowardsRandomDirection',
  PointTowards: 'PointTowards',
  ChangeX: 'ChangeX',
  SetX: 'SetX',
  ChangeY: 'ChangeY',
  SetY: 'SetY',
  IfOnEdgeBounce: 'IfOnEdgeBounce',
  SetRotationStyleLeftRight: 'SetRotationStyleLeftRight',
  SetRotationStyleDoNotRotate: 'SetRotationStyleDoNotRotate',
  SetRotationStyleAllAround: 'SetRotationStyleAllAround',
  // looks
  Say2: 'Say2',
  Say1: 'Say1',
  Think2: 'Think2',
  Think1: 'Think1',
  SwitchCostume: 'SwitchCostume',
  NextCostume: 'NextCostume',
  SwitchBackdrop: 'SwitchBackdrop',
  PreviousBackdrop: 'PreviousBackdrop',
  RandomBackdrop: 'RandomBackdrop',
  NextBackdrop: 'NextBackdrop',
  SetSize: 'SetSize',
  ChangeSize: 'ChangeSize',
  ChangeColorEffect: 'ChangeColorEffect',
  ChangeFisheyeEffect: 'ChangeFisheyeEffect',
  ChangeWhirlEffect: 'ChangeWhirlEffect',
  ChangePixelateEffect: 'ChangePixelateEffect',
  ChangeMosaicEffect: 'ChangeMosaicEffect',
  ChangeBrightnessEffect: 'ChangeBrightnessEffect',
  ChangeGhostEffect: 'ChangeGhostEffect',
  SetColorEffect: 'SetColorEffect',
  SetFisheyeEffect: 'SetFisheyeEffect',
  SetWhirlEffect: 'SetWhirlEffect',
  SetPixelateEffect: 'SetPixelateEffect',
  SetMosaicEffect: 'SetMosaicEffect',
  SetBrightnessEffect: 'SetBrightnessEffect',
  SetGhostEffect: 'SetGhostEffect',
  ClearGraphicEffects: 'ClearGraphicEffects',
  Show: 'Show',
  Hide: 'Hide',
  GotoFront: 'GotoFront',
  GotoBack: 'GotoBack',
  GoForward: 'GoForward',
  GoBackward: 'GoBackward',
  // sound
  PlaySoundUntilDone: 'PlaySoundUntilDone',
  StartSound: 'StartSound',
  StopAllSounds: 'StopAllSounds',
  ChangePitchEffect: 'ChangePitchEffect',
  ChangePanEffect: 'ChangePanEffect',
  SetPitchEffect: 'SetPitchEffect',
  SetPanEffect: 'SetPanEffect',
  ChangeVolume: 'ChangeVolume',
  SetVolume: 'SetVolume',
  ClearSoundEffects: 'ClearSoundEffects',
  // event / control
  Broadcast: 'Broadcast',
  BroadcastAndWait: 'BroadcastAndWait',
  Wait: 'Wait',
  StopAll: 'StopAll',
  StopThisScript: 'StopThisScript',
  StopOtherScripts: 'StopOtherScripts',
  DeleteThisClone: 'DeleteThisClone',
  Clone0: 'Clone0',
  Clone1: 'Clone1',
  // sensing
  Ask: 'Ask',
  SetDragModeDraggable: 'SetDragModeDraggable',
  SetDragModeNotDraggable: 'SetDragModeNotDraggable',
  ResetTimer: 'ResetTimer',
  // pen
  EraseAll: 'EraseAll',
  Stamp: 'Stamp',
  PenDown: 'PenDown',
  PenUp: 'PenUp',
  SetPenColor: 'SetPenColor',
  ChangePenSize: 'ChangePenSize',
  SetPenSize: 'SetPenSize',
  SetPenHue: 'SetPenHue',
  SetPenSaturation: 'SetPenSaturation',
  SetPenBrightness: 'SetPenBrightness',
  SetPenTransparency: 'SetPenTransparency',
  ChangePenHue: 'ChangePenHue',
  ChangePenSaturation: 'ChangePenSaturation',
  ChangePenBrightness: 'ChangePenBrightness',
  ChangePenTransparency: 'ChangePenTransparency',
  // music
  PlayDrum: 'PlayDrum',
  PlayNote: 'PlayNote',
  SetInstrument: 'SetInstrument',
  Rest: 'Rest',
  SetTempo: 'SetTempo',
  ChangeTempo: 'ChangeTempo',
};

// BlockSpec: { opcode, args, field: [key, value] | null, menu: Menu | null }
function _bs(opcode, args, field, menu) {
  return { opcode, args: args || [], field: field || null, menu: menu || null };
}

export const _BLOCK_SPEC = {
  // motion
  [Block.Move]: _bs('motion_movesteps', ['STEPS']),
  [Block.TurnLeft]: _bs('motion_turnleft', ['DEGREES']),
  [Block.TurnRight]: _bs('motion_turnright', ['DEGREES']),
  [Block.GotoRandomPosition]: _bs('motion_goto', [], null, new Menu('TO', 'motion_goto_menu', '_random_', 'TO')),
  [Block.GotoMousePointer]: _bs('motion_goto', [], null, new Menu('TO', 'motion_goto_menu', '_mouse_', 'TO')),
  [Block.Goto1]: _bs('motion_goto', ['TO'], null, new Menu('TO', 'motion_goto_menu', '_random_', 'TO')),
  [Block.Goto2]: _bs('motion_gotoxy', ['X', 'Y']),
  [Block.Glide3]: _bs('motion_glidesecstoxy', ['X', 'Y', 'SECS']),
  [Block.Glide2]: _bs('motion_glideto', ['TO', 'SECS'], null, new Menu('TO', 'motion_glideto_menu', '_random_', 'TO')),
  [Block.GlideToRandomPosition]: _bs('motion_glideto', ['SECS'], null, new Menu('TO', 'motion_glideto_menu', '_random_', 'TO')),
  [Block.GlideToMousePointer]: _bs('motion_glideto', ['SECS'], null, new Menu('TO', 'motion_glideto_menu', '_mouse_', 'TO')),
  [Block.PointInDirection]: _bs('motion_pointindirection', ['DIRECTION']),
  [Block.PointTowardsMousePointer]: _bs('motion_pointtowards', [], null, new Menu('TOWARDS', 'motion_pointtowards_menu', '_mouse_', 'TOWARDS')),
  [Block.PointTowardsRandomDirection]: _bs('motion_pointtowards', [], null, new Menu('TOWARDS', 'motion_pointtowards_menu', '_random_', 'TOWARDS')),
  [Block.PointTowards]: _bs('motion_pointtowards', ['TOWARDS'], null, new Menu('TOWARDS', 'motion_pointtowards_menu', '_random_', 'TOWARDS')),
  [Block.ChangeX]: _bs('motion_changexby', ['DX']),
  [Block.SetX]: _bs('motion_setx', ['X']),
  [Block.ChangeY]: _bs('motion_changeyby', ['DY']),
  [Block.SetY]: _bs('motion_sety', ['Y']),
  [Block.IfOnEdgeBounce]: _bs('motion_ifonedgebounce', []),
  [Block.SetRotationStyleLeftRight]: _bs('motion_setrotationstyle', [], ['STYLE', 'left-right']),
  [Block.SetRotationStyleDoNotRotate]: _bs('motion_setrotationstyle', [], ['STYLE', "don't rotate"]),
  [Block.SetRotationStyleAllAround]: _bs('motion_setrotationstyle', [], ['STYLE', 'all around']),
  // looks
  [Block.Say2]: _bs('looks_sayforsecs', ['MESSAGE', 'SECS']),
  [Block.Say1]: _bs('looks_say', ['MESSAGE']),
  [Block.Think2]: _bs('looks_thinkforsecs', ['MESSAGE', 'SECS']),
  [Block.Think1]: _bs('looks_think', ['MESSAGE']),
  [Block.SwitchCostume]: _bs('looks_switchcostumeto', ['COSTUME'], null, new Menu('COSTUME', 'looks_costume', 'costume1', 'COSTUME')),
  [Block.NextCostume]: _bs('looks_nextcostume', []),
  [Block.SwitchBackdrop]: _bs('looks_switchbackdropto', ['BACKDROP'], null, new Menu('BACKDROP', 'looks_backdrops', 'backdrop1', 'BACKDROP')),
  [Block.PreviousBackdrop]: _bs('looks_switchbackdropto', [], null, new Menu('BACKDROP', 'looks_backdrops', 'previous backdrop', 'BACKDROP')),
  [Block.RandomBackdrop]: _bs('looks_switchbackdropto', [], null, new Menu('BACKDROP', 'looks_backdrops', 'random backdrop', 'BACKDROP')),
  [Block.NextBackdrop]: _bs('looks_nextbackdrop', []),
  [Block.SetSize]: _bs('looks_setsizeto', ['SIZE']),
  [Block.ChangeSize]: _bs('looks_changesizeby', ['CHANGE']),
  [Block.ChangeColorEffect]: _bs('looks_changeeffectby', ['CHANGE'], ['EFFECT', 'COLOR']),
  [Block.ChangeFisheyeEffect]: _bs('looks_changeeffectby', ['CHANGE'], ['EFFECT', 'FISHEYE']),
  [Block.ChangeWhirlEffect]: _bs('looks_changeeffectby', ['CHANGE'], ['EFFECT', 'WHIRL']),
  [Block.ChangePixelateEffect]: _bs('looks_changeeffectby', ['CHANGE'], ['EFFECT', 'PIXELATE']),
  [Block.ChangeMosaicEffect]: _bs('looks_changeeffectby', ['CHANGE'], ['EFFECT', 'MOSAIC']),
  [Block.ChangeBrightnessEffect]: _bs('looks_changeeffectby', ['CHANGE'], ['EFFECT', 'BRIGHTNESS']),
  [Block.ChangeGhostEffect]: _bs('looks_changeeffectby', ['CHANGE'], ['EFFECT', 'GHOST']),
  [Block.SetColorEffect]: _bs('looks_seteffectto', ['VALUE'], ['EFFECT', 'COLOR']),
  [Block.SetFisheyeEffect]: _bs('looks_seteffectto', ['VALUE'], ['EFFECT', 'FISHEYE']),
  [Block.SetWhirlEffect]: _bs('looks_seteffectto', ['VALUE'], ['EFFECT', 'WHIRL']),
  [Block.SetPixelateEffect]: _bs('looks_seteffectto', ['VALUE'], ['EFFECT', 'PIXELATE']),
  [Block.SetMosaicEffect]: _bs('looks_seteffectto', ['VALUE'], ['EFFECT', 'MOSAIC']),
  [Block.SetBrightnessEffect]: _bs('looks_seteffectto', ['VALUE'], ['EFFECT', 'BRIGHTNESS']),
  [Block.SetGhostEffect]: _bs('looks_seteffectto', ['VALUE'], ['EFFECT', 'GHOST']),
  [Block.ClearGraphicEffects]: _bs('looks_cleargraphiceffects', []),
  [Block.Show]: _bs('looks_show', []),
  [Block.Hide]: _bs('looks_hide', []),
  [Block.GotoFront]: _bs('looks_gotofrontback', [], ['FRONT_BACK', 'front']),
  [Block.GotoBack]: _bs('looks_gotofrontback', [], ['FRONT_BACK', 'back']),
  [Block.GoForward]: _bs('looks_goforwardbackwardlayers', ['NUM'], ['FORWARD_BACKWARD', 'forward']),
  [Block.GoBackward]: _bs('looks_goforwardbackwardlayers', ['NUM'], ['FORWARD_BACKWARD', 'backward']),
  // sound
  [Block.PlaySoundUntilDone]: _bs('sound_playuntildone', ['SOUND_MENU'], null, new Menu('SOUND_MENU', 'sound_sounds_menu', 'meow', 'SOUND_MENU')),
  [Block.StartSound]: _bs('sound_play', ['SOUND_MENU'], null, new Menu('SOUND_MENU', 'sound_sounds_menu', 'meow', 'SOUND_MENU')),
  [Block.StopAllSounds]: _bs('sound_stopallsounds', []),
  [Block.ChangePitchEffect]: _bs('sound_changeeffectby', ['VALUE'], ['EFFECT', 'PITCH']),
  [Block.ChangePanEffect]: _bs('sound_changeeffectby', ['VALUE'], ['EFFECT', 'PAN']),
  [Block.SetPitchEffect]: _bs('sound_seteffectto', ['VALUE'], ['EFFECT', 'PITCH']),
  [Block.SetPanEffect]: _bs('sound_seteffectto', ['VALUE'], ['EFFECT', 'PAN']),
  [Block.ChangeVolume]: _bs('sound_changevolumeby', ['VOLUME']),
  [Block.SetVolume]: _bs('sound_setvolumeto', ['VOLUME']),
  [Block.ClearSoundEffects]: _bs('sound_cleareffects', []),
  // event / control
  [Block.Broadcast]: _bs('event_broadcast', ['BROADCAST_INPUT']),
  [Block.BroadcastAndWait]: _bs('event_broadcastandwait', ['BROADCAST_INPUT']),
  [Block.Wait]: _bs('control_wait', ['DURATION']),
  [Block.StopAll]: _bs('control_stop', [], ['STOP_OPTION', 'all']),
  [Block.StopThisScript]: _bs('control_stop', [], ['STOP_OPTION', 'this script']),
  [Block.StopOtherScripts]: _bs('control_stop', [], ['STOP_OPTION', 'other scripts in sprite']),
  [Block.DeleteThisClone]: _bs('control_delete_this_clone', []),
  [Block.Clone0]: _bs('control_create_clone_of', [], null, new Menu('CLONE_OPTION', 'control_create_clone_of_menu', '_myself_', 'CLONE_OPTION')),
  [Block.Clone1]: _bs('control_create_clone_of', ['CLONE_OPTION'], null, new Menu('CLONE_OPTION', 'control_create_clone_of_menu', '_myself_', 'CLONE_OPTION')),
  // sensing
  [Block.Ask]: _bs('sensing_askandwait', ['QUESTION']),
  [Block.SetDragModeDraggable]: _bs('sensing_setdragmode', [], ['DRAG_MODE', 'draggable']),
  [Block.SetDragModeNotDraggable]: _bs('sensing_setdragmode', [], ['DRAG_MODE', 'not draggable']),
  [Block.ResetTimer]: _bs('sensing_resettimer', []),
  // pen
  [Block.EraseAll]: _bs('pen_clear', []),
  [Block.Stamp]: _bs('pen_stamp', []),
  [Block.PenDown]: _bs('pen_penDown', []),
  [Block.PenUp]: _bs('pen_penUp', []),
  [Block.SetPenColor]: _bs('pen_setPenColorToColor', ['COLOR']),
  [Block.ChangePenSize]: _bs('pen_changePenSizeBy', ['SIZE']),
  [Block.SetPenSize]: _bs('pen_setPenSizeTo', ['SIZE']),
  [Block.SetPenHue]: _bs('pen_setPenColorParamTo', ['VALUE'], null, new Menu('COLOR_PARAM', 'pen_menu_colorParam', 'color', 'colorParam')),
  [Block.SetPenSaturation]: _bs('pen_setPenColorParamTo', ['VALUE'], null, new Menu('COLOR_PARAM', 'pen_menu_colorParam', 'saturation', 'colorParam')),
  [Block.SetPenBrightness]: _bs('pen_setPenColorParamTo', ['VALUE'], null, new Menu('COLOR_PARAM', 'pen_menu_colorParam', 'brightness', 'colorParam')),
  [Block.SetPenTransparency]: _bs('pen_setPenColorParamTo', ['VALUE'], null, new Menu('COLOR_PARAM', 'pen_menu_colorParam', 'transparency', 'colorParam')),
  [Block.ChangePenHue]: _bs('pen_changePenColorParamBy', ['VALUE'], null, new Menu('COLOR_PARAM', 'pen_menu_colorParam', 'color', 'colorParam')),
  [Block.ChangePenSaturation]: _bs('pen_changePenColorParamBy', ['VALUE'], null, new Menu('COLOR_PARAM', 'pen_menu_colorParam', 'saturation', 'colorParam')),
  [Block.ChangePenBrightness]: _bs('pen_changePenColorParamBy', ['VALUE'], null, new Menu('COLOR_PARAM', 'pen_menu_colorParam', 'brightness', 'colorParam')),
  [Block.ChangePenTransparency]: _bs('pen_changePenColorParamBy', ['VALUE'], null, new Menu('COLOR_PARAM', 'pen_menu_colorParam', 'transparency', 'colorParam')),
  // music
  [Block.PlayDrum]: _bs('music_playDrumForBeats', ['DRUM', 'BEATS'], null, new Menu('DRUM', 'music_menu_DRUM', '1', 'DRUM')),
  [Block.PlayNote]: _bs('music_playNoteForBeats', ['NOTE', 'BEATS']),
  [Block.SetInstrument]: _bs('music_setInstrument', ['INSTRUMENT'], null, new Menu('INSTRUMENT', 'music_menu_INSTRUMENT', '1', 'INSTRUMENT')),
  [Block.Rest]: _bs('music_restForBeats', ['BEATS']),
  [Block.SetTempo]: _bs('music_setTempo', ['TEMPO']),
  [Block.ChangeTempo]: _bs('music_changeTempo', ['TEMPO']),
};

export const _BLOCK_FROM_SHAPE = {
  'move': Block.Move,
  'turn_left': Block.TurnLeft,
  'turn_right': Block.TurnRight,
  'goto_random_position': Block.GotoRandomPosition,
  'goto_mouse_pointer': Block.GotoMousePointer,
  'glide_to_random_position': Block.GlideToRandomPosition,
  'glide_to_mouse_pointer': Block.GlideToMousePointer,
  'point_in_direction': Block.PointInDirection,
  'point_towards_mouse_pointer': Block.PointTowardsMousePointer,
  'point_towards_random_direction': Block.PointTowardsRandomDirection,
  'point_towards': Block.PointTowards,
  'change_x': Block.ChangeX,
  'set_x': Block.SetX,
  'change_y': Block.ChangeY,
  'set_y': Block.SetY,
  'if_on_edge_bounce': Block.IfOnEdgeBounce,
  'set_rotation_style_left_right': Block.SetRotationStyleLeftRight,
  'set_rotation_style_do_not_rotate': Block.SetRotationStyleDoNotRotate,
  'set_rotation_style_all_around': Block.SetRotationStyleAllAround,
  'switch_costume': Block.SwitchCostume,
  'next_costume': Block.NextCostume,
  'switch_backdrop': Block.SwitchBackdrop,
  'previous_backdrop': Block.PreviousBackdrop,
  'random_backdrop': Block.RandomBackdrop,
  'next_backdrop': Block.NextBackdrop,
  'set_size': Block.SetSize,
  'change_size': Block.ChangeSize,
  'change_color_effect': Block.ChangeColorEffect,
  'change_fisheye_effect': Block.ChangeFisheyeEffect,
  'change_whirl_effect': Block.ChangeWhirlEffect,
  'change_pixelate_effect': Block.ChangePixelateEffect,
  'change_mosaic_effect': Block.ChangeMosaicEffect,
  'change_brightness_effect': Block.ChangeBrightnessEffect,
  'change_ghost_effect': Block.ChangeGhostEffect,
  'set_color_effect': Block.SetColorEffect,
  'set_fisheye_effect': Block.SetFisheyeEffect,
  'set_whirl_effect': Block.SetWhirlEffect,
  'set_pixelate_effect': Block.SetPixelateEffect,
  'set_mosaic_effect': Block.SetMosaicEffect,
  'set_brightness_effect': Block.SetBrightnessEffect,
  'set_ghost_effect': Block.SetGhostEffect,
  'clear_graphic_effects': Block.ClearGraphicEffects,
  'show': Block.Show,
  'hide': Block.Hide,
  'goto_front': Block.GotoFront,
  'goto_back': Block.GotoBack,
  'go_forward': Block.GoForward,
  'go_backward': Block.GoBackward,
  'play_sound_until_done': Block.PlaySoundUntilDone,
  'start_sound': Block.StartSound,
  'stop_all_sounds': Block.StopAllSounds,
  'change_pitch_effect': Block.ChangePitchEffect,
  'change_pan_effect': Block.ChangePanEffect,
  'set_pitch_effect': Block.SetPitchEffect,
  'set_pan_effect': Block.SetPanEffect,
  'change_volume': Block.ChangeVolume,
  'set_volume': Block.SetVolume,
  'clear_sound_effects': Block.ClearSoundEffects,
  'broadcast': Block.Broadcast,
  'broadcast_and_wait': Block.BroadcastAndWait,
  'wait': Block.Wait,
  'stop_all': Block.StopAll,
  'stop_this_script': Block.StopThisScript,
  'stop_other_scripts': Block.StopOtherScripts,
  'delete_this_clone': Block.DeleteThisClone,
  'ask': Block.Ask,
  'set_drag_mode_draggable': Block.SetDragModeDraggable,
  'set_drag_mode_not_draggable': Block.SetDragModeNotDraggable,
  'reset_timer': Block.ResetTimer,
  'erase_all': Block.EraseAll,
  'stamp': Block.Stamp,
  'pen_down': Block.PenDown,
  'pen_up': Block.PenUp,
  'set_pen_color': Block.SetPenColor,
  'change_pen_size': Block.ChangePenSize,
  'set_pen_size': Block.SetPenSize,
  'set_pen_hue': Block.SetPenHue,
  'set_pen_saturation': Block.SetPenSaturation,
  'set_pen_brightness': Block.SetPenBrightness,
  'set_pen_transparency': Block.SetPenTransparency,
  'change_pen_hue': Block.ChangePenHue,
  'change_pen_saturation': Block.ChangePenSaturation,
  'change_pen_brightness': Block.ChangePenBrightness,
  'change_pen_transparency': Block.ChangePenTransparency,
  'play_drum': Block.PlayDrum,
  'play_note': Block.PlayNote,
  'set_instrument': Block.SetInstrument,
  'rest': Block.Rest,
  'set_tempo': Block.SetTempo,
  'change_tempo': Block.ChangeTempo,
};

export const _BLOCK_OVERLOADS = {
  'goto': [Block.Goto1, Block.Goto2],
  'glide': [Block.Glide3, Block.Glide2],
  'say': [Block.Say2, Block.Say1],
  'think': [Block.Think2, Block.Think1],
  'clone': [Block.Clone0, Block.Clone1],
};

// Block methods
export function blockOpcode(self) {
  return _BLOCK_SPEC[self].opcode;
}

export function blockArgs(self) {
  return [..._BLOCK_SPEC[self].args];
}

export function blockFields(self) {
  const field = _BLOCK_SPEC[self].field;
  if (!field) return null;
  return { [field[0]]: [field[1], null] };
}

export function blockMenu(self) {
  return _BLOCK_SPEC[self].menu;
}

export function blockMutation(self) {
  if (self === Block.StopOtherScripts) {
    return { tagName: 'mutation', children: [], hasnext: 'true' };
  }
  return null;
}

export function blockFromShape(name, argCount = 0) {
  if (name === 'goto') {
    if (argCount === 1) return Block.Goto1;
    if (argCount === 2) return Block.Goto2;
    return Block.Goto1;
  }
  if (name === 'glide') {
    if (argCount === 3) return Block.Glide3;
    if (argCount === 2) return Block.Glide2;
    return Block.Glide3;
  }
  if (name === 'say') {
    if (argCount === 2) return Block.Say2;
    if (argCount === 1) return Block.Say1;
    return Block.Say2;
  }
  if (name === 'think') {
    if (argCount === 2) return Block.Think2;
    if (argCount === 1) return Block.Think1;
    return Block.Think2;
  }
  if (name === 'clone') {
    if (argCount === 0) return Block.Clone0;
    if (argCount === 1) return Block.Clone1;
    return Block.Clone0;
  }
  return _BLOCK_FROM_SHAPE[name] || null;
}

export function blockOverloads(name) {
  return [...(_BLOCK_OVERLOADS[name] || [])];
}

// ---------------------------------------------------------------------------
// Repr — expression (reporter) blocks
// ---------------------------------------------------------------------------

export const Repr = {
  XPosition: 'XPosition',
  YPosition: 'YPosition',
  Direction: 'Direction',
  Size: 'Size',
  CostumeNumber: 'CostumeNumber',
  CostumeName: 'CostumeName',
  BackdropNumber: 'BackdropNumber',
  BackdropName: 'BackdropName',
  Volume: 'Volume',
  DistanceToMousePointer: 'DistanceToMousePointer',
  DistanceTo: 'DistanceTo',
  TouchingMousePointer: 'TouchingMousePointer',
  TouchingEdge: 'TouchingEdge',
  Touching: 'Touching',
  KeyPressed: 'KeyPressed',
  MouseDown: 'MouseDown',
  MouseX: 'MouseX',
  MouseY: 'MouseY',
  Loudness: 'Loudness',
  Timer: 'Timer',
  CurrentYear: 'CurrentYear',
  CurrentMonth: 'CurrentMonth',
  CurrentDate: 'CurrentDate',
  CurrentDayOfWeek: 'CurrentDayOfWeek',
  CurrentHour: 'CurrentHour',
  CurrentMinute: 'CurrentMinute',
  CurrentSecond: 'CurrentSecond',
  DaysSince2000: 'DaysSince2000',
  Username: 'Username',
  Online: 'Online',
  TouchingColor: 'TouchingColor',
  ColorIsTouchingColor: 'ColorIsTouchingColor',
  Answer: 'Answer',
  Random: 'Random',
  Contains: 'Contains',
  SensingOf: 'SensingOf',
  ItemNumOfList: 'ItemNumOfList',
  LetterOf: 'LetterOf',
};

function _rs(opcode, args, field, menu) {
  return { opcode, args: args || [], field: field || null, menu: menu || null };
}

export const _REPR_SPEC = {
  [Repr.XPosition]: _rs('motion_xposition', []),
  [Repr.YPosition]: _rs('motion_yposition', []),
  [Repr.Direction]: _rs('motion_direction', []),
  [Repr.Size]: _rs('looks_size', []),
  [Repr.CostumeNumber]: _rs('looks_costumenumbername', [], ['NUMBER_NAME', 'number']),
  [Repr.CostumeName]: _rs('looks_costumenumbername', [], ['NUMBER_NAME', 'name']),
  [Repr.BackdropNumber]: _rs('looks_backdropnumbername', [], ['NUMBER_NAME', 'number']),
  [Repr.BackdropName]: _rs('looks_backdropnumbername', [], ['NUMBER_NAME', 'name']),
  [Repr.Volume]: _rs('sound_volume', []),
  [Repr.DistanceToMousePointer]: _rs('sensing_distanceto', [], null, new Menu('DISTANCETOMENU', 'sensing_distancetomenu', '_mouse_', 'DISTANCETOMENU')),
  [Repr.DistanceTo]: _rs('sensing_distanceto', ['DISTANCETOMENU'], null, new Menu('DISTANCETOMENU', 'sensing_distancetomenu', '_mouse_', 'DISTANCETOMENU')),
  [Repr.TouchingMousePointer]: _rs('sensing_touchingobject', [], null, new Menu('TOUCHINGOBJECTMENU', 'sensing_touchingobjectmenu', '_mouse_', 'TOUCHINGOBJECTMENU')),
  [Repr.TouchingEdge]: _rs('sensing_touchingobject', [], null, new Menu('TOUCHINGOBJECTMENU', 'sensing_touchingobjectmenu', '_edge_', 'TOUCHINGOBJECTMENU')),
  [Repr.Touching]: _rs('sensing_touchingobject', ['TOUCHINGOBJECTMENU'], null, new Menu('TOUCHINGOBJECTMENU', 'sensing_touchingobjectmenu', '_mouse_', 'TOUCHINGOBJECTMENU')),
  [Repr.KeyPressed]: _rs('sensing_keypressed', ['KEY_OPTION'], null, new Menu('KEY_OPTION', 'sensing_keyoptions', 'any', 'KEY_OPTION')),
  [Repr.MouseDown]: _rs('sensing_mousedown', []),
  [Repr.MouseX]: _rs('sensing_mousex', []),
  [Repr.MouseY]: _rs('sensing_mousey', []),
  [Repr.Loudness]: _rs('sensing_loudness', []),
  [Repr.Timer]: _rs('sensing_timer', []),
  [Repr.CurrentYear]: _rs('sensing_current', [], ['CURRENTMENU', 'YEAR']),
  [Repr.CurrentMonth]: _rs('sensing_current', [], ['CURRENTMENU', 'MONTH']),
  [Repr.CurrentDate]: _rs('sensing_current', [], ['CURRENTMENU', 'DATE']),
  [Repr.CurrentDayOfWeek]: _rs('sensing_current', [], ['CURRENTMENU', 'DAYOFWEEK']),
  [Repr.CurrentHour]: _rs('sensing_current', [], ['CURRENTMENU', 'HOUR']),
  [Repr.CurrentMinute]: _rs('sensing_current', [], ['CURRENTMENU', 'MINUTE']),
  [Repr.CurrentSecond]: _rs('sensing_current', [], ['CURRENTMENU', 'SECOND']),
  [Repr.DaysSince2000]: _rs('sensing_dayssince2000', []),
  [Repr.Username]: _rs('sensing_username', []),
  [Repr.Online]: _rs('sensing_online', []),
  [Repr.TouchingColor]: _rs('sensing_touchingcolor', ['COLOR']),
  [Repr.ColorIsTouchingColor]: _rs('sensing_coloristouchingcolor', ['COLOR', 'COLOR2']),
  [Repr.Answer]: _rs('sensing_answer', []),
  [Repr.Random]: _rs('operator_random', ['FROM', 'TO']),
  [Repr.Contains]: _rs('operator_contains', ['STRING1', 'STRING2']),
  // Upstream expr.rs Expr::Property (sb3 sensing_of): PROPERTY is a plain
  // FIELD (single_field, default "x"), only OBJECT is an input + dropdown.
  [Repr.SensingOf]: _rs('sensing_of', ['OBJECT'], ['PROPERTY', 'x'], new Menu('OBJECT', 'sensing_of_object_menu', '_stage_', 'OBJECT')),
  [Repr.ItemNumOfList]: _rs('data_itemnumoflist', ['ITEM'], null, new Menu('LIST', 'data_itemoflist_menu', '', 'LIST')),
  [Repr.LetterOf]: _rs('operator_letter_of', ['LETTER', 'STRING']),
};

export const _REPR_FROM_SHAPE = {
  'x_position': Repr.XPosition,
  'y_position': Repr.YPosition,
  'direction': Repr.Direction,
  'size': Repr.Size,
  'costume_number': Repr.CostumeNumber,
  'costume_name': Repr.CostumeName,
  'backdrop_number': Repr.BackdropNumber,
  'backdrop_name': Repr.BackdropName,
  'volume': Repr.Volume,
  'distance_to_mouse_pointer': Repr.DistanceToMousePointer,
  'distance_to': Repr.DistanceTo,
  'touching_mouse_pointer': Repr.TouchingMousePointer,
  'touching_edge': Repr.TouchingEdge,
  'touching': Repr.Touching,
  'key_pressed': Repr.KeyPressed,
  'mouse_down': Repr.MouseDown,
  'mouse_x': Repr.MouseX,
  'mouse_y': Repr.MouseY,
  'loudness': Repr.Loudness,
  'timer': Repr.Timer,
  'current_year': Repr.CurrentYear,
  'current_month': Repr.CurrentMonth,
  'current_date': Repr.CurrentDate,
  'current_day_of_week': Repr.CurrentDayOfWeek,
  'current_hour': Repr.CurrentHour,
  'current_minute': Repr.CurrentMinute,
  'current_second': Repr.CurrentSecond,
  'days_since_2000': Repr.DaysSince2000,
  'username': Repr.Username,
  'online': Repr.Online,
  'touching_color': Repr.TouchingColor,
  'color_is_touching_color': Repr.ColorIsTouchingColor,
  'answer': Repr.Answer,
  'random': Repr.Random,
  'contains': Repr.Contains,
  'sensing_of': Repr.SensingOf,
  'item_num': Repr.ItemNumOfList,
  'letter_of': Repr.LetterOf,
};

// Repr methods
export function reprOpcode(self) {
  return _REPR_SPEC[self].opcode;
}

export function reprArgs(self) {
  return [..._REPR_SPEC[self].args];
}

export function reprFields(self) {
  const field = _REPR_SPEC[self].field;
  if (!field) return null;
  return { [field[0]]: [field[1], null] };
}

export function reprMenu(self) {
  return _REPR_SPEC[self].menu;
}

export function reprFromShape(name) {
  return _REPR_FROM_SHAPE[name] || null;
}
