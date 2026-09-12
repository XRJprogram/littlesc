// ===========================================================================
// 范例 3：安全存档码序列化与防篡改哈希校验 (Save Code & Checksum Verification)
// ===========================================================================

target stage;

var g_save_code = "";
var g_save_status = "READY";
list g_split_items;

// 通用字符串拆分器（写入全局列表）
func def_split(src, sep) {
    clear list g_split_items;
    local len = length(src);
    local cur = "";
    local i = 1;
    while (i <= len) {
        local ch = letter_of(i, src);
        if (ch == sep) {
            add cur to g_split_items;
            cur = "";
        } else {
            cur = cur & ch;
        }
        i += 1;
    }
    if (cur != "") {
        add cur to g_split_items;
    }
}

// 存档码校验和算法
func def_compute_hash(str) {
    local h = 0;
    local i = 1;
    local len = length(str);
    while (i <= len) {
        h = (h * 31 + len + i) % 9973;
        i += 1;
    }
    return h;
}

// 编码存档：将 关卡、金币、攻击力 打包并生成加密校验码
func def_make_save(level, coins, atk) {
    local data = level & "-" & coins & "-" & atk;
    local checksum = def_compute_hash(data);
    g_save_code = data & "#" & checksum;
    return g_save_code;
}

// 解码存档：验证校验码，防止玩家手动篡改数据
func def_load_save(code) {
    def_split(code, "#");
    if (length(g_split_items) != 2) {
        g_save_status = "FORMAT_ERR";
        return 0;
    }
    local payload = g_split_items[1];
    local expected_hash = g_split_items[2] * 1;
    local computed_hash = def_compute_hash(payload);

    if (expected_hash != computed_hash) {
        g_save_status = "TAMPERED_CHEAT";
        return 0;
    }

    // 校验通过，提取业务属性
    def_split(payload, "-");
    local p_level = g_split_items[1] * 1;
    local p_coins = g_split_items[2] * 1;
    local p_atk   = g_split_items[3] * 1;

    g_save_status = "SUCCESS: Lv=" & p_level & ", Coins=" & p_coins;
    return 1;
}

onflag {
    // 演示：生成正常存档码
    local code = def_make_save(5, 1280, 45);
    say("生成的存档码: " & code, 2);

    // 演示正常载入
    def_load_save(code);
    say("读取结果: " & g_save_status, 2);

    // 演示玩家恶意篡改金币（将 1280 改为 999999）
    def_load_save("5-999999-45#" & g_split_items[2]);
    say("防作弊拦截结果: " & g_save_status, 2);
}
