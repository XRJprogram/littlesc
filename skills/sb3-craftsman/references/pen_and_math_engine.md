# Scratch 3.0 画笔渲染引擎与数学系统 (Pen Engine & Math)

在《AnyChem》《new Planet》《灵物语》《ALLTALE》等高质量项目中，画笔（Pen）被广泛用于程序化生成星球、化学键拓扑网络、动态曲线、激光特效以及纯代码文字排版引擎。

---

## 1. 摄像机与坐标系投影 (Camera & Coordinates)

当游戏地图大于 Scratch 舞台（480 × 360）时，必须将物理世界的“世界坐标”转换为摄像机观察下的“屏幕坐标”。

### 核心变换数学公式
设物体在世界中的绝对坐标为 $(X_{world}, Y_{world})$，摄像机所在世界位置为 $(X_{cam}, Y_{cam})$，缩放倍率为 $Z$：

$$X_{screen} = (X_{world} - X_{cam}) \times Z$$
$$Y_{screen} = (Y_{world} - Y_{cam}) \times Z$$

### 视锥体剔除优化 (Frustum Culling)
凡超出屏幕边界的一律不画、不克隆、不渲染，节省 90% 性能：
```goboscript
func def_draw_node(world_x, world_y, radius) {
    local sx = (world_x - cam_x) * cam_zoom;
    local sy = (world_y - cam_y) * cam_zoom;
    
    // 舞台尺寸：-240~240, -180~180。留出边距 buffer
    if (sx < -260 or sx > 260 or sy < -200 or sy > 200) {
        return 0; // 视锥体外部直接剔除，跳过绘制
    }
    
    goto(sx, sy);
    set_pen_size(radius * 2 * cam_zoom);
    pen_down;
    pen_up;
}
```

---

## 2. 画笔零闪烁渲染管道 (Flicker-Free Pen Pipeline)

### 闪烁的原因
如果在多个循环或非 Warp 自定义积木中分散调用 `erase_all` 和 `pen_down`，画面会在重绘未完成时被显示出来，产生高频频闪。

### 黄金渲染管道
**必须将整帧的所有绘制逻辑包揽在一个无刷新屏幕（Warp）函数中！**

```goboscript
// target "PenRenderer";

on "Tick_Render" {
    def_render_frame();
}

// 必须勾选：运行时不刷新屏幕 (Warp)
func def_render_frame() {
    erase_all; // 帧首统一切换清屏
    
    def_draw_background_grid();
    def_draw_map_geometry();
    def_draw_particles();
    def_draw_ui();
    // 本函数结束瞬间，Scratch 统一提交显卡缓冲，画面极致流畅无闪烁！
}
```

---

## 3. 线段与拓扑连线绘制 (Line & Bond Rendering)

如《AnyChem》中绘制分子链和化学键：
```goboscript
func def_draw_link(x1, y1, x2, y2, color, thickness) {
    local sx1 = (x1 - cam_x) * cam_zoom;
    local sy1 = (y1 - cam_y) * cam_zoom;
    local sx2 = (x2 - cam_x) * cam_zoom;
    local sy2 = (y2 - cam_y) * cam_zoom;
    
    set_pen_color(color);
    set_pen_size(thickness * cam_zoom);
    
    pen_up;
    goto(sx1, sy1);
    pen_down;
    goto(sx2, sy2);
    pen_up;
}
```

---

## 4. 纯代码矢量/点阵文字引擎 (Pen Font Engine)

如《灵物语》《几何之战》在无文字扩展的情况下输出动态分数、剧情对话与中文：

### 实现架构
1. **造型字符库法**：角色的每个造型为单个字符（`0`~`9`、`A`~`Z`、常用标点或中文字库）。
2. **盖章排版法 (Stamp Font)**：
   - 遍历输入字符串中的每一个字符：`local ch = letter_of(i, text);`
   - 切换角色造型为对应字符：`switch_costume(ch);`
   - 计算该字符宽度，移动到光标位置并调用 `stamp;` 盖章；
   - 光标向右累加字符宽度与字间距；
   - 换行时重置 X 坐标并下移 Y 坐标。

```goboscript
func def_print_text(text, start_x, start_y, char_size, spacing) {
    size = char_size;
    local cur_x = start_x;
    local cur_y = start_y;
    local len = length(text);
    local i = 1;
    
    while (i <= len) {
        local ch = letter_of(i, text);
        if (ch == "\n") {
            cur_x = start_x;
            cur_y -= (char_size * 0.3); // 换行
        } else {
            goto(cur_x, cur_y);
            switch_costume(ch);
            stamp;
            cur_x += spacing;
        }
        i += 1;
    }
}
```
