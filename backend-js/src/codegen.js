// codegen.js — SB3 code generator for goboscript
// Ported from goboscript/codegen.py (1:1 alignment)
// Turns an ast_nodes.Project into a Scratch 3.0 .sb3 file (zip archive)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

import {
  Name, DotName, Value, TypeValue,
  ExprValue, ExprName, ExprDot, ExprArg, ExprRepr, ExprFuncCall,
  ExprUnOp, ExprBinOp, ExprTernary, ExprStructLiteral, ExprProperty,
  StmtRepeat, StmtForever, StmtBranch, StmtUntil, StmtWaitUntil,
  StmtSetVar, StmtChangeVar, StmtShow, StmtHide,
  StmtAddToList, StmtDeleteList, StmtDeleteListIndex,
  StmtInsertAtList, StmtSetListIndex,
  StmtBlock, StmtProcCall, StmtFuncCall, StmtReturn,
  EventKind, Event, Asset, RotationStyle,
  ListDefaultValues, ListDefaultFile,
  ConstExprValue, ConstExprEnumVariant,
  Sprite, Project,
} from './ast_nodes.js';
import {
  Block, Repr, UnOp, BinOp, Menu,
  blockOpcode, blockArgs, blockFields, blockMenu, blockMutation,
  reprOpcode, reprArgs, reprFields, reprMenu,
  unopOpcode, unopInput, unopFields,
  binopOpcode, binopLhs, binopRhs,
} from './blocks.js';
import { Config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Block ID generation (NodeID / NodeIDFactory)
// ---------------------------------------------------------------------------

class NodeID {
  constructor(id) { this.id = id; }
  toString() { return this.id; }
}

class NodeIDFactory {
  constructor() {
    this._counter = 0;
  }
  newId() {
    this._counter += 1;
    return new NodeID(`__node_id_${this._counter}`);
  }
}

// ---------------------------------------------------------------------------
// S — scope/context object
// ---------------------------------------------------------------------------

class S {
  constructor(sprite, project) {
    this.sprite = sprite;
    this.project = project;
    this.proc_name = null;
    this.func_name = null;
    this.locals = {};
  }

  qualifyName(name) {
    // LISTS WIN over same-named scalar variables and proc parameters.
    // Rationale: Scratch custom-block args are scalars-only, so a list can
    // never actually travel through a parameter — AI code that declares
    // `var tokens` (scalar, from an assignment like `var tokens = f(...)`)
    // AND uses the same name as its real list elsewhere must resolve list
    // contexts to the LIST, or `length(tokens)` compiles to string-length
    // of an empty variable and every loop bound collapses to garbage.
    if (name in this.sprite.lists) {
      return ['list', name];
    }
    if (name in this.project.stage.lists) {
      return ['list', name];
    }
    // Check locals (proc/func args, plus `local`-declared mangled vars).
    // Upstream sb3.rs:72: local vars are emitted as "<procName>:<name>".
    if (this.proc_name && this.locals[name]) {
      return this.locals[name] === 'mangle'
        ? ['var', this.proc_name + ':' + name]
        : ['var', name];
    }
    if (this.func_name && this.locals[name]) {
      return this.locals[name] === 'mangle'
        ? ['var', this.func_name + ':' + name]
        : ['var', name];
    }
    // Check sprite vars
    if (name in this.sprite.vars) {
      return ['var', name];
    }
    // Check global (stage) vars
    if (name in this.project.stage.vars) {
      return ['var', name];
    }
    // Check __ prefix convention for stage vars
    if (name.startsWith('__')) {
      const bare = name.slice(2);
      if (bare in this.project.stage.vars) {
        return ['var', bare];
      }
      if (bare in this.project.stage.lists) {
        return ['list', bare];
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// CodeGen — main code generator
// ---------------------------------------------------------------------------

export class CodeGen {
  constructor(config = null, opts = {}) {
    this.config = config || new Config();
    // Optional base directory for resolving list-default txt files
    // (upstream datalists.rs ListDefault::File). compileSource callers that
    // have a source directory on disk can pass { sourceDir }.
    this.sourceDir = opts.sourceDir || null;
    this.extensions = {};
    this._broadcast_counter = 0;
    this._broadcasts = {};
  }

  // Upstream datalists.rs: a `list t x = "file.txt";` default imports one
  // item per non-empty line at compile time. Without a configured sourceDir
  // the file cannot be resolved — return an empty list instead of failing.
  _readListDefaultFile(relPath) {
    const p = relPath instanceof Value ? relPath.data : String(relPath || '');
    if (this.sourceDir) {
      try {
        const abs = path.isAbsolute(p) ? p : path.join(this.sourceDir, p);
        if (fs.existsSync(abs)) {
          return fs.readFileSync(abs, 'utf8')
            .split(/\r?\n/)
            .filter(line => line.length > 0);
        }
      } catch {
        // fall through to the diagnostic below
      }
    }
    console.warn(`[codegen] list default file not resolvable: "${p}"` +
      (this.sourceDir ? '' : ' (no sourceDir configured)'));
    return [];
  }

  // ======================================================================
  // Public API
  // ======================================================================

  genProject(project) {
    const targets = [];

    // Generate stage
    const stageTarget = this._genSprite(project.stage, project, true);
    targets.push(stageTarget);

    // Generate sprites — layerOrder follows upstream sb3.rs: sprites are
    // ordered alphabetically by name and numbered 1..N (the old hard-coded
    // `1` collapsed every sprite onto one layer). goboscript.toml [layers]
    // reordering is not yet supported here.
    const sortedSprites = Object.values(project.sprites)
      .sort((a, b) => ((a.name || '') < (b.name || '') ? -1 : (a.name || '') > (b.name || '') ? 1 : 0));
    sortedSprites.forEach((sprite, i) => { sprite._layer_order = i + 1; });
    for (const sprite of sortedSprites) {
      const spriteTarget = this._genSprite(sprite, project, false);
      targets.push(spriteTarget);
    }

    // Write the collected broadcast table into the stage target. Upstream
    // sb3.rs emits all EventKind::On names on Stage with id == name; the old
    // code collected them but never wrote them back, leaving an empty table
    // that only worked because scratch-vm self-heals by name.
    stageTarget.broadcasts = { ...this._broadcasts };

    // TurboWarp project configuration (upstream turbowarp_config.rs): always
    // written onto the Stage as a workspace comment ending in "// _twconfig_".
    stageTarget.comments = stageTarget.comments || {};
    stageTarget.comments['twconfig'] = {
      blockId: null,
      x: 5,
      y: 5,
      width: 350,
      height: 160,
      minimized: false,
      text: this._turbowarpConfigText(),
    };

    // Build project.json
    const projectJson = {
      targets,
      monitors: [],
      extensions: Object.keys(this.extensions),
      meta: {
        semver: '3.0.0',
        vm: '4.3.1',
        agent: 'InstanceScratch/1.0',
      },
    };

    return projectJson;
  }

  // Exact replica of upstream TurbowarpConfig Display output (the trailing
  // "// _twconfig_" marker is how TurboWarp recognizes the comment). Note
  // maxClones uses a bare Infinity literal, which is invalid JSON but is what
  // TurboWarp itself writes/parses.
  _turbowarpConfigText() {
    const c = this.config || new Config();
    const frameRate = c.frame_rate ?? 30;
    const maxClones = c.max_clones ?? 300;
    const noMisc = c.no_miscellaneous_limits ?? false;
    const noFencing = c.no_sprite_fencing ?? false;
    const interpolation = c.frame_interpolation ?? false;
    const hq = c.high_quality_pen ?? false;
    const width = c.stage_width ?? 480;
    const height = c.stage_height ?? 360;
    const clonesLiteral = maxClones === Infinity ? 'Infinity' : String(maxClones);
    return 'Configuration for https://turbowarp.org/\n' +
      "You can move, resize, and minimize this comment, but don't " +
      'edit it by hand. This comment can be deleted to remove the ' +
      'stored settings.\n' +
      '{"framerate":' + frameRate +
      ',"interpolation":' + interpolation +
      ',"hq":' + hq +
      ',"width":' + width +
      ',"height":' + height +
      ',"runtimeOptions":{"maxClones":' + clonesLiteral +
      ',"miscLimits":' + (!noMisc) +
      ',"fencing":' + (!noFencing) +
      '}} // _twconfig_';
  }

  makeSb3(project) {
    const projectJson = this.genProject(project);

    // Read default assets
    const assetsDir = path.join(__dirname, '..', 'assets');
    const defaultBackdropSvg = fs.existsSync(path.join(assetsDir, 'cd21514d0531fdffb22204e0ec5ed84a.svg'))
      ? fs.readFileSync(path.join(assetsDir, 'cd21514d0531fdffb22204e0ec5ed84a.svg'))
      : Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"></svg>');
    const dangoCatSvg = fs.existsSync(path.join(assetsDir, 'dango-cat.svg'))
      ? fs.readFileSync(path.join(assetsDir, 'dango-cat.svg'))
      : Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"></svg>');

    // Asset names must derive from the CONTENT hash (upstream goboscript
    // assets.rs: assetId = md5-hex of the bytes, zip entry & md5ext =
    // `${hash}.${ext}`). The official sb3 schema enforces
    // assetId ~ ^[a-fA-F0-9]{32}$, so bundled files with friendly names
    // ('dango-cat.svg') are renamed to their real content hash here.
    const md5Hex = buf => crypto.createHash('md5').update(buf).digest('hex');
    const backdropHex = md5Hex(defaultBackdropSvg);
    const dangoHex = md5Hex(dangoCatSvg);
    const backdropMd5ext = `${backdropHex}.svg`;
    const dangoMd5ext = `${dangoHex}.svg`;
    // Seed the assets dir with content-hashed copies so decompiled sources
    // (which now reference the hashed name) recompile without special-casing.
    try {
      if (!fs.existsSync(path.join(assetsDir, dangoMd5ext))) {
        fs.writeFileSync(path.join(assetsDir, dangoMd5ext), dangoCatSvg);
      }
      if (!fs.existsSync(path.join(assetsDir, backdropMd5ext))) {
        fs.writeFileSync(path.join(assetsDir, backdropMd5ext), defaultBackdropSvg);
      }
    } catch {
      // Read-only assets dir is non-fatal; in-memory registration below still
      // produces a complete sb3.
    }
    const DEFAULT_ASSET_BYTES = {
      [backdropMd5ext]: defaultBackdropSvg,
      [dangoMd5ext]: dangoCatSvg,
      'cd21514d0531fdffb22204e0ec5ed84a.svg': defaultBackdropSvg,
      'dango-cat.svg': dangoCatSvg,
    };

    // Collect assets
    const assetFiles = {};

    // Ensure stage has at least one costume
    for (const target of projectJson.targets) {
      if (target.isStage && (!target.costumes || target.costumes.length === 0)) {
        target.costumes = [{
          name: 'backdrop1',
          assetId: backdropHex,
          md5ext: backdropMd5ext,
          dataFormat: 'svg',
          rotationCenterX: 240,
          rotationCenterY: 180,
        }];
      }
      if (!target.isStage && (!target.costumes || target.costumes.length === 0)) {
        target.costumes = [{
          name: 'costume1',
          assetId: dangoHex,
          md5ext: dangoMd5ext,
          dataFormat: 'svg',
          rotationCenterX: 240,
          rotationCenterY: 180,
        }];
      }
      // Register costume assets
      for (const costume of target.costumes) {
        if (costume.md5ext && !assetFiles[costume.md5ext]) {
          if (DEFAULT_ASSET_BYTES[costume.md5ext]) {
            assetFiles[costume.md5ext] = DEFAULT_ASSET_BYTES[costume.md5ext];
          } else if (this.userAssets && this.userAssets[costume.md5ext]) {
            // Caller-provided bytes (sb3 round-trip pipeline).
            assetFiles[costume.md5ext] = this.userAssets[costume.md5ext];
          } else {
            // Try to read from assets dir
            const assetPath = path.join(assetsDir, costume.md5ext);
            if (fs.existsSync(assetPath)) {
              assetFiles[costume.md5ext] = fs.readFileSync(assetPath);
            }
          }
        }
      }
      // Register sound assets
      for (const sound of (target.sounds || [])) {
        if (sound.md5ext && !assetFiles[sound.md5ext]) {
          if (this.userAssets && this.userAssets[sound.md5ext]) {
            assetFiles[sound.md5ext] = this.userAssets[sound.md5ext];
          } else {
            const assetPath = path.join(assetsDir, sound.md5ext);
            if (fs.existsSync(assetPath)) {
              assetFiles[sound.md5ext] = fs.readFileSync(assetPath);
            }
          }
        }
      }
      // Normalize any remaining non-hash asset filenames to their content
      // hash and rewrite the referencing JSON (upstream naming rule).
      const normalizeAsset = (asset) => {
        if (!asset || !asset.md5ext) return;
        if (/^[a-fA-F0-9]{32}\./.test(asset.md5ext)) return;
        let bytes = assetFiles[asset.md5ext] || DEFAULT_ASSET_BYTES[asset.md5ext];
        if (!bytes) {
          const p = path.join(assetsDir, asset.md5ext);
          if (fs.existsSync(p)) bytes = fs.readFileSync(p);
        }
        if (!bytes) return;
        const ext = (asset.dataFormat
          || asset.md5ext.split('.').pop() || 'svg').replace(/^\./, '');
        const hex = md5Hex(bytes);
        delete assetFiles[asset.md5ext];
        asset.md5ext = `${hex}.${ext}`;
        asset.assetId = hex;
        assetFiles[asset.md5ext] = bytes;
      };
      for (const costume of target.costumes) normalizeAsset(costume);
      for (const sound of (target.sounds || [])) normalizeAsset(sound);
    }

    // Create zip
    const zip = new AdmZip();
    zip.addFile('project.json', Buffer.from(JSON.stringify(projectJson, null, 2), 'utf8'));
    for (const [filename, data] of Object.entries(assetFiles)) {
      zip.addFile(filename, Buffer.from(data));
    }

    return zip.toBuffer();
  }

  // ======================================================================
  // Sprite target generation
  // ======================================================================

  // Coerce a source-level sprite field (Value instance, primitive, or
  // legacy tuple) to a finite number, or null.
  _numField(v) {
    let n;
    if (v instanceof Value) n = Number(v.data);
    else if (Array.isArray(v)) {
      // Legacy [Value, span] tuples from older parser versions.
      const head = v[0];
      n = head instanceof Value ? Number(head.data) : Number(head);
    } else {
      n = typeof v === 'object' && v !== null && 'data' in v ? Number(v.data) : Number(v);
    }
    return Number.isFinite(n) ? n : null;
  }

  // Resolve a parser constant wrapper to a scalar Value. Enum variants
  // evaluate to their explicit discriminant or 0-based position (upstream
  // const-eval); struct literals are not scalars and yield null.
  _constScalar(v, sprite) {
    if (v instanceof ConstExprValue) return v.value;
    if (v instanceof ConstExprEnumVariant) {
      const en = sprite && sprite.enums ? sprite.enums[v.enum_name] : null;
      if (en) {
        const idx = en.variants.findIndex(x => x.name === v.variant_name);
        if (idx >= 0) {
          // Parser stores explicit discriminants as [Value, span] tuples
          // (parseValue result); unwrap before use.
          let dv = en.variants[idx].value;
          if (Array.isArray(dv)) dv = dv[0];
          if (dv instanceof ConstExprValue) dv = dv.value;
          if (dv instanceof Value) return dv;
          if (typeof dv === 'number') return Value.fromFloat(dv);
          return Value.fromFloat(idx);
        }
      }
      return Value.fromFloat(0);
    }
    return null;
  }

  _genSprite(sprite, project, isStage) {
    const s = new S(sprite, project);
    const idFactory = new NodeIDFactory();

    const target = {
      isStage: isStage,
      // The official sb3 schema restricts the stage target's name to the
      // literal enum "Stage" (upstream goboscript sb3.rs STAGE_NAME). Any
      // other name fails scratch-parser validation, i.e. turbowarp.org /
      // Scratch reject the import with "validationError".
      name: isStage ? 'Stage' : (sprite.name || 'Sprite1'),
      variables: {},
      lists: {},
      broadcasts: {},
      blocks: {},
      comments: {},
      currentCostume: 0,
      costumes: [],
      sounds: [],
      // Upstream sb3.rs: stage is 0, sprites numbered 1..N alphabetically
      // (assigned in genProject via sprite._layer_order).
      layerOrder: isStage ? 0 : (sprite._layer_order || 1),
      // SB3 schema requires volume to be a NUMBER — the parser now stores a
      // Value here, and serializing it raw leaked a class object into
      // project.json. Upstream sb3.rs:737-740 writes `volume as number`.
      volume: this._numField(sprite.volume) ?? 100,
      // SB3 schema: sprite targets REQUIRE numeric x/y (scratch-parser
      // rejects the project otherwise). Stage must NOT carry them.
      ...(isStage ? {} : { x: 0, y: 0, size: 100, direction: 90 }),
    };

    // Add variables
    // Scratch 3.0 format: { "varId": ["varName", initialValue, isCloud?] }
    // Upstream sb3.rs declares EVERY declared variable (unused ones only get
    // a diagnostic in pass3; they are not dropped from the project).
    for (const [name, var_] of Object.entries(sprite.vars)) {
      let initialVal = 0;
      // NOTE: the AST field is `.default` (ast_nodes.js Var), not
      // `.default_value` — the old lookup here always missed, silently
      // resetting every `var x = <expr>` to 0.
      // parseConstExpr wraps plain values in ConstExprValue — unwrap before
      // the Value/primitive checks, otherwise every declared default collapses
      // to 0 (invisible to opcode histograms, breaks semantic roundtrips).
      // Enum variants resolve through _constScalar (`var c = Color.RED;`).
      let dv = var_.default;
      if (dv instanceof ConstExprValue || dv instanceof ConstExprEnumVariant) {
        dv = this._constScalar(dv, sprite);
      }
      if (dv !== null && dv !== undefined) {
        if (dv instanceof Value) {
          initialVal = dv.kind === 'string' ? dv.data : dv.toNumber();
        } else if (typeof dv === 'number' || typeof dv === 'string' || typeof dv === 'boolean') {
          initialVal = dv;
        }
      }
      if (var_.is_cloud) {
        // Upstream prefixes cloud var display names with "☁ " and stores
        // the raw JSON value (number/string), not a stringified copy.
        target.variables[name] = [`☁ ${name}`, initialVal, true];
      } else {
        target.variables[name] = [name, initialVal];
      }
    }

    // Upstream sb3.rs:581-620: per-proc `local` variables are declared as
    // plain globals under their mangled id "<procName>:<name>".
    for (const [pn, dict] of Object.entries(sprite.proc_locals || {})) {
      for (const nm of Object.keys(dict)) {
        const id = pn + ':' + nm;
        if (!(id in target.variables)) target.variables[id] = [id, 0];
      }
    }

    // Add lists
    // Scratch 3.0 format: { "listId": ["listName", [items...]] }
    for (const [name, lst] of Object.entries(sprite.lists)) {
      let initialVal = [];
      const d = lst.default;
      if (d instanceof ListDefaultValues) {
        // Parser wraps each element in ConstExprValue (parseConstExpr) —
        // unwrap, otherwise every list default collapses to empty/zero.
        // Enum variants resolve to their numeric discriminant.
        initialVal = (d.values || []).map(v => {
          let cv = this._constScalar(v, sprite);
          if (cv === null) cv = v;
          return (cv instanceof Value)
            ? (cv.kind === 'string' ? cv.data : cv.toNumber())
            : cv;
        });
      } else if (d instanceof ListDefaultFile) {
        // Upstream datalists.rs imports the txt contents at compile time
        // (one item per line). Resolve relative to the configured source
        // directory when available.
        initialVal = this._readListDefaultFile(d.path);
      } else if (d instanceof Value) {
        initialVal = [d.kind === 'string' ? d.data : d.toString()];
      } else if (Array.isArray(d)) {
        initialVal = d;
      }
      // Namespace list ids away from variable ids: Scratch forbids one id
      // appearing as BOTH a scalar variable and a list — the GUI aborts the
      // whole workspace import with "Serialized variable type ... does not
      // match" and the editor renders NOTHING. Display name stays `name`.
      target.lists['L:' + name] = [name, initialVal];
    }

    // Add costumes
    for (const costume of sprite.costumes) {
      target.costumes.push(this._genCostume(costume, isStage));
    }

    // Add sounds
    for (const sound of sprite.sounds) {
      target.sounds.push(this._genSound(sound));
    }

    // Set sprite properties. SB3 schema requires numeric x/y/size/direction;
    // coerce (source may carry string or Value wrappers) and fall back to
    // Scratch defaults when non-finite — TurboWarp's scratch-parser rejects
    // the whole project.json otherwise.
    const nx = this._numField(sprite.x_position);
    const ny = this._numField(sprite.y_position);
    if (nx !== null) target.x = nx;
    if (ny !== null) target.y = ny;
    const nsize = this._numField(sprite.size);
    if (nsize !== null) target.size = nsize;
    const ndir = this._numField(sprite.direction);
    if (ndir !== null) target.direction = ndir;
    // Upstream sb3.rs:742-746 always writes `visible` explicitly.
    target.visible = !sprite.hidden;
    if (sprite.rotation_style) {
      target.rotationStyle = sprite.rotation_style.style || 'all around';
    }

    // Generate event blocks
    // Per-target top-level block position accumulator: ensures each hat
    // block gets a distinct (x, y) so they don't overlap in the workspace.
    const topLevelPos = { x: 60, y: 60 };
    for (const event of sprite.events) {
      const eventId = idFactory.newId();
      this._genEvent(event, target.blocks, idFactory, eventId, sprite, s, topLevelPos);
    }

    // Generate proc definitions (custom blocks)
    for (const procName of Object.keys(sprite.procs)) {
      if (sprite.used_procs && !sprite.used_procs.has(procName)) continue;
      const defId = idFactory.newId();
      this._genProcDefinition(sprite.procs[procName], procName,
        sprite.proc_args[procName] || [],
        sprite.proc_definitions[procName] || [],
        target.blocks, idFactory, defId, sprite, s, topLevelPos);
    }

    // Generate top-level orphan stacks (`orphan { ... }`): loose SB3 blocks
    // not attached to any hat. The first statement of each chain becomes a
    // topLevel block with its own workspace position; the rest of the chain
    // follows via `next`, exactly like a hat-less stack in the Scratch editor.
    for (const chain of sprite.orphanChains) {
      const headId = idFactory.newId();
      this._genStmts(chain, target.blocks, idFactory, headId.id, headId.id, sprite, s);
      // Promote the chain head to a top-level block (no hat, no parent).
      const head = target.blocks[headId.id];
      if (head) {
        head.parent = null;
        head.topLevel = true;
        head.x = topLevelPos.x;
        head.y = topLevelPos.y;
        topLevelPos.x += 400;
        if (topLevelPos.x > 800) {
          topLevelPos.x = 60;
          topLevelPos.y += 400;
        }
      }
    }

    return target;
  }

  // Generate a custom block definition:
  //   procedures_definition (hat, topLevel)
  //     └─ custom_block input → procedures_prototype (shadow)
  //   body blocks (parent chain starts at definition)
  // Shared proccode builder — the procedures_call mutation MUST produce the
  // exact same proccode + argumentids as the procedures_prototype, because
  // scratch-vm pairs them by exact string match (upstream mutation.rs builds
  // both sides from the same qualified_args: `name a: %s b: %s`, all %s).
  _procMutationParts(procName, args) {
    const argNames = args.map((a, i) => (a && a.name) ? a.name : `arg${i}`);
    // Scratch allows duplicate parameter display names (`proc dup x, x`), but
    // argumentids are used as JS object keys for prototype/call inputs —
    // duplicate keys silently orphan the first argument's subtree (dropped on
    // the next roundtrip). Uniquify ids greedily left-to-right; keep
    // argumentnames verbatim. scratch-vm pairs call↔prototype by exact
    // proccode and reads call inputs through the prototype's ids
    // (scratch3_procedures.js getProcedureParamNamesIdsAndDefaults), so only
    // key uniqueness matters. Deterministic ⇒ recompile reaches a fixed point.
    const used = Object.create(null);
    const argIds = argNames.map(name => {
      let id = name;
      for (let n = 2; used[id]; n++) id = `${name}${n}`;
      used[id] = true;
      return id;
    });
    let proccode;
    if (args.length === 0) {
      proccode = procName;
    } else {
      const parts = args.map(a => `${a.name}: %s`);
      proccode = `${procName} ${parts.join(' ')}`;
    }
    return { proccode, argIds, argNames };
  }

  _genProcDefinition(proc, procName, args, body, blocks, idFactory, defId, sprite, s, pos) {
    const { proccode, argIds, argNames } = this._procMutationParts(procName, args);
    // argumentdefaults: empty string default for string/number args
    const argDefaults = args.map(() => '');

    // Create prototype (shadow, child of definition)
    const protoId = idFactory.newId();
    const protoBlock = {
      opcode: 'procedures_prototype',
      next: null,
      parent: defId.id,
      inputs: {},
      fields: {},
      shadow: true,
      topLevel: false,
      mutation: {
        tagName: 'mutation',
        children: [],
        proccode: proccode,
        argumentids: JSON.stringify(argIds),
        argumentnames: JSON.stringify(argNames),
        argumentdefaults: JSON.stringify(argDefaults),
        warp: proc.warp ? 'true' : 'false',
      },
    };

    // Create definition hat block
    const defBlock = {
      opcode: 'procedures_definition',
      next: null,
      parent: null,
      inputs: { custom_block: [1, protoId.id] },
      fields: {},
      shadow: false,
      topLevel: true,
      x: pos.x,
      y: pos.y,
    };

    // Advance position for next hat block
    pos.y += 100;
    if (pos.y > 800) { pos.y = 60; pos.x += 400; }

    // Generate argument reporter shadow blocks (children of prototype)
    for (let i = 0; i < args.length; i++) {
      const argBlockId = idFactory.newId();
      blocks[argBlockId.id] = {
        opcode: 'argument_reporter_string_number',
        next: null,
        parent: protoId.id,
        inputs: {},
        fields: { VALUE: [args[i].name, null] },
        shadow: true,
        topLevel: false,
      };
      protoBlock.inputs[argIds[i]] = [1, argBlockId.id];
    }

    blocks[protoId.id] = protoBlock;
    blocks[defId.id] = defBlock;

    // Generate proc body — parent chain starts at the definition block.
    // M27-F: use a PROC-SCOPED symbol table carrying the parameter names,
    // so ExprName(param) emits an argument_reporter instead of silently
    // reading a same-named (never-assigned → always default) variable.
    if (body && body.length > 0) {
      const procS = new S(sprite, s && s.project);
      procS.proc_name = procName;
      procS.locals = {};
      for (const arg of args) {
        // Scratch custom-block arguments are SCALARS only — a list cannot
        // travel through an argument reporter. AI-written code routinely
        // passes lists positionally using the SAME name as the global list
        // (def_parse(tokens, pos)). For those, skip the parameter binding:
        // body reads then resolve through the normal global-list paths
        // (item-of-list / length-of), which is exactly the intended
        // pass-by-name semantics. Scalar params keep reporter binding.
        if (arg.name in sprite.lists) continue;
        procS.locals[arg.name] = true;
      }
      // Upstream sb3.rs:189-204 + pass0.rs:216-226: variables declared with
      // the `local` keyword resolve to a per-proc MANGLED global
      // "<procName>:<name>" (a static rename — upstream has no runtime
      // frames). Args keep reporter binding; lists win over both.
      for (const nm of Object.keys(sprite.proc_locals[procName] || {})) {
        if (nm in procS.locals) continue;
        if (nm in sprite.lists) continue;
        procS.locals[nm] = 'mangle';
      }
      this._genStmts(body, blocks, idFactory, defId.id, defId.id, sprite, procS);
    }
  }

  _genCostume(costume, isStage = false) {
    // costume is an Asset instance
    const out = {
      name: costume.name || 'costume1',
      assetId: null,
      md5ext: null,
      dataFormat: null,
    };
    if (costume.md5ext) {
      out.assetId = costume.assetId || costume.md5ext.replace(/\.[^.]+$/, '');
      out.md5ext = costume.md5ext;
      out.dataFormat = (costume.dataFormat || costume.md5ext.split('.').pop() || 'svg').toLowerCase();
    } else if (costume.path) {
      const base = costume.path.split('/').pop().split('\\\\').pop();
      out.assetId = costume.assetId || base.replace(/\.[^.]+$/, '');
      out.md5ext = base;
      out.dataFormat = (costume.dataFormat || base.split('.').pop() || 'svg').toLowerCase();
    } else {
      // Default placeholder costume
      out.assetId = 'dango-cat';
      out.md5ext = 'dango-cat.svg';
      out.dataFormat = 'svg';
    }
    const BITMAP = ['png', 'bmp', 'jpeg', 'jpg', 'gif'];
    if (BITMAP.includes(out.dataFormat)) {
      // Upstream writes bitmapResolution only for bitmap formats
      out.bitmapResolution = this.config?.bitmap_resolution ?? 1;
    } else if (costume.bitmapResolution) {
      out.bitmapResolution = costume.bitmapResolution;
    }
    if (costume.rotationCenterX !== undefined && costume.rotationCenterY !== undefined) {
      out.rotationCenterX = costume.rotationCenterX;
      out.rotationCenterY = costume.rotationCenterY;
    } else if (isStage) {
      out.rotationCenterX = 240;
      out.rotationCenterY = 180;
    } else {
      let cx = 0;
      let cy = 0;
      const rawBytes = (this.userAssets && (this.userAssets[costume.path] || this.userAssets[out.md5ext]));
      if (rawBytes) {
        const text = rawBytes.toString('utf8');
        const vb = /viewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']/i.exec(text);
        if (vb) {
          const minX = parseFloat(vb[1]);
          const minY = parseFloat(vb[2]);
          const w = parseFloat(vb[3]);
          const h = parseFloat(vb[4]);
          cx = minX < 0 ? Math.round(-minX) : Math.round(w / 2);
          cy = minY < 0 ? Math.round(-minY) : Math.round(h / 2);
        } else {
          const wm = /width\s*=\s*["']([\d.]+)["']/i.exec(text);
          const hm = /height\s*=\s*["']([\d.]+)["']/i.exec(text);
          if (wm && hm) {
            cx = Math.round(parseFloat(wm[1]) / 2);
            cy = Math.round(parseFloat(hm[1]) / 2);
          }
        }
      }
      out.rotationCenterX = cx;
      out.rotationCenterY = cy;
    }
    return out;
  }

  _genSound(sound) {
    // Upstream sounds.rs writes only name/assetId/md5ext/dataFormat — rate
    // and sampleCount are recomputed by scratch-vm when the audio decodes,
    // and stale values only mislead the editor's duration display.
    let dataFormat;
    let assetId, md5ext;
    if (sound.md5ext) {
      assetId = sound.assetId || sound.md5ext.replace(/\.[^.]+$/, '');
      md5ext = sound.md5ext;
      dataFormat = (sound.dataFormat || sound.md5ext.split('.').pop() || 'wav').toLowerCase();
    } else if (sound.path) {
      const base = sound.path.split('/').pop().split('\\\\').pop();
      assetId = sound.assetId || base.replace(/\.[^.]+$/, '');
      md5ext = base;
      dataFormat = (sound.dataFormat || base.split('.').pop() || 'wav').toLowerCase();
    } else {
      assetId = '83a9787d4cb6f3b7632b4ddfe5d0f0a0';
      md5ext = '83a9787d4cb6f3b7632b4ddfe5d0f0a0.wav';
      dataFormat = 'wav';
    }
    return {
      name: sound.name || 'sound1',
      assetId,
      md5ext,
      dataFormat,
    };
  }

  // ======================================================================
  // Event generation
  // ======================================================================

  _genEvent(event, blocks, idFactory, eventId, sprite, s, pos) {
    let opcode = null;
    const block = {
      opcode: null,
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: true,
      x: pos.x,
      y: pos.y,
    };

    // Advance position for the next top-level block in this target.
    // Layout: start at (60, 60), step +400 horizontally; when x exceeds
    // 800 (beyond typical canvas width), wrap to next row (+400 in y).
    pos.x += 400;
    if (pos.x > 800) {
      pos.x = 60;
      pos.y += 400;
    }

    // event.kind is an EventKind instance; its .kind property is a string
    // like 'OnFlag', 'OnKey', 'On', 'OnClick', 'OnBackdrop', 'OnLoudnessGt',
    // 'OnTimerGt', 'OnClone'.
    const ek = event.kind.kind;
    switch (ek) {
      case 'OnFlag':
        block.opcode = 'event_whenflagclicked';
        break;
      case 'OnKey':
        block.opcode = 'event_whenkeypressed';
        block.fields.KEY_OPTION = [event.kind.key || 'any', null];
        break;
      case 'OnClick':
        block.opcode = 'event_whenthisspriteclicked';
        break;
      case 'OnBackdrop':
        block.opcode = 'event_whenbackdropswitchesto';
        block.fields.BACKDROP = [event.kind.backdrop || 'backdrop1', null];
        break;
      case 'OnLoudnessGt':
        block.opcode = 'event_whengreaterthan';
        block.fields.WHENGREATERTHANMENU = ['LOUDNESS', null];
        block.inputs.VALUE = [1, [10, '']];
        if (event.kind.value) {
          this._genInput(block, 'VALUE', event.kind.value, idFactory.newId(), blocks, idFactory, eventId.id, sprite, s);
        }
        break;
      case 'OnTimerGt':
        block.opcode = 'event_whengreaterthan';
        block.fields.WHENGREATERTHANMENU = ['TIMER', null];
        block.inputs.VALUE = [1, [10, '']];
        if (event.kind.value) {
          this._genInput(block, 'VALUE', event.kind.value, idFactory.newId(), blocks, idFactory, eventId.id, sprite, s);
        }
        break;
      case 'OnClone':
        block.opcode = 'control_start_as_clone';
        break;
      case 'On': {
        block.opcode = 'event_whenbroadcastreceived';
        const broadcastName = event.kind.event || 'message1';
        // Register BEFORE writing the field so the field can carry the
        // broadcast id. Upstream sb3.rs uses id == name (key == value in the
        // Stage broadcasts table) and single_field_id emits [name, name];
        // the old [name, null] relied on scratch-vm's lookup-by-name fallback.
        if (!this._broadcasts[broadcastName]) {
          this._broadcasts[broadcastName] = broadcastName;
        }
        block.fields.BROADCAST_OPTION = [broadcastName, this._broadcasts[broadcastName]];
        break;
      }
      default:
        block.opcode = 'event_whenflagclicked';
        break;
    }

    blocks[eventId.id] = block;

    // Generate event body
    if (event.body && event.body.length > 0) {
      this._genStmts(event.body, blocks, idFactory, eventId.id, eventId.id, sprite, s);
    }
  }

  // ======================================================================
  // Statement generation
  // ======================================================================

  _genStmts(stmts, blocks, idFactory, parentId, topLevelId, sprite, s) {
    // Anchor semantics for the first statement:
    //  - If blocks[parentId] already exists (hat block / procedures_definition),
    //    the first statement gets a fresh id and becomes that block's `next`
    //    (classic chain pattern).
    //  - If blocks[parentId] does NOT exist (C-block SUBSTACK / SUBSTACK2
    //    anchor, orphan chain head, inlined function body), the caller has
    //    wired an input such as SUBSTACK = [2, parentId] expecting the FIRST
    //    statement block to live at exactly that id — so the first statement
    //    is generated there, and its `parent` is set to topLevelId (the
    //    enclosing C-block; null for orphan chains).
    // Previously every statement got a fresh id and the substack anchor id was
    // never created, leaving every C-block body dangling: SUBSTACK pointed at
    // a non-existent block and the body statements became unreachable garbage.
    const anchorExists = !!blocks[parentId];
    let prevId = parentId;
    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i];
      let stmtId;
      if (i === 0 && !anchorExists) {
        // Anchor the first statement at the wired substack/chain id itself.
        stmtId = parentId;
      } else {
        stmtId = idFactory.newId().id;
      }

      const lastId = this._genStmt(stmt, blocks, idFactory, { id: stmtId }, sprite, s);

      if (i === 0) {
        if (anchorExists) {
          // First statement follows the existing parent block (hat pattern).
          blocks[parentId].next = stmtId;
          if (blocks[stmtId]) blocks[stmtId].parent = parentId;
        } else {
          // First statement lives at the anchor id; its logical parent is the
          // enclosing block (topLevelId), e.g. the control_if owning SUBSTACK.
          if (blocks[stmtId]) {
            blocks[stmtId].parent =
              (topLevelId !== undefined && topLevelId !== stmtId) ? topLevelId : null;
          }
        }
      } else {
        blocks[prevId].next = stmtId;
        if (blocks[stmtId]) blocks[stmtId].parent = prevId;
      }
      // For multi-block statements (e.g. list-literal assignment lowered into
      // delete-all + N add-blocks), the NEXT statement must chain from the
      // LAST block produced, not the anchor (first) block.
      prevId = lastId;
    }
  }

  _genStmt(stmt, blocks, idFactory, thisId, sprite, s) {
    let lastId = thisId.id;
    if (stmt instanceof StmtBlock) {
      this._genStmtBlock(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtSetVar) {
      lastId = this._genSetVar(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtChangeVar) {
      this._genChangeVar(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtShow) {
      this._genShow(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtHide) {
      this._genHide(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtAddToList) {
      this._genAddToList(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtDeleteList) {
      this._genDeleteList(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtDeleteListIndex) {
      this._genDeleteListIndex(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtInsertAtList) {
      this._genInsertAtList(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtSetListIndex) {
      this._genSetListIndex(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtRepeat) {
      this._genRepeat(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtForever) {
      this._genForever(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtBranch) {
      this._genBranch(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtUntil) {
      this._genUntil(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtWaitUntil) {
      this._genWaitUntil(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtProcCall) {
      this._genProcCall(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtFuncCall) {
      this._genFuncCallStmt(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtReturn) {
      this._genReturn(stmt, blocks, idFactory, thisId, sprite, s);
    } else {
      // Unknown statement type - generate an empty block
      blocks[thisId.id] = {
        opcode: 'control_wait',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
      };
      blocks[thisId.id].inputs.DURATION = [1, [4, 0]];
    }
    return lastId;
  }

  _genStmtBlock(stmt, blocks, idFactory, thisId, sprite, s) {
    const opcode = blockOpcode(stmt.block);
    this._checkExtension(opcode);

    const block = {
      opcode: opcode,
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };

    // Fields
    const fields = blockFields(stmt.block);
    if (fields) {
      for (const [fname, fval] of Object.entries(fields)) {
        block.fields[fname] = fval;
      }
    }

    // Menu — generate shadow block for the menu input if it's a literal value
    const menu = blockMenu(stmt.block);

    // Mutation
    const mutation = blockMutation(stmt.block);
    if (mutation) {
      block.mutation = mutation;
    }

    // Inputs (args)
    const argNames = blockArgs(stmt.block);
    for (let i = 0; i < argNames.length && i < stmt.args.length; i++) {
      const inputName = argNames[i];
      const argExpr = stmt.args[i];

      // If this input is the menu input and the arg is a literal value,
      // generate a menu shadow block (e.g., looks_costume for switch_costume)
      if (menu && menu.input === inputName && argExpr instanceof ExprValue) {
        const menuBlock = {
          opcode: menu.opcode,
          next: null,
          parent: thisId.id,
          inputs: {},
          fields: {},
          shadow: true,
          topLevel: false,
        };
        if (menu.field) {
          const valStr = argExpr.value.kind === 'string'
            ? argExpr.value.data
            : String(argExpr.value.toNumber());
          menuBlock.fields[menu.field] = [valStr, null];
        }
        const menuId = idFactory.newId();
        blocks[menuId.id] = menuBlock;
        block.inputs[inputName] = [1, menuId.id];
        continue;
      }

      // If this input is the menu input but the arg is a reporter/variable
      // (not a literal), we still need to generate the menu shadow block
      // underneath the reporter. E.g., switch_costume(gcname) needs a
      // looks_costume shadow block as the obscured shadow.
      let menuShadowId = null;
      if (menu && menu.input === inputName) {
        const menuBlock = {
          opcode: menu.opcode,
          next: null,
          parent: thisId.id,
          inputs: {},
          fields: {},
          shadow: true,
          topLevel: false,
        };
        if (menu.field) {
          menuBlock.fields[menu.field] = ['', null];
        }
        const menuId = idFactory.newId();
        blocks[menuId.id] = menuBlock;
        menuShadowId = menuId.id;
      }

      const argId = idFactory.newId();
      this._genInput(block, inputName, argExpr, argId, blocks, idFactory, thisId.id, sprite, s, false, menuShadowId);
    }

    // Zero-arg statement with a menu (e.g., goto_mouse_pointer;): the loop
    // above never runs because the block takes no arguments, so the menu
    // shadow is never emitted. Generate it here with the menu's default
    // value so the round-trip preserves the companion menu block.
    if (menu && !argNames.includes(menu.input)) {
      const menuBlock = {
        opcode: menu.opcode,
        next: null,
        parent: thisId.id,
        inputs: {},
        fields: {},
        shadow: true,
        topLevel: false,
      };
      if (menu.field) {
        menuBlock.fields[menu.field] = [menu.default, null];
      }
      const menuId = idFactory.newId();
      blocks[menuId.id] = menuBlock;
      block.inputs[menu.input] = [1, menuId.id];
    }

    blocks[thisId.id] = block;
  }

  _genSetVar(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let varName = name;
    if (result) {
      varName = result[1];
    }

    // LIST-ASSIGNMENT from a constant array literal (e.g. `g = []` or
    // `g = [1, 2, 3]`). The parser hoists every anonymous literal into a
    // hidden per-sprite list `__arr_N`, and Scratch has no "assign one list
    // from another by value" primitive — a `data_setvariableto` would make the
    // target share a single mutable list object with `__arr_N`. Mutating the
    // target afterwards would also mutate `__arr_N`, so the NEXT time the same
    // literal is assigned the target still holds the stale accumulated items
    // (the root cause of "function always returns the first call's result":
    // `g = []` failed to actually clear g across repeated function calls).
    //
    // Fix: lower the assignment into an explicit clear + per-element append,
    // which both correctly resets the list and preserves the literal's items.
    if (result && result[0] === 'list') {
      const valueIsHiddenArr =
        stmt.value instanceof ExprName &&
        (stmt.value.name instanceof Name
          ? stmt.value.name.name : stmt.value.name) in sprite.lists;
      if (valueIsHiddenArr) {
        const arrName = stmt.value.name instanceof Name
          ? stmt.value.name.name : stmt.value.name;
        const arrList = sprite.lists[arrName];
        if (arrList && arrList.default instanceof ListDefaultValues) {
          return this._genListAssignFromLiteral(
            varName, arrList, blocks, idFactory, thisId.id, sprite, s
          );
        }
      }
    }

    const block = {
      opcode: 'data_setvariableto',
      next: null,
      parent: null,
      inputs: {},
      fields: { VARIABLE: [varName, varName] },
      shadow: false,
      topLevel: false,
    };

    // Generate the value input
    const valueId = idFactory.newId();
    this._genInput(block, 'VALUE', stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);

    blocks[thisId.id] = block;
    return thisId.id;
  }

  // Lower `listVar = <constant literal>` into:
  //   delete all of listVar
  //   add elem1 to listVar
  //   add elem2 to listVar
  //   ...
  // The first block occupies `thisId`; the rest are chained via `next`.
  _genListAssignFromLiteral(varName, arrList, blocks, idFactory, thisId, sprite, s) {
    // (A) delete all of listVar
    const del = {
      opcode: 'data_deletealloflist',
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [varName, 'L:' + varName] },
      shadow: false,
      topLevel: false,
    };
    blocks[thisId] = del;
    let lastId = thisId;

    // (B) one add block per literal element
    const values = arrList.default && arrList.default.values
      ? arrList.default.values : [];
    let prevId = thisId;
    for (const v of values) {
      let cv = this._constScalar(v, sprite);
      if (cv === null) cv = v;
      let item;
      if (cv instanceof Value) {
        item = cv.kind === 'string' ? cv.data : cv.toNumber();
      } else if (typeof cv === 'number' || typeof cv === 'string' || typeof cv === 'boolean') {
        item = cv;
      } else {
        item = 0;
      }
      const addId = idFactory.newId().id;
      const add = {
        opcode: 'data_addtolist',
        next: null,
        parent: prevId,
        inputs: {},
        fields: { LIST: [varName, 'L:' + varName] },
        shadow: false,
        topLevel: false,
      };
      // literal value as a shadow input
      add.inputs.ITEM = [1, [this._primTypeOf(item), item]];
      blocks[addId] = add;
      blocks[prevId].next = addId;
      prevId = addId;
      lastId = addId;
    }
    return lastId;
  }

  _primTypeOf(v) {
    return typeof v === 'string' ? 10 : 4;
  }

  _genChangeVar(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let varName = name;
    if (result) {
      varName = result[1];
    }

    const block = {
      opcode: 'data_changevariableby',
      next: null,
      parent: null,
      inputs: {},
      fields: { VARIABLE: [varName, varName] },
      shadow: false,
      topLevel: false,
    };

    const valueId = idFactory.newId();
    this._genInput(block, 'VALUE', stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);

    blocks[thisId.id] = block;
  }

  _genShow(stmt, blocks, idFactory, thisId, sprite, s) {
    // `show;` → looks_show (sprite visibility)
    // `show L;` where L resolves to a list → data_showlist (list monitor)
    // `show V;` where V resolves to a variable → data_showvariable
    // (upstream sb3.rs Stmt::Show: list → ShowList, var → ShowVariable,
    // only a bare `show;` touches the sprite itself).
    const name = stmt.name instanceof Name ? stmt.name.name : (stmt.name ? stmt.name.lhs : null);
    if (name) {
      const result = s.qualifyName(name);
      if (result && result[0] === 'list') {
        blocks[thisId.id] = {
          opcode: 'data_showlist',
          next: null,
          parent: null,
          inputs: {},
          fields: { LIST: [result[1], 'L:' + result[1]] },
          shadow: false,
          topLevel: false,
        };
        return;
      }
      if (result && result[0] === 'var') {
        blocks[thisId.id] = {
          opcode: 'data_showvariable',
          next: null,
          parent: null,
          inputs: {},
          fields: { VARIABLE: [result[1], result[1]] },
          shadow: false,
          topLevel: false,
        };
        return;
      }
    }
    blocks[thisId.id] = {
      opcode: 'looks_show',
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };
  }

  _genHide(stmt, blocks, idFactory, thisId, sprite, s) {
    // `hide;` → looks_hide (sprite visibility)
    // `hide L;` where L resolves to a list → data_hidelist (list monitor)
    // `hide V;` where V resolves to a variable → data_hidevariable
    const name = stmt.name instanceof Name ? stmt.name.name : (stmt.name ? stmt.name.lhs : null);
    if (name) {
      const result = s.qualifyName(name);
      if (result && result[0] === 'list') {
        blocks[thisId.id] = {
          opcode: 'data_hidelist',
          next: null,
          parent: null,
          inputs: {},
          fields: { LIST: [result[1], 'L:' + result[1]] },
          shadow: false,
          topLevel: false,
        };
        return;
      }
      if (result && result[0] === 'var') {
        blocks[thisId.id] = {
          opcode: 'data_hidevariable',
          next: null,
          parent: null,
          inputs: {},
          fields: { VARIABLE: [result[1], result[1]] },
          shadow: false,
          topLevel: false,
        };
        return;
      }
    }
    blocks[thisId.id] = {
      opcode: 'looks_hide',
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };
  }

  _genAddToList(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let listName = name;
    if (result) {
      listName = result[1];
    }

    const block = {
      opcode: 'data_addtolist',
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [listName, 'L:' + listName] },
      shadow: false,
      topLevel: false,
    };

    const valueId = idFactory.newId();
    this._genInput(block, 'ITEM', stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);

    blocks[thisId.id] = block;
  }

  _genDeleteList(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let listName = name;
    if (result) {
      listName = result[1];
    }

    const block = {
      opcode: 'data_deletealloflist',
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [listName, 'L:' + listName] },
      shadow: false,
      topLevel: false,
    };

    blocks[thisId.id] = block;
  }

  _genDeleteListIndex(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let listName = name;
    if (result) {
      listName = result[1];
    }

    const block = {
      opcode: 'data_deleteoflist',
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [listName, 'L:' + listName] },
      shadow: false,
      topLevel: false,
    };

    const indexId = idFactory.newId();
    this._genInput(block, 'INDEX', stmt.index, indexId, blocks, idFactory, thisId.id, sprite, s);

    blocks[thisId.id] = block;
  }

  _genInsertAtList(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let listName = name;
    if (result) {
      listName = result[1];
    }

    const block = {
      opcode: 'data_insertatlist',
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [listName, 'L:' + listName] },
      shadow: false,
      topLevel: false,
    };

    const indexId = idFactory.newId();
    this._genInput(block, 'INDEX', stmt.index, indexId, blocks, idFactory, thisId.id, sprite, s);
    const valueId = idFactory.newId();
    this._genInput(block, 'ITEM', stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);

    blocks[thisId.id] = block;
  }

  _genSetListIndex(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let listName = name;
    if (result) {
      listName = result[1];
    }

    const block = {
      opcode: 'data_replaceitemoflist',
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [listName, 'L:' + listName] },
      shadow: false,
      topLevel: false,
    };

    const indexId = idFactory.newId();
    this._genInput(block, 'INDEX', stmt.index, indexId, blocks, idFactory, thisId.id, sprite, s);
    const valueId = idFactory.newId();
    this._genInput(block, 'ITEM', stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);

    blocks[thisId.id] = block;
  }

  _genRepeat(stmt, blocks, idFactory, thisId, sprite, s) {
    const block = {
      opcode: 'control_repeat',
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };

    // TIMES input takes a numeric expression — do NOT coerce to boolean
    const timesId = idFactory.newId();
    this._genInput(block, 'TIMES', stmt.times, timesId, blocks, idFactory, thisId.id, sprite, s);

    const bodyId = idFactory.newId();
    if (stmt.body && stmt.body.length > 0) {
      block.inputs.SUBSTACK = [2, bodyId.id];
      this._genStmts(stmt.body, blocks, idFactory, bodyId.id, thisId.id, sprite, s);
    }

    blocks[thisId.id] = block;
  }

  _genForever(stmt, blocks, idFactory, thisId, sprite, s) {
    const block = {
      opcode: 'control_forever',
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };

    const bodyId = idFactory.newId();
    if (stmt.body && stmt.body.length > 0) {
      block.inputs.SUBSTACK = [2, bodyId.id];
      this._genStmts(stmt.body, blocks, idFactory, bodyId.id, thisId.id, sprite, s);
    }

    blocks[thisId.id] = block;
  }

  _genBranch(stmt, blocks, idFactory, thisId, sprite, s) {
    // `else` explicitly present in source (even with an empty body) → control_if_else
    // with an empty SUBSTACK2, matching how the decompiler emits `} else { }`.
    const hasElse = stmt.has_else || (stmt.else_body && stmt.else_body.length > 0);
    const block = {
      opcode: hasElse ? 'control_if_else' : 'control_if',
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };

    const condId = idFactory.newId();
    const cond = _coerceCondition(stmt.cond, s);
    this._genInput(block, 'CONDITION', cond, condId, blocks, idFactory, thisId.id, sprite, s, true);

    if (stmt.if_body && stmt.if_body.length > 0) {
      const ifBodyId = idFactory.newId();
      block.inputs.SUBSTACK = [2, ifBodyId.id];
      this._genStmts(stmt.if_body, blocks, idFactory, ifBodyId.id, thisId.id, sprite, s);
    }

    if (stmt.else_body && stmt.else_body.length > 0) {
      const elseBodyId = idFactory.newId();
      block.inputs.SUBSTACK2 = [2, elseBodyId.id];
      this._genStmts(stmt.else_body, blocks, idFactory, elseBodyId.id, thisId.id, sprite, s);
    }

    blocks[thisId.id] = block;
  }

  _genUntil(stmt, blocks, idFactory, thisId, sprite, s) {
    // Empty body: upstream sb3.rs:297 emits control_wait_until (a bare
    // conditional wait), not an empty repeat_until loop.
    if (!stmt.body || stmt.body.length === 0) {
      return this._genWaitUntil({ cond: stmt.cond }, blocks, idFactory, thisId, sprite, s);
    }
    // until (cond) { body } → control_repeat_until (NOT control_wait_until)
    const block = {
      opcode: 'control_repeat_until',
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };

    const condId = idFactory.newId();
    const cond = _coerceCondition(stmt.cond, s);
    this._genInput(block, 'CONDITION', cond, condId, blocks, idFactory, thisId.id, sprite, s, true);

    if (stmt.body && stmt.body.length > 0) {
      const bodyId = idFactory.newId();
      block.inputs.SUBSTACK = [2, bodyId.id];
      this._genStmts(stmt.body, blocks, idFactory, bodyId.id, thisId.id, sprite, s);
    }

    blocks[thisId.id] = block;
  }

  _genWaitUntil(stmt, blocks, idFactory, thisId, sprite, s) {
    const block = {
      opcode: 'control_wait_until',
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };

    const condId = idFactory.newId();
    const cond = _coerceCondition(stmt.cond, s);
    this._genInput(block, 'CONDITION', cond, condId, blocks, idFactory, thisId.id, sprite, s, true);

    blocks[thisId.id] = block;
  }

  _genProcCall(stmt, blocks, idFactory, thisId, sprite, s) {
    const proccallId = stmt.name instanceof Name ? stmt.name.name : stmt.name;
    const proc = sprite.procs[proccallId];
    const procArgs = sprite.proc_args[proccallId] || [];

    // Upstream stmt.rs (log/warn/error/breakpoint): these compile to a
    // compact procedures_call whose proccode is wrapped in zero-width
    // spaces; scratch-vm finds no matching prototype and the call stays
    // inert instead of silently dropping arguments into an unknown proc.
    if (!proc && procArgs.length === 0
        && (proccallId === 'log' || proccallId === 'warn'
          || proccallId === 'error' || proccallId === 'breakpoint')) {
      const takesArg = proccallId !== 'breakpoint';
      const zw = '\u200b\u200b';
      const builtinProccode = takesArg ? `${zw}${proccallId}${zw} %s` : `${zw}${proccallId}${zw}`;
      const builtinBlock = {
        opcode: 'procedures_call',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
        mutation: {
          tagName: 'mutation',
          children: [],
          proccode: builtinProccode,
          argumentids: JSON.stringify(takesArg ? ['arg0'] : []),
          // Upstream stmt.rs builds these builtins with Proc::new(…, false)
          // — mutation.rs writes warp:"false". Byte-parity matters because
          // roundtrip diffs are compared as raw JSON.
          warp: 'false',
        },
      };
      if (takesArg && stmt.args.length > 0) {
        const inputId = idFactory.newId();
        this._genInput(builtinBlock, 'arg0', stmt.args[0], inputId, blocks, idFactory, thisId.id, sprite, s);
      }
      blocks[thisId.id] = builtinBlock;
      return;
    }

    // MUST match the prototype's mutation exactly (see _procMutationParts).
    // The old call side built `name %s %s` with argumentids ["arg0",…] which
    // never matches the prototype's `name a: %s` — every parameterized call
    // silently became a no-op.
    const { proccode, argIds } = this._procMutationParts(proccallId, procArgs);

    const block = {
      opcode: 'procedures_call',
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
      mutation: {
        tagName: 'mutation',
        children: [],
        proccode: proccode,
        argumentids: JSON.stringify(argIds),
        warp: proc ? (proc.warp ? 'true' : 'false') : 'true',
      },
    };

    // Generate argument inputs
    for (let i = 0; i < argIds.length && i < stmt.args.length; i++) {
      const argId = argIds[i];
      const argExpr = stmt.args[i];
      const inputId = idFactory.newId();
      this._genInput(block, argId, argExpr, inputId, blocks, idFactory, thisId.id, sprite, s);
    }

    blocks[thisId.id] = block;
  }

  _genFuncCallStmt(stmt, blocks, idFactory, thisId, sprite, s) {
    // M27-F: functions are published as native procedures during pass1, so
    // a bare statement-level call compiles exactly like a proc call (the
    // old compile-time inlining — and its recursion guard — are retired).
    this._genProcCall(stmt, blocks, idFactory, thisId, sprite, s);
  }

  _genReturn(stmt, blocks, idFactory, thisId, sprite, s) {
    // Return sets the :return variable
    const funcName = s.func_name;
    if (!funcName) {
      // Top-level return: upstream pass2.rs replaces it with
      // control_stop/"this script" — NOT "all", which would kill every
      // script in the project.
      blocks[thisId.id] = {
        opcode: 'control_stop',
        next: null,
        parent: null,
        inputs: {},
        fields: { STOP_OPTION: ['this script', null] },
        shadow: false,
        topLevel: false,
        mutation: {
          tagName: 'mutation',
          children: [],
          hasnext: 'false',
        },
      };
      return;
    }

    const block = {
      opcode: 'data_setvariableto',
      next: null,
      parent: null,
      inputs: {},
      fields: { VARIABLE: [`returnedFunc:${funcName}`, `returnedFunc:${funcName}`] },
      shadow: false,
      topLevel: false,
    };

    // Bare `return ;` inside a func: store the empty-string default rather
    // than dereferencing a null value expression.
    if (!stmt.value) {
      block.inputs.VALUE = [1, ['10', '']];
      blocks[thisId.id] = block;
      return;
    }

    const valueId = idFactory.newId();
    this._genInput(block, 'VALUE', stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);

    blocks[thisId.id] = block;
  }

  // ======================================================================
  // Input generation
  // ======================================================================

  _genInput(blockDict, inputName, expr, exprId, blocks, idFactory, parentId, sprite, s, noEmptyShadow = false, shadowOverride = null) {
    // Determine the shadow to use: override (e.g., menu shadow block) takes priority
    const shadow = shadowOverride !== null
      ? shadowOverride
      : (noEmptyShadow ? null : this._shadowForInput(inputName));

    if (expr instanceof ExprValue) {
      // Canonical sb3 wraps literal primitives as [shadowState=1, [primType,
      // value]] — mirrors upstream goboscript codegen/input.rs `value_input`.
      // Bare [primType, value] at the input level is nonstandard and broke
      // decompilation of our own output.
      blockDict.inputs[inputName] = [1, this._valueToShadow(expr.value, inputName)];
    } else if (expr instanceof ExprName) {
      // expr.name may be a Name object (with .name string) or a raw string
      const nameStr = expr.name instanceof Name ? expr.name.name
        : (typeof expr.name === 'string' ? expr.name : String(expr.name));
      // Built-in sensing reporters that look like bare names
      if (nameStr === 'answer') {
        const answerBlock = {
          opcode: 'sensing_answer',
          next: null,
          parent: parentId,
          inputs: {},
          fields: {},
          shadow: false,
          topLevel: false,
        };
        blocks[exprId.id] = answerBlock;
        blockDict.inputs[inputName] = shadow
          ? [3, exprId.id, shadow]
          : [3, exprId.id];
        return;
      }
      // M27-F: inside a procedure body, a bare name matching a declared
      // PARAMETER must read the caller-supplied argument (reporter), not a
      // same-named sprite variable (which is never assigned → always the
      // default 0/empty). Writes keep the variable path (Scratch args are
      // read-only reporters).
      // `local`-declared names carry the 'mangle' marker — they are real
      // (mangled) variables, NOT read-only parameters, so they fall through
      // to the qualifyName variable path below.
      if (s.proc_name && s.locals[nameStr] && s.locals[nameStr] !== 'mangle') {
        const argRead = {
          opcode: 'argument_reporter_string_number',
          next: null,
          parent: parentId,
          inputs: {},
          fields: { VALUE: [nameStr, null] },
          shadow: false,
          topLevel: false,
        };
        blocks[exprId.id] = argRead;
        if (shadow) {
          blockDict.inputs[inputName] = [3, exprId.id, shadow];
        } else {
          blockDict.inputs[inputName] = [2, exprId.id];
        }
        return;
      }
      const result = s.qualifyName(nameStr);
      if (result) {
        const [kind, qualifiedName] = result;
        const typeCode = kind === 'var' ? 12 : 13;
        // sb3 variable/list primitives are [type, displayName, ID]. List
        // ids live under the 'L:' namespace (see target.lists writer) —
        // ids; using a bare name would collide with a same-named scalar
        // variable and the VM would hand getListContents a non-array.
        const sb3Id = kind === 'list' ? ('L:' + qualifiedName) : qualifiedName;
        blockDict.inputs[inputName] = [
          3, [typeCode, qualifiedName, sb3Id],
          shadow,
        ];
      } else {
        // Unknown name — produce a variable-list shadow with the raw name
        // so the block still renders instead of crashing.
        blockDict.inputs[inputName] = [
          3, [12, nameStr, nameStr],
          shadow,
        ];
      }
    } else if (expr instanceof ExprArg) {
      // Argument reference (proc arg) → generate argument_reporter_string_number block
      const argName = expr.name instanceof Name ? expr.name.name : expr.name;
      const argBlock = {
        opcode: 'argument_reporter_string_number',
        next: null,
        parent: parentId,
        inputs: {},
        fields: { VALUE: [argName, null] },
        shadow: false,
        topLevel: false,
      };
      blocks[exprId.id] = argBlock;
      if (shadow) {
        blockDict.inputs[inputName] = [3, exprId.id, shadow];
      } else {
        blockDict.inputs[inputName] = [2, exprId.id];
      }
    } else if (expr instanceof ExprDot) {
      // Struct field access on a list (`l.f`): upstream expr.rs L496-502
      // writes the variable/list PRIMITIVE directly into the parent input —
      // no reporter block exists. The old generic path referenced exprId.id
      // while _genExpr returned early without creating any block, leaving a
      // dangling sb3 block reference.
      const lhsN = expr.lhs instanceof Name ? expr.lhs.name
        : (expr.lhs && expr.lhs.name !== undefined) ? String(expr.lhs.name) : String(expr.lhs);
      const rhsN = expr.rhs instanceof Name ? expr.rhs.name
        : (expr.rhs && expr.rhs.name !== undefined) ? String(expr.rhs.name) : String(expr.rhs);
      const dotted = `${lhsN}.${rhsN}`;
      let qual = s.qualifyName(dotted);
      if (!qual) qual = s.qualifyName(lhsN);
      const finalName = qual ? qual[1] : dotted;
      const typeCode = qual && qual[0] === 'list' ? 13 : 12;
      const finalId = qual && qual[0] === 'list' ? ('L:' + finalName) : finalName;
      blockDict.inputs[inputName] = [3, [typeCode, finalName, finalId], shadow];
    } else {
      // All other expressions become block references
      this._genExpr(expr, blocks, idFactory, exprId, parentId, sprite, s);
      if (shadow) {
        blockDict.inputs[inputName] = [2, exprId.id, shadow];
      } else {
        blockDict.inputs[inputName] = [2, exprId.id];
      }
    }
  }

  _genExpr(expr, blocks, idFactory, exprId, parentId, sprite, s) {
    // Normalize the parent id: _genInput passes it as a STRING (the enclosing
    // block id), while the _genBinOp/_genUnOp/_genRepr helpers expect an
    // object with .id. Without this, every expression block generated under
    // an input got `parent: undefined` (the .id of a string).
    if (typeof parentId === 'string') {
      parentId = { id: parentId };
    }
    if (expr instanceof ExprValue) {
      // Literal value - inline shadow
      // No separate block needed
      return;
    }

    if (expr instanceof ExprName) {
      // Variable reference - inline
      return;
    }

    if (expr instanceof ExprBinOp) {
      this._genBinOp(expr, blocks, idFactory, exprId, parentId, sprite, s);
    } else if (expr instanceof ExprUnOp) {
      this._genUnOp(expr, blocks, idFactory, exprId, parentId, sprite, s);
    } else if (expr instanceof ExprTernary) {
      this._genTernary(expr, blocks, idFactory, exprId, parentId, sprite, s);
    } else if (expr instanceof ExprRepr) {
      this._genRepr(expr, blocks, idFactory, exprId, parentId, sprite, s);
    } else if (expr instanceof ExprFuncCall) {
      this._genFuncCallExpr(expr, blocks, idFactory, exprId, parentId, sprite, s);
    } else if (expr instanceof ExprArg) {
      // Argument reference - inline
      return;
    } else if (expr instanceof ExprDot) {
      // Direct _genExpr calls on a dot expression are handled by _genInput
      // (which writes the upstream inline primitive); nothing to emit here.
      return;
    } else {
      // Unknown expression - generate a default shadow
      blocks[exprId.id] = {
        opcode: 'text',
        next: null,
        parent: parentId.id,
        inputs: {},
        fields: {},
        shadow: true,
        topLevel: false,
      };
    }
  }

  _genBinOp(expr, blocks, idFactory, exprId, parentId, sprite, s) {
    // BinOp.Of is list indexing: list[index] → data_itemoflist. A non-list
    // left operand falls back to operator_letter_of (upstream expr.rs
    // L231-238 parses the lhs as a List and otherwise emits LetterOf with
    // STRING/LETTER inputs) — string indexing `v[i]` used to produce a broken
    // itemoflist block with no LIST field at all.
    if (expr.op === BinOp.Of) {
      const lhsName = expr.lhs instanceof ExprName
        ? (expr.lhs.name instanceof Name ? expr.lhs.name.name : expr.lhs.name)
        : (expr.lhs instanceof ExprDot
          ? (expr.lhs.name instanceof Name ? expr.lhs.name.name : expr.lhs.name)
          : null);
      const listQual = lhsName ? s.qualifyName(lhsName) : null;
      if (listQual && listQual[0] === 'list') {
        const block = {
          opcode: 'data_itemoflist',
          next: null,
          parent: parentId.id,
          inputs: {},
          fields: { LIST: [listQual[1], 'L:' + listQual[1]] },
          shadow: false,
          topLevel: false,
        };
        // RHS is the index — goes in the INDEX input
        const indexId = idFactory.newId();
        this._genInput(block, 'INDEX', expr.rhs, indexId, blocks, idFactory, exprId.id, sprite, s);
        blocks[exprId.id] = block;
        return;
      }
      // Non-list left operand → letter-of-string indexing
      const block = {
        opcode: 'operator_letter_of',
        next: null,
        parent: parentId.id,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
      };
      const stringId = idFactory.newId();
      this._genInput(block, 'STRING', expr.lhs, stringId, blocks, idFactory, exprId.id, sprite, s);
      const letterId = idFactory.newId();
      this._genInput(block, 'LETTER', expr.rhs, letterId, blocks, idFactory, exprId.id, sprite, s);
      blocks[exprId.id] = block;
      return;
    }

    // BinOp.In on a list name → data_listcontainsitem (not operator_contains)
    // Decompiled as: (item in listName)
    if (expr.op === BinOp.In) {
      // Check if RHS is a list reference
      const rhsIsList = expr.rhs instanceof ExprName;
      if (rhsIsList) {
        const rhsNameStr = expr.rhs.name instanceof Name ? expr.rhs.name.name : expr.rhs.name;
        const rhsQual = s.qualifyName(rhsNameStr);
        if (rhsQual && rhsQual[0] === 'list') {
          const listName = rhsQual[1];
          const block = {
            opcode: 'data_listcontainsitem',
            next: null,
            parent: parentId.id,
            inputs: {},
            fields: { LIST: [listName, 'L:' + listName] },
            shadow: false,
            topLevel: false,
          };
          // LHS is the item — goes in the ITEM input
          const itemId = idFactory.newId();
          this._genInput(block, 'ITEM', expr.lhs, itemId, blocks, idFactory, exprId.id, sprite, s);
          blocks[exprId.id] = block;
          return;
        }
      }
    }

    const opcode = binopOpcode(expr.op);
    this._checkExtension(opcode);

    const block = {
      opcode: opcode,
      next: null,
      parent: parentId.id,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };

    const lhsId = idFactory.newId();
    const rhsId = idFactory.newId();

    // Input names must follow the sb3 spec per opcode — upstream goboscript
    // blocks.rs BinOp::lhs()/rhs(): Add..Mod use NUM1/NUM2, Lt/Gt/Eq/And/Or
    // use OPERAND1/OPERAND2, Join uses STRING1/STRING2. Hardcoding NUM1/NUM2
    // for everything emitted operator_equals with NUM1/NUM2 inputs, which is
    // an invalid block that scratch-vm/TurboWarp cannot evaluate and our own
    // decompiler read back as empty strings.
    const lhsName = binopLhs(expr.op);
    const rhsName = binopRhs(expr.op);

    // operator_and / operator_or expect Boolean-typed inputs (OPERAND1/2).
    // Coerce non-boolean operands so Blockly doesn't throw "Connection
    // checks failed" and drop entire procedure stacks from the canvas.
    let lhsExpr = expr.lhs;
    let rhsExpr = expr.rhs;
    if ((expr.op === BinOp.And || expr.op === BinOp.Or)) {
      if (!_isBooleanExpr(lhsExpr)) {
        const zero = new ExprValue(Value.fromFloat(0.0), expr.span);
        lhsExpr = new ExprUnOp(UnOp.Not, expr.span,
          new ExprBinOp(BinOp.Eq, expr.span, lhsExpr, zero));
      }
      if (!_isBooleanExpr(rhsExpr)) {
        const zero = new ExprValue(Value.fromFloat(0.0), expr.span);
        rhsExpr = new ExprUnOp(UnOp.Not, expr.span,
          new ExprBinOp(BinOp.Eq, expr.span, rhsExpr, zero));
      }
    }

    this._genInput(block, lhsName, lhsExpr, lhsId, blocks, idFactory, exprId.id, sprite, s);
    this._genInput(block, rhsName, rhsExpr, rhsId, blocks, idFactory, exprId.id, sprite, s);

    blocks[exprId.id] = block;
  }

  // ExprTernary must never reach codegen: visitor pass1 lowers every
  // ternary into a hidden temp var + control_if_else statements (scratch-vm
  // has no if/else reporter primitive — an invented opcode would violate
  // the sb3 spec and evaluate to undefined at runtime).
  _genTernary() {
    throw new Error(
      'ExprTernary reached codegen un-lowered — visitor pass1 ternary expansion did not cover this statement type');
  }

  _genUnOp(expr, blocks, idFactory, exprId, parentId, sprite, s) {
    // UnOp.Length on a list name → data_lengthoflist (not operator_length)
    if (expr.op === UnOp.Length) {
      if (expr.opr instanceof ExprName) {
        const nameStr = expr.opr.name instanceof Name ? expr.opr.name.name : expr.opr.name;
        const qualResult = s.qualifyName(nameStr);
        if (qualResult && qualResult[0] === 'list') {
          const listName = qualResult[1];
          blocks[exprId.id] = {
            opcode: 'data_lengthoflist',
            next: null,
            parent: parentId.id,
            inputs: {},
            fields: { LIST: [listName, 'L:' + listName] },
            shadow: false,
            topLevel: false,
          };
          return;
        }
      }
    }

    // Unary minus safety net: Scratch has no negate block, so -x lowers to
    // operator_subtract(0, x). The visitor's expression transform normally
    // does this lowering in pass2, but statement contexts it does not cover
    // (e.g. top-level `set_x -175;`) used to crash with "UnOp.Minus has no
    // opcode". (Numeric literals are folded at parse time and never get here.)
    if (expr.op === UnOp.Minus) {
      const subBlock = {
        opcode: 'operator_subtract',
        next: null,
        parent: parentId.id,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
      };
      // literal zero primitive: [1, [4, "0"]]
      subBlock.inputs.NUM1 = [1, [4, '0']];
      const oprId = idFactory.newId();
      this._genInput(subBlock, 'NUM2', expr.opr, oprId, blocks, idFactory, exprId.id, sprite, s);
      blocks[exprId.id] = subBlock;
      return;
    }

    const opcode = unopOpcode(expr.op);
    this._checkExtension(opcode);

    // Not: coerce non-boolean operands so Blockly sees a Boolean input on
    // OPERAND (avoids "Connection checks failed" → broken procedure stacks).
    let oprExpr = expr.opr;
    if (expr.op === UnOp.Not && !_isBooleanExpr(oprExpr)) {
      const zero = new ExprValue(Value.fromFloat(0.0), expr.span);
      oprExpr = new ExprBinOp(BinOp.Eq, expr.span, oprExpr, zero);
    }

    const block = {
      opcode: opcode,
      next: null,
      parent: parentId.id,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };

    const inputName = unopInput(expr.op);
    const oprId = idFactory.newId();
    this._genInput(block, inputName, oprExpr, oprId, blocks, idFactory, exprId.id, sprite, s);

    // Some unops have fields
    const fields = unopFields(expr.op);
    if (fields) {
      for (const [fname, fval] of Object.entries(fields)) {
        block.fields[fname] = fval;
      }
    }

    blocks[exprId.id] = block;
  }

  _genRepr(expr, blocks, idFactory, exprId, parentId, sprite, s) {
    // ExprRepr stores the repr enum value in .repr, not .op
    const reprVal = expr.repr;
    const opcode = reprOpcode(reprVal);
    this._checkExtension(opcode);

    const block = {
      opcode: opcode,
      next: null,
      parent: parentId.id,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
    };

    // sensing_of(prop, object): upstream routes this through a dedicated
    // Expr::Property path (expr.rs L530-577), NOT the generic Repr machinery:
    // PROPERTY is a plain field and OBJECT goes through its dropdown menu.
    // The generic named-arg loop would pair args[0] with OBJECT.
    if (reprVal === Repr.SensingOf) {
      let propValue = 'x';
      if (expr.args.length > 0 && expr.args[0] instanceof ExprValue) {
        propValue = expr.args[0].value.kind === 'string'
          ? expr.args[0].value.data
          : String(expr.args[0].value.toNumber());
      }
      block.fields.PROPERTY = [propValue, null];

      const menu = reprMenu(reprVal); // OBJECT / sensing_of_object_menu / _stage_
      const menuBlock = {
        opcode: menu.opcode,
        next: null,
        parent: exprId.id,
        inputs: {},
        fields: {},
        shadow: true,
        topLevel: false,
      };
      menuBlock.fields[menu.field] = [menu.default, null];
      const menuId = idFactory.newId();
      blocks[menuId.id] = menuBlock;

      const objectArg = expr.args.length > 1 ? expr.args[1] : null;
      if (!objectArg) {
        block.inputs.OBJECT = [1, menuId.id];
      } else if (objectArg instanceof ExprValue) {
        let valStr = objectArg.value.kind === 'string'
          ? objectArg.value.data
          : String(objectArg.value.toNumber());
        // Upstream maps every spelling of the stage to the "_stage_" sentinel
        if (valStr === 'Stage' || valStr === 'stage' || valStr === '_stage_') {
          valStr = '_stage_';
        }
        menuBlock.fields[menu.field] = [valStr, null];
        block.inputs.OBJECT = [1, menuId.id];
      } else {
        // Reporter obscures the menu → reporter on top of the menu shadow
        const argId = idFactory.newId();
        this._genInput(block, 'OBJECT', objectArg, argId, blocks, idFactory, exprId.id, sprite, s, false, menuId.id);
      }
      blocks[exprId.id] = block;
      return;
    }

    // Fields
    const fields = reprFields(reprVal);
    if (fields) {
      for (const [fname, fval] of Object.entries(fields)) {
        block.fields[fname] = fval;
      }
    }

    // Menu — two shapes exist:
    //  (a) named-arg menus: menu.input is one of argNames (e.g. key_pressed "f"
    //      → KeyPressed's KEY_OPTION, touching "edge", distance_to "Sprite").
    //      The value belongs INSIDE the menu block; the input must point at the
    //      menu block ([1, menuId]), which is the canonical SB3 structure.
    //      Previously the arg loop overwrote the input with a raw string
    //      primitive, leaving a dangling menu block carrying the default
    //      value ("any" instead of "f").
    //  (b) trailing-name menus: menu.input is not an arg name (e.g.
    //      item_num_of_list — the list name follows the named args) — the list
    //      name goes straight into the block fields.
    const menu = reprMenu(reprVal);
    const argNames = reprArgs(reprVal);
    const menuArgIdx = menu ? argNames.indexOf(menu.input) : -1;

    if (menu && menuArgIdx < 0) {
      // Trailing-name menu (list reference as the extra arg after named args)
      const menuArgIndex = argNames.length; // list name is the extra arg after named args
      if (expr.args.length > menuArgIndex) {
        const menuArg = expr.args[menuArgIndex];
        if (menuArg instanceof ExprName) {
          // List/variable reference — put directly in fields, no shadow block
          const argName = menuArg.name instanceof Name ? menuArg.name.name : menuArg.name;
          const qualResult = s.qualifyName(argName);
          const listName = qualResult ? qualResult[1] : argName;
          if (menu.field) {
            block.fields[menu.field] = [listName, listName];
          }
        } else {
          // Non-name arg — generate menu shadow block
          this._genMenuShadow(block, menu, exprId, expr.args[menuArgIndex],
            blocks, idFactory, sprite, s);
        }
      } else {
        // No arg provided for menu — use default with shadow block
        this._genMenuShadow(block, menu, exprId, null,
          blocks, idFactory, sprite, s);
      }
    }

    // Inputs (named args only — a trailing list name was handled by the menu above)
    for (let i = 0; i < argNames.length && i < expr.args.length; i++) {
      const inputName = argNames[i];
      const argExpr = expr.args[i];
      const argId = idFactory.newId();

      if (menu && i === menuArgIdx) {
        // Named-arg menu: emit the real menu block carrying the value.
        const menuBlock = {
          opcode: menu.opcode,
          next: null,
          parent: exprId.id,
          inputs: {},
          fields: {},
          shadow: true,
          topLevel: false,
        };
        if (menu.field) {
          menuBlock.fields[menu.field] = [menu.default, null];
        }
        const menuId = idFactory.newId();
        blocks[menuId.id] = menuBlock;
        if (argExpr instanceof ExprValue) {
          // Literal → value goes inside the menu block, input points at it
          let valStr = argExpr.value.kind === 'string'
            ? argExpr.value.data
            : String(argExpr.value.toNumber());
          if (menu.field) {
            // Upstream expr.rs maps every spelling of the stage to the
            // "_stage_" sentinel in sensing_of's object menu; scratch-vm
            // resolves entries by name and would miss the stage otherwise.
            if (menu.opcode === 'sensing_of_object_menu'
                && (valStr === 'Stage' || valStr === 'stage' || valStr === '_stage_')) {
              valStr = '_stage_';
            }
            menuBlock.fields[menu.field] = [valStr, null];
          }
          block.inputs[inputName] = [1, menuId.id];
        } else {
          // Reporter obscures the menu → reporter on top of the menu shadow
          this._genInput(block, inputName, argExpr, argId, blocks, idFactory, exprId.id, sprite, s, false, menuId.id);
        }
        continue;
      }

      this._genInput(block, inputName, argExpr, argId, blocks, idFactory, exprId.id, sprite, s);
    }

    blocks[exprId.id] = block;
  }

  // Generate a menu shadow block for an input
  _genMenuShadow(block, menu, exprId, argExpr, blocks, idFactory, sprite, s) {
    const menuBlock = {
      opcode: menu.opcode,
      next: null,
      parent: exprId.id,
      inputs: {},
      fields: {},
      shadow: true,
      topLevel: false,
    };
    if (menu.field) {
      menuBlock.fields[menu.field] = [menu.default, null];
    }
    const menuId = idFactory.newId();
    blocks[menuId.id] = menuBlock;
    if (argExpr instanceof ExprName) {
      const argName = argExpr.name instanceof Name ? argExpr.name.name : argExpr.name;
      block.inputs[menu.input] = [3, [12, argName, argName], menuId.id];
    } else {
      // Canonical shape: input = [1, menuId] — the value already lives in
      // the menu block's field. The old [1, [10, default], menuId] left the
      // menu shadow dangling (scratch-vm reads only the text primitive).
      block.inputs[menu.input] = [1, menuId.id];
    }
  }

  _genFuncCallExpr(expr, blocks, idFactory, exprId, parentId, sprite, s) {
    // AI models keep reaching for to_number()/str_to_num()/int()-style
    // coercions that Scratch simply does not have. The idiomatic equivalent
    // is arithmetic `x * 1` (Cast.ToNumber on both operands). Emit that for
    // the known synonym names instead of falling through to the dead text
    // shadow below (which evaluated to 0 silently).
    const callName = expr.name instanceof Name ? expr.name.name : String(expr.name);
    const callArgs = expr.args || [];
    if (/^(to_number|str_to_num|tonumber|num|int|float|val)$/i.test(callName) && callArgs.length === 1) {
      const mulBlock = {
        opcode: 'operator_multiply',
        next: null,
        parent: parentId.id,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
      };
      this._genInput(mulBlock, 'NUM1', callArgs[0], idFactory.newId(), blocks, idFactory, exprId.id, sprite, s);
      mulBlock.inputs.NUM2 = [1, [4, 1]];
      blocks[exprId.id] = mulBlock;
      return;
    }
    // Function call as an expression - generates the function body
    // and returns the :return variable reference
    // The actual body generation happens at the statement level (via pass1 expansion)
    // Here we just reference the callsite variable
    // This should not normally be reached if pass1 ran correctly
    blocks[exprId.id] = {
      opcode: 'text',
      next: null,
      parent: parentId.id,
      inputs: {},
      fields: {},
      shadow: true,
      topLevel: false,
    };
  }

  // ======================================================================
  // Shadow / value helpers
  // ======================================================================

  _valueToShadow(value, inputName) {
    if (value.kind === 'number') {
      const n = value.toNumber();
      // JSON has no Infinity/NaN — upstream emits the strings "Infinity" /
      // "-Infinity" / "NaN" so scratch-vm can still parse them (input.rs
      // value_input). JSON.stringify would otherwise emit null.
      if (!Number.isFinite(n)) {
        return [4, n > 0 ? 'Infinity' : (n < 0 ? '-Infinity' : 'NaN')];
      }
      // Emit the number itself — the old parseInt(n) here stringified via
      // "1e+21" for n >= 1e21 and silently truncated the value to 1, so a
      // decompiled `n = 1e21;` recompiled to `n = 1`.
      return [4, n];
    }
    if (value.kind === 'boolean') {
      // Upstream input.rs: `[1,[4,<1|0>]]` — type code 4 (math_number), not
      // 8 (math_angle); scratch-vm coerces via Number(value), and
      // Number('true') is NaN which made `if true {}` evaluate falsy.
      return [4, value.data ? 1 : 0];
    }
    if (value.kind === 'string') {
      // Broadcast message literals use the broadcast primitive (upstream:
      // `[1,[11,name,name]]`).
      if (inputName === 'BROADCAST_INPUT') {
        return [11, value.data, value.data];
      }
      // Check if it's a color — only for colour inputs, mirroring upstream
      // (other text that merely looks like a colour stays a plain string).
      const isColorInput = inputName === 'COLOR' || inputName === 'COLOR2';
      const color = _parseColor(value.data);
      if (isColorInput && color) {
        return [9, color];
      }
      return [10, value.data];
    }
    return [10, ''];
  }

  _shadowForInput(inputName) {
    if (inputName === 'BROADCAST_INPUT') {
      const broadcastName = 'message1';
      return [11, broadcastName, broadcastName];
    }
    return [10, ''];
  }

  _checkExtension(opcode) {
    if (opcode.startsWith('pen_')) {
      this.extensions.pen = true;
    } else if (opcode.startsWith('music_')) {
      this.extensions.music = true;
    }
  }

  static _valueToNumber(value) {
    if (value instanceof Value) {
      if (value.kind === 'number') return value.toNumber();
      if (value.kind === 'boolean') return value.toBoolean() ? 1.0 : 0.0;
      return value.toNumber();
    }
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function _coerceCondition(expr, s) {
  // Conditions are emitted as-is for Boolean-typed expressions (comparisons,
  // logical operators, sensing predicates). Scratch's CONDITION input slot
  // natively accepts any reporter and treats non-zero values as true, so
  // boolean-typed expressions pass through unchanged.
  if (expr === null || expr === undefined) {
    return new ExprValue(Value.fromFloat(0.0), [0, 0]);
  }
  // Coerce non-boolean expressions (e.g. a bare variable used as condition)
  // to a Boolean-typed block. `not (value = 0)` preserves Scratch's
  // truthiness semantics (0/"" falsy, non-zero/non-empty truthy) while
  // giving Blockly the Boolean output it expects on the CONDITION input.
  // Without this, a `data_variable` (String-typed) fed into `control_if`
  // / `control_repeat_until` / `operator_not`'s OPERAND triggers
  // "Connection checks failed ... expected Boolean, found String" and the
  // entire procedures_definition stack fails to render (自制积木只有调用、
  // 没有定义).
  if (!_isBooleanExpr(expr)) {
    const zero = new ExprValue(Value.fromFloat(0.0), [0, 0]);
    const eq = new ExprBinOp(BinOp.Eq, [0, 0], expr, zero);
    return new ExprUnOp(UnOp.Not, [0, 0], eq);
  }
  return expr;
}

function _isBooleanExpr(expr) {
  if (expr instanceof ExprBinOp) {
    return expr.op === BinOp.Eq || expr.op === BinOp.Ne ||
           expr.op === BinOp.Lt || expr.op === BinOp.Gt ||
           expr.op === BinOp.Le || expr.op === BinOp.Ge ||
           expr.op === BinOp.And || expr.op === BinOp.Or ||
           expr.op === BinOp.In;
  }
  if (expr instanceof ExprUnOp) {
    return expr.op === UnOp.Not;
  }
  if (expr instanceof ExprRepr) {
    return expr.repr === Repr.Contains || expr.repr === Repr.Touching || expr.repr === Repr.TouchingMousePointer ||
           expr.repr === Repr.TouchingEdge || expr.repr === Repr.KeyPressed ||
           expr.repr === Repr.MouseDown;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Color parsing
// ---------------------------------------------------------------------------

const _COLOR_NAME_MAP = {
  'white': '#ffffff',
  'black': '#000000',
  'red': '#ff0000',
  'green': '#00ff00',
  'blue': '#0000ff',
  'yellow': '#ffff00',
  'cyan': '#00ffff',
  'magenta': '#ff00ff',
  'orange': '#ffa500',
  'purple': '#800080',
  'pink': '#ffc0cb',
  'brown': '#a52a2a',
  'gray': '#808080',
  'grey': '#808080',
  'lightblue': '#add8e6',
  'lightgreen': '#90ee90',
  'lightred': '#ffcccb',
  'darkblue': '#00008b',
  'darkgreen': '#006400',
  'darkred': '#8b0000',
};

const _HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function _parseColor(string) {
  if (typeof string !== 'string') return null;
  const s = string.trim().toLowerCase();
  if (s in _COLOR_NAME_MAP) return _COLOR_NAME_MAP[s];
  if (_HEX_RE.test(s)) {
    if (s.length === 4) {
      return '#' + s.slice(1).split('').map(c => c + c).join('');
    }
    if (s.length === 9) {
      return s.slice(0, 7);
    }
    return s;
  }
  const m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const r = parseInt(m[1]);
    const g = parseInt(m[2]);
    const b = parseInt(m[3]);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Convenience function: compile project → sb3 buffer
// ---------------------------------------------------------------------------

export function compileProject(project) {
  const codegen = new CodeGen();
  return codegen.makeSb3(project);
}
