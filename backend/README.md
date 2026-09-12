# InstanceScratch backend — Python 编译服务（已弃用）

> **已弃用**：现行实现是 `backend-js/`（纯 Node 的 goboscript 编译器与 AI 网关）。
> 本目录是早期 Python 原型，仅作参考，不再维护。

基于 [goboscript-py](https://github.com/origamitower/goboscript) (MIT) 的 FastAPI 编译服务，提供在线编译、校验、反编译和 AI 代码生成能力，产出 Scratch 3.0 `.sb3` 文件。

## 目录结构

```
backend/
├── main.py              # FastAPI 应用（六个端点）
├── requirements.txt     # 依赖清单
├── start.sh             # 一键启动脚本
├── self_test.py         # 全链路自测脚本
└── README.md            # 本文档
```

## 依赖

- Python 3.10+
- fastapi ≥ 0.104
- uvicorn ≥ 0.24
- openai ≥ 1.0
- goboscript-py（通过 sys.path 引用，不改写源码）

## 快速启动

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动服务（默认端口 8000）
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# 或用启动脚本
bash start.sh   # 默认 127.0.0.1:18710
```

启动后访问：
- API 文档：`http://localhost:8000/docs`
- ReDoc：`http://localhost:8000/redoc`

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `GOBOSCRIPT_PKG_PATH` | `/home/z/my-project/shared/goboscript-unzip/goboscript-project` | goboscript-py 包路径 |
| `MODEL_PROVIDER` | `deepseek` | AI 模型提供商：`deepseek` / `kimi` / `zhipu` / `mock` |
| `API_KEY` | （从 `.env`/provider 专用 env 读取） | 覆盖 provider 专用 key 的通用 API key |
| `BASE_URL` | 按 provider 不同 | 覆盖 API base URL |
| `MODEL_NAME` | 按 provider 不同 | 覆盖模型名 |
| `DEEPSEEK_API_KEY` | （从 `.env` 读取） | DeepSeek 专用 key |
| `KIMI_API_KEY` | （从 `.env` 读取） | Kimi/Moonshot 专用 key |
| `ZHIPU_API_KEY` | （从 `.env` 读取） | 智谱 GLM 专用 key |

### 多模型 Provider 配置

支持四家 provider（均兼容 OpenAI chat completions API）：

| Provider | base_url | 默认模型 | Key 环境变量 |
|----------|----------|----------|-------------|
| `deepseek` | `https://api.deepseek.com` | `deepseek-chat` | `DEEPSEEK_API_KEY` |
| `kimi` | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` | `KIMI_API_KEY` |
| `zhipu` | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` | `ZHIPU_API_KEY` |
| `mock` | — | — | — |

**配置优先级**：`API_KEY`/`BASE_URL`/`MODEL_NAME` 环境变量覆盖 provider 默认值 > provider 专用 key env > 无 key 走 mock。

**配置方式一**：`.env` 文件（`/home/z/my-project/.env`）

```
MODEL_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
```

或切换到 Kimi：

```
MODEL_PROVIDER=kimi
KIMI_API_KEY=sk-your-kimi-key-here
```

**配置方式二**：环境变量直接设置

```bash
# DeepSeek
export MODEL_PROVIDER=deepseek
export DEEPSEEK_API_KEY=sk-your-key
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Kimi
export MODEL_PROVIDER=kimi
export KIMI_API_KEY=sk-your-key
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# 智谱 GLM
export MODEL_PROVIDER=zhipu
export ZHIPU_API_KEY=sk-your-key
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Mock（无 key 自测）
export MODEL_PROVIDER=mock
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**配置方式三**：完全自定义

```bash
export MODEL_PROVIDER=deepseek
export API_KEY=sk-your-key          # 覆盖 provider 专用 key
export BASE_URL=https://custom.api   # 覆盖 base URL
export MODEL_NAME=deepseek-coder     # 覆盖模型名
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

> 无 key 或 `MODEL_PROVIDER=mock` 时，`/ai/chat` 返回固定 mock 响应 `onflag { move(10); }` 并日志告警，不影响其他端点正常使用。

### 系统提示词动态注入

`/ai/chat` 的系统提示词不再写死，而是启动时从 `/schema` 端点数据动态构建：
- 注入全部 67 个关键字
- 按分类列出全部 138 个积木（syntax + example + args）
- 注入 5 个完整程序示例 + 语法规则摘要
- 提示词约 13KB（~3300 tokens），确保模型生成 goboscript 合规代码

## API 端点

### `GET /health`

健康检查。

```bash
curl http://localhost:8000/health
# → {"status":"ok","goboscript_version":"1.0.0"}
```

---

### `POST /compile`

编译 goboscript 源码，返回 `.sb3` 文件字节流。

**请求体**

```json
{ "source": "onflag { move(10); }" }
```

**成功响应** (200)

- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="project.sb3"`
- `X-Block-Count: 2`（编译产出的积木数）
- Body：`.sb3` 二进制内容

**失败响应** (400)

```json
{
  "detail": {
    "success": false,
    "error": "unexpected character '@'",
    "line": 1,
    "column": 15,
    "kind": "LexError"
  }
}
```

**curl 示例**

```bash
# 编译并保存为 .sb3
curl -X POST http://localhost:8000/compile \
  -H "Content-Type: application/json" \
  -d '{"source": "onflag { move(10); }"}' \
  -o project.sb3

# 查看积木数
curl -X POST http://localhost:8000/compile \
  -H "Content-Type: application/json" \
  -d '{"source": "onflag { move(10); turn(15); }"}' \
  -o /dev/null -D - | grep -i x-block-count
# → x-block-count: 3
```

---

### `POST /validate`

校验 goboscript 源码，不产出 `.sb3`，返回结构化的错误信息（含行列号）。

**请求体**

```json
{ "source": "onflag { move(10; }" }
```

**成功响应** (200)

```json
{
  "success": false,
  "errors": [
    {
      "line": 1,
      "column": 17,
      "message": "Expected ')'",
      "kind": "ParseError"
    },
    {
      "line": 1,
      "column": 19,
      "message": "Unexpected token in declaration: RBrace",
      "kind": "ParseError"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | bool | 无错误时为 true |
| `errors[].line` | int | 错误所在行（1-based） |
| `errors[].column` | int | 错误所在列（1-based） |
| `errors[].message` | string | 错误描述 |
| `errors[].kind` | string | 错误类型：`LexError` / `ParseError` |

**curl 示例**

```bash
# 合法源码
curl -X POST http://localhost:8000/validate \
  -H "Content-Type: application/json" \
  -d '{"source": "onflag { move(10); }"}'
# → {"success":true,"errors":[]}

# 非法源码
curl -X POST http://localhost:8000/validate \
  -H "Content-Type: application/json" \
  -d '{"source": "onflag { move(@10); }"}'
# → {"success":false,"errors":[{"line":1,"column":15,...}]}
```

---

### `POST /decompile`

将 `.sb3` 文件反编译为 goboscript 源码。支持 raw body 和 multipart 两种上传方式。

**请求方式一：raw body**

```bash
curl -X POST http://localhost:8000/decompile \
  -H "Content-Type: application/octet-stream" \
  --data-binary @project.sb3
```

**请求方式二：multipart 文件上传**

```bash
curl -X POST http://localhost:8000/decompile \
  -F "file=@project.sb3"
```

**成功响应** (200)

```json
{
  "source": "onflag {\n    move 10;\n}\n",
  "targets": [
    {
      "name": "Stage",
      "isStage": true,
      "source": "onflag {\n    move 10;\n}\n",
      "name_map": { "variables": {}, "lists": {}, "procedures": {} }
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `source` | string | 反编译出的 goboscript 源码 |
| `targets` | list | 各 target 的反编译详情（name, isStage, source, name_map） |

**失败响应** (422)

```json
{
  "detail": {
    "error": "SB3 parse error",
    "detail": "Invalid SB3 archive: File is not a zip file"
  }
}
```

---

### `POST /ai/chat`

通过多国产 LLM（DeepSeek / Kimi / 智谱 GLM）将自然语言对话转为 goboscript 代码。

支持两种配置方式：
1. **BYOK（Bring Your Own Key）**：前端请求体直接传 `base_url` + `api_key` + `model`，后端用 OpenAI SDK 按用户配置调真模型。key 不写进任何日志。
2. **环境变量**：服务端通过 `MODEL_PROVIDER` env 切换 provider，key 从 `.env` / 环境变量读取。

无 key 时（BYOK 字段和 env 都没给 key）返回固定 mock 响应，不影响管线运行。系统提示词从 `/schema` 动态构建，注入 138 个积木 + 67 个关键字。

**请求契约**

```json
{
  "messages": [
    {"role": "user", "content": "让角色点击绿旗后移动10步"}
  ],
  "project_context": "onflag { move(10); }",
  "base_url": "https://api.deepseek.com",
  "api_key": "sk-your-key-here",
  "model": "deepseek-chat"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `messages` | `[{role, content}]` | 是 | 对话历史 |
| `project_context` | string | 否 | 当前项目 goboscript 上下文（反编译后传入，让 AI 看到用户拖拽修改） |
| `base_url` | string | 否 | BYOK：模型 API 地址（OpenAI 兼容端点） |
| `api_key` | string | 否 | BYOK：用户自己的 API key。**有此字段即走 BYOK，优先级高于 env** |
| `model` | string | 否 | BYOK：模型名 |

**BYOK 支持的国产模型（均兼容 OpenAI chat completions API）**

| Provider | base_url | model 示例 | 获取 key |
|----------|----------|-----------|---------|
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` / `deepseek-coder` / `deepseek-reasoner` | https://platform.deepseek.com |
| Kimi (Moonshot) | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` / `moonshot-v1-32k` / `moonshot-v1-128k` | https://platform.moonshot.cn |
| 智谱清言 (BigModel) | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` / `glm-4` / `glm-4-air` | https://open.bigmodel.cn |

> 也支持任何其他 OpenAI 兼容端点（如 OpenAI 本身、Together AI、本地 vLLM 等），只要填对 `base_url` + `api_key` + `model` 即可。

**成功响应** (200)

```json
{
  "goboscript": "onflag { move(10); }",
  "explanation": "绿旗点击后移动10步"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `goboscript` | string | AI 生成的 goboscript 源码 |
| `explanation` | string | 简短中文解释；若生成代码校验失败，错误信息会附加在此字段 |

**Mock 回退**（未配置 API key 时）

```json
{
  "goboscript": "onflag { move(10); }",
  "explanation": "示例：绿旗点击后移动 10 步（mock 回退，未接真实模型）"
}
```

**配置优先级**：BYOK 请求体字段（`base_url` + `api_key` + `model`）> env 环境变量 > mock 回退。

**安全**：`api_key` 永远不会出现在任何日志中。日志仅记录 provider 名、host 和 model 名。

**实现细节**：
- 系统提示词从 `/schema` 数据动态构建（非写死），注入 138 blocks + 67 keywords
- 模型输出格式：goboscript 代码 + `EXPLANATION:` 分隔的简短解释，不带 markdown 围栏
- 生成后自动调 `/validate` 校验，若失败则将错误行号和消息回填到 `explanation`
- API 调用失败时返回 mock + 错误信息（含 provider 名）
- BYOK 模式下 `base_url` 缺省 `https://api.deepseek.com`，`model` 缺省 `deepseek-chat`

**curl 示例**

```bash
# 1. 无 BYOK → mock 回退
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "让角色点击绿旗后移动10步"}
    ]
  }'
# → {"goboscript":"onflag { move(10); }","explanation":"示例：绿旗点击后移动 10 步（mock 回退...）"}

# 2. BYOK DeepSeek
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "让角色点击绿旗后移动10步"}
    ],
    "base_url": "https://api.deepseek.com",
    "api_key": "sk-your-deepseek-key",
    "model": "deepseek-chat"
  }'

# 3. BYOK Kimi (Moonshot)
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "让角色点击绿旗后移动10步"}
    ],
    "base_url": "https://api.moonshot.cn/v1",
    "api_key": "sk-your-kimi-key",
    "model": "moonshot-v1-8k"
  }'

# 4. BYOK 智谱清言 (BigModel)
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "让角色点击绿旗后移动10步"}
    ],
    "base_url": "https://open.bigmodel.cn/api/paas/v4",
    "api_key": "your-zhipu-key",
    "model": "glm-4-flash"
  }'

# 5. BYOK 带项目上下文（反编译后传入）
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "在现有代码上加一个说你好"}
    ],
    "project_context": "onflag { move(10); }",
    "base_url": "https://api.deepseek.com",
    "api_key": "sk-your-key",
    "model": "deepseek-chat"
  }'

# 6. BYOK 只传 api_key（默认走 DeepSeek）
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "让角色点击绿旗后移动10步"}
    ],
    "api_key": "sk-your-key"
  }'
```

---

### `GET /schema`

返回 goboscript 完整语法清单，供积木浏览器和 AI 系统提示词使用。

```bash
curl http://localhost:8000/schema | python3 -m json.tool
```

**响应结构**

```json
{
  "keywords": ["abs", "acos", "add", "and", ...],
  "blocks": [
    {
      "name": "move",
      "category": "motion",
      "syntax": "move(steps)",
      "example": "move(10);",
      "args": ["STEPS"]
    },
    ...
  ],
  "examples": [
    "onflag { move(10); }",
    "onflag { repeat(4) { move(50); turn_right(90); } }",
    ...
  ],
  "grammar_notes": "Statements end with `;` or newline. ..."
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `keywords` | string[] | 从 lexer.py 提取的全部保留关键字（67 条） |
| `blocks` | object[] | 语句块 + 报告块映射（138 条），每条含 name/category/syntax/example/args |
| `examples` | string[] | 5 个完整程序示例 |
| `grammar_notes` | string | 语法规则摘要（语句结尾、事件、控制流、运算符、重载） |

**分类分布**：looks(38)、sensing(29)、motion(26)、pen(15)、sound(11)、control(7)、music(6)、operator(3)、event(2)、data(1)

**实现**：启动时动态 import `goboscript.blocks` + `goboscript.lexer.KEYWORDS`，扫描 `_BLOCK_FROM_SHAPE`/`_BLOCK_OVERLOADS`/`_REPR_FROM_SHAPE` + `_BLOCK_SPEC`/`_REPR_SPEC` 构建一次后缓存。

---

## 自测验证

### 编译自测

```bash
# 自测：onflag { move(10); } 应编译成 2 个积木的 .sb3
curl -X POST http://localhost:8000/compile \
  -H "Content-Type: application/json" \
  -d '{"source": "onflag { move(10); }"}' \
  -o /tmp/test.sb3

python3 -c "
import zipfile, json
with zipfile.ZipFile('/tmp/test.sb3') as z:
    proj = json.loads(z.read('project.json'))
    blocks = sum(
        1 for t in proj.get('targets', [])
        for b in t.get('blocks', {}).values()
        if isinstance(b, dict)
    )
    print(f'Blocks: {blocks}')
    assert blocks == 2, 'Expected 2 blocks'
    print('Compile self-test PASSED')
"
```

### 反编译 round-trip 自测

```bash
# 1. 编译
curl -X POST http://localhost:8000/compile \
  -H "Content-Type: application/json" \
  -d '{"source": "onflag { move(10); }"}' \
  -o /tmp/roundtrip.sb3

# 2. 反编译
curl -X POST http://localhost:8000/decompile \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/tmp/roundtrip.sb3
# → {"source":"onflag {\n    move 10;\n}\n","targets":[...]}

# 3. 重编译反编译后的源码，验证 block count 一致
curl -X POST http://localhost:8000/compile \
  -H "Content-Type: application/json" \
  -d '{"source": "onflag {\n    move 10;\n}"}' \
  -o /dev/null -D - 2>/dev/null | grep -i x-block-count
# → x-block-count: 2  ✓
```

### AI chat 自测（mock provider 全链路）

```bash
# 设置 mock provider 启动
export MODEL_PROVIDER=mock
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# 1. mock 回退请求 "让小猫移动10步"
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"让小猫移动10步"}]}'
# → {"goboscript":"onflag { move(10); }","explanation":"示例：绿旗点击后移动 10 步（mock 回退...）"}

# 2. 全链路：AI → compile → decompile → validate
AI_SRC=$(curl -s -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"move"}]}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['goboscript'])")

# compile AI output
curl -s -X POST http://localhost:8000/compile \
  -H "Content-Type: application/json" \
  -d "{\"source\": \"$AI_SRC\"}" \
  -o /tmp/ai.sb3 -D - -o /dev/null 2>/dev/null | grep -i x-block-count
# → x-block-count: 2  ✓

# decompile back
curl -s -X POST http://localhost:8000/decompile \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/tmp/ai.sb3
# → {"source":"onflag {\n    move 10;\n}\n","targets":[...]}  ✓

# validate
curl -s -X POST http://localhost:8000/validate \
  -H "Content-Type: application/json" \
  -d "{\"source\": \"$AI_SRC\"}"
# → {"success":true,"errors":[]}  ✓
```

**自测结果**（`python3 self_test.py`，mock provider，7/7 通过）：

```
✓ health                  → {"status":"ok","goboscript_version":"1.0.0"}
✓ ai_chat_mock            → goboscript='onflag { move(10); }'
✓ compile                 → 2 blocks, 409 bytes
✓ decompile               → source='onflag {\n    move 10;\n}\n'
✓ schema                  → 67 keywords, 138 blocks
✓ ai_chat_context         → (with project_context) mock response ✓
✓ validate_valid           → success=True
7/7 tests passed — ALL TESTS PASSED ✓
```

**Provider 配置自测**：

```
✓ Default (deepseek, no key)  → mock fallback, 日志告警 "no API key"
✓ MODEL_PROVIDER=mock          → mock response, 无 API 调用
✓ MODEL_PROVIDER=kimi          → base_url=api.moonshot.cn/v1, model=moonshot-v1-8k
✓ MODEL_PROVIDER=zhipu         → base_url=open.bigmodel.cn, model=glm-4-flash
✓ API_KEY/BASE_URL/MODEL_NAME 覆盖 → 正确覆盖 provider 默认值
✓ Fake key (deepseek)          → 401 错误捕获，返回 mock + 错误信息
✓ 系统提示词动态构建            → 13.3KB (~3300 tokens)，含 67 keywords + 138 blocks
```

### Schema 自测

```bash
# 获取完整语法清单
curl -s http://localhost:8000/schema | python3 -c "
import sys, json
s = json.load(sys.stdin)
print(f'keywords: {len(s[\"keywords\"])}')
print(f'blocks:   {len(s[\"blocks\"])}')
print(f'examples: {len(s[\"examples\"])}')
assert len(s['blocks']) > 50, 'Expected dozens of blocks'
print('Schema self-test PASSED')
"
# → keywords: 67
# → blocks:   138
# → examples: 5
# → Schema self-test PASSED
```

## 实现要点

1. **goboscript-py 引用方式**：通过 `sys.path.insert` 引入 goboscript-py 包路径，不修改其源码
2. **临时目录管理**：每次编译创建独立临时目录（`stage.gs` + `blank.svg` + `goboscript.toml`），编译后自动清理
3. **错误行列号提取**：
   - `LexError.offset` → 字符偏移 → 行/列
   - `ParseError.pos`（来自 Token.start）→ 字符偏移 → 行/列
4. **validate 直接调用 parser 内部方法**：绕过 `parse()` 的错误恢复机制，保留原始错误信息
5. **decompile 双通道上传**：支持 `application/octet-stream`（raw body）和 `multipart/form-data`（文件上传），通过 Content-Type 自动路由
6. **decompile 错误处理**：捕获 `ValueError`（SB3 格式错误）和其他异常，统一返回 422 + `{error, detail}`
7. **AI chat 多 provider 支持**：通过 `MODEL_PROVIDER` env 切换 deepseek/kimi/zhipu/mock，均用 OpenAI SDK 兼容接口；`API_KEY`/`BASE_URL`/`MODEL_NAME` 可覆盖 provider 默认值
8. **AI chat 系统提示词动态注入**：从 `/schema` 数据动态构建（非写死），注入 67 keywords + 138 blocks（按分类排列，含 syntax/example/args）+ 5 示例 + 语法摘要，约 13KB / 3300 tokens
9. **AI chat 响应解析**：`_parse_ai_response()` 处理 markdown 围栏剥离 + `EXPLANATION:` 分割，兼容模型格式偏移
10. **AI chat validate 回填**：生成后自动调 `_validate_source()` 校验，错误行号和消息追加到 `explanation` 末尾
11. **.env 自动加载**：启动时读取 `/home/z/my-project/.env`，通过 `os.environ.setdefault()` 注入（不覆盖已设环境变量）
12. **schema 静态构建缓存**：启动时动态 import `goboscript.blocks` + `goboscript.lexer.KEYWORDS`，扫描 `_BLOCK_FROM_SHAPE`/`_BLOCK_OVERLOADS`/`_REPR_FROM_SHAPE` + `_BLOCK_SPEC`/`_REPR_SPEC`，构建一次后缓存到 `_SCHEMA_CACHE`
13. **schema 分类推断**：从 Scratch opcode 前缀（`motion_`/`looks_`/`sound_`/`control_` 等）映射到 goboscript 分类名
14. **schema 示例生成**：从块名 + 参数列表自动生成 syntax 字符串和 example 代码，参数值用 `_ARG_SAMPLE` 表填充常见类型
