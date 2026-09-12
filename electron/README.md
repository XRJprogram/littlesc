# InstanceScratch 桌面绿色版

开箱即用的 Windows 便携版（portable）——无需安装，双击即用。

## 使用方法

1. 下载 `InstanceScratch-<version>-portable.exe`
2. 双击运行，直接打开 Scratch 编辑器
3. 内置后端服务，AI 编译/反编译等功能开箱即用

## 特性

- **绿色便携**：单个 `.exe` 文件，解压到任意目录即可运行，无需安装
- **开箱即用**：前后端一体化，无需手动配置端口或 API key（mock 模式）
- **内置后端**：编译/反编译、语法校验、AI 对话全部本地化运行
- **无痕运行**：不写入注册表、不创建服务

## 开发构建

```bash
# 从项目根目录执行
node scripts/build-portable.mjs
```

或者手动分步构建：

```bash
# 1. 构建前端
cd /workspace && npm run build

# 2. 安装后端依赖
cd backend-js && npm install

# 3. 打包
cd electron && npm install && npm run build:win
```

## 目录结构

```
electron/
├── main.mjs              # Electron 主进程：启动后端 + 静态服务 + 窗口
├── package.json          # electron-builder 配置
├── build/                # 前端构建产物（构建时生成）
├── backend-js/           # 后端源码（构建时复制）
└── release/              # 打包输出目录
```

## 注意事项

- 首次运行便携版时，系统可能提示"未知发布者"，选择"仍要运行"即可
- 所有数据保存在本地，不涉及任何云服务（除非配置了 API key）
