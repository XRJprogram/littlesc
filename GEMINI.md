# Antigravity (AGY) Scratch 项目开发指南

本项目支持直接在 AGY / Gemini 对话中阅读、编写、修改 Scratch 3.0 (.sb3) 项目。

---

## 🛠️ 标准工作流 (SOP)

用户的 Scratch 项目文件存放在 `project/` 目录下（或指定的其他路径）。

当用户要求阅读、编写或修改一个 `.sb3` 项目时，请严格按照以下步骤执行：

### 1. 结构探测 (Inspect)
在不解包大文件的情况下，先快速查看项目角色结构、积木数、变量、自定义函数等元数据：
```bash
node scripts/sb3.mjs inspect project/my_game.sb3
```

### 2. 反编译解包 (Decompile)
将 `.sb3` 转换为易于阅读和编辑的 goboscript 文本源码及媒体资产包：
```bash
node scripts/sb3.mjs decompile project/my_game.sb3 project/my_game_src
```
- `project/my_game_src/project.gs`：主源码文件（包含各角色的代码，以 `target stage;` 和 `target "角色名";` 分割）。
- `project/my_game_src/assets/`：原版造型与音频文件（SVG/PNG/WAV），重编译时必须原样保留。
- `project/my_game_src/targets/`：按角色拆分的独立源码文件（供快速参考）。

### 3. 代码阅读与精准编辑 (Edit)
使用 `view_file` 阅读 `project.gs`，使用 `replace_file_content` 精准编辑或添加逻辑。

### 4. 语法与合法性校验 (Validate)
在编译前，必须使用编译器校验器进行语法检查：
```bash
node scripts/sb3.mjs validate project/my_game_src/project.gs
```
若有报错，根据报错行号和修复指引就地修正。

### 5. 重编译为 .sb3 (Compile)
校验无误后，打包为完整的 `.sb3` 文件供用户在 Scratch / TurboWarp 中直接运行：
```bash
node scripts/sb3.mjs compile project/my_game_src project/my_game_modified.sb3
```

---

## ⚠️ goboscript 核心语法守则与避坑指南

1. **事件帽子块必须在顶层（Top-Level）**：
   - 合法：`onflag { ... }`, `onclick { ... }`, `onkey "space" { ... }` 必须位于最外层。
   - 严禁：绝对不能将事件帽子嵌套在其他事件内部或 `forever` / `repeat` 循环体内！
2. **函数命名规范**：
   - 自定义函数（Custom Blocks）定义必须以 `def_` 开头（保留字保护）：`func def_jump() { ... }` 或 `proc def_init() { ... }`。
3. **变量与作用域**：
   - 角色/舞台顶层变量使用 `var 变量名 = 初始值;` 声明。
   - 函数内的局部变量使用 `local 变量名 = 初始值;`。
4. **列表（List）规则**：
   - 列表索引起始为 **1**（1-based）。第一项为 `list[1]`，最后一项为 `list[length(list)]`。
   - 弹出最后一项使用 `delete last of list;`。
5. **运算符**：
   - 字符串连接使用 `&`（例如 `"分数: " & score`）。
   - `+` 仅代表数值加法。
6. **循环与控制**：
   - 循环语法：`forever { ... }`、`repeat(10) { ... }`、`while (cond) { ... }`、`until (cond) { ... }`。
   - 列表遍历糖：`for item in 列表 { ... }`（无需单独声明循环变量）。
