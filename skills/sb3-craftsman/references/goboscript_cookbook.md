# goboscript 语法守则与避坑全书 (goboscript Cookbook)

goboscript 是 Scratch 3.0 项目开发中最强大、最工程化的文本编程语言。本项目 InstanceScratch 内置了完整的 JS 编译器与反编译管线。编写 goboscript 时必须严格恪守以下规范：

---

## 1. 核心语法速查表

| Scratch 3.0 原生积木概念 | goboscript 等价语法 | 严禁错误写法 (会导致编译失败) |
|---|---|---|
| 当绿旗被点击 | `onflag { ... }` | ❌ `when green flag clicked`, 嵌套在循环内 |
| 收到广播 [xxx] | `on "xxx" { ... }` | ❌ `when I receive "xxx"` |
| 按下 [空格] 键 | `onkey "space" { ... }` | ❌ `onkey("space")` |
| 当作为克隆体启动 | `onclone { ... }` | ❌ `when I start as a clone` |
| 将 [变量] 设为 [值] | `var a = 0;` (顶层) / `a = 10;` | ❌ `let a = 0;`, ❌ `set a to 10;` |
| 将 [变量] 增加 [1] | `a += 1;` | ❌ `change a by 1;` |
| 列表加入项 | `add x to mylist;` | ❌ `mylist.push(x);` |
| 删除列表第 [i] 项 | `delete i of mylist;` | ❌ `delete mylist[i];` |
| 删除列表最后一项 | `delete last of mylist;` | ❌ `delete mylist;` (此语句会清空整张表！) |
| 清空列表 | `clear list mylist;` 或 `delete mylist;` | ❌ `mylist = [];` (会创建同名变量覆盖列表) |
| 获取列表第 [i] 项 | `mylist[i]` (1-based 起始！) | ❌ `item i of mylist` |
| 列表元素个数 | `length(mylist)` | ❌ `mylist.length` |
| 连接字符串 | `"得分: " & score` | ❌ `"得分: " + score` (`+`在Scratch里为纯数字加法，会变成0) |
| 字符取位 | `letter_of(i, str)` | ❌ `str[i]` |
| 字符串转数字 | `num = str * 1;` | ❌ `to_number(str)` (无此内置函数) |
| 自定义函数定义 | `func def_calc(a, b) { ... return r; }` | ❌ 未以 `def_` 开头的名字（会与保留字冲突） |

---

## 2. 十大高频致死编译陷阱

### 陷阱 1：事件帽子块（Hat Events）嵌套
- **致命错误**：在 `onflag { ... }` 或 `forever { ... }` 体内写 `onclick { ... }` 或 `on "msg" { ... }`。
- **正解**：所有事件帽子（`onflag`, `onclick`, `onkey`, `on`, `onclone`）**必须严格位于角色顶层第 0 列**！

### 陷阱 2：自定义函数未使用 `def_` 前缀
- **致命错误**：`func add(a, b)` 或 `func delete(i)`。
- **正解**：`add`, `to`, `delete`, `insert`, `at`, `as` 均为 goboscript 的保留关键字。自定义函数必须加前缀，如 `func def_add(a, b)`、`func def_init()`。

### 陷阱 3：在函数内错误使用 `var` 代替 `local`
- **致命错误**：在 `func` 体内用 `var i = 1;`。
- **正解**：顶层共享状态用 `var`；函数内部的临时变量、循环变量**必须且只能用 `local`**，否则会被当成全局变量在多处调用中相互污染。

### 陷阱 4：试图让函数返回列表（List）
- **致命错误**：`func def_get_list() { return [1, 2, 3]; }`
- **正解**：Scratch 原生机制决定了 `return` 只能携带标量（数字或文本）。返回列表会被自动拍平拼接为无空格字符串。
- **正解做法**：由函数直接操作顶层的全局列表（例如 `g_result_list`），调用方直接读取该列表。

### 陷阱 5：列表索引从 0 开始
- **致命错误**：`local first = mylist[0];`
- **正解**：Scratch 列表全为 **1-based**（从 1 开始）。第一项是 `mylist[1]`，最后一项是 `mylist[length(mylist)]`。

### 陷阱 6：递归重入导致 `local` 变量被覆盖
- **致命错误**：编写深层递归下降语法分析器（如表达式解析器互相调用自身）。
- **底层原因**：Scratch 自定义积木即使是局部参数，底层实现也是静态单例变量。同一函数未执行完就发生自我递归调用，局部变量会被子递归直接覆盖踩踏！
- **正解**：复杂解析器必须使用基于列表的显式栈（Stack）和 `while` 迭代循环实现。

### 陷阱 7：并发 `onflag` 状态竞争
- **致命错误**：在一个角色中书写多个 `onflag` 线程并发修改同一个计数器或列表。
- **正解**：单角色严格保持单一主 `onflag` 入口，避免时序混沌。

### 陷阱 8：清空列表误写为 `list = []`
- **致命错误**：试图用 `tokens = [];` 清空列表。
- **正解**：编译器会将其解析为声明并赋值一个同名普通变量 `tokens`，导致后续的 `add` 仍然写入底层隐藏列表，而读取时却读到了这个空字符串变量。清空列表必须写 `clear list tokens;`。

### 陷阱 9：循环中断误用 `break` 或 `continue`
- **致命错误**：在 `while` 循环中使用 `break;` 或 `continue;`。
- **正解**：Scratch 虚拟机原生无 break 积木。应通过逻辑标志位控制跳出：`while (i <= n and not found) { ... }`。

### 陷阱 10：长文本超 token 导致末尾截断
- **致命错误**：AI 生成大型游戏时逐关逐物展开，代码超过 200 行导致在末尾 `}` 处被硬截断。
- **正解**：数据与代码分离。大地图、复杂关卡通过列表压缩存储，用通用循环渲染，保持总代码精简在 160 行以内。
