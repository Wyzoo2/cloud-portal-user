/**
 * 出包包装脚本：把「重新打包」需要的环境准备一次做掉，避免踩两个坑
 *
 * 坑 1：NSIS 默认往系统 %TEMP% 写 nst*.tmp，受限环境下 makensis 读不回来 →
 *      统一把 TMP/TEMP 指到 desktop/.tmp（工程内可写目录）
 * 坑 2：某些终端环境带 ELECTRON_RUN_AS_NODE=1，会让 electron.exe 退化成纯 Node →
 *      出包/自检前把它从环境里删掉
 *
 * 用法：
 *   node scripts/pack.js             # 等价于 npm run build:win（nsis + portable）
 *   node scripts/pack.js --dir       # 只出免安装目录（最快，用于快速验证）
 */
const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const root = path.join(__dirname, '..')
const tmp = path.join(root, '.tmp')
fs.mkdirSync(tmp, { recursive: true })

const env = { ...process.env, TMP: tmp, TEMP: tmp }
delete env.ELECTRON_RUN_AS_NODE

const args = process.argv.slice(2)
const targets = args.includes('--dir') ? ['--win', '--dir'] : ['--win', 'nsis', 'portable']

// 前端产物检查：没 build 就出包，打出来的应用会是白屏
const distIndex = path.join(root, '..', 'dist', 'index.html')
if (!fs.existsSync(distIndex)) {
  console.error('\n[pack] 缺少前端产物：' + distIndex)
  console.error('[pack] 请先在仓库根目录执行：npm run build\n')
  process.exit(1)
}

const cli = path.join(root, 'node_modules', 'electron-builder', 'out', 'cli', 'cli.js')
if (!fs.existsSync(cli)) {
  console.error('[pack] 找不到 electron-builder，请先执行：npm install')
  process.exit(1)
}

console.log(`[pack] 目标 ${targets.join(' ')}  TMP=${tmp}`)
const r = spawnSync(process.execPath, [cli, ...targets], { cwd: root, env, stdio: 'inherit' })
process.exit(r.status === null ? 1 : r.status)
