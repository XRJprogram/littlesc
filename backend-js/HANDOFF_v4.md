# InstanceScratch 交接文档（v4 — D14 全量 6/6 达成版）

> 本会话（自 v3 交接后）核心成果：**压测从 v3 的 5/6（S3 唯一遗留）打到全量 6/6**。
> 根因不是语法 bug，而是「响应在 max_tokens 处被硬截断 + 截断被误报成普通语法错 +
> temp=0 字节级重放」三层叠加；本轮把三层全部修掉，并顺带吸收了 8 组 AI 高频写法超集。
> 全部证据在磁盘（tmp_stress/results_D14_6of6.json 等）。

---

## 〇、一句话现状

backend-js 内核达成交付口径：**D14 全量压测 6/6**（S1/S4/S5/S6 首轮即过，
S2/S3 靠「诚实截断报错 → 压缩重生成」自修复挽回），全套离线回归绿
（探针 9 件套 + self_test 13/13 + calculator ✓ + scale_verify ALL-PASS）。
后端 :8000 已运行最新内核；前端 :8601 在跑。

---

## 一、S3 根因复盘（v3 遗留问题的完整答案）

v3 记录的 `L1:1 Unexpected token in expression: Semicolon`（resp=21350 字节、
4 轮字节级相同）真相是三层叠加：

1. **物理截断**：21350 字节恰为 max_tokens=8192 的输出上限（finish_reason=length），末行悬空 `var level_enemy1_x =`；
2. **误报链**：peek() 越界返回合成 Semicolon(pos=-1)（模仿上游 EOF 兼作语句终止符），EOF 被报成普通语法错且无 "Unexpected EOF" 字样 → stress 的 /Unexpected EOF/ 截断分支在错误文本上永不命中；另外服务端其实早已返回 truncated 标志，但 stress 只读 goboscript 字段，全丢掉了；
3. **重放循环**：temp=0 下每轮把整段巨码塞回 assistant 消息 → prompt 几乎等价 → 贪心解码复刻同一条生成路径 → 同一位置再次撞墙（D12 四轮字节级相同的机制）。

### 修复（三层）

| 层 | 文件 | 内容 |
|---|---|---|
| 内核 | src/parser.js | ① _parseTerm 抛错前查 isAtEnd() → "Unexpected EOF in expression (source may be truncated)" 且 pos=最后真实 token；② 体内/顶层 var 初始化器 = 后 EOF → 定向报错（带变量名，体内保持致命）；③ parseConstExpr 同款。探针 probe_truncation_eof.mjs（12 断言） |
| 服务端 | src/server.js | 系统提示词规则 10 收紧（≤160 行、骨架优先、装不下就简化设计）+ 新增规则 11（大数据必须是短列表字面量+循环处理，禁逐平台/逐关写代码块，单列表字面量 ≤12 元素） |
| 压测 | tmp_stress/stress.mjs | 记录每轮 truncated/finishReason；截断轮追加硬预算指令（≤6000 字符）；新增短回复守卫（raw<2000 且失败 → 强制输出完整程序）；每轮失败代码落盘 code_<id>_R<n>.gs |

⚠ 实测教训（已写进代码注释）：截断轮若把巨码换成 800 字符摘要回显，模型会失去锚点掉进 851 字符"说明文"模式连跪——**保留全量回显**是对的（D12 的 S2/S5 就是靠它压缩自救的），防重放靠硬指令而非换历史。

---

## 二、本轮新增「文档化超集」（全部有探针、不自造 opcode）

对照上游 goboscript-main：以下表达上游均无；实现全部脱糖到既有 AST/opcode。

| 语法 | 实例 | 脱糖到 | 探针 |
|---|---|---|---|
| JS 风格过程定义 | define foo { } / define foo(a,b) { } | proc（preprocessor 形状守卫后就地改写 Define→Proc；宏式 define X 5 语义原样保留） | t1/t2/t5 |
| Scratch 积木删尾 | delete last [item] of\|from L; | delete index=length(L) | t12/t13 |
| from/in 同义词 | delete N from L; / insert v at N in L; | 既有 of 形态（in 需深度 0 预扫描改写防被成员运算吞掉：_rewriteListTargetIn） | t8/t10 |
| 清空列表 | clear list L; | StmtDeleteList（data_deletealloflist） | t11 |
| 替换项 | replace [item] N of\|in L with V; | StmtSetListIndex | t14 |
| item-of 记者块 | x = item 1 of L; | 表达式级改写为 L[1]（_rewriteItemOfReporter，语句入口统一做） | t15 |
| C 风格 for | for (i = 0; i < n; i++) { } | init; until(!(cond)){body; incr;}（三段用隔离 token 切片复用常规语句解析器；空 cond 退化为 forever） | t20/t21 |
| 块状多角色 | sprite "Name" { ...decls... }（含 unquoted/stage 形式） | 作用域式 _switchTarget：体内声明归该 target，出花括号还原；体错误保持致命 | t17-t19 |

统一探针：build/scaledown/probe_define_alias.mjs（23 断言，含全部回归项）。

---

## 三、验证证据（全部磁盘可查）

| 项 | 结果 |
|---|---|
| **D14 全量压测** | **6/6**（results_D14_6of6.json；S2/S3 自修复挽回，块数 74~271） |
| 中途证据 | results_D13_5of6.json（当时 S2 未过）、results_D12.json（v3 基线）、code_S*_R*.gs 各轮落盘 |
| truncation 探针 | 12/12 |
| superset 探针 | 23/23 |
| review 探针 | 7/7 + 11/11（注意真实文件名是 probe_review_fixes**2**.mjs，v3 写的 _2 不存在） |
| ternary/copy/runtime-init/ai_parse | 全 PASS |
| self_test | 13/13 |
| calculator_test | 全部通过 |
| scale_verify | ALL-PASS（改 src 自动失效重算，缓存工作正常） |

---

## 四、已知边界与建议（非阻塞）

1. **temp=0 的截断-压缩自救不是 100% 首发命中**：大型场景常态是 R1 截断、R2 压缩过（自修复挽回计入 PASS）。想提首轮命中率可考虑服务端按场景动态注入规则 11 示例，但当前 6/6 已达标，动提示词有回归风险。
2. **退化输出门**（MIN_BLOCKS<10 判定"疑似退化"）在 D13 中正确拦下一次 749-var 零逻辑输出——别拆这个门。
3. DEEPSEEK_MAX_TOKENS 已到 deepseek-chat 上限（8192），不要试图调大。
4. 可选优化（沿袭 v3）：合并轻量探针为 verify_quick.mjs；非致命诊断升级。

---

## 五、本会话改动/新增文件

- 内核：src/parser.js（EOF 诚实报错×4 处；define/repeat-until/delete-from/insert-in/clear-list/delete-last/replace/item-of/C-for/sprite-block 八组超集）、src/preprocessor.js（Define→Proc 就地改写 + looksLikeProcDefinition）、src/server.js（系统提示词规则 10 收紧 + 规则 11）
- 压测：tmp_stress/stress.mjs（truncated/finishReason 记录、硬预算与短回复指令、每轮失败代码落盘）
- 探针/诊断：build/scaledown/probe_truncation_eof.mjs（新）、probe_define_alias.mjs（新，23 断言）、diag_s3_stack.mjs、diag_s3_tokens.mjs、diag_sprite_codegen.mjs、diag_s3r2_compile.mjs、diag_s3r2_ast.mjs、diag_cfor.mjs（定位过程留档诊断）
- 证据：tmp_stress/results_D14_6of6.json、results_D13_5of6.json、results_D12.json、code_S3_D12.gs、code_S*_R*.gs

## 六、运行中进程

- 后端 :8000 ✅ 最新内核（本会话多次重启，最终重启于 D14 前）
- 前端 :8601 ✅ 在跑
- ⚠ 重启后端：`cd backend-js && node src/server.js`（或 `./start.sh`）；任何 AI 链路前先 health 检查。（原 HANDOFF_v3.md 已随仓库清理移除）

**结论**：交付口径达成 —— 上游 1:1 + 14 个文档化超集 + 全部探针绿 + scale_verify 结构门 + 压测 6/6。

---

## 七、前端四项修复与 Playwright 验证（M9–M11 补充）

用户实测报告四个问题，全部修复并以 Python Playwright 无头 E2E 实证
（pw/test_fix_verify.py，**17/17 PASS**，截图证据在 pw/artifacts/）：

| # | 问题 | 根因 | 修复 |
|---|---|---|---|
| 1 | 积木区滚动不 confined | AIChat 被塞进纵向列 .stage-and-target-wrapper 且 aiSidebarWrapper 无样式 → 撑高整页 | 移出为 .flex-wrapper 第三直接子列 + gui.css 新增布局规则 |
| 2 | 折叠侧栏积木区不扩张 | Blockly/舞台只听 window resize，CSS 过渡不触发 | 折叠切换泵 300ms 合成 resize；拖拽调宽每次 mousemove 派发 |
| 3 | 右键菜单「添加到AI对话」不存在 | 该功能从未在本库实现（全库+备份无痕迹） | 新增：Registry 可用则原生注册；本 TW 构建无 ContextMenuRegistry → MutationObserver 在 goog-menu(.blocklyContextMenu) 追加条目；mouseup 捕获委托激活（goog 菜单 mouseup 即销毁 DOM，click 收不到）；点击=序列化当前角色→/decompile→goboscript 填入输入框 |
| 4 | 「已注入N积木」但画布空且旧积木消失 | a) 旧实现先清空目标（设计性丢失）；b) 编译器块 ID 确定性(__node_id_N)两次生成冲突；c) 变量/列表可能在编译产物 stage 侧而注入只拷 sprite 侧→XML 引用未知变量 ID 抛异常被 blocks.jsx 吞掉→画布空仍报成功；d) 成功消息用服务端全项目计数 | injectSb3 重写为**合并追加**：全量 ID 重映射、变量/列表/广播按名合并（stage+sprite 双侧）、字段引用重写、vm.setEditingTarget 正确发 UI 事件、返回真实追加数、回滚覆盖 stage 作用域 |

关键教训：TW 的 scratch-blocks 构建无 ContextMenuRegistry 且菜单是原生 goog-menu；
scratch-vm 的 serialize(runtime, targetId)、反编译返回 {source} —— 一切以
node_modules 实装为准，勿凭上游记忆写代码。

验证命令：`cd pw && python test_fix_verify.py`（需 :8000 DeepSeek + :8601）。

## 八、M13 第二轮用户反馈修复（注入合法性 / 面板定位 / 滚动约束）

- **goto 下拉为空（不合法积木）根因**：deserializeBlocks() 把输入从数组
  `[1,id]` 转成对象 `{shadow,block}`，而 M8 重映射只处理数组形态 → 菜单阴影
  块引用残留旧 ID，toXML 输出 `<value name="TO">undefined</value>`。修复：
  双形态重映射 + 输入内变量原语第二遍改写。实测画布渲染「当角色被点击/
  移到/随机位置」，全工作区零 undefined。
- **注入检查门禁（回应用户“到底有没有做检查”）**：提交前对合并后整个
  工作区做 next/parent/input 引用完整性审计，任何悬空引用→整体回滚并报错；
  成功消息追加“已通过引用完整性校验”。`onclick` 本就映射
  event_whenthisspriteclicked，无需改编译器。
- **设置面板/会话下拉“打不开”**：二者 `top:calc(100%-1px)` 锚定整高侧栏底边，
  M9 三列重构后面板渲染到 y≈949（视口外）。改为 `top:5.9rem` + 
  `max-height:calc(100% - 7rem)`，探针实测面板可见。
- **列表局部滚动**：`.ai-chat-blocks-list/.ai-chat-messages` 补 `min-height:0`
  + `overscroll-behavior:contain`（flex 子项默认 min-height:auto 导致裁切无滚动条）。
  调色板滚轮实测局部滚动、页面 scrollY 恒 0。
- **右键菜单激活加固**：goog 菜单 mouseup 即销毁 DOM，click 可能不触发 →
  菜单根 mouseup/click 双捕获委托 + 触发后 Escape 与隐藏 widgetDiv 兜底。
  套件 F3a/F3b 持续 PASS。

回归：test_fix_verify.py 17/17 PASS（含两轮真实 DeepSeek 生成）。

## 十、M15/M16 第四轮：原生菜单通道 / 居中注入 / 静默成功

- **右键菜单终极方案（用户要求"先调研原生怎么搞"）**：解剖本构建 scratch-blocks，
  全部上下文菜单（块 block_svg.js:728、工作区 workspace_svg.js:1628、评论）都经
  **Blockly.ContextMenu.show(e, options, rtl)** 单一咽喉点渲染，选项形状
  `{text, enabled, callback}` 由 populate_ 建成 goog.ui.MenuItem、ACTION 事件激活。
  M15 弃用全部 DOM 克隆/合成事件补丁，直接包裹 ContextMenu.show 追加我们的选项
  —— 与「复制」完全同通道（渲染/悬停/激活/自动关闭全是原生行为），卸载时还原原函数。
- **注入位置**：compiler 硬编码 (60,60)。M15 在 injectSb3 里用 workspace metrics
  （viewLeft=-scrollX、absoluteLeft=flyout 宽、scale）把视口中心换算为工作区坐标，
  多栈纵向错位排布。实测落点为编辑区 (56%,42%)。
- **静默成功**：删除「✅已合并注入…」「✅已把积木反编译…」两条成功提示；画布长出/
  输入框被填即反馈；错误消息保留。测试断言同步改为按脚本数增长判定成功。
- **侧栏高度硬钳制**：aiSidebarWrapper 与 .ai-chat-sidebar 增加 max-height:100% +
  overflow:hidden（防御性，此前实测已无溢出）。

## 九、M14 第三轮：onclick 自愈失败 / 右键激活终极加固

- **AI 把 onclick 嵌进 onflag 且自愈改不对**：双管齐下——系统提示词规则1加入
  正误对照与"看到该错误就把事件行移到顶层"指令，Examples 增补
  「点击角色随机移动 → onclick { goto_random_position; }」；parser.js 对语句位
  置的事件 token 抛出带修复指引的错误文案。真实 DeepSeek 复测原场景 PASS。
- **右键条目激活终极形态（M14）**：blockId 冻结到节点 data-block-id；
  document 捕获层 mouseup/click 委托（对 goog 重挂载/整体替换免疫）+ 条目直击
  双通道；取消"无 blockId 不追加"，每个上下文菜单必有入口；触发后
  Escape+隐藏 widgetDiv 兜底关闭。仿真人慢速点击实测填框成功。
- **侧栏长度**：长对话链路逐层测量 page scrollHeight==视口、messages 列表
  clientHeight==scrollHeight 自滚动 —— 无溢出；此前 min-height:0 修复已覆盖。

## 十一、四代理审查修复（M17）与 rootbak 重建

- **审查方式**：4 个并行子代理（菜单钩子 / 注入管线 / 后端解析提示 / CSS+测试），
  全部只读 + 实证，产出 P0×1、P1×5、P2×15+。以下全部修复。
- **菜单钩子（Review-A）**：flyout 右键走 show(e,[],rtl) 且原生隐藏空菜单——
  只在 options.length>0 时追加条目；恢复改为**身份守卫**（仅当当前 show 仍是我们的
  包装才还原，绝不踩坏 TW addons/api.js createBlockContextMenu 的同函数包装链）；
  DOM 回退 + 全局捕获监听器 + registeredId 全部删除。
- **注入管线（Review-B）**：居中公式修正为 ws=(screen−div−scroll−absolute)/s
  （scroll 必须在除法内！旧式在 s≠1 时偏差 scroll·(1−1/s)），中心点改为
  flyoutWidth+(viewWidth−flyoutWidth)/2 可见画布中心；审计门禁补 code===2 与
  Array 拒判；Object.assign 前补 abort 复查；回滚恢复 editingTarget；
  ensureVar 撞 id 时改发新 id 而非静默绑定异名变量。
- **后端（Review-C）**：rule-1 示例语法修正 onloudness > 10 / ontimer > 5
  （旧文本教的括号写法本身编译失败！）并补广播帽 on "msg" 与「禁止 when 风格」
  （实测 when… 被解析器静默丢弃成空程序）；EVENT_TOKENS 升为模块级 Set、
  由 TokenType 自动派生防漂移；parseStmt 尾加 when* Name 守卫提示；
  declaration() 循环错误追加「循环须在事件体内」提示。
- **CSS/测试（Review-D）**：P0 根因 .body-wrapper 缺 min-height:0 ——
  M16 的 max-height:100% 全是空操作（长消息把页面撑到 5500px）；补齐后
  新增 F1c 高内容包含性断言（注意探针子元素须 min-height+flex:0 0 auto，
  否则被 flex shrink 压成 0 造成假阴性）。aiSidebarWrapper 补
  flex-shrink:1;min-width:2.75rem 防 1024px 视口侧栏出屏；面板锚点 6.5rem、
  设置面板 z-index:40；三个弹层开关互斥；死规则 .ai-sidebar-wrapper 删除。
- **事故记录**：一次误用 write 整文件覆盖 ai-chat.jsx 为占位符；靠
  ai-chat.jsx.rootbak（M8 后备份）+ 会话内逐字重放完成重建，最终套件
  **18/18 PASS**（新增 F1c）。教训：write 仅限新文件；改既有文件一律 edit。
  toggleCollapse 的 resize 泵也在重建中补回（否则折叠不触发 Blockly 重排，F2 delta=0）。

---

## 十二、M18~M24 落地复验 + M25 自定义AI模型栏目（本次会话）

### 复验结论（两轮全量回归）
- 基线首跑 20 passed / 2 failed —— 两个失败**全是测试缺陷，应用代码无恙**：
  - **F3c 真失败 + F3e 假绿**：定位器 `[class*="ai-chat-quick-action"]` 同时命中容器 DIV
    （aiChatQuickActions 的哈希类名包含该子串），`.first.click()` 点到无 handler 的容器，
    后端日志证实两次快捷动作均未发出 /api/ai/chat。修复：定位器改用
    `button[class*="ai-chat-quick-action"]`；并给 F3e 加硬性反空转门槛——必须观测到
    /api/ 请求计数增长（api_reqs）才算通过。
  - **M21 超时**：语言入口在 ⚙(Settings) 下拉内部（MenuLabel 渲染 div，非 button、无 title），
    且 headless 默认 en locale 显示 "Language" 而非「语言」，旧用例悬停 `text=语言` 必超时。
    修复：先点 `[class*="dropdown-label"]` 打开下拉，再点 `text=/^(Language|语言)$/`。
- 终跑 **23 passed / 0 failed**。关键实证：
  - F3c `scripts=4 (stable)`（快捷动作真实发送并注入）
  - F3e `api=True scripts 4->1 dangling=0`（replace 替换语义实锤）
  - M21 `items=3 ['English', '简体中文', '繁體中文']`

### M25 自定义AI模型栏目（新功能）
- 后端 `POST /ai/probe`（server.js）：复用 `_validateByokBaseUrl` SSRF 门禁（非 https /
  内网 IP → 422 中文 detail）；通过后 GET `{base_url}/models`（默认 15s 超时，
  AI_PROBE_TIMEOUT_MS 可调）。探测结果一律 HTTP 200 `{ok:false,error}` 返回；
  只有畸形请求/被拒 base_url 才 4xx——与 /ai/chat 语义对齐；只探 /models 不做补全，零 token。
- 前端 ai-chat.jsx BYOK 设置面板重构为栏目式：
  - 预设行第 4 枚 chip「自定义」：当前配置不匹配任何预设且非空时高亮；点击清空
    base_url/model（保留 api_key）从空白自定义开始。
  - 「自定义 AI 模型」栏目标题 + 副标（OpenAI 兼容接口说明）置于三字段上方。
  - Model 字段下新增「测试连接」按钮 + 内联结果文本（成功=连接成功·N 个可用模型，
    配置了列表外模型名时附提示；失败=透传后端 detail）。新 CSS：
    .ai-chat-section-title/.ai-chat-section-hint/.ai-chat-probe-row/
    .ai-chat-probe-button/.ai-chat-probe-result(.probe-ok/.probe-fail)；全程无 emoji（M23 规范）。
- 套件新增 M25 项：面板结构、4 chips、DeepSeek 预设填充、自定义清空语义、
  localStorage 持久化、探针错误路径（http:// 内网地址 → 422 → 结果行显示「连接失败：
  base_url 必须使用 https 协议…」）。

### API Key 状态（重要）
- 用户提供的 DeepSeek key（sk-…hbf）经 GET api.deepseek.com/models 实测返回
  **401 invalid**（"Authentication Fails"）——因此**未接入**，provider 仍为 mock。
- 拿到有效 key 后这样启用服务端密钥（key 只走环境变量，不入库、不进测试代码）：

    $env:MODEL_PROVIDER='deepseek'; $env:DEEPSEEK_API_KEY='<真实key>'; $env:ALLOW_SERVER_KEY='true'
    node src/server.js *> server_run_tomorrow.log

- 也可不改后端：浏览器 ⚙→API 设置→粘贴 key（BYOK 走 /ai/chat byok 路径），
  并可用新的「测试连接」按钮即时验证。

### 本次会话改动文件
```
backend-js/src/server.js               # + POST /ai/probe（SSRF 校验 + models 探测）+ 路由注册
src/components/ai-chat/ai-chat.jsx     # M25：自定义chip+栏目头+测试连接；matchesAnyPreset/probeByokConnection/probeState
src/components/ai-chat/ai-chat.css     # M25 栏目样式（section-title/hint、probe-row/button/result）
pw/test_fix_verify.py                  # F3c/F3e 定位器修复、M21 重写、api_reqs 反空转、新增 M25（共23项）
pw/diag_m25.py                         # 诊断探针留档（快捷动作 inventory + 菜单 DOM dump）
pw/suite_run_baseline.log              # 基线轮记录（20/2）
pw/suite_run_m25.log                   # 终轮记录（23/0 全绿）
```

### 服务状态（本会话结束时刻）
- 后端 ：8000 运行中（job pwsh-4，provider=mock，已含 /ai/probe）
- WDS ：8601 运行中（job pwsh-2，Compiled successfully）

---

## 十三、M27：Agnes 接入 + def_ 函数命名约定 + 截断续写 + 行级修补

### 背景
- 用户实报：四则运算 `func add(...)` 报 `L1:6 Expected func name` —— `add` 是保留字（加到列表）。
- 用户 key 实为 **Agnes AI**（apihub.agnes-ai.com/v1，OpenAI 兼容）而非 DeepSeek；deepseek.com 401 只是拿错门。
- 两份调研报告全文见 `pw/research_report.md`（开源 Agent 续写实现 / 服务商能力矩阵）。

### A. Agnes 接入
- `_getAiProviderConfig()` 新增 agnes 条目（env：`AGNES_BASE_URL / AGNES_MODEL / AGNES_API_KEY`），默认 model agnes-2.5-flash。
- 前端 BYOK 预设第 5 枚芯片 **Agnes**（自动填 https://apihub.agnes-ai.com/v1）。
- 兜底链 `AI_FALLBACK_PROVIDER`（如 deepseek）：主商 429/402/5xx/网络错误时服务端密钥路径自动切换重试一次；BYOK 不跨商回退；备用商无 api_key 时静默跳过。
- P0 实测：agnes-2.5-flash 接受 max_tokens 100→65536 全部 200/stop（不钳制）；prefix:true 被网关容忍但返回空内容+length（透传不可靠）→ **auto 模式下 Agnes 走 echo**。

### B. def_ 前缀函数命名（提示词强制 + 校验兜底）
- grammar_notes 硬性要求函数名以 `def_` 开头，附示例与保留字黑名单说明；examples 增加 def_twice 示例。
- `_validateSource` 词法扫描（parse 前）：func/proc 定义名缺 def_ 前缀 → NamingError「函数名必须以 def 开头（保留字保护）：add → def_add」。关键字占名槽（TokenType.Add 等 value=null）通过源码 span 切片恢复拼写识别。
- 自修复循环凭该错误自动改名；compileSource 直连路径不受影响（语料回归全绿）。

### C. returnedFunc 改名 + 递归保护
- 返回变量 `{fn}:return` → **returnedFunc:{fn}**（visitor.js 注入/提升/表达式引用 ×4、codegen.js VARIABLE 字段 ×1）。
- 变量注册沿用 pass0 注入机制（_visitSpritePass0 内 sprite.vars[returnedFunc:fn]）。
- codegen._genFuncCallStmt 新增内联递归守卫：调用栈成环即抛中文错误（原先无限内联爆栈），单测 t6 验证。

### D. 服务端 auto-continuation（截断治理）
- 流程：finish_reason=length → 追加 assistant=已生成原文 + user=模板2续写指令 重发 → 重叠去重(≤200字符)+围栏修复拼接 → 直到 stop 或上限；空增量自停。
- env `AI_CONTINUATION_MODE=auto|echo|prefix`（默认 auto：直连 api.deepseek.com 自动切 /beta + 最后一条 assistant prefix:true；其余 echo）。
- env `MAX_AI_CONTINUATIONS=3`；`AI_TIMEOUT_MS` 默认 240000→600000。DeepSeek 直连 prefix 为一等公民（主用户路径）。
- 最终仍 length 时前端警告改为「自动续写已达上限」。

### E. 行级修补（SEARCH/REPLACE）+ 首答留存
- 第一次成功回复存为 workingCode；后续修补全部基于该副本增量进行。
- 校验失败先走定向补丁轮：要求模型只回 text 围栏内的 aider 式 SEARCH/REPLACE 块；applySearchReplace 精确匹配→行级 trim 匹配；应用后本地 /validate 预检，零错误才采纳注入。
- 补丁不可用/仍失败 → 回落原整段重生成阶梯（保底不劣化）。收益：修补输出缩到几行，截断几乎不再触发。

### F. 测试与证据
- 新单测 build/scaledown/test_func_sugar.mjs：**10/10 PASS**（原始源码双点名 NamingError / FIXED 零错误编译 / 早返回 / 嵌套调用 / 递归响亮报错 / proc 同约束）。
- scale_verify ALL-PASS（pyinterpreter 既有 7 处记录差异、幂等 0）；probe_ai_parse / test_ai_parse 全过。
- E2E：M25 chips 4→5；新增 M26 四则运算真实出码（Agnes BYOK 点击→填 key→ai_send→画布增长断言）。日志 pw/suite_run_m27.log。
- 冒烟：/validate ORIGINAL 复现用户报错并叠加改名指引；FIXED 编译 200 SB3。

### G. 已知边界
- 反编译往返中 returnedFunc:* 还原为普通赋值，不还原 return 语法。
- DeepSeek 直连 prefix 未实测（无余额），代码按官方 /beta 文档实现；Agnes 走 echo。
- check_hint.mjs 等直连 /validate 的旧脚本若用裸名 proc 会收到新 NamingError（预期行为）。

### H. 运行配方（PowerShell）
```powershell
$env:MODEL_PROVIDER = 'agnes'
$env:AGNES_API_KEY  = '<你的key>'   # 或前端 BYOK 面板填入
$env:AI_FALLBACK_PROVIDER = 'deepseek'   # 备用商需其自身 api_key
$env:ALLOW_SERVER_KEY = 'true'   # 仅当希望无 BYOK 时也用服务端 key
node src/server.js   # :8000
```

### 补记（同日稍晚）
- 全量回归 **suite_run_m27b.log：24/24 PASS**（M25 chips=5、M26 四则运算真实出码 ok=True ai_fired=True scripts 1→2 stable）。
- P0 实测数据：agnes max_tokens 100/16384/65536 均 200+stop；prefix:true 经网关返回空内容+length → auto 模式下 Agnes 固定走 echo。
- **事故与教训**：
  1. apply_pairs.mjs 采用「全部锚点命中才一次性写盘」——首轮 server.js 五对在内存应用后因后续对失败而**整体丢失**，且运行日志打印的是 env 变量名而非解析结果，造成“已生效”假象。教训：批量补丁要么逐对落盘，要么失败时打印已应用清单；健康检查必须读派生状态而非输入配置。
  2. 经 run_code 模板字面量写含反斜杠的代码会吃掉转义（\\s 变 s），ai-chat.jsx 正则碎成多行 → babel「Unterminated regular expression」→ editor 块编译失败，dev-server 静默回退旧内存包。教训：写正则/转义密集内容一律用双引号数组行并双写反斜杠；WDS 排查先看 stderr 日志的 ERROR in 行。
- 服务终态：pwsh-13 后端(:8000, MODEL_PROVIDER=agnes + AI_FALLBACK_PROVIDER=deepseek)、pwsh-10 WDS(:8601, editor.js 含 agnes 标记 5127618B)。
