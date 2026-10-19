/**
 * Electron 主进程
 *
 * 页面从本机服务（http://127.0.0.1:<port>）加载 —— 与 /api 同源，免 CORS、Cookie 可用。
 * 窗口内容区默认 iPad Air 11" 横向逻辑尺寸 1180×820（可用 config.js 调整）。
 */
const path = require('path')
const fs = require('fs')
const electronApi = require('electron')

// 防御：某些 CI/终端环境会设置 ELECTRON_RUN_AS_NODE=1，此时 electron.exe 会退化成纯 Node，
// require('electron') 只能拿到「可执行文件路径字符串」，拿不到 app —— 给出明确提示而不是莫名其妙的 TypeError。
if (typeof electronApi === 'string' || !electronApi || !electronApi.app) {
  console.error(
    '[desktop] 检测到以「纯 Node 模式」运行（通常是环境变量 ELECTRON_RUN_AS_NODE=1）。\n' +
      '           请先清除该变量再启动：Remove-Item Env:ELECTRON_RUN_AS_NODE  然后重试 npm start / npm run smoke'
  )
  process.exit(9)
}

const { app, BrowserWindow, Menu, shell, dialog, session } = electronApi
const cfg = require('./config')
const { startServer } = require('./server')

const IS_SMOKE = process.argv.includes('--smoke')
const IS_DEV = process.env.DESKTOP_DEV === '1'
// 自检可选指定路由：--smoke-route=/products
const SMOKE_ROUTE = (process.argv.find(a => a.startsWith('--smoke-route=')) || '').split('=')[1] || ''

// 没接控制台时（打包/自检）把致命错误落到文件，方便定位
function logFatal(e) {
  try {
    fs.writeFileSync(path.join(__dirname, '.error.log'), String((e && e.stack) || e))
  } catch (_) { /* ignore */ }
}
process.on('uncaughtException', e => { logFatal(e); app.exit(5) })
process.on('unhandledRejection', e => { logFatal(e); app.exit(6) })

let mainWindow = null
let localServer = null

// 单实例：第二次启动只把已有窗口拉到前台
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

/** 前端产物目录：打包后放在 resources/dist，开发时用仓库根目录的 dist */
function resolveStaticDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'dist')
    : path.join(__dirname, '..', 'dist')
}

function createWindow(url) {
  const { width, height, minWidth, minHeight } = cfg.window
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth,
    minHeight,
    useContentSize: true,
    show: false,
    backgroundColor: '#0b1020',
    title: '云平台统一门户',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      zoomFactor: 1,
      // 打包后不需要开发者工具入口（可用 --devtools 打开）
      devTools: !app.isPackaged || process.argv.includes('--devtools')
    }
  })

  // 外链一律交给系统浏览器，不在应用内新开窗口
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:/i.test(target)) shell.openExternal(target)
    return { action: 'deny' }
  })

  // 只允许留在本机服务里（防止页面被导航到外部站点）
  mainWindow.webContents.on('will-navigate', (event, target) => {
    if (!target.startsWith(url)) {
      event.preventDefault()
      if (/^https?:/i.test(target)) shell.openExternal(target)
    }
  })

  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    dialog.showErrorBox('页面进程异常退出', `原因：${details.reason}\n请重新打开应用。`)
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.loadURL(url.replace(/\/$/, '') + (IS_SMOKE && SMOKE_ROUTE ? SMOKE_ROUTE : '/'))
  return mainWindow
}

function buildMenu() {
  const template = [
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'toggleDevTools', label: '开发者工具', visible: process.argv.includes('--devtools') },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '打开后端接口文档',
          click: () => shell.openExternal(cfg.apiTarget + '/api/docs')
        },
        {
          label: '关于',
          click: () =>
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '云平台统一门户（桌面端）',
              detail: `版本 ${app.getVersion()}\n后端：${cfg.apiTarget}\n窗口：${cfg.window.width}×${cfg.window.height}（iPad 平板排版）`
            })
        }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

/** 自检模式：加载完成 → 截图 + 写报告 → 退出（CI/本地验证用，不需要人工看窗口） */
function runSmoke() {
  // 打包后 __dirname 在 asar 里是只读的，产物写到用户数据目录
  const outDir = app.isPackaged ? path.join(app.getPath('userData'), 'smoke') : __dirname
  const shotPath = path.join(outDir, '.smoke.png')
  const reportPath = path.join(outDir, '.smoke.json')
  try {
    fs.mkdirSync(outDir, { recursive: true })
  } catch (_) { /* ignore */ }

  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const write = (obj, code) => {
    try { fs.writeFileSync(reportPath, JSON.stringify(obj, null, 2)) } catch (_) { /* ignore */ }
    app.exit(code)
  }

  const capture = async () => {
    try {
      // 等首帧画完：窗口必须先可见，否则 Windows 上 capturePage 会拿到空白图
      mainWindow.show()
      await sleep(1600)
      const image = await mainWindow.webContents.capturePage()
      fs.writeFileSync(shotPath, image.toPNG())
      const info = await mainWindow.webContents.executeJavaScript(
        `JSON.stringify({
           w: innerWidth, h: innerHeight, dpr: devicePixelRatio,
           title: document.title, route: location.pathname,
           hasBand: !!document.querySelector('.band') || !!document.querySelector('.hero-band'),
           hasTabbar: !!document.querySelector('.tabbar'),
           hasDock: !!document.querySelector('.mobile-dock'),
           gridCols: (() => { const g = document.querySelector('.grid'); return g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : null })(),
           bodyText: document.body.innerText.slice(0, 60)
         })`
      )
      const page = JSON.parse(info)
      const blank = !image.getSize().width || image.isEmpty()
      const ok = !blank && page.w >= 900 && page.w <= 1180 && (page.gridCols === null || page.gridCols === 2)
      write({ ok, blank, packaged: app.isPackaged, route: page.route, shot: shotPath, page }, ok ? 0 : 3)
    } catch (e) {
      write({ ok: false, error: String(e) }, 4)
    }
  }

  const wc = mainWindow.webContents
  if (wc.isLoading()) wc.once('did-finish-load', capture)
  else capture()
}

app.whenReady().then(async () => {
  try {
    // 只允许本机服务这一个 origin（其余权限一律拒绝）
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false))

    const staticDir = resolveStaticDir()
    localServer = await startServer({
      staticDir,
      apiTarget: cfg.apiTarget,
      dev: IS_DEV,
      devServer: cfg.devServer,
      port: cfg.port,
      stripPortalPrefix: cfg.stripPortalPrefix
    })
    console.log(`[desktop] 本地服务 ${localServer.url}  →  后端 ${cfg.apiTarget}`)
    console.log(`[desktop] 静态目录 ${IS_DEV ? '(dev → ' + cfg.devServer + ')' : staticDir}`)

    buildMenu()
    createWindow(localServer.url)

    if (IS_SMOKE) runSmoke()
  } catch (e) {
    logFatal(e)
    app.exit(7)
  }
})

app.on('window-all-closed', async () => {
  if (localServer) await localServer.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async () => {
  if (localServer) await localServer.close()
})
