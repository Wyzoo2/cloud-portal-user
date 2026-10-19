/**
 * 预加载脚本：只暴露「只读的运行时信息」，不暴露 Node 能力。
 * 前端可用 window.__PORTAL_DESKTOP__ 判断是否运行在桌面端（需要时再加 .is-desktop 样式钩子）。
 */
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('__PORTAL_DESKTOP__', {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
})
