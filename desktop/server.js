/**
 * 本机同源服务：静态资源 + 接口反代
 *
 * 为什么需要它：Electron 里用 file:// 加载页面时，接口请求会变成跨域（且 Cookie 不好处理）。
 * 这里在 127.0.0.1 起一个小服务，把「页面」和「/api」放在同一个 origin 下：
 *   生产：静态资源来自 dist，/api 转发到内网后端
 *   开发：页面请求转发给 Vite（含 WebSocket HMR），/api 同样转发到后端
 */
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8'
}

/** 需要丢掉/改写的请求头（避免后端 CORS 校验与 Host 不匹配） */
const DROP_REQ_HEADERS = new Set(['origin', 'referer', 'host', 'connection', 'accept-encoding'])
/** 需要丢掉/改写的响应头（同源后无需 CORS 头；Set-Cookie 单独处理） */
const DROP_RES_HEADERS = new Set([
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-expose-headers',
  'transfer-encoding',
  'connection',
  'keep-alive'
])

/**
 * 后端 Set-Cookie 落到 127.0.0.1 上要做三件事：
 *   1) 去掉 Domain（后端可能写了别的域，浏览器会直接丢弃）
 *   2) 去掉 Secure（我们在 http://127.0.0.1，Secure Cookie 在部分内核下不写）
 *   3) Path 统一成 /（后端可能写 /api，导致前端读不到）
 */
function rewriteSetCookie(list) {
  return [].concat(list || []).map(raw =>
    raw
      .split(';')
      .map(s => s.trim())
      .filter(s => !/^domain=/i.test(s) && !/^secure$/i.test(s))
      .map(s => (/^path=/i.test(s) ? 'Path=/' : s))
      .join('; ')
  )
}

function isApiPath(p, portalPrefix) {
  return p === '/api' || p.startsWith('/api/') || p.startsWith(portalPrefix + '/api')
}

/** 反代：支持 http/https 目标，流式转发，不缓冲整包 */
function proxy(req, res, target, { stripPortalPrefix, portalPrefix }) {
  let upstream
  try {
    upstream = new URL(target)
  } catch (e) {
    res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('后端地址配置有误：' + target)
    return
  }

  let pathname = req.url
  if (stripPortalPrefix && pathname.startsWith(portalPrefix)) {
    pathname = pathname.slice(portalPrefix.length) || '/'
  }

  const headers = {}
  for (const [k, v] of Object.entries(req.headers)) {
    if (!DROP_REQ_HEADERS.has(k.toLowerCase())) headers[k] = v
  }
  headers.host = upstream.host

  const client = upstream.protocol === 'https:' ? https : http
  const upReq = client.request(
    {
      protocol: upstream.protocol,
      hostname: upstream.hostname,
      port: upstream.port || (upstream.protocol === 'https:' ? 443 : 80),
      method: req.method,
      path: pathname,
      headers
    },
    upRes => {
      const out = {}
      for (const [k, v] of Object.entries(upRes.headers)) {
        const key = k.toLowerCase()
        if (DROP_RES_HEADERS.has(key)) continue
        if (key === 'set-cookie') continue
        out[k] = v
      }
      const cookies = rewriteSetCookie(upRes.headers['set-cookie'])
      if (cookies.length) out['set-cookie'] = cookies
      res.writeHead(upRes.statusCode || 502, out)
      upRes.pipe(res)
    }
  )

  upReq.on('error', err => {
    if (res.headersSent) return res.end()
    res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('无法连接后端（' + target + '）：' + err.message)
  })
  req.pipe(upReq)
}

/** 静态文件（生产态）：SPA 回退到 index.html */
function serveStatic(req, res, rootDir) {
  const u = new URL(req.url, 'http://127.0.0.1')
  const rel = decodeURIComponent(u.pathname)
  const root = path.resolve(rootDir)
  // path.resolve(root, '.' + '/xxx') 才能正确拼出绝对路径；越界（../）一律 403
  const filePath = path.resolve(root, '.' + (rel === '/' || !rel ? '/index.html' : rel))
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('forbidden')
    return
  }

  fs.stat(filePath, (err, st) => {
    if (!err && st.isFile()) return sendFile(res, filePath, st)
    // 目录 / 不存在的路径（前端 history 路由）→ 回退首页
    const indexFile = path.join(rootDir, 'index.html')
    fs.stat(indexFile, (e2, st2) => {
      if (e2) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('前端产物不存在：' + rootDir + '（先在仓库根目录执行 npm run build）')
        return
      }
      sendFile(res, indexFile, st2)
    })
  })
}

function sendFile(res, filePath, st) {
  const ext = path.extname(filePath).toLowerCase()
  const isHtml = ext === '.html'
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'content-length': st.size,
    // index.html 不缓存（升级后要能立刻生效），带 hash 的静态资源可长缓存
    'cache-control': isHtml ? 'no-cache' : 'public, max-age=31536000, immutable'
  })
  fs.createReadStream(filePath).pipe(res)
}

/** 开发态：把请求整体转发给 Vite（含 HMR 的 WebSocket） */
function proxyToVite(req, res, devOrigin) {
  const target = new URL(devOrigin)
  const headers = { ...req.headers, host: target.host }
  const upReq = http.request(
    { hostname: target.hostname, port: target.port || 80, method: req.method, path: req.url, headers },
    upRes => {
      res.writeHead(upRes.statusCode || 502, upRes.headers)
      upRes.pipe(res)
    }
  )
  upReq.on('error', err => {
    if (res.headersSent) return res.end()
    res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('无法连接 Vite 开发服务（' + devOrigin + '）：' + err.message + '\n请先在仓库根目录执行 npm run dev')
  })
  req.pipe(upReq)
}

function startServer({ staticDir, apiTarget, dev, devServer, port = 0, stripPortalPrefix = true }) {
  const portalPrefix = '/portal'

  const server = http.createServer((req, res) => {
    const p = new URL(req.url, 'http://127.0.0.1').pathname
    if (isApiPath(p, portalPrefix)) {
      return proxy(req, res, apiTarget, { stripPortalPrefix, portalPrefix })
    }
    if (dev) return proxyToVite(req, res, devServer)
    return serveStatic(req, res, staticDir)
  })

  // Vite HMR 走 WebSocket：把 upgrade 事件原样转给 Vite
  server.on('upgrade', (req, socket, head) => {
    if (!dev) return socket.destroy()
    const target = new URL(devServer)
    const upSocket = require('net').connect(target.port || 80, target.hostname, () => {
      const headers = Object.entries(req.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n')
      upSocket.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`)
      if (head && head.length) upSocket.write(head)
      upSocket.pipe(socket)
      socket.pipe(upSocket)
    })
    upSocket.on('error', () => socket.destroy())
    socket.on('error', () => upSocket.destroy())
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      const actual = server.address().port
      resolve({
        port: actual,
        url: `http://127.0.0.1:${actual}/`,
        close: () => new Promise(r => server.close(() => r()))
      })
    })
  })
}

module.exports = { startServer }
