# Scratch 3.0 跨游戏通用克隆体架构与高阶工程指南
*(Scratch 3.0 Advanced Clone Architecture & Composite Component Engineering Manual)*

---

## 📖 前言与设计宗旨

在 Scratch 3.0 的复杂游戏开发中，**克隆体（Clones）** 是实现丰富游戏机制、海量实体交互、多部件动画与复合 UI 的核心支柱。
然而，原生 Scratch 并没有现代游戏引擎（如 Unity、Godot）的实体组件系统（ECS）或层级场景树（Scene Graph），且存在全局 **300 个克隆体硬上限**、私有变量闭包复制机制、广播克隆扩散风暴等诸多底层限制。

当开发者尝试制作动作 RPG、弹幕射击、多段机械 BOSS、复杂塔防或复合卡牌/战棋 UI 时，常常面临以下核心痛点：
1. **一个实体拥有多个需要独立运动或旋转的部件**（例如坦克底座与炮塔、多段身体的怪物、卡牌本体与悬浮徽章/拖拽代理）。
2. **克隆体之间无法直接读取对方的私有变量**（信息孤岛问题）。
3. **全局广播导致所有克隆体成倍自我分裂**（广播克隆爆炸灾难）。
4. **部件跟随产生 1 帧画面延迟抖动**（执行时序错位）。
5. **父实体销毁时子部件残留在舞台**（内存泄漏与幽灵孤儿克隆体）。

本指南旨在建立一套**跨游戏类型通用、高内聚低耦合、性能可预测**的 Scratch 克隆体工程架构规范，重点攻克**克隆体组合组件（Composite Clone Components）**与大规模实体协同管理难题。

---

## 一、Scratch 克隆体底层内核与边界法则

在编写任何克隆体逻辑之前，必须深刻理解 Scratch 解释器（Scratch VM）对克隆体的底层处理规则：

### 1. 300 个全局硬上限
* Scratch 运行时中，**所有角色的克隆体数量总和上限为 300 个**。
* 当克隆体数量达到 300 时，后续执行的 `create clone of [myself]` 或 `create clone of [Sprite]` 会被底层**静默丢弃**，不报错、不抛异常，导致游戏逻辑中的子弹、敌人或 UI 悄无声息地丢失。
* **工程铁律**：永远监控克隆体生成总数，非持久性实体（子弹、击中火花、飘字）必须严格实现生命周期回收机制或使用对象池。

### 2. 局部变量的“瞬时深拷贝”
* 设为“仅适用于当前角色”（This sprite only）的变量，在创建克隆体时会被**完整拷贝一份独立的内存副本**给该克隆体。
* 克隆体产生后，本体与各个克隆体对该变量的读写相互完全隔离。
* **注意**：Scratch 的列表（Lists）如果设为“仅适用于当前角色”，在克隆时同样会被深拷贝一份，但克隆体过多会导致巨大的内存开销和卡顿，因此**跨实体共享状态应统一使用全局列表（Data Bus）**。

### 3. 广播扩散炸弹（Broadcast Bomb）
* 当发出全局广播（Broadcast）时，不仅该角色的**本体**会响应，该角色的**所有存活克隆体**也会同时触发该广播帽子块！
* **致命陷阱**：如果在响应广播的脚本中写了 `create clone of myself`，当场上有 10 个克隆体时，一次广播将增加 11 个新克隆体；连续广播几次将瞬间击穿 300 个上限并造成死机卡死。
* **防御门控**：所有广播监听块内部，第一行必须通过门控变量判断执行者身份（如 `if (is_clone == 0)` 或 `if (is_clone == 1)`）。

---

## 二、核心基础设施：三元组与工厂模型

为了在大型项目中安全使用克隆体，任何使用克隆体的角色都应配备**标准三元组**私有变量与统一生成工厂：

### 1. 身份三元组定义
每个角色建立如下私有变量（This sprite only）：
* `is_clone`：布尔标记。`0` 表示本体（Sprite Master/Factory），`1` 表示克隆体（Clone Instance）。
* `clone_id`：实体唯一索引号。用于与全局数据总线列表进行映射关联。
* `clone_type`：多态类型标记。标明当前克隆体承担的角色类型或组件职能。

### 2. 工厂模式（Spawner Pattern）标准模板

```scratch
// --- [角色启动初始化] ---
when green flag clicked
set [is_clone v] to (0)
set [clone_id v] to (0)
set [clone_type v] to (0)
hide // 本体永远保持隐形，退居幕后作为纯粹的“生成工厂”

// --- [统一生成自定义积木 (运行后不刷新屏幕)] ---
define Spawn_Entity (type, spawn_x, spawn_y, param1, param2)
if <(is_clone) = (0)> then // 严格限制：只有本体有权制造克隆体
    change [GLOBAL_EntityCounter v] by (1)
    set [clone_id v] to (GLOBAL_EntityCounter)
    set [clone_type v] to (type)
    // 写入私有参数或写入全局总线
    go to x: (spawn_x) y: (spawn_y)
    create clone of [myself v]
end

// --- [克隆体诞生入口] ---
when I start as a clone
set [is_clone v] to (1) // 声明克隆体身份
show
if <(clone_type) = (1)> then
    // 执行实体类型 1 行为
else
    if <(clone_type) = (2)> then
        // 执行实体类型 2 行为
    end
end
```

---

## 三、核心专题：克隆体组合组件 (Composite Clone Components)

在现代游戏架构中，复杂实体由若干功能单一的组件组合而成：
例如一个坦克由【底座】+【炮塔】+【血条】构成；
一张卡牌由【卡面底板】+【立绘插画】+【攻击/血量徽章】+【拖拽代理 Hitbox】构成。
在 Scratch 中，单个克隆体无法实现不同部件的独立旋转，也无法让同一个克隆体分处不同渲染图层深度。
**克隆体组合组件技术**就是利用 Scratch 克隆体模拟层级树与组件装配的高阶工程范式。

```
                    ┌─────────────────────────┐
                    │ 主控克隆体 (Master Host) │
                    │ Entity_ID: 101          │
                    │ 负责：物理判定、主逻辑、移动│
                    └────────────┬────────────┘
                                 │ 写入数据总线 (X, Y, Dir, State)
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  组件 1: 视觉 │         │  组件 2: 部件 │         │  组件 3: UI  │
│  (Visual)    │         │  (Turret/Arm)│         │  (HealthBar) │
│ 负责独立图层/动画        │ 负责独立角度瞄准旋转      │ 负责数值悬浮与跟随   │
└──────────────┘         └──────────────┘         └──────────────┘
```

### 1. 全局数据总线 (List Data Bus) 架构

要让附属组件（子克隆体）严丝合缝地跟随主控实体（父克隆体），必须打破私有变量的信息孤岛。
建立一组全局列表作为**实体状态寄存器**：

* `BUS_Entity_ID[]`：存活实体的唯一 ID 列表
* `BUS_X[]`：实体的世界 X 坐标
* `BUS_Y[]`：实体的世界 Y 坐标
* `BUS_Direction[]`：主实体朝向
* `BUS_HP[]`：生命值
* `BUS_MaxHP[]`：最大生命值
* `BUS_State[]`：当前状态（0:正常, 1:受击, 2:待销毁）

#### 数据总线写入（主实体每帧执行）：
```scratch
define Master_Update_Bus (my_slot_index)
replace item (my_slot_index) of [BUS_X v] with (x position)
replace item (my_slot_index) of [BUS_Y v] with (y position)
replace item (my_slot_index) of [BUS_Direction v] with (direction)
replace item (my_slot_index) of [BUS_HP v] with (current_hp)
replace item (my_slot_index) of [BUS_State v] with (current_state)
```

---

### 2. 架构模式 A：单精灵内部多态组件组合 (Single-Sprite Composite)

如果组件较小或希望将代码全部内聚在一个角色中，可以让同一个精灵通过不同的 `clone_type` 分别克隆出【本体】和【附属组件】。

#### 角色职能划分：
* `clone_type = 1`：主实体（Master Host，如敌机机身）
* `clone_type = 2`：武器炮塔（Sub-Component 1：独立瞄准玩家）
* `clone_type = 3`：悬浮血条（Sub-Component 2：跟随在头顶）

#### 绑定与生成时序：
```scratch
define Spawn_Composite_Enemy (spawn_x, spawn_y)
if <(is_clone) = (0)> then
    change [GLOBAL_EntityCounter v] by (1)
    set [temp_id v] to (GLOBAL_EntityCounter)
    
    // 1. 在总线列表中注册新槽位
    add (temp_id) to [BUS_Entity_ID v]
    add (spawn_x) to [BUS_X v]
    add (spawn_y) to [BUS_Y v]
    add (0) to [BUS_Direction v]
    add (100) to [BUS_HP v]
    add (0) to [BUS_State v] // 0: Active
    
    // 2. 生成主实体 (Master)
    set [clone_id v] to (temp_id)
    set [clone_type v] to (1) // 主控机身
    go to x: (spawn_x) y: (spawn_y)
    create clone of [myself v]
    
    // 3. 生成附属组件：独立旋转炮塔
    set [clone_id v] to (temp_id) // 携带相同的 parent clone_id
    set [clone_type v] to (2) // 炮塔组件
    create clone of [myself v]
    
    // 4. 生成附属组件：悬浮血条
    set [clone_id v] to (temp_id) // 携带相同的 parent clone_id
    set [clone_type v] to (3) // 血条组件
    create clone of [myself v]
end
```

#### 组件跟随与解耦逻辑：
```scratch
when I start as a clone
set [is_clone v] to (1)
show
if <(clone_type) = (1)> then
    // --- [主实体主循环] ---
    repeat until <(my_state) = (2)> // 2 代表销毁
        // 执行巡逻、AI 或物理移动
        change x by (speed_x)
        // 关键：将自身最新位置发布到总线
        set [slot v] to (item # of (clone_id) in [BUS_Entity_ID v])
        if <(slot) > (0)> then
            replace item (slot) of [BUS_X v] with (x position)
            replace item (slot) of [BUS_Y v] with (y position)
            replace item (slot) of [BUS_HP v] with (my_hp)
            if <(my_hp) <= (0)> then
                set [my_state v] to (2)
                replace item (slot) of [BUS_State v] with (2)
            end
        end
    end
    delete_this_clone

else if <(clone_type) = (2)> then
    // --- [炮塔组件主循环] ---
    switch costume to [turret_barrel v]
    go to [front v] layers
    repeat until <(is_parent_alive) = (0)>
        set [slot v] to (item # of (clone_id) in [BUS_Entity_ID v])
        if <(slot) > (0)> then
            // 检查父实体是否存活
            if <(item (slot) of [BUS_State v]) = (2)> then
                set [is_parent_alive v] to (0)
            else
                // 严密锚定在父实体位置，自身独立朝向目标
                go to x: (item (slot) of [BUS_X v]) y: ((item (slot) of [BUS_Y v]) + (10))
                point towards [Player v]
            end
        else
            set [is_parent_alive v] to (0)
        end
    end
    delete_this_clone // 父死子随，级联销毁，绝不残留孤儿克隆体！

else if <(clone_type) = (3)> then
    // --- [悬浮血条组件主循环] ---
    go to [front v] layers
    repeat until <(is_parent_alive) = (0)>
        set [slot v] to (item # of (clone_id) in [BUS_Entity_ID v])
        if <(slot) > (0)> then
            if <(item (slot) of [BUS_State v]) = (2)> then
                set [is_parent_alive v] to (0)
            else
                // 保持无角度偏转，悬浮在头顶上方 35 像素
                go to x: (item (slot) of [BUS_X v]) y: ((item (slot) of [BUS_Y v]) + (35))
                point in direction (90)
                // 根据生命值比例换算造型帧 (例如 1~10 帧满到空)
                set [hp_ratio v] to ((item (slot) of [BUS_HP v]) / (100))
                switch costume to (round ((10) * (hp_ratio)))
            end
        else
            set [is_parent_alive v] to (0)
        end
    end
    delete_this_clone
end
```

---

### 3. 架构模式 B：跨角色协同组件法 (Multi-Sprite Co-operative)

当某些组件在逻辑或渲染上有极大特殊性时（例如：全局共享的浮空飘字、全屏扭曲特效、画笔拖尾、通用碰撞检测器），建议拆分为**独立的专用角色（Specialized Sprites）**：

* `Sprite_Enemy`：专门处理敌人 AI、血量、世界坐标
* `Sprite_HealthBar`：专门处理所有敌人的血条克隆体
* `Sprite_DamagePopup`：专门处理全场受击伤害跳字动画
* `Sprite_Shadow`：统一在底层渲染所有角色的仿 3D 地面投影

**跨角色组件绑定机制**：
1. `Sprite_Enemy` 生成克隆体后，将自身生成的唯一分配号 `enemy_uuid` 作为参数，向子组件角色发送广播或写入待生成队列。
2. 子组件角色读取该 `enemy_uuid` 并赋给自己克隆体的私有变量 `bound_target_uuid`。
3. 渲染循环中，子组件通过在 `BUS_Entity_ID` 列表中搜索 `bound_target_uuid`，获取目标的世界坐标并紧密咬合。

---

### 4. 消除 1 帧落后抖动（Eliminating 1-Frame Tick Lag）

在克隆体跟随组合中，最常见的视觉缺陷是**组件漂移与抖动（Lag Jitter）**：
* 现象：当主实体高速移动时，炮塔或武器看起来总是滞后半步，在主实体停下后才贴合上去。
* **根源剖析**：Scratch 解释器按照角色和克隆体在内部链表中的排列顺序依次执行脚本。如果子组件在主实体更新坐标**之前**就读取了总线，它读取的就是上一帧的旧坐标，产生了 1 帧的时间差！
* **终极解决方案：三阶段广播时序同步（Tick Sync Loop）**
  杜绝在克隆体内写 `forever` 自主循环，改由舞台（Stage）统一分发单帧节拍：

```scratch
// [Stage 主时间轴控制]
when green flag clicked
forever
    broadcast [TICK_PHYSICS v] and wait // 阶段 1：主实体计算物理、移动、并写入 BUS 总线
    broadcast [TICK_COMPONENTS v] and wait // 阶段 2：附属组件读取最新 BUS 总线并瞬移锚定
    broadcast [TICK_RENDER v] and wait // 阶段 3：统一更新动画造型与图层调整
end
```
通过 `broadcast and wait` 的强制时序约束，无论场上有多少克隆体，子组件都保证读取的是**同一物理帧内的最新鲜坐标**，抖动彻底消失！

---

## 四、跨游戏类型通用实战范式 (Multi-Genre Paradigms)

组合组件思想不仅可用于某种特定玩法，在以下 5 种核心主流游戏类型中均有标准化解决方案：

---

### 1. 动作 / RPG / 平台跳跃类 (Action & Platformer)

#### 核心挑战
* 角色在跑步、跳跃、挥刀时外观造型多变，但物理碰撞必须保持恒定，否则会发生卡墙、嵌入地板、天花板抖动。
* 角色持有的武器需要随鼠标方向 360° 旋转，而身体只需要简单的左右翻转（左右镜像翻转）。

#### 组件拆解模型
* **Component 1 (Master / Hitbox)**：隐藏或透明的标准胶囊矩形。**只有它**带有重力 `vy`、水平速度 `vx`、并与地形地图进行接触检测。
* **Component 2 (Visual Skin)**：紧密贴合 Hitbox 中心，负责播放跑动、受击闪烁、待机骨骼帧序列。
* **Component 3 (Weapon Rig)**：锚定在角色手部挂点（如 `x + 5, y + 2`），独立跟随鼠标角度旋转。当角度处于 90~270 度时自动切换为上下镜像造型，防止武器上下颠倒。
* **Component 4 (HUD Overhead)**：浮空状态指示器（霸体护盾槽、异常状态冰冻/灼烧图标）。

---

### 2. 弹幕射击 / 飞行空战 (Bullet Hell & Shmup)

#### 核心挑战
* 多段复合巨大 BOSS：由本体、两只机翼、多门独立激光炮塔、防护力场罩构成。
* 玩家可以逐一击毁机翼和炮塔（部位破坏系统），每个部件具有独立的判定箱、血量与受击闪白反馈。

#### 组件拆解模型与部位破坏实现
* 为每个部件分配独立的数据总线字段：`PART_HP[part_index]`。
* **局部相对坐标转换公式**：
  设 BOSS 主核心世界坐标为 (X0, Y0)，机体整体旋转偏角为 θ。
  右机翼在局部图纸中的相对偏移为 (Δx, Δy)。
  则右机翼克隆体每帧实际世界坐标为：
  `X_wing = X0 + Δx * cos(θ) - Δy * sin(θ)`
  `Y_wing = Y0 + Δx * sin(θ) + Δy * cos(θ)`
* 某个部件受到子弹攻击时，扣除对应部件的独立血量。当 `PART_HP <= 0` 时，该部件克隆体播放剧烈爆炸粒子并销毁自己，主实体根据破坏的部件动态切换狂暴阶段 AI。

---

### 3. 塔防 / 即时战略 (Tower Defense & RTS)

#### 核心挑战
* 防御塔底座与地面网格平齐；
* 炮管必须顺滑旋转追踪视野内距离终点最近的敌人；
* 玩家点击选框时，需在地面展示半透明攻击射程指示圈；
* 升级按钮与售卖按钮悬浮在塔四周。

#### 复合组件流水线
1. **Tower Base (底座)**：静态克隆体，占据建筑格子，处理放置碰撞。
2. **Tower Barrel (炮塔)**：动态克隆体，每帧在总线中搜寻最近敌人，使用插值平滑转向目标：
   `direction += (target_dir - direction) * 0.2`
3. **Range Indicator (射程环)**：休眠克隆体。仅当该塔被选中时 `show`，并将自身 `size` 缩放到对应射程半径；失去选中时立即 `hide`。
4. **Floating Action Ring (操作悬浮环)**：由 2~3 个 UI 子克隆体围绕塔身分布，处理点击升级与售卖。

---

### 4. 卡牌 / 战棋 / 复合 UI 体系 (Card Games & Complex UI)

#### 核心挑战
* 卡牌需要分层渲染：外边框底板、角色半身画、稀有度边框、攻击/血量数值徽章、悬停放大浮动层、动态拖拽判定箱。
* **状态机污染规避（真实工程痛点回溯）**：
  在本次项目演进中，`upCard` 无法拖拽的根本原因就是**控制生命周期的全局/私有状态变量（`IsFinish?`）未在跨关卡或切换模式时彻底初始化**。当状态锁死为非活跃态（`IsFinish? == 1`）时，拖拽位移逻辑被完全绕过，克隆体陷入 `MoveToSmoothly(0, 50)` 伪死锁。

#### 卡牌组合组件黄金规范
* **Card Base Host**：持有卡牌数据（CardID、ATK、HP、Cost）。负责卡牌在手牌中的弧形排布（Fan-out layout）与坐标插值（Lerp）。
* **Hitbox Drag Proxy (拖拽代理)**：一个看不见的矩形克隆体。当鼠标按下且接触到它时激活拖拽，拖拽时仅计算鼠标偏移量，并驱动 Base 平滑追赶鼠标，形成具有物理质量感的拖拽弹性。
* **Badge / Text Mesh Components**：将攻击力、生命力数值以独立数字克隆体呈现，当数值变化时执行缩放弹跳动效（Punch Scale）。
* **状态生命周期沙盒**：
  在任何涉及进入选择、拖拽、奖励页面的自定义积木头部，必须显式重置一切状态守门人：
  `set [IsFinish? v] to (0)`
  `set [IsDragging v] to (0)`

---

### 5. 物理沙盒 / 多节蠕动生物 (Physics & Segmented Creatures)

#### 核心挑战
* 贪吃蛇、机械蜈蚣、布娃娃肢体、链条摆动需要若干个节点首尾相连。

#### 前导跟随算法（Follow-the-Leader Algorithm）
不需要复杂的物理弹簧引擎，只需每个子节点跟随前一个父节点的历史轨迹或极坐标距离约束：

```scratch
define Constrain_Distance_To_Leader (leader_x, leader_y, fixed_distance)
// 1. 测算与前一节的相对位移向量
set [dx v] to ((x position) - (leader_x))
set [dy v] to ((y position) - (leader_y))
set [dist v] to ([sqrt v] of (((dx) * (dx)) + ((dy) * (dy))))
// 2. 如果距离超过设定节距，拉回至固定距离
if <(dist) > (fixed_distance)> then
    set [scale_factor v] to ((fixed_distance) / (dist))
    set x to ((leader_x) + ((dx) * (scale_factor)))
    set y to ((leader_y) + ((dy) * (scale_factor)))
end
// 3. 角度朝向前一节
point towards x: (leader_x) y: (leader_y)
```

---

## 五、空间与渲染管理：图层对齐与 2.5D 深度排序 (Y-Sorting)

在组件克隆体中，图层混乱（例如血条穿模到机身下方、后方的怪物遮挡住前方怪物的武器）是极破坏游戏质感的现象。

### 1. 组件内部相对图层顺序
一个完整实体的推荐渲染层级关系从后到前为：
`[地面投影阴影] -> [主实体底座] -> [主躯干] -> [活动武器/部件] -> [高光/护盾特效] -> [悬浮血条与HUD]`

在单精灵内多态初始化时，通过强制层级穿透确定组件前后：
```scratch
when I start as a clone
if <(clone_type) = (TYPE_SHADOW)> then
    go to [back v] layers
else if <(clone_type) = (TYPE_WEAPON)> then
    go forward (2) layers
else if <(clone_type) = (TYPE_UI)> then
    go to [front v] layers
end
```

### 2. 2.5D / 斜 45° 视角 Y 轴深度排序算法 (Y-Sorting)
在俯视角 RPG 或战棋中，**脚底 Y 坐标越小（越靠屏幕下方）的物体离摄像机越近，必须遮挡 Y 坐标较大的物体**。
单靠 Scratch 原生的 `go forward 1 layers` 容易出现不可控的时序错乱。

#### 权威 Y 深度重排引擎（单帧全局排序法）：
1. 建立全局列表 `SORT_List_Entity_ID[]` 与 `SORT_List_Y[]`。
2. 每帧由各个实体将自身的 `Y` 坐标填入列表中。
3. 舞台调用一段不刷新屏幕（Warp）的**冒泡/插入排序积木**，按照 `Y` 降序排列。
4. 排序完成后发出全局广播 `EVT_RESTACK_LAYERS`。
5. 所有克隆体响应广播，根据自己在排序列表中的排名执行：
   ```scratch
   when I receive [EVT_RESTACK_LAYERS v]
   if <(is_clone) = (1)> then
       set [rank v] to (item # of (clone_id) in [SORT_List_Entity_ID v])
       if <(rank) > (0)> then
           go to [back v] layers
           go forward (rank) layers
       end
   end
   ```

---

## 六、性能极致压榨：对象池与画笔混合架构

为了在复杂的百弹齐发或大量同屏单位场景下保持满帧 30/60 FPS，并绝对不触碰 300 克隆体红线，必须引入对象池与画笔降级。

### 1. 静态预分配对象池（Pre-allocated Object Pool）
* **原理**：开局时一口气生成 50 个隐藏克隆体，常驻内存。游戏过程中**绝不销毁克隆体**（不执行 `delete this clone`），而是将其状态标记为“休眠”，隐藏并移出屏幕；当需要生成新实体时，查找并“唤醒”空闲克隆体。
* **收益**：彻底消除频繁克隆与销毁带来的内存分配卡顿（GC Spike），克隆体数量恒定可控。

```scratch
define Recycle_Entity (entity_clone_id)
set [slot v] to (item # of (entity_clone_id) in [POOL_ID_List v])
replace item (slot) of [POOL_Status_List v] with (0) // 0 表示空闲待命
// 对应克隆体探测到自身状态归零，立即 hide 并移至 x: 999 y: 999
```

### 2. 画笔印章（Pen Stamp）降级体系
* **原则**：**只有需要玩家点击、带有复杂碰撞检测、或者具有高频独立物理移动的实体才分配克隆体配额**！
* 那些纯视觉表现元素（爆炸烟尘、刀光拖尾、受击飘落的金币、弹壳、地砖），一律使用**画笔印章（Stamp）**或清屏重绘在背景层渲染。
* **典型配额分配比例**：
  * 玩家与核心交互物：5 ~ 10 个克隆体
  * 动态敌人与复合部件：40 ~ 80 个克隆体
  * 关键互动子弹/投射物：30 ~ 50 个克隆体
  * UI 与悬浮组件：20 个克隆体
  * 剩余缓冲空间：140 个安全冗余
  * 粒子与背景装饰：0 个克隆体（100% 由 Pen 实现）

---

## 七、克隆体常见致命反模式与避坑清单

| 常见致命错误 (Bug) | 灾难现象 | 根本诱因 | 架构级避坑解决方案 |
|---|---|---|---|
| **广播链式裂变** | 几秒内游戏彻底卡死，克隆体达到 300 顶峰 | 收到广播的处理块内调用了 `create clone`，本体与所有旧克隆体同时自我复制 | 严格在所有广播入口加装 `if (is_clone == 0)` 门控 |
| **状态跨生命周期残留 (FCE2.1案例)** | 拖拽失效、停在原地、动画不播放 | 上一次交互结束时遗留了 `IsFinish = 1` 或 `State = Lock`，新生成的克隆体继承了被污染的变量 | 在任何模式/关卡入口、生成实体函数头部，必须强制重置状态标记 |
| **部件 1 帧落后抖动** | 高速移动时炮塔/血条与身体脱节脱胶 | 子部件与父实体处于自由 `forever` 中，执行顺序随机，读到了上一帧的旧坐标 | 使用舞台广播驱动三阶段主循环：`Tick_Physics` -> `Tick_Components` -> `Tick_Render` |
| **幽灵孤儿克隆体** | 敌人被消灭后，它的血条或影子仍漂浮在空中 | 仅消灭了父实体，没有通知附属子组件执行销毁 | 统一在数据总线中设立 `BUS_State`，父级死亡时标记 `State=DEAD`，子组件检测到父死亡级联销毁自身 |
| **克隆体图层反复跳跃闪烁** | 同一行多个实体在重叠时像斑马线一样剧烈抖动 | 多个克隆体在各自的局部循环中不断调用 `go to front layers` 争夺顶层 | 禁止克隆体各自调用 `go to front`，统一由中心调度器通过 Y-Sorting 算好层级后一次性重排 |

---

## 八、总结与工程选型建议

在 Scratch 中构筑高质量、工业级的复杂游戏，克隆体架构决定了整个工程的扩展性与帧率下限。
* 小型简单游戏：优先采用**单精灵多态组件**，代码内聚，简单高效；
* 中大型复杂游戏：采用**全局总线 (Data Bus) + 复合克隆体组件分发 + 舞台统一 Tick 节拍**，辅以**对象池与画笔降级**。

严格遵守本指南的架构规范，不仅能轻松突破 Scratch 单精灵的表现力瓶颈，更能在 300 个克隆体的严格约束下，创造出兼具极致视觉效果与如丝般顺滑操控的大作级体验。
