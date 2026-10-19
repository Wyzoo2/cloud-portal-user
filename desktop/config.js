/**
 * 桌面端配置（Electron 主进程与本地服务共用）
 *
 * 打包后的应用没有 Vite 代理，所以由主进程在本机起一个 127.0.0.1 的服务：
 *   页面静态资源 + /api 反代 → 内网后端
 * 这样渲染进程的 origin 是 http://127.0.0.1:<port>，与接口同源：
 *   · 不受浏览器 CORS 限制（后端不用加 Access-Control-Allow-Origin）
 *   · 后端下发的 HttpOnly refresh Cookie 能正常写读（SameSite 也成立）
 */
module.exports = {
  // 后端地址：换环境不用改代码，打包时可用环境变量覆盖
  //   曾经用过 .103 / .104，当前联调是 .105（与仓库根目录 vite.config.js 保持一致）
  //   $env:PORTAL_API_TARGET="http://192.168.9.103:3000"
  // npm run desktop:start
  apiTarget: process.env.PORTAL_API_TARGET || 'http://192.168.9.105:3000',

  // 前端接口前缀由 src/deploy.config.js 的 MOUNTED 决定（/api 或 /portal/api）。
  // 这里默认把 /portal 前缀剥掉再转发到后端 /api（测试后端没有 /portal 上下文）；
  // 若生产后端确实挂了 context-path=/portal，启动时设 PORTAL_KEEP_PREFIX=1 即可保留。
  stripPortalPrefix: process.env.PORTAL_KEEP_PREFIX !== '1',

  // 窗口尺寸：iPad Air 11" 横向逻辑尺寸（1180×820），内容区按它排版 → 命中 ≤1180 平板档
  window: {
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 620
  },

  // 本地服务端口：0 = 随机可用端口（避免与其他进程冲突）
  port: Number(process.env.PORTAL_DESKTOP_PORT || 0),

  // 开发态：本地服务把页面请求转发给 Vite（保留 HMR）
  devServer: process.env.PORTAL_DEV_SERVER || 'http://127.0.0.1:5173'
}
