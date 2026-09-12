# Scratch 3.0 克隆体管理与对象池 (Clones & Object Pooling)

在大型 Scratch 游戏（如《MCF大战转载者》《Rabbit Hole》《几何之战》）中，怪物、子弹、UI 按钮、粒子特效绝大多数基于克隆体实现。克隆体机制是 Scratch 最强大的功能之一，但也是最容易产生严重 Bug 和崩溃的地方。

---

## 1. Scratch 克隆体核心底层机制

1. **300 个硬性上限**：Scratch 运行时全局最多同时存在 300 个克隆体（包括所有角色的克隆体总和）。超出后 `create clone` 积木将被静默忽略，不报错也不生效。
2. **私有变量复制特性**：
   - 角色私有变量（`This sprite only`）在克隆体生成的那一瞬间，会将本体当前的私有变量数值**完整复制**给该克隆体。
   - 之后克隆体修改该私有变量，只影响自己，不影响本体和其他克隆体。
3. **全局广播的群体触发灾难**：
   - 当收到广播时，**本体与所有克隆体**都会同时执行该 `on "msg"` 帽子块！
   - 若在广播处理中调用 `clone;`，现有 10 个克隆体会变成 20 个，再广播一次变成 40 个……瞬时击穿 300 个上限，引发恶性卡顿与逻辑崩溃。

---

## 2. 黄金法则：`is_clone` 与 `clone_id` 身份隔离

每一个需要克隆的角色，必须设置私有变量 `is_clone` 和 `clone_id`：

```goboscript
// target "Bullet";
// 私有变量声明
var is_clone = 0;
var clone_id = 0;
var bullet_speed = 0;
var bullet_hp = 0;

// 全局生成计数器
var g_bullet_counter = 0;

onflag {
    is_clone = 0;
    clone_id = 0;
    hide; // 本体隐形，常驻后台充当生成工厂 (Spawner)
}

// 供外部调用的生成函数
func def_spawn_bullet(x, y, dir, spd) {
    // 只有本体可以生成克隆体！
    if (is_clone == 0) {
        g_bullet_counter += 1;
        clone_id = g_bullet_counter;
        bullet_speed = spd;
        goto(x, y);
        point_in_direction(dir);
        clone; // 触发 onclone
    }
}

onclone {
    is_clone = 1; // 标记自身为克隆体
    show;
    
    // 克隆体独立生命周期
    while (bullet_hp > 0) {
        move(bullet_speed);
        if (touching_edge) {
            bullet_hp = 0;
        }
    }
    
    delete_this_clone; // 销毁克隆体，归还配额
}

// 广播防御门控
on "Tick_Physics" {
    // 严格区分：只有克隆体执行移动，本体静止
    if (is_clone == 1) {
        def_bullet_tick();
    }
}
```

---

## 3. 单精灵多角色多态 (Single-Sprite Multi-Entity)

如《几何之战》中，一个角色往往承担多种形态（普通怪、精英怪、BOSS召唤物）。通过 `clone_type` 私有变量实现形态派发：

```goboscript
var clone_type = 0; // 1: 小兵, 2: 追踪导弹, 3: 爆炸碎片

func def_spawn(type_id, x, y) {
    if (is_clone == 0) {
        clone_type = type_id;
        goto(x, y);
        clone;
    }
}

onclone {
    is_clone = 1;
    show;
    if (clone_type == 1) {
        switch_costume("minion");
        def_run_minion_ai();
    } else if (clone_type == 2) {
        switch_costume("missile");
        def_run_missile_ai();
    } else if (clone_type == 3) {
        switch_costume("particle");
        def_run_particle();
    }
    delete_this_clone;
}
```

---

## 4. 克隆体与全局列表通信 (List-based Data Sync)

如果主控制器需要知道所有怪物的坐标（例如玩家发射自动追踪弹需要寻找最近怪物）：

1. 每个克隆体在生成时获取一个唯一的连续数组索引 `my_index`。
2. 克隆体每帧将自己的 `x`、`y`、`hp` 写入公共列表 `monster_x[my_index]`、`monster_y[my_index]`。
3. 死亡时标记 `monster_hp[my_index] = 0`，或者使用“尾项覆盖法”紧凑删除列表项，保持列表密集。

---

## 5. 高性能对象池技术 (Object Pooling)

在子弹密集型或弹幕游戏（如《ALLTALE》弹幕、弹幕射击）中，高频 `clone` 与 `delete_this_clone` 会导致 Scratch 底层频繁分配和销毁 JS 内部对象，引起 GC 垃圾回收卡顿。

**对象池解法**：
1. 开局一次性创建固定数量（例如 50 个）的克隆体。
2. 每个克隆体通过私有变量 `active` 控制是否激活。
3. 未激活时 `hide` 并挂起等待；
4. 需要发射子弹时，通过修改全局数组激活对应序号的克隆体，避免任何动态克隆开销。
