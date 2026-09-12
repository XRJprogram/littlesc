# Scratch 3.0 核心黑科技与冷知识 (Hacks & Advanced Tricks)

在顶级 Scratch 作品（如《灵物语》《Rabbit Hole》《几何之战》《AnyChem》）中，作者为了突破 Scratch 引擎默认的物理与图形限制，使用了许多巧妙的底层“黑科技”。

---

## 1. 突破大小限制 (Size Hack)

### 原理背景
Scratch 引擎在执行 `set size to (%)` 积木时，会根据当前造型的边界框（Bounding Box）进行安全尺寸限制（Clamping），以防止造型过小看不见或过大导致渲染崩溃（通常最大被限制在 150%~500% 之间）。
但**关键机制**是：Scratch 只在执行 `set size` 时校验当前造型的尺寸，**切换造型（Switch Costume）时并不会重新校验尺寸**！

### 黑科技实现步骤
1. 准备两个造型：
   - 实际需要的角色造型（例如大地图、全屏背景图、巨型 BOSS `boss_normal`）；
   - 一个名为 `dot` 的辅助造型：只有 **1x1 像素**的极小透明或单色点。
2. 切换到 `dot` 造型；
3. 执行 `set size to 5000%`（因为 1x1 像素极小，允许放大的倍数上限极高）；
4. 切回 `boss_normal` 造型！此时角色将保持 5000% 的巨型尺寸，突破舞台正常缩放限制！

#### goboscript 代码
```goboscript
// Warp 自定义函数（不刷新屏幕，玩家完全看不到切换造型的闪烁）
func def_force_set_size(target_size, real_costume) {
    switch_costume("dot");
    size = target_size;
    switch_costume(real_costume);
}
```

---

## 2. 突破舞台边缘限制 (Off-screen Fencing Hack)

### 原理背景
Scratch 有一个名为 `Fencing`（围栏）的机制：当角色向舞台边缘移动时，引擎强制让角色的包围盒至少保留约 15 像素留在 480×360 的舞台可见区域内，无法将角色完全移到舞台之外。这对于大地图滚动、屏幕外实体刷新造成严重障碍。

### 黑科技实现步骤
利用巨大造型（或配合 Size Hack）：
1. 切换造型为一个巨大的空白画布造型 `giant_blank`（或切到 `dot` 放大至 5000%）；
2. 此时角色的几何中心可以在舞台之外极远处（如 `x = 1000, y = 800`），因为其巨大包围盒的一角仍在舞台内，通过了引擎的 Fencing 校验；
3. 移动到位后，立即切换回普通小造型；
4. 此时角色成功驻留在完全脱离屏幕的坐标上！

---

## 3. 极速执行：无刷新积木 (Run Without Screen Refresh / Warp)

### 原理与差异
- **常规积木/循环**：Scratch 在每一次 `repeat` 或 `while` 循环迭代末尾，都会让出 CPU 时间片，等待下一帧刷新（即锁定在 30 FPS，每次循环耗时约 33 毫秒）。
- **Warp 积木**：将 `mutation.warp = true`。Scratch 运行时会暂停屏幕刷新，在单帧之内（通常几微秒到几毫秒）跑完循环内的所有计算，直到函数执行完毕才一次性渲染画面！

### 核心应用场景
1. **纯数学与寻路算法**：A* 寻路、物理光线投射（Raycasting）、多项式插值。
2. **画笔渲染 (Pen Engine)**：一帧内绘制整个星球、数万个粒子或上百个文字（如《new Planet》21/23 个积木为 Warp）。
3. **连续平滑移动碰撞检测**：每帧细分步进 10 次检测墙体，彻底杜绝高速穿墙（Tunelling）。

### 避坑警报
- **严禁在 Warp 中使用等待积木**：在 Warp 函数内放置 `wait(1)`、`ask and wait` 会打破 Warp 机制甚至引起死锁。
- **0.5秒防卡死熔断机制**：如果 Warp 函数内发生了死循环（如 `while (true)`），Scratch 引擎在约 0.5 秒后会强行中断并刷新一帧，同时帧率骤降至个位数。

---

## 4. 碰撞箱分离技术 (Hitbox Separation)

### 原理背景
平台跳跃、动作格斗游戏（如《Rabbit Hole》中拥有独立的 `HitBoxes//HB_MAIN`, `HitBoxes//HB_CEILING` 等角色）中，角色的待机、奔跑、攻击动画尺寸各不相同。如果直接用动画造型做碰撞检测，角色的脚会陷入地面，或在转身时卡进墙壁。

### 黄金方案：单角色切造型 vs 独立 Hitbox 角色
**方案 A：单角色在单帧内切造型检测（推荐，零跨角色通讯开销）**
```goboscript
func def_physics_step() {
    // 1. 切换为规则矩形碰撞箱
    switch_costume("hitbox_box");
    
    // 2. 物理与位移
    y += vy;
    if (touching("Ground")) {
        // 落地贴合处理
        while (touching("Ground")) {
            y += (vy > 0 ? -1 : 1);
        }
        vy = 0;
    }
    
    // 3. 计算完毕后切回玩家视觉动画造型
    switch_costume(current_anim_frame);
}
```

---

## 5. 平滑缓动与插值数学 (Easing & Lerp)

高级 UI、摄像机跟随、血条动画绝不使用机械生硬的匀速移动，而是使用非线性插值算法：

### 1. 经典 Lerp (线性插值趋近)
每一帧向目标逼近固定百分比（如 20%）：
```goboscript
// target_x 为目标值，x 为当前值
x += (target_x - x) * 0.2;
y += (target_y - y) * 0.2;
size += (target_size - size) * 0.15;
```

### 2. 弹簧阻尼模型 (Spring Physics)
模拟物理弹性（如果冻按钮、受击回弹）：
```goboscript
var vx = 0;
var stiffness = 0.3; // 劲度系数
var damping = 0.75;   // 阻尼系数

func def_spring_tick(target_x) {
    local force = (target_x - x) * stiffness;
    vx = (vx + force) * damping;
    x += vx;
}
```

---

## 6. 帧同步礼让：`wait(0)` 机制

在 Scratch 中，执行 `wait(0)` 秒**不是无操作**，而是显式将控制权移交给 Scratch 运行时调度器，等待当前帧所有其他角色的任务处理完毕并完成一次画面刷新后再继续。这被用于多角色时序同步或防止超长任务冻结浏览器。

---

## 7. Scratch 3.0 自定义积木 (Procedures) AST 底层铁律

当直接操作或注入 Scratch 3.0 AST（`project.json`）中的自定义积木（Custom Blocks）时，必须严格遵守以下底层规范，否则在 Scratch / TurboWarp 编辑器中会导致形参胶囊完全不显示、积木断裂或空白：

1. **原型中的参数影子块 (Prototype Shadow Reporters)**：
   - 积木定义帽（`procedures_definition`）的输入 `custom_block` 指向 `procedures_prototype`。
   - `procedures_prototype.inputs[argId]` 为 `[1, shadowId]`。
   - 对应的影子块 `argument_reporter_string_number`：
     - `parent` **必须**明确指向 `procedures_prototype` 的块 ID！若为 `null`，Blockly 会将其判定为孤立块而直接丢弃，导致定义积木头部完全不渲染参数椭圆。
     - `shadow` **必须**为 `true`。
2. **积木体与调用方中的形参 Reporter (Body Reporters)**：
   - 在过程体内部或调用时作为实参传递的形参引用，**不是**影子块！
   - `shadow` **必须**为 `false`（严禁设为 `true`）。
   - `parent` **必须**指向容纳它的表达式积木（如 `operator_equals`）或语句积木。
3. **调用块 (Procedures Call) 传参规范**：
   - 当调用块传入普通变量或 Reporter 积木时，输入格式为 `[3, blockId, [10, ""]]`，且 `blocks[blockId].parent` 必须指向调用块 ID。
   - 只有传入字面常量时，格式才为 `[1, [10, "val"]]`。

