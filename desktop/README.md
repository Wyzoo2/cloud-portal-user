# 桌面端（Electron）· iPad 平板排版

把用户端打包成 Windows 桌面应用，窗口内容区默认 **1180×820**（iPad Air 11" 横向逻辑尺寸），
应用打开即落在前端 `≤1180` 的**平板档排版**：商品网格两列、KPI 两列、控件 ≥44px 触控尺寸、去掉 hover 浮动。

> 窗口可拉伸：拉大超过 1180 会回到桌面档排版，缩小到 768 以下会切手机档。
> 版式按窗口宽度自适应（与网页端一致），尺寸定义在 `desktop/config.js` 的 `window` 字段。

## 为什么需要主进程里的本地服务

打包后没有 Vite 代理了。如果直接用 `file://` 打开页面：

- 页面 origin 是 `file://`，请求后端是**跨域**，后端必须加 CORS；
- 后端的 `HttpOnly` refresh Cookie（`SameSite=Strict`）在 `file://` 下基本写不进去；
- 前端代码里的相对路径 `/api` 没有代理可用。

所以 `server.js` 在 `127.0.0.1` 起一个小服务，把**页面和接口放在同一个 origin**：

```
Electron 渲染进程
      │  加载 http://127.0.0.1:<随机端口>/
      ▼
desktop/server.js ──┬─ 静态资源：仓库根目录 dist/（SPA 回退 index.html）
                     └─ /api、/portal/api ──► 内网后端 http://<后端>:3000/api
```

这样：免 CORS、Cookie 能带上、`withCredentials` 照旧生效，前端一行代码都不用改。

## 目录

```
desktop/
├─ main.js       主进程：窗口、菜单、单实例、外链、--smoke 自检
├─ preload.js    只暴露只读运行时信息（window.__PORTAL_DESKTOP__）
├─ server.js     本地静态服务 + 接口反代（含 Vite HMR 的 WebSocket 转发）
├─ config.js     后端地址 / 窗口尺寸 / 端口 / 前缀剥离策略
└─ build/        应用图标（icon.svg 源文件 + 512×512 icon.png）
```

## 常用命令

> **重新打包只需要一条命令**（会先构建前端，再出安装包 + 绿色版）：
>
> ```powershell
> cd D:\code\cloud-portal-user
> npm run desktop:build
> ```
>
> 产物在 `desktop/release/`：
> - `云平台统一门户-Setup-<版本>.exe`（安装包）
> - `云平台统一门户-<版本>-portable.exe`（绿色版）

```powershell
# 安装桌面端依赖（只需一次）
npm run desktop:install

# 用打包好的 dist 运行（最接近正式效果）
npm run desktop:start

# 开发态：先起 Vite（另开一个终端 npm run dev），再起桌面端（页面与 HMR 走 5173）
npm run desktop:dev

# 自检：无人值守截图 + 打印窗口尺寸后退出（CI/回归用）
npm run desktop:smoke

# 只出免安装目录（最快，改完代码想马上看效果时用）
npm run desktop:pack

# 分步出包（等价于 desktop:build，但不会重新构建前端）
cd desktop
npm run build:win
```

`desktop/scripts/pack.js` 已内置两件事：把 `TMP/TEMP` 指到 `desktop/.tmp`（绕开 NSIS 的 `C:\WINDOWS\TEMP\nst*.tmp` 报错）、
出包前清掉 `ELECTRON_RUN_AS_NODE`。所以正常情况**不需要手动设置任何环境变量**。

### 需要重新打包的时机

| 改了什么 | 要不要重打包 |
|---|---|
| `src/**` 前端代码、样式、断点 | ✅ 需要（`desktop:build` 会自动先 build 前端） |
| `desktop/main.js`、`server.js`、`config.js`、图标 | ✅ 需要 |
| 只是调试渲染层 | ❌ 用 `desktop:dev`（走 Vite，改完刷新即可） |

### 改版本号

出包文件名带版本号，改 `desktop/package.json` 的 `version` 即可（如 `0.1.1`），
重新打包后产物会变成 `云平台统一门户-Setup-0.1.1.exe`。前端仓库根的 `package.json` 版本与之独立。


## 换后端地址

不用改代码，用环境变量覆盖（换一台机器/换环境只改这个）：

```powershell
$env:PORTAL_API_TARGET = "http://192.168.9.103:3000"
npm start
```

- 默认 `http://192.168.9.104:3000`
- 前端接口前缀由 `src/deploy.config.js` 的 `MOUNTED` 决定（`/api` 或 `/portal/api`）。
  桌面端默认把 `/portal` **剥掉**再转发到后端 `/api`；如果生产后端确实挂了 `context-path=/portal`，
  启动时加 `PORTAL_KEEP_PREFIX=1` 保留前缀。
- 固定端口（默认随机端口，避免冲突）：`PORTAL_DESKTOP_PORT=47612`

## 出包说明

- 安装包：`云平台统一门户-Setup-<版本>.exe`（可选安装目录、桌面/开始菜单快捷方式）
- 绿色版：`云平台统一门户-<版本>-portable.exe`（双击即用，不写注册表）
- 前端产物以 `extraResources` 打进 `resources/dist`，`main.js` 运行时按 `app.isPackaged` 取路径
- 图标：改 `build/icon.svg` 后重新生成 512×512 PNG（见下方命令），electron-builder 会自动转 `.ico`

```powershell
# 重新生成图标（用 Chrome 把 SVG 渲染成 PNG）
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu `
  --hide-scrollbars --default-background-color=00000000 --window-size=512,512 `
  --screenshot="D:\code\cloud-portal-user\desktop\build\icon.png" `
  "file:///D:/code/cloud-portal-user/desktop/build/icon.svg"
```

## 已知边界

- 只做了 Windows 出包（`nsis` + `portable`）；macOS/Linux 需另加 target。
- 窗口宽高比锁定在 iPad 横向比例，用户仍可拖动改变大小（最小 900×620），
  缩到 ≤768 会自动切到手机排版（表格转卡片、导航转汉堡抽屉）。
- 证书签名未配置：首次运行 Windows 可能提示「未知发布者」，需要正式分发时再补代码签名。

## 两个踩过的坑

1. **`ELECTRON_RUN_AS_NODE=1` 会让 electron.exe 退化成纯 Node**
   现象：`require('electron')` 只拿到一个路径字符串，启动即报
   `Cannot read properties of undefined (reading 'requestSingleInstanceLock')`。
   `main.js` 里已加显式检测并提示。修复：启动前 `Remove-Item Env:ELECTRON_RUN_AS_NODE`。

2. **NSIS 打包报 `!include: could not find: C:\WINDOWS\TEMP\nst*.tmp`**
   electron-builder 的 makensis 默认把临时 include 写到系统 `%TEMP%`，在受限环境下读不回来。
   现在 `scripts/pack.js` 已自动把 `TMP/TEMP` 指到 `desktop/.tmp`，**正常用 `npm run desktop:build` 不会再遇到**。
   如果是直接调用 `electron-builder`（绕过了包装脚本），仍需手动设置：

   ```powershell
   $env:TMP = "D:\code\cloud-portal-user\desktop\.tmp"
   $env:TEMP = $env:TMP
   npx electron-builder --win nsis portable
   ```

3. **跑自检/新版时窗口一闪就退出（exit 0）**
   因为应用是**单实例**的：如果已经有一个实例在跑（比如装好的旧版还在运行），
   新进程会立刻把控制权交回旧实例并退出。验证新版前要么先关掉正在运行的旧版，要么用独立数据目录：

   ```powershell
   npx electron . --smoke --user-data-dir="$PWD\.tmp\ud-test"
   ```


