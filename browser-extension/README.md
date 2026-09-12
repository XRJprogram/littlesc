# InstanceScratch AI — 浏览器侧边栏扩展

用自然语言写 Scratch 的 **浏览器侧边栏扩展**，直接注入到 **Turbowarp**（https://turbowarp.org/）
与 **Codingclip**（https://codingclip.com/editor）两大图形化 Scratch 编辑器。

在**浏览器原生侧边栏**中输入自然语言 → **真实 AI** 流式生成 goboscript → 内置编译器
编译成 SB3 积木 → **注入到当前打开的角色**。所有生成结果都经过多轮自修复 + 结构性
校验 + 真实 VM 运行验证，**保证可运行**（不存在"只有调用没有定义"或"能编译但跑不起来"）。

---

## ✨ 特性

- 🧩 **原生侧边栏扩展**（Chrome Side Panel，Manifest V3）：点扩展图标即弹出浏览器侧边栏。
- 🎯 **注入当前打开的角色**：自动读取页面当前选中的角色并注入，**无需选择角色**。
- 📝 **AI 流式输出**：AI 生成结果通过长连接端口**逐段实时渲染**，边生成边显示。
- 🔄 **AI 自动判定删改/替换积木**：AI 结合当前角色已有积木自动判断追加还是替换；
  输入"重新写/删除/替换/修改"等指令时，自动移除旧积木再重建，保留其它手写积木。
- 🌗 **黑白模式**：一键深浅色切换（右上角太阳/月亮图标），持久化记忆。
- ☁️ **定制图标**：使用自定义云朵图标。
- 💬 **对话管理**：多会话记录，可新建/切换/删除对话，历史消息保存在本地，支持多轮上下文。
- 🧠 **真实 AI**：支持 **DeepSeek**、**Moonshot**、**Agnes**、**OpenAI** 及任意自定义 OpenAI 兼容端点。
- 🔁 **多轮自修复**：生成 → 校验 → 把错误回喂给模型重试（默认最多 5 轮）。
- 🧪 **64 个测试码**：冒泡/快排、计算器、JSON 解析、正则、数据库、生命游戏等全部通过
  **编译 + 结构完整性 + 真实 scratch-vm 运行时**三重验证；并提供**真实 AI 端到端测试**。
- 🚫 **防"只有调用没有定义"**：自动检测 `def_xxx()` 调用是否有对应 `func def_xxx`
  定义；强制单一 `onflag` 事件块。
- 🔒 **密钥安全**：不内置任何 API Key，仅保存在浏览器本地。

---

## 📦 安装

### 方式一：直接导入 zip（Release 产物）

1. 从 **Release** 下载 `InstanceScratch-AI-v{VERSION}.zip`。
2. 解压得到 `InstanceScratch-AI-v{VERSION}/` 文件夹。
3. 打开 Chrome/Edge 扩展管理页 `chrome://extensions`，开启「开发者模式」。
4. 点「加载已解压的扩展程序」→ 选择解压后的文件夹。

> 也可以不解压，直接在开发者模式把 zip 拖进 `chrome://extensions` 页面。

### 方式二：从源码构建

```bash
cd browser-extension
npm install
npm run build      # 打包编译器 / 注入器 / 后台
npm run package    # 生成 release/InstanceScratch-AI-v{VERSION}.zip
```
然后按"方式一"加载。

---

## 🚀 使用

1. 打开 **https://turbowarp.org/** 或 **https://codingclip.com/editor**，新建/打开一个项目。
2. 点击扩展图标，**浏览器右侧弹出侧边栏**。
3. 点击侧边栏右上角的齿轮图标，配置 AI 服务商和 API Key。
4. 侧边栏顶部显示注入目标为**当前打开的角色**（无需选择）。
5. 在输入框用自然语言描述，例如：
   - "点击角色说你好，移动 10 步"
   - "用冒泡排序给列表排序并显示"
   - "做一个计算器，3 + 5 * 2 等于 13"
   - "**替换**当前角色的代码，改成点击时唱歌"
   - "**删除**之前的排序代码，重新写一个斐波那契"
6. 点「发送」→ 扩展调用真实 AI（**流式输出**）→ 编译 → **注入到当前打开的角色**。

> 💡 **替换模式**：当你的指令中包含"删除/替换/修改/重建/override/replace"等关键词时，
> 扩展会先**清空当前角色的所有旧积木**，再注入新的积木。否则以追加模式注入。

---

## ⚙️ AI 配置

通过侧边栏右上角的齿轮图标进入「AI 设置」，选择服务商或填写自定义 OpenAI 兼容接口。

支持的服务商（OpenAI 兼容，可随时切换）：

| 服务商 | Base URL | 模型 | 说明 |
| --- | --- | --- | --- |
| **DeepSeek** | `https://api.deepseek.com/v1` | `deepseek-chat` | platform.deepseek.com 获取 key |
| **Moonshot** | `https://api.moonshot.cn/v1` | `kimi-k3` | platform.moonshot.cn 获取 key |
| **Agnes** | `https://apihub.agnes-ai.com/v1` | `agnes-2.5-flash` | |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o-mini` | platform.openai.com 获取 key |
| **自定义** | 你指定 | 你指定 | 任意 OpenAI 兼容端点 |

> ⚠️ **密钥安全**：本项目**不内置任何 API Key**。所有 API Key 由用户自行填写，
> 仅保存在浏览器本地 `chrome.storage.local` 中。请勿将你的 API Key 提交到代码仓库。

---

## 🧪 测试

```bash
cd browser-extension
npm test               # 全量：编译 + 结构完整性 + 真实 VM 运行时（64 码）
npm run test:compile   # 仅编译 + 结构完整性（64 码）
npm run test:runtime   # 仅真实 scratch-vm 运行时（64 码）
npm run test:ai        # 真实 AI 端到端测试（需配置 API key）
```

**真实 AI 端到端测试**（每个场景都调用真实 API 生成，再验证可运行，可选截图）：

```bash
AI_API_KEY=sk-xxx \
AI_BASE_URL=https://api.deepseek.com/v1 \
AI_MODEL=deepseek-chat \
AI_SCREENSHOT_DIR=./shots \
npm run test:ai
```

该测试对每个场景用真实 AI 生成 goboscript，然后逐项校验：语法结构 → 编译完整性 →
真实 scratch-vm 运行，并将运行结果（say 文本）打印，可配置无头浏览器截图确认。

---

## 🏗 架构

```
browser-extension/
├── manifest.json                MV3 清单：sidePanel + content script + 后台
├── background.js                后台：编译 + 真实 AI 多轮自修复 + 流式支持
├── sidepanel.html / .css / .js  ★ 侧边栏 UI（对话管理 + 黑白模式 + 流式输出 + 设置）
├── content.js                   隔离世界 content script：桥接（postMessage）
├── injected-main.js             主页世界脚本：发现页面 VM、执行读取/注入/替换
├── icons/                       自定义云朵图标（PNG 多尺寸 + SVG）
├── build/
│   ├── compiler.mjs             ★ 浏览器端 goboscript→SB3 编译器
│   ├── injector.mjs             ★ 积木注入器（append / replace 双模式）
│   └── background.bundle.js     打包后的后台 worker
├── src/lib/                     ai-pipeline / system-prompt / injector
└── tests/                       64 个 goboscript 测试码 + 三重验证 + AI 端到端
```

### 关键流程
1. **sidepanel**（浏览器原生侧边栏）接收用户输入。
2. sidepanel 通过 `chrome.runtime.connect({name:'aiStream'})` 建立**长连接端口**。
3. **background** 用真实模型（DeepSeek/Moonshot/Agnes/OpenAI 等）**流式生成** goboscript，
   每个增量 chunk 通过端口 `postMessage` **逐段实时推送到侧边栏**（真正渐进式输出）。
4. 同时后台进入**自修复循环**（默认最多 5 轮：生成→校验→把错误回喂模型重试），
   保证返回的代码可编译可运行。
5. 通过后 **compile** 把 goboscript 编译成 SB3。
6. sidepanel 通过 `chrome.tabs.sendMessage` 通知 **content script**。
7. **content script** 通过 `window.postMessage` 与 **injected-main.js**（主页世界）
   通信，后者发现页面 VM 并**把积木合并或替换**到**当前角色**。

### 自动判定删改
AI 会结合「当前角色已有积木上下文」**自动判断**需要追加还是替换：
- 当你说「**重新写 / 重写 / 再写 / 删除 / 替换 / 修改**」一个已有功能时，
  AI 自动在输出里携带 `# DEL: <opcode>` 指令删除旧积木，再注入新实现。
- 当你说「**增加 / 追加**」时，AI 只追加新积木，保留已有代码。
- 注入器根据 `# DEL:` 指令与输入关键词，仅删除需要替换的积木，**保留你手写的其它积木**。

---

## 🔒 说明

- 编译核心移植自本项目 `backend-js`（goboscript JS 版，GPL-3.0）。
- **本项目不内置任何 API Key**，所有 AI 服务需在设置中填写你自己的 Key。
- 扩展只在本站编辑器页面读取 VM 与注入，不上传用户代码到第三方（AI 调用除外）。
- 图标为自定义云朵 SVG。
