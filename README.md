# littlesc

> 基于 TurboWarp 与 goboscript 纯 Node.js 编译内核的 Scratch AI 协同创作环境。支持自然语言生成积木、行级代码变更比对 (Diff)、画布积木发光定位与 AGY (Antigravity) 终端双轨协同开发。

littlesc 是一个面向 Scratch 3.0 的智能辅助开发系统。用户可以在可视化编辑器侧边栏中用自然语言描述交互逻辑，由内置大语言模型网关生成可读的 goboscript 源码，通过纯 Node.js 编译器转换为 Scratch 虚拟机（VM）可执行的积木并合并到当前工程；同时提供类似现代代码编辑器的差异对比与积木视觉定位能力。

---

## 核心功能

### 1. 行级代码差异比对 (Diff Viewer)
在 AI 生成或修改代码后，侧边栏提供清晰的代码差异比对面板：
- **逐行比对**：基于动态规划（LCS）算法，明确区分新增行（绿色）与删除行（红色）；
- **变更统计**：标识目标角色名称（如 `Sprite1`）与增删行数统计（如 `+12 -4`）；
- **双视图切换**：支持在差异视图（Diff）与纯源码视图（Source）之间自由切换；
- **操作控制**：支持单键复制源码、应用变更 (Apply) 与放弃修改 (Discard)。

### 2. 画布积木高亮与视口聚焦 (Visual Diff)
代码注入后，工作区与积木画布提供即时视觉反馈：
- **脉冲发光**：受本次变更影响的新积木栈会自动附带呼吸发光光晕（`tw-ai-glow-pulse`），便于快速识别；
- **视口居中聚焦**：自动平移工作区滚动条，将视野平滑定位至新生成的积木正中心；
- **历史定位**：消息卡片提供定位积木按钮，随时可在画布上重新聚焦目标代码。

### 3. AGY 终端与 TurboWarp 界面双轨协同
系统支持两种互补的开发工作流：
- **界面交互流**：在 TurboWarp 编辑器中直接使用 AI Copilot 侧边栏，适合直观调试、查看 Diff 与造型声音编辑；
- **终端 Agent 流**：直接在 AGY 命令行中由智能体调度 `sb3-editor` 与 `sb3-craftsman` 技能，通过命令行对 `project/` 下的源码进行自动化批量重构；
- **一键工程导出**：侧边栏提供导出工程功能，可一键将当前画布的所有角色与全局逻辑反编译为标准的 `project.gs` 文件，供终端工具接续开发。

### 4. 纯 Node.js 双向编译引擎
- **高保真转换**：实现 `goboscript ↔ SB3` 双向 AST 互转，支持脱糖、自定义积木抽象及独立变量作用域映射；
- **安全沙箱保护**：具备压缩包路径穿越防护、解压炸弹防御与大小限制检查；
- **模型接入 (BYOK)**：支持配置 DeepSeek、Kimi (Moonshot)、智谱 GLM、Agnes 等兼容 OpenAI 格式的模型接口；未配置 Key 时自动回退至内置 Mock 模式。

---

## 系统架构

```
[TurboWarp scratch-gui :8601]
    ├── 积木画布与舞台运行环境
    ├── AI Copilot 侧边栏 (ai-chat.jsx)
    │     ├── 行级比对面板 (ai-diff-viewer.jsx)
    │     └── 积木发光与聚焦定位 (block-highlighter.js)
    └── 代理转发 (/api/*)
              │
              ▼
[littlesc-backend :8000]
    ├── server.js (HTTP API 路由)
    ├── parser / lexer / codegen (goboscript -> SB3 编译器)
    ├── decompiler (SB3 -> goboscript 反编译器)
    └── validator (语法校验与自愈指引)
              ▲
              │ 导出 project.gs / 本地工程读取
              ▼
[AGY 终端命令行]
    ├── scripts/sb3.mjs (CLI 工具)
    ├── project/ (本地 Scratch 工程与 goboscript 源码)
    └── sb3-editor / sb3-craftsman 技能库
```

---

## 快速启动

### 方式一：Windows 批处理一键启动（推荐）
在项目根目录下双击运行：
`start.bat`

批处理脚本已做 ASCII 安全处理并锁定当前目录，会自动执行以下操作：
1. 检查 Node.js 与 npm 环境；
2. 自动检查并安装缺失的前后端依赖模块；
3. 同时启动后端编译器（`:8000`）与前端开发服务器（`:8601`）；
4. 检测到服务就绪后，自动调用系统默认浏览器打开 `http://localhost:8601`。

---

### 方式二：终端命令行一键启动
在项目根目录下执行：
```bash
npm run start:all
```
统一调度脚本将自动托管前后端进程，并在编译完成时自动打开浏览器。

---

### 方式三：开发者手动分步启动

#### 1. 启动后端服务 (:8000)
```bash
cd backend-js
npm install
node src/server.js
```
终端输出 `[InstanceScratch Backend] listening on http://0.0.0.0:8000` 表示后端就绪。

#### 2. 启动前端服务 (:8601)
另开终端窗口，在根目录执行：
```bash
npm install
npm start
```
构建完成后访问 `http://localhost:8601`。

---

## 核心工作流程与使用方法

### 1. 自然语言生成积木
1. 访问编辑器后，展开右侧 AI Copilot 侧边栏；
2. 在输入框输入需求，例如：
   ```text
   帮小猫添加键盘左右移动，按空格键跳跃，并将跳跃逻辑封装为一个 def_jump 自制积木。
   ```
3. 按 Enter 发送；
4. AI 生成代码并通过语法校验后，侧边栏显示 Diff 对比卡片，画布自动居中并高亮新积木。

### 2. 双模式应用机制
在输入框下方提供自动注入画布并高亮选项：
- **勾选状态（默认）**：代码通过校验后自动注入画布，视口平滑定位并触发脉冲发光；
- **未勾选状态（审阅模式）**：生成后停留在卡片中展示 Diff。核对无误后点击应用变更 (Apply) 按钮注入，或点击放弃按钮取消。

### 3. 右键现有积木定向重构
1. 在画布中选中任意积木栈，单击鼠标右键；
2. 选择「添加到AI对话」；
3. 侧边栏附件栏将显示该角色当前代码切片；
4. 输入修改需求（如：*“将移动改用加速度平滑过渡”*），AI 将以原有积木为基础做增量修改，并在 Diff 中呈现老代码与新代码的变动。

### 4. 与 AGY 终端协同开发
1. 在编辑器中完成原型搭建或添加素材后，点击侧边栏顶栏或底部的导出工程 (AGY) 按钮；
2. 系统自动下载或导出当前全部角色的 `project.gs` 源码；
3. 将文件置于 `project/` 目录下，可直接在 AGY 中对话开发：
   ```text
   帮我重构 project/ 目录下的敌人巡逻与碰撞逻辑，并用 node scripts/sb3.mjs compile 打包为 sb3。
   ```
4. 利用 AGY 深度推理与全工程多文件编辑能力完成复杂系统架构。

### 5. API 设置与本地模式 (BYOK)
点击侧边栏右上角设置图标：
- 可配置 DeepSeek、Kimi、智谱、Agnes 等提供商的 API Key 与 Base URL；
- 所有 Key 均保存在本地浏览器的 `localStorage` 中，不经过任何外部服务器中转；
- 若不配置 Key，系统默认进入本地 Mock 演示模式，编译与反编译链路完全正常可用。

---

## 工程目录结构

```
littlesc/
├── start.bat                     # Windows 快速启动脚本
├── scripts/
│   ├── start-all.mjs             # 前后端进程协同启动引擎
│   ├── sb3.mjs                   # AGY 命令行 SB3 检查/反编译/校验/编译工具
│   └── build-portable.mjs        # 便携版打包脚本
├── src/                          # 前端源码 (基于 TurboWarp scratch-gui)
│   ├── lib/brand.js              # 全局品牌名称定义 (littlesc)
│   ├── components/ai-chat/       # AI Copilot 侧边栏
│   │   ├── ai-chat.jsx           # 交互主面板与会话管理
│   │   ├── ai-diff-viewer.jsx    # LCS 行级代码差异比对组件
│   │   ├── ai-diff-viewer.css    # 差异对比样式
│   │   ├── block-highlighter.js  # 积木发光与画布视口聚焦工具
│   │   └── ai-chat.css           # 侧边栏样式定义
│   ├── components/gui/gui.jsx    # 编辑器核心布局
│   └── addons/                   # TurboWarp 插件扩展
├── backend-js/                   # 纯 Node.js 编译器与网关服务 (:8000)
│   ├── src/
│   │   ├── server.js             # HTTP 路由与 AI 网关
│   │   ├── lexer.js              # goboscript 词法分析
│   │   ├── parser.js             # 语法分析
│   │   ├── codegen.js            # AST 转 SB3 project.json
│   │   ├── decompiler.js         # SB3 转 goboscript 源码
│   │   └── sb3_parser.js         # SB3 解压解析
│   └── test/self_test.js         # 后端全链路自动化测试
├── electron/                     # 桌面客户端打包目录
├── project/                      # 本地 Scratch 项目工程与 goboscript 源码
└── package.json                  # 前端工程配置
```

---

## 打包 Windows 绿色便携版

项目支持构建单一的可执行文件（portable exe）：

```bash
# 1. 构建前端静态资源
npm run build

# 2. 安装后端与打包工具依赖
cd backend-js && npm install
cd ../electron && npm install

# 3. 打包生成便携版客户端
npm run build:win
```
构建产物输出路径为 `electron/release/littlesc-1.0.0-portable.exe`。

---

## 致谢与开源协议

### 特别致谢
本项目是在 **[InstanceScratch](https://cnb.cool/flx.edu/InstanceScratch-js)** 项目的基础上深度演进与重构而来的。
特别感谢 InstanceScratch 原作者团队在纯 Node.js goboscript ↔ SB3 双向高保真编译器内核、AST 解析映射与积木反序列化注入方案上所做的开创性工作，为本项目的实时代码比对与智能协同能力奠定了扎实可靠的底层基础。

### 开源协议
- 本项目遵循 **GPL-3.0** 协议开源。
- 前端底层基于 [TurboWarp / scratch-gui](https://github.com/TurboWarp/scratch-gui)（遵循 GPL-3.0 协议）。
- Scratch 是麻省理工学院（MIT）媒体实验室 Lifelong Kindergarten 团队的注册商标。
