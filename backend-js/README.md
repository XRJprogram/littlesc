# InstanceScratch backend-js —— goboscript↔SB3 编译内核

## 环境
- Node.js ≥ 18（ESM）
- 依赖：`adm-zip`（package.json 已含，如未安装先 `npm install`）

## 启动服务

后端默认监听 **:8000**，前端默认 **:8601**，前端通过 `/api/*` 代理转发到后端（见仓库根 `webpack.config.js`）。

```bash
cd backend-js
npm install
cp .env.example .env     # 填入 API key；.env 已被 .gitignore 排除，切勿提交
node src/server.js       # 或 ./start.sh  → http://localhost:8000

# 另开一个终端，回到仓库根启动前端
cd ..
npm install
npm start                # → http://localhost:8601
```
未配置 key 时为 mock 模式，编译 / 反编译端点仍可正常使用。

## 目录
```
backend-js/
├── src/                     # 编译器内核（lexer/parser/preprocessor/visitor/codegen/decompiler/server）
├── test/
│   ├── self_test.js         # 服务端与编译链路自测（13 项，mock 模式即可跑）
│   ├── calculator_test.js   # 计算器用例：编译→反编译→重编译，直方图对比
│   ├── roundtrip_test.js    # 3 个真实项目往返保真度回归
│   └── fixtures/calculator/ # calculator_test 的输入源码（main.gs）
├── build/
│   ├── test-sb3/            # roundtrip 测试输入：pixel-font / zhiteng / pyinterpreter
│   └── scaledown/           # 语法超集探针、EOF 探针、规模校验脚本
├── .env.example             # 环境变量模板（复制为 .env 后填写）
├── 修复报告.md               # 保真度根因分析、修前修后对照、已知限制
├── HANDOFF_v4.md            # 交接记录（AI 链路 / 注入管线 / 前端修复）
└── README.md                # 本文件
```

## 运行回归测试
```bash
cd backend-js
node test/self_test.js       # 13 项，不需要 API key
node test/calculator_test.js # 编译→反编译→重编译，直方图必须完全一致
node test/roundtrip_test.js  # 3 个真实项目往返
node build/scaledown/probe_define_alias.mjs   # 语法超集探针（23 断言）
```
- `calculator_test` 输入 `test/fixtures/calculator/main.gs`，产物写入 `build/calculator-out/`
- `roundtrip_test` 输入 `build/test-sb3/`，产物写入 `build/roundtrip-out/`；两个产物目录在首次运行时自动创建
- 判定标准：反编译→重编译后的 **opcode 直方图**与原版完全一致
- 预期结果：
  - self_test：13/13
  - calculator：全部通过
  - pixel-font：✓ PASS（0 差异）
  - zhiteng：✓ PASS（0 差异，修复前 50 处）
  - pyinterpreter：✗ 7 处差异（全部为已知限制：42 块不可见游离块 + 7 块残留，详见修复报告第四节；块级保真 99.79%）

## 核心管线用法
```js
// 反编译：SB3 → goboscript 源码
import { sb3ToGoboscript } from './src/decompiler.js';
const { source } = sb3ToGoboscript(sb3Buffer);

// 重编译：goboscript 源码 → SB3
import { compileSource } from './src/server.js';
const sb3Buffer2 = compileSource(source);
```

## 本轮新增语法
- `orphan { ... }`：顶层孤儿块组。反编译器用它保留 SB3 中不连帽子块的散块链（loose stacks），重编译时生成无帽 topLevel 块链。手工编写 goboscript 时一般用不到。
- `if cond { } else { }`：else 分支显式存在但为空时，现在会如实生成带空 SUBSTACK2 的 control_if_else（此前会被降级成 control_if）。
- `for item in 清单 { ... }`：**遍历糖（写时压缩、编译展开）**。展开为隐藏指针 `__for_i_N`（1 起步、每轮 +1）+ 临时缓存变量 `item = 清单[指针]`；嵌套循环各自持有独立计数器，循环变量无需声明。AI 生成与手写均适用。
- `copy list 源 to 目标 ;`：**一键克隆列表糖**。展开为"清空目标 + 循环逐项 append"，等价手工 repeat(length)+item-of 循环。
- `change 变量 by 表达式 ;` / `set 变量 to 表达式 ;`：Scratch 风格语句适配（AI 友好扩展），分别映射 data_changevariableby / data_setvariableto；与既有 `+=`、`++`、过程调用、`change = x` 赋值零冲突。
- 事件体内 `var x = T;`：自动提升为角色级变量声明（AI 常见写法；上游语法本只允许角色顶层声明）。

以上糖均在**解析期**脱糖为普通 AST 节点：visitor 自动注册隐藏变量、codegen/反编译器零特判、decompile→recompile 天然幂等。

**已知限制**：`%define` 宏体为单行（上游一致语义）。含糖语句的宏必须写在同一物理行内（如 `%define SUMALL(lst) for item in lst { total += item; }`）；跨行宏体不会被完整捕获。宏 × 糖组合已验证：常量宏作列表名 ✓、函数宏包裹 copy/for-in ✓、一条宏串联 copy+遍历+求和 ✓。
