#!/usr/bin/env node
/**
 * scripts/sb3.mjs — littlesc CLI for AGY & Developers
 * 
 * 极简、高保真、零外部依赖的 Scratch 3.0 (.sb3) 项目处理工具。
 * 供 AGY (Gemini) 及终端开发者在无需开启浏览器的前提下，
 * 快速完成项目探查、反编译、语法校验与重打包。
 * 
 * Provides command-line access to the goboscript <-> SB3 compiler pipeline:
 *   - inspect   : View project structure, targets, blocks, variables, sounds, costumes
 *   - decompile : Unpack .sb3 into project.gs + assets/ + manifest.json
 *   - compile   : Compile project.gs + assets/ back into a valid .sb3 file
 *   - validate  : Check goboscript syntax and output actionable diagnostics
 *   - new       : Create a starter goboscript project template
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Resolve paths to backend-js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_SRC = path.resolve(ROOT_DIR, 'backend-js', 'src');

// Dynamic imports of backend compiler modules
const { sb3ToGoboscript } = await import(pathToFileURL(path.join(BACKEND_SRC, 'decompiler.js')).href);
const { compileSource, _validateSource } = await import(pathToFileURL(path.join(BACKEND_SRC, 'server.js')).href);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function printUsage() {
  console.log(`
littlesc CLI (sb3) - Scratch 3.0 <-> Goboscript 工具

用法:
  node scripts/sb3.mjs <command> [options]

命令:
  inspect <file.sb3>
      查看 .sb3 项目全貌（角色、积木数、变量、列表、造型、声音、广播）

  decompile <file.sb3> [outputDir]
      将 .sb3 反编译为 project.gs 源码和 assets/ 媒体资源包
      默认输出目录: <file_without_ext>_src/

  compile <srcDir_or_gsFile> [output.sb3]
      将 project.gs 源码与 assets/ 打包编译为标准的 Scratch 3.0 (.sb3) 文件
      默认输出文件: <srcDir>.sb3 或 <gsFile_without_ext>.sb3

  validate <file.gs_or_dir>
      对 goboscript 源码执行词法、语法与语义校验，输出详细错误与修复提示

  new [outputDir]
      生成一个包含基础舞台与精灵的空白项目模板

示例:
  node scripts/sb3.mjs inspect project/my_game.sb3
  node scripts/sb3.mjs decompile project/my_game.sb3 project/my_game_src
  node scripts/sb3.mjs validate project/my_game_src/project.gs
  node scripts/sb3.mjs compile project/my_game_src project/my_game_modified.sb3
`);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/**
 * 1. INSPECT: Quick inspection of .sb3 file
 */
async function handleInspect(sb3Path) {
  if (!sb3Path) {
    console.error('❌ 错误: 请指定要检查的 .sb3 文件路径');
    process.exit(1);
  }
  const resolvedPath = path.resolve(process.cwd(), sb3Path);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ 错误: 文件不存在: ${resolvedPath}`);
    process.exit(1);
  }

  const buf = fs.readFileSync(resolvedPath);
  console.log(`\n📦 正在解析: ${path.basename(resolvedPath)} (${formatSize(buf.length)})`);

  let decompiled;
  try {
    decompiled = sb3ToGoboscript(buf);
  } catch (err) {
    console.error(`❌ 解析失败: ${err.message}`);
    process.exit(1);
  }

  const { targets, assets } = decompiled;
  let totalBlocks = 0;

  console.log(`\n--- 🎭 角色与舞台 (${targets.length} 个 Target) ---`);
  targets.forEach((t, idx) => {
    totalBlocks += t.blockCount || 0;
    const typeLabel = t.isStage ? '【舞台 Stage】' : '【角色 Sprite】';
    console.log(`\n${idx + 1}. ${typeLabel} "${t.name}" (积木数: ${t.blockCount})`);

    const vars = Object.keys(t.name_map?.variables || {});
    if (vars.length > 0) {
      console.log(`   - 变量 (${vars.length}): ${vars.join(', ')}`);
    }
    const lists = Object.keys(t.name_map?.lists || {});
    if (lists.length > 0) {
      console.log(`   - 列表 (${lists.length}): ${lists.join(', ')}`);
    }
    const procs = Object.keys(t.name_map?.procedures || {});
    if (procs.length > 0) {
      console.log(`   - 自定义积木 (${procs.length}): ${procs.join(', ')}`);
    }
  });

  const assetCount = Object.keys(assets || {}).length;
  console.log(`\n--- 🎨 媒体资源 ---`);
  console.log(`- 资源总数: ${assetCount} 个 (SVG/PNG 造型与音频)`);
  console.log(`- 积木总数: ${totalBlocks} 块`);
  console.log(`\n💡 提示: 使用 'node scripts/sb3.mjs decompile ${sb3Path}' 即可导出完整可编辑代码。\n`);
}

/**
 * 2. DECOMPILE: Unpack .sb3 to project.gs + assets/ + manifest.json
 */
async function handleDecompile(sb3Path, outputDir) {
  if (!sb3Path) {
    console.error('❌ 错误: 请指定要反编译的 .sb3 文件路径');
    process.exit(1);
  }
  const resolvedSb3 = path.resolve(process.cwd(), sb3Path);
  if (!fs.existsSync(resolvedSb3)) {
    console.error(`❌ 错误: 文件不存在: ${resolvedSb3}`);
    process.exit(1);
  }

  const defaultOutDir = resolvedSb3.replace(/\.sb3$/i, '') + '_src';
  const targetDir = path.resolve(process.cwd(), outputDir || defaultOutDir);

  console.log(`\n📂 正在反编译: ${path.basename(resolvedSb3)} -> ${path.relative(process.cwd(), targetDir)}/`);

  const buf = fs.readFileSync(resolvedSb3);
  let decompiled;
  try {
    decompiled = sb3ToGoboscript(buf);
  } catch (err) {
    console.error(`❌ 反编译失败: ${err.message}`);
    process.exit(1);
  }

  const { source, targets, assets } = decompiled;

  // Ensure output directories exist
  fs.mkdirSync(targetDir, { recursive: true });
  const assetsDir = path.join(targetDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  // Write project.gs
  const gsPath = path.join(targetDir, 'project.gs');
  fs.writeFileSync(gsPath, source, 'utf8');

  // Write assets
  let savedAssetCount = 0;
  for (const [filename, assetData] of Object.entries(assets || {})) {
    fs.writeFileSync(path.join(assetsDir, filename), assetData);
    savedAssetCount++;
  }

  // Write manifest.json
  const manifest = {
    originalFile: path.basename(resolvedSb3),
    decompiledAt: new Date().toISOString(),
    targets: targets.map(t => ({
      name: t.name,
      isStage: t.isStage,
      blockCount: t.blockCount,
      variables: Object.keys(t.name_map?.variables || {}),
      lists: Object.keys(t.name_map?.lists || {}),
      procedures: Object.keys(t.name_map?.procedures || {}),
    })),
    assetCount: savedAssetCount,
  };
  fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  // Also write individual target files into targets/ for easy focused viewing
  const targetsDir = path.join(targetDir, 'targets');
  fs.mkdirSync(targetsDir, { recursive: true });
  for (const t of targets) {
    const safeName = t.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_');
    const targetGs = `target ${t.isStage ? 'stage' : JSON.stringify(t.name)};\n\n${t.source}\n`;
    fs.writeFileSync(path.join(targetsDir, `${safeName}.gs`), targetGs, 'utf8');
  }

  console.log(`✅ 反编译成功!`);
  console.log(`  ├── 源码文件: ${path.relative(process.cwd(), gsPath)} (${source.split('\n').length} 行)`);
  console.log(`  ├── 媒体资源: ${savedAssetCount} 个文件 -> ${path.relative(process.cwd(), assetsDir)}/`);
  console.log(`  ├── 目标拆分: targets/ 目录包含 ${targets.length} 个独立角色文件`);
  console.log(`  └── 项目清单: manifest.json`);
  console.log(`\n💡 现在你可以直接阅读与修改 project.gs，修改完成后执行:`);
  console.log(`   node scripts/sb3.mjs compile ${path.relative(process.cwd(), targetDir)}\n`);
}

/**
 * 3. COMPILE: Compile project.gs + assets/ into a valid .sb3
 */
async function handleCompile(inputPath, outputPath) {
  if (!inputPath) {
    console.error('❌ 错误: 请指定源码目录或 .gs 文件路径');
    process.exit(1);
  }

  let resolvedInput = path.resolve(process.cwd(), inputPath);
  let gsPath;
  let assetsDir;

  if (fs.existsSync(resolvedInput) && fs.statSync(resolvedInput).isDirectory()) {
    gsPath = path.join(resolvedInput, 'project.gs');
    assetsDir = path.join(resolvedInput, 'assets');
    if (!fs.existsSync(gsPath)) {
      console.error(`❌ 错误: 目录中未找到 project.gs: ${resolvedInput}`);
      process.exit(1);
    }
  } else if (fs.existsSync(resolvedInput) && resolvedInput.endsWith('.gs')) {
    gsPath = resolvedInput;
    assetsDir = path.join(path.dirname(resolvedInput), 'assets');
  } else {
    console.error(`❌ 错误: 输入路径不存在: ${resolvedInput}`);
    process.exit(1);
  }

  // Determine output sb3 path
  let resolvedOutput;
  if (outputPath) {
    resolvedOutput = path.resolve(process.cwd(), outputPath);
  } else if (fs.statSync(resolvedInput).isDirectory()) {
    resolvedOutput = resolvedInput.replace(/_src$/i, '') + '.sb3';
  } else {
    resolvedOutput = resolvedInput.replace(/\.gs$/i, '') + '.sb3';
  }

  console.log(`\n🔨 正在编译: ${path.relative(process.cwd(), gsPath)} -> ${path.relative(process.cwd(), resolvedOutput)}`);

  const source = fs.readFileSync(gsPath, 'utf8');

  // Pre-validate
  const errors = _validateSource(source);
  if (errors && errors.length > 0) {
    console.error(`\n❌ 编译前语法检查发现 ${errors.length} 个错误:`);
    for (const err of errors) {
      console.error(`  - 第 ${err.line} 行第 ${err.column} 列 [${err.kind || 'SyntaxError'}]: ${err.message}`);
    }
    console.error(`\n请修复上述语法错误后再尝试编译。\n`);
    process.exit(1);
  }

  // Load user assets if available
  const userAssets = {};
  if (fs.existsSync(assetsDir) && fs.statSync(assetsDir).isDirectory()) {
    const files = fs.readdirSync(assetsDir);
    for (const file of files) {
      try {
        userAssets[file] = fs.readFileSync(path.join(assetsDir, file));
      } catch { /* skip unreadable */ }
    }
  }

  // Compile
  let sb3Buffer;
  try {
    sb3Buffer = compileSource(source, { assets: userAssets });
  } catch (err) {
    console.error(`\n❌ 编译内核报错: ${err.message}`);
    if (err.line && err.column) {
      console.error(`  位置: 第 ${err.line} 行第 ${err.column} 列`);
    }
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  fs.writeFileSync(resolvedOutput, sb3Buffer);

  console.log(`✅ 编译生成成功!`);
  console.log(`  - 产物路径: ${path.relative(process.cwd(), resolvedOutput)}`);
  console.log(`  - 文件大小: ${formatSize(sb3Buffer.length)}`);
  console.log(`  - 可直接在 Scratch 3.0 / TurboWarp 中双击打开运行！\n`);
}

/**
 * 4. VALIDATE: Syntax and structure checking
 */
async function handleValidate(targetPath) {
  if (!targetPath) {
    console.error('❌ 错误: 请指定要校验的 .gs 文件或源码目录');
    process.exit(1);
  }

  let resolved = path.resolve(process.cwd(), targetPath);
  let gsFile = resolved;
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    gsFile = path.join(resolved, 'project.gs');
  }

  if (!fs.existsSync(gsFile)) {
    console.error(`❌ 错误: 文件不存在: ${gsFile}`);
    process.exit(1);
  }

  console.log(`\n🔍 正在校验: ${path.relative(process.cwd(), gsFile)}`);
  const source = fs.readFileSync(gsFile, 'utf8');
  const errors = _validateSource(source);

  if (!errors || errors.length === 0) {
    console.log(`✅ 校验通过！该文件语法与结构完全合法。\n`);
    return;
  }

  console.error(`\n❌ 发现 ${errors.length} 个语法或结构问题:`);
  for (const err of errors) {
    console.error(`  • [L${err.line}:${err.column}] ${err.kind || 'Error'}: ${err.message}`);
  }
  console.log(`\n💡 修复建议:`);
  console.log(`  - 事件帽子块 (onflag, onclick 等) 必须在最外层顶层，禁止嵌套在花括号内。`);
  console.log(`  - 自定义函数必须以 'def_' 开头，如 'func def_move() { ... }'。`);
  console.log(`  - 变量声明使用 'var x = 0;'，局部变量在函数内使用 'local i = 1;'。`);
  console.log(`  - 列表必须以 1 起始索引（1-based）。\n`);
  process.exit(1);
}

/**
 * 5. NEW: Create a minimal starting project template
 */
async function handleNew(outputDir) {
  const targetDir = path.resolve(process.cwd(), outputDir || 'project/starter_project');
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    console.error(`❌ 错误: 目标目录已存在且非空: ${targetDir}`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });

  const starterGs = `// ==========================================
// 舞台 Stage
// ==========================================
target stage;

costumes "cd21514d0531fdffb22204e0ec5ed84a.svg" as "backdrop1";

onflag {
    // 舞台初始化逻辑
}

// ==========================================
// 主角色 Sprite1
// ==========================================
target "Sprite1";

costumes "dango-cat.svg" as "costume1";

var speed = 5;

onflag {
    goto(0, 0);
    say("你好，我是 littlesc！", 2);
    forever {
        if (key_pressed("right arrow")) {
            change_x(speed);
        }
        if (key_pressed("left arrow")) {
            change_x(-speed);
        }
        if (key_pressed("up arrow")) {
            change_y(speed);
        }
        if (key_pressed("down arrow")) {
            change_y(-speed);
        }
        if_on_edge_bounce;
    }
}

onclick {
    say("你点击了我！", 1);
}
`;

  fs.writeFileSync(path.join(targetDir, 'project.gs'), starterGs, 'utf8');

  console.log(`\n✨ 已创建初始项目模板: ${path.relative(process.cwd(), targetDir)}/`);
  console.log(`  ├── project.gs (包含基础舞台与可移动精灵)`);
  console.log(`  └── assets/    (资源目录)`);
  console.log(`\n可以使用 'node scripts/sb3.mjs compile ${path.relative(process.cwd(), targetDir)}' 打包为 .sb3 测试。\n`);
}

// ---------------------------------------------------------------------------
// Main CLI Router
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'inspect':
    await handleInspect(args[1]);
    break;
  case 'decompile':
    await handleDecompile(args[1], args[2]);
    break;
  case 'compile':
    await handleCompile(args[1], args[2]);
    break;
  case 'validate':
    await handleValidate(args[1]);
    break;
  case 'new':
    await handleNew(args[1]);
    break;
  case '-h':
  case '--help':
  case 'help':
  case undefined:
    printUsage();
    break;
  default:
    console.error(`❌ 未知命令: ${command}`);
    printUsage();
    process.exit(1);
}
