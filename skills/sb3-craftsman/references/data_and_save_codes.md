# Scratch 3.0 数据结构与存档码系统 (Data & Save Codes)

在《几何之战》《魔能的源点》《灵物语》《Rabbit Hole》等长流程游戏中，存档系统、地图序列化和复杂数据结构是核心支柱。由于 Scratch 官方没有直接的文件读写或键值对字典（Map）积木，必须基于原生列表（List）和字符串解析技术构建。

---

## 1. 原生列表模拟多维数据结构

### 1. 一维列表模拟 2D 网格地图 (2D Array Simulation)
将网格地图（宽 $W$，高 $H$）展平为一维列表，索引从 1 开始：
- 网格点 $(x, y)$ 对应的一维列表索引公式（$x \in [1, W], y \in [1, H]$）：
  $$\text{Index} = (y - 1) \times W + x$$
- 从一维索引反算网格坐标：
  $$y = \text{floor}((\text{Index} - 1) / W) + 1$$
  $$x = ((\text{Index} - 1) \pmod W) + 1$$

### 2. 结构体数组模拟 (Struct of Arrays - SoA)
在管理实体数据时，为避免复杂的复合字符串解析，推荐采用多列表并行映射：
```goboscript
// 声明同一批实体的不同属性列表
list entity_x;
list entity_y;
list entity_hp;
list entity_type;

func def_add_entity(x, y, hp, type) {
    add x to entity_x;
    add y to entity_y;
    add hp to entity_hp;
    add type to entity_type;
}
```

---

## 2. 字符串解析器与切分器 (String Splitter)

在读取地图文件或导入存档时，必须将形如 `"100,250,5,Warrior"` 的带分隔符字符串解析为列表项：

```goboscript
list g_split_result; // 全局切分结果缓存

func def_split_string(src, delimiter) {
    clear list g_split_result;
    local len = length(src);
    local cur = "";
    local i = 1;
    
    while (i <= len) {
        local ch = letter_of(i, src);
        if (ch == delimiter) {
            add cur to g_split_result;
            cur = "";
        } else {
            cur = cur & ch;
        }
        i += 1;
    }
    // 压入末尾最后一段
    if (cur != "") {
        add cur to g_split_result;
    }
}
```

---

## 3. 存档码生成与校验加密算法 (Save Code & Checksum)

### 为什么需要校验码？
玩家在复制文本存档码时，极易手动篡改数值（例如把金币从 10 改成 999999）。必须在存档码末尾附加校验哈希（Checksum），一旦数值被篡改，算法校验立即失败。

### 生产级存档码范式
```goboscript
// 假设存档数据：关卡 level, 金币 coins, 杀怪数 kills
var g_save_code = "";
var g_load_success = 0;

// 1. 生成存档码并附带简易加权校验码
func def_generate_save(level, coins, kills) {
    // 拼接核心数据段（使用短横线或井号分隔）
    local payload = level & "-" & coins & "-" & kills;
    
    // 计算校验和：所有字符 ASCII 权值累加取模
    local hash = 0;
    local i = 1;
    while (i <= length(payload)) {
        // 利用字符序号加权扰动
        hash = (hash * 31 + length(payload) + i) % 9973;
        i += 1;
    }
    
    // 最终存档码格式: Payload#Hash
    g_save_code = payload & "#" & hash;
}

// 2. 验证并读取存档码
func def_load_save(input_code) {
    g_load_success = 0;
    def_split_string(input_code, "#");
    if (length(g_split_result) != 2) {
        return 0; // 格式错误
    }
    
    local payload = g_split_result[1];
    local expected_hash = g_split_result[2] * 1;
    
    // 重新计算 Hash 进行比对
    local hash = 0;
    local i = 1;
    while (i <= length(payload)) {
        hash = (hash * 31 + length(payload) + i) % 9973;
        i += 1;
    }
    
    if (hash != expected_hash) {
        return 0; // 校验失败，存档被非法篡改！
    }
    
    // 校验通过，提取业务字段
    def_split_string(payload, "-");
    local level = g_split_result[1] * 1;
    local coins = g_split_result[2] * 1;
    local kills = g_split_result[3] * 1;
    
    g_load_success = 1;
}
```
