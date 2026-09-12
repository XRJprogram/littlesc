# Scratch 3.0 架构模式与主循环 (Architecture & Game Loop)

在 Scratch 3.0 及大型 `.sb3` 项目（如《Rabbit Hole》《ALLTALE》《Pond》《几何之战》）中，架构设计的优劣直接决定了项目的可维护性、流畅度与稳定性。

---

## 1. 单线程主循环模式 (Tick / Game Loop)

### 为什么避免多角色分散并发 `forever`？
Scratch 内部的协程调度机制在不同角色的 `forever` 之间以时间片轮转执行。如果每个角色都在自己的 `forever` 里处理移动、碰撞和输入，会导致：
1. **执行顺序不可控**：玩家先移动还是怪物先移动完全取决于积木运行时的内部 ID 顺序。
2. **逻辑穿透与帧撕裂**：角色刚移动了一半，碰撞箱还没更新，渲染循环就已经开始，导致物体穿墙或抖动。
3. **竞态条件 (Race Conditions)**：多线程同时读写同一个全局变量，造成数值丢失。

### 推荐架构：中央控制器 (Central Controller)
由舞台 (Stage) 或一个专职 `Controller` 角色统一驱动所有角色：

```text
[Stage / Controller]
        │
        ├── broadcast "PreUpdate" and wait  (输入采集、摄像机准备)
        ├── broadcast "Update" and wait     (物理移动、AI行为、碰撞检测)
        ├── broadcast "LateUpdate" and wait (碰撞修正、血量结算)
        └── broadcast "Render" and wait     (画笔清屏、重绘、造型同步)
```

#### goboscript 代码范式
```goboscript
// target stage;
var frame_count = 0;
var dt = 0.033; // 30 FPS 基准帧时间

onflag {
    frame_count = 0;
    broadcast "Init" and wait;
    
    forever {
        frame_count += 1;
        broadcast "Tick_Input" and wait;
        broadcast "Tick_Physics" and wait;
        broadcast "Tick_Render" and wait;
    }
}
```

---

## 2. 状态机设计 (FSM - Finite State Machine)

在大型游戏（如《MCF大战转载者》《魔能的源点》）中，游戏拥有多个全局状态：
- `0`: 标题封面 (Title)
- `1`: 选关与关卡加载 (Level Select)
- `2`: 游戏中 (In Game)
- `3`: 暂停 (Paused)
- `4`: 结算与失败 (Game Over / Victory)

### 状态切换与事件分发守卫
每个角色在响应全局广播时，必须增加状态门控，防止在主界面响应战斗逻辑：

```goboscript
// target "Player";
var g_game_state = 0;

on "Tick_Physics" {
    // 状态门控：仅在游戏中执行物理更新
    if (g_game_state == 2) {
        def_update_physics();
    }
}

on "State_Change" {
    if (g_game_state == 0) {
        hide;
    } else if (g_game_state == 2) {
        show;
        def_init_player();
    }
}
```

---

## 3. 广播总线协议 (Broadcast Bus Convention)

在复杂项目中，随意使用无序广播会导致代码极其混乱。高水平项目的广播命名规范通常采用命名空间前缀：

| 广播命名前缀 | 用途 | 示例 |
|---|---|---|
| `SYS_` 或 `@` | 系统级控制、初始化、切场景 | `SYS_Init`, `@MP.Refresh` |
| `TICK_` | 主循环各阶段步进 | `TICK_Input`, `TICK_Physics`, `TICK_Render` |
| `UI_` | 用户界面弹窗、按钮交互 | `UI_OpenInventory`, `UI_CloseDialogue` |
| `AUDIO_` | 音频引擎、BGM 播放与淡出 | `AUDIO_PlayBGM`, `AUDIO_StopAll` |
| `ENTITY_` | 实体生命周期广播 | `ENTITY_BossSpawn`, `ENTITY_ClearAllEnemies` |

---

## 4. 避免广播死锁与雪崩

1. **绝对禁止循环 `broadcast and wait`**：
   - 角色 A 发送 `broadcast "B_do" and wait`；
   - 角色 B 收到 "B_do" 后又发送 `broadcast "A_do" and wait`；
   - 导致 Scratch 线程死锁，整个项目卡死。
2. **克隆体接收广播的拦截**：
   - 默认情况下，当发送广播时，**本体和所有克隆体**都会并发执行该广播事件！
   - 如果发送广播并在里面执行 `create clone`，克隆体数量将呈 $2^n$ 指数级暴增，瞬间达到 300 个克隆体上限并卡死。
   - 必须通过 `is_clone` 变量进行身份拦截（参见克隆体专项指南）。
