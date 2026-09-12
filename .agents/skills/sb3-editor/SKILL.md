---
name: sb3-editor
description: Inspect, decompile, write, modify, validate, and compile Scratch 3.0 (.sb3) projects using InstanceScratch CLI in AGY.
---

# Scratch (.sb3) Editor Skill

Use this skill when the user asks to inspect, write, modify, debug, or compile Scratch 3.0 (`.sb3`) projects located in `project/` or specified paths.

## Quick CLI Reference

```bash
# 1. Inspect metadata without full unpack
node scripts/sb3.mjs inspect <path-to-sb3>

# 2. Decompile to editable goboscript code + assets
node scripts/sb3.mjs decompile <path-to-sb3> [outputDir]

# 3. Validate syntax
node scripts/sb3.mjs validate <path-to-gs-or-dir>

# 4. Compile back to .sb3
node scripts/sb3.mjs compile <path-to-srcDir> [outputSb3]

# 5. Create new starter project
node scripts/sb3.mjs new [outputDir]
```

## Workflow Guide

1. Inspect the `.sb3` file with `inspect` to check targets, blocks, variables, and costumes.
2. Decompile with `decompile` into `project/<name>_src/`.
3. Use `view_file` to inspect `project.gs`.
4. Use `replace_file_content` to make logic changes.
5. Validate with `validate`.
6. Compile with `compile` to generate the new `.sb3` file.
7. Inform the user of the output `.sb3` path so they can test it in Scratch / TurboWarp.
