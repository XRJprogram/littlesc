---
name: sb3-craftsman
description: Scratch 3.0 (.sb3) 高级开发技巧、架构模式、黑科技与最佳编码规范手册。当用户需要设计、编写、重构、调优或逆向高难度 Scratch/goboscript 项目时（涉及游戏循环、克隆体管理、画笔渲染、物理碰撞箱、突破舞台与尺寸限制、数据存档码等），使用此技能。
---

# Scratch 3.0 专家级开发指南 (sb3-craftsman)

本手册基于 `project/resource/` 中 10 个顶尖精品大型 Scratch 3.0 商业级/神作级项目（《Rabbit Hole》《ALLTALE》《几何之战》《灵物语》《AnyChem》《new Planet》《FCL》《Pond》《MCF大战转载者》《魔能的源点》）的工程实践反编译解析，结合 InstanceScratch 编译内核深度提炼而成。

---

## 🧭 架构选型矩阵 (Architecture Decision Matrix)

| 项目类型 | 推荐架构 | 核心技巧 | 参考标杆 |
|---|---|---|---|
| **大型动作/平台跳跃** | 中央控制器 + 独立 Hitbox + 状态机 | 单帧内切碰撞箱、Lerp 摄像机跟随、重力贴合 | 《Rabbit Hole》《灵物语》 |
| **弹幕射击 / 塔防** | 单精灵多克隆体 + 对象池 | `is_clone` 广播拦截、私有变量 ID、数组并行映射 | 《几何之战》《MCF大战转载者》 |
| **数学/物理模拟/沙盒** | 全画笔渲染 (Pen Engine) + 世界坐标系 | Warp 零闪烁清屏、视锥体剔除、拓扑连线 | 《AnyChem》《new Planet》 |
| **长流程 RPG / 解谜** | 数据驱动 + 地图流式加载 + 存档码校验 | 字符串切分器、ASCII 加权哈希、一维数组模拟 2D | 《魔能的源点》《ALLTALE》 |

---

## ⚡ 核心设计模式速览 (Core Patterns)

### 1. 黄金单线程主循环 (Tick Loop)
**杜绝多角色分散并发 `forever`**，由舞台集中分发：
```goboscript
// target stage;
onflag {
    broadcast "SYS_Init" and wait;
    forever {
        broadcast "Tick_Input" and wait;
        broadcast "Tick_Physics" and wait;
        broadcast "Tick_Render" and wait;
    }
}
```
👉 详细指南：[架构模式与主循环](./references/architecture_and_game_loop.md)

### 2. 克隆体 `is_clone` 与 `clone_id` 身份隔离
**杜绝广播导致克隆体指数级爆炸**：
```goboscript
var is_clone = 0;
var clone_id = 0;

onflag { is_clone = 0; hide; }

func def_spawn(x, y) {
    if (is_clone == 0) {
        clone_id += 1;
        goto(x, y);
        clone;
    }
}

onclone {
    is_clone = 1;
    show;
}

on "Tick_Physics" {
    if (is_clone == 1) { /* 仅克隆体执行移动 */ }
}
```
👉 详细指南：[克隆体管理与对象池](./references/clones_and_pooling.md)

### 3. 突破大小限制黑科技 (Size Hack)
利用 Scratch **只在 `set size` 时校验尺寸，切换造型不重新校验** 的底层特性：
```goboscript
// 准备 1x1 像素造型 "dot" 和目标超大造型 "giant_map"
func def_force_size(target_size, real_costume) {
    switch_costume("dot");
    size = target_size; // 可放大至 5000% 甚至更大
    switch_costume(real_costume);
}
```
👉 详细指南：[核心黑科技与冷知识](./references/hacks_and_tricks.md)

### 4. 碰撞箱与视觉动画解耦 (Hitbox Separation)
物理移动使用规则矩形碰撞箱，渲染时恢复视觉动画帧，解决卡墙与地面抖动：
```goboscript
func def_step() {
    switch_costume("hitbox");
    x += vx;
    if (touching("Ground")) { while (touching("Ground")) { x += (vx > 0 ? -1 : 1); } vx = 0; }
    y += vy;
    if (touching("Ground")) { while (touching("Ground")) { y += (vy > 0 ? -1 : 1); } vy = 0; }
    switch_costume(current_animation);
}
```

### 5. 画笔零闪烁渲染与视锥体剔除 (Pen & Frustum Culling)
整帧所有清屏与重绘必须封装在一个 **Warp（运行时不刷新屏幕）** 函数内：
```goboscript
func def_render() {
    erase_all; // 帧首清屏
    // 世界坐标 -> 屏幕坐标变换
    local sx = (world_x - cam_x) * cam_zoom;
    local sy = (world_y - cam_y) * cam_zoom;
    // 视锥体剔除
    if (sx >= -260 and sx <= 260 and sy >= -200 and sy <= 200) {
        goto(sx, sy);
        stamp;
    }
}
```
👉 详细指南：[画笔渲染引擎与数学系统](./references/pen_and_math_engine.md)

### 6. 防篡改存档码系统 (Save Code & Checksum)
数据序列化与加权哈希，拦截玩家恶意改值：
```goboscript
func def_make_save(lv, coin) {
    local data = lv & "-" & coin;
    local hash = def_hash(data);
    return data & "#" & hash;
}
```
👉 详细指南：[数据结构与存档码系统](./references/data_and_save_codes.md)

---

## ⚠️ goboscript 严格编码军规

1. **事件必须在顶层**：`onflag`, `onclick`, `on "msg"`, `onkey "space"`, `onclone` 严禁嵌套在循环或函数内！
2. **函数命名保留字保护**：自定义函数必须以 `def_` 开头（如 `func def_calc()`)，防止与 `add/to/delete/insert/at` 等保留字冲突。
3. **函数内局部变量必用 `local`**：顶层用 `var` 或 `list`，函数内变量用 `local`。
4. **Scratch 列表 1-based**：第一项为 `L[1]`，最后一项为 `L[length(L)]`。
5. **安全清空列表**：清空列表必须用 `clear list L;` 或 `delete L;`，**绝对不要写 `L = [];`**（会生成同名变量覆盖列表）。
6. **弹出末尾**：`delete last of L;`（切勿写 `delete L;`，那是清空整张表）。
7. **字符串连接**：使用 `&`，加号 `+` 在 Scratch 里是纯数字加法（`"a" & "b"` 为 `"ab"`，`"a" + "b"` 结果为 0）。
8. **函数返回值**：`return` 只能返回数字或字符串标量，**切勿返回列表**（会被展平为文本）。多返回值或列表输出应直接写入全局列表。
9. **避免深度自递归**：Scratch 自定义积木局部变量底层共享，自递归会导致变量踩踏，复杂解析器使用迭代 + 显式列表栈。
10. **代码预算控制**：单次生成的代码尽量保持在 160 行以内，复杂关卡数据通过压缩列表存储，由通用循环处理。

👉 详细避坑全书：[goboscript 语法守则与避坑全书](./references/goboscript_cookbook.md)

---

## 📂 生产级可运行范例 (Examples)

- [platformer_hitbox.gs](./examples/platformer_hitbox.gs) - 碰撞箱分离的完整平台跳跃引擎
- [pen_camera_engine.gs](./examples/pen_camera_engine.gs) - 摄像机世界坐标投影与画笔渲染引擎
- [save_code_checksum.gs](./examples/save_code_checksum.gs) - 防篡改存档码生成与哈希校验系统

---

## 🛠️ CLI 工具链速查

```bash
# 探测 .sb3 元数据
node scripts/sb3.mjs inspect project/my_game.sb3

# 反编译为工程源码
node scripts/sb3.mjs decompile project/my_game.sb3 project/my_game_src

# 语法与合法性校验
node scripts/sb3.mjs validate project/my_game_src/project.gs

# 重新打包编译
node scripts/sb3.mjs compile project/my_game_src project/my_game_dist.sb3
```
