// ===========================================================================
// 范例 2：画笔渲染引擎与大地图世界摄像机 (Pen World Camera Engine)
// ===========================================================================

target stage;
onflag {
    forever {
        broadcast "Tick_Input" and wait;
        broadcast "Tick_Render" and wait;
    }
}

target "PenEngine";

// 摄像机世界坐标与平滑度
var cam_x = 0;
var cam_y = 0;
var cam_zoom = 1;
var target_cam_x = 0;
var target_cam_y = 0;

// 星球/节点的世界坐标数据（一维模拟）
list stars_wx = [ -200, 300, -400, 500, 0, 150 ];
list stars_wy = [ 100, -150, -300, 200, 400, -50 ];
list stars_r  = [ 15, 25, 10, 30, 20, 18 ];

onflag {
    hide;
    cam_x = 0;
    cam_y = 0;
    cam_zoom = 1;
    target_cam_x = 0;
    target_cam_y = 0;
}

on "Tick_Input" {
    // 摄像机平滑跟随键盘方向键
    if (key_pressed("right arrow")) { target_cam_x += 10; }
    if (key_pressed("left arrow"))  { target_cam_x -= 10; }
    if (key_pressed("up arrow"))    { target_cam_y += 10; }
    if (key_pressed("down arrow"))  { target_cam_y -= 10; }

    // Lerp 缓动逼近
    cam_x += (target_cam_x - cam_x) * 0.15;
    cam_y += (target_cam_y - cam_y) * 0.15;
}

// 核心渲染管道：必须勾选 Warp（不刷新屏幕）
func def_render_scene() {
    erase_all; // 帧首清屏

    local i = 1;
    local total = length(stars_wx);
    while (i <= total) {
        local wx = stars_wx[i];
        local wy = stars_wy[i];
        local r = stars_r[i];

        // 世界坐标 -> 屏幕坐标映射
        local sx = (wx - cam_x) * cam_zoom;
        local sy = (wy - cam_y) * cam_zoom;

        // 视锥体剔除（Frustum Culling）
        if (sx >= -260 and sx <= 260 and sy >= -200 and sy <= 200) {
            goto(sx, sy);
            set_pen_size(r * 2 * cam_zoom);
            set_pen_color("#33aaff");
            pen_down;
            pen_up;
        }
        i += 1;
    }
}

on "Tick_Render" {
    def_render_scene();
}
