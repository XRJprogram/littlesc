// ===========================================================================
// 范例 1：碰撞箱分离的平台跳跃引擎 (Platformer with Hitbox Separation)
// ===========================================================================

target stage;
var g_game_over = 0;

onflag {
    g_game_over = 0;
    forever {
        broadcast "Tick_Input" and wait;
        broadcast "Tick_Physics" and wait;
        broadcast "Tick_Render" and wait;
    }
}

target "Player";

// 物理与状态变量
var vx = 0;
var vy = 0;
var on_ground = 0;
var facing = 1;
var anim_tick = 0;

func def_init_player() {
    x = 0;
    y = 0;
    vx = 0;
    vy = 0;
    on_ground = 0;
    facing = 1;
}

on "Tick_Input" {
    // 左右移动输入
    local move_input = 0;
    if (key_pressed("right arrow") or key_pressed("d")) {
        move_input += 1;
        facing = 1;
    }
    if (key_pressed("left arrow") or key_pressed("a")) {
        move_input -= 1;
        facing = -1;
    }
    vx = move_input * 6;

    // 跳跃输入（必须在地表）
    if ((key_pressed("up arrow") or key_pressed("w") or key_pressed("space")) and on_ground == 1) {
        vy = 12;
        on_ground = 0;
    }
}

func def_physics_step() {
    // 关键技巧：单帧内切换为规则几何碰撞箱
    switch_costume("hitbox");

    // --- 水平移动与碰撞 ---
    x += vx;
    if (touching("Ground")) {
        // 水平贴合：微量回退直到脱离墙体
        local step_back = (vx > 0 ? -1 : 1);
        while (touching("Ground")) {
            x += step_back;
        }
        vx = 0;
    }

    // --- 垂直重力与碰撞 ---
    vy -= 0.8; // 重力加速度
    if (vy < -15) { vy = -15; } // 终端限速

    y += vy;
    on_ground = 0;
    if (touching("Ground")) {
        local step_back_y = (vy > 0 ? -1 : 1);
        while (touching("Ground")) {
            y += step_back_y;
        }
        if (vy < 0) {
            on_ground = 1; // 落地
        }
        vy = 0;
    }
}

on "Tick_Physics" {
    def_physics_step();
}

on "Tick_Render" {
    // 切回视觉动画造型，并同步朝向
    anim_tick += 1;
    point_in_direction(facing == 1 ? 90 : -90);
    
    if (on_ground == 0) {
        switch_costume("jump");
    } else if (vx != 0) {
        // 跑步循环（两帧交替）
        switch_costume((anim_tick % 10 < 5) ? "run_1" : "run_2");
    } else {
        switch_costume("idle");
    }
}
