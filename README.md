# 云平台统一门户 · 用户端

面向 C 端用户的统一门户前端（独立仓库，与管理端分开）。

- 技术栈：**Vue 3 + Vite + JavaScript（无 TypeScript）+ vue-router 4 + pinia + Element Plus + axios**
- 状态管理：**pinia**（`src/store/index.js`）
- 组件库：**Element Plus**（主色已改为暖橙 `#ff6b35`，见 `src/assets/main.css`）
- 后端：`http://192.168.9.100:3000`，接口前缀 `/api`（开发经 Vite 代理转发，前端 `baseURL` 为相对路径 `/api`）
- 权威依据：**《云平台统一门户 API 契约 v1.0》**，字段与错误码以契约为准

## 环境要求

- Node.js ≥ 18（本机 v24 已验证）
- npm（或 pnpm）

## 快速开始

```bash
# 1) 安装依赖
npm install

# 2) 启动开发服务器（默认 http://localhost:5173）
npm run dev
```

> **开发走 Vite 代理**：`/api` → `http://192.168.9.100:3000`（见 `vite.config.js`），前端 `baseURL` 保持相对路径 `/api`。
> 这样浏览器视为**同源**，`refresh_token` Cookie（`SameSite=Strict`）才能正常携带；
> **后端无需配置任何 CORS**。若改成直连后端完整地址，则必须由后端提供 CORS，且 `SameSite=Strict` 的 Cookie
> 在跨站场景下不会被发送（需改为 `SameSite=None; Secure` + HTTPS，局域网 HTTP 下行不通）。
> **联调前提：后端已在 `http://192.168.9.100:3000` 运行。**

## 其他脚本

```bash
npm run build        # 产物构建（dist/）
npm run preview      # 本地预览构建产物
```

## 目录结构

```
cloud-portal-user/
├─ index.html
├─ vite.config.js            # Vite 配置（/api 代理到后端）
├─ public/
│  └─ favicon.svg
└─ src/
   ├─ main.js                # 入口：挂载 App + 注册路由 + 引入全局样式
   ├─ App.vue                # 路由出口
   ├─ assets/
   │  └─ main.css            # 全局样式 + 暖橙主题 CSS 变量
   ├─ api/
   │  └─ index.js            # 单文件 API 定义（api.login / api.getProducts / ...）
   ├─ router/
   │  └─ index.js            # 路由表 + 登录守卫
   ├─ store/
   │  └─ index.js            # pinia：用户登录态
   ├─ utils/
   │  ├─ request.js          # axios 封装：带 token、按 code 判成败、1003 自动刷新重放
   │  ├─ storage.js          # localStorage 持久化（token / user）
   │  └─ format.js           # formatCents / formatTime（全站只准用这两个）
   └─ views/                 # 页面（占位，待实现）
      ├─ LoginView.vue
      ├─ RegisterView.vue
      └─ HomeView.vue
```

## 五条硬规矩（先记住，能避开大部分返工）

1. **HTTP 状态码几乎永远是 200**，成功与否看 body 里的 `code`（`code === 0` 才是成功）。
2. **金额一律整数「分」**：`balance_cents: 17000` = ¥170.00，显示只用 `formatCents()`，禁止浮点运算。
3. **只按 `code` 判断，不要解析 `message` 文案**。
4. **token 怎么带**：`access_token`（2h）→ `Authorization: Bearer`；`refresh_token` 是 HttpOnly Cookie，前端碰不到，只在刷新时调 `/auth/refresh`。
5. **三类接口凭证别混**：用户端 `Bearer`；管理端 `X-Admin-Key`；内网计费 `X-Internal-Key`（前端**永不调用** `/wallet/deduct`、`/wallet/refund`）。

## 关键错误码处置

| code | 含义 | 前端做法 |
|---|---|---|
| 1002 | 未认证 / token 无效 | 踢回登录 |
| 1003 | token 过期 | 自动刷新后重放原请求 |
| 3001 | 余额不足 | 提示 + 引导充值（**不要自动重试**） |
| 3003 | 幂等重复 | 当成功处理，取 `data` |
| 1001 | 参数校验失败 | 遍历 `data.errors` —— 它是**字符串数组**，每个非法属性一条 |

> 业务错误（`code !== 0`）会被拦截器**原样抛出**，页面 `catch (e)` 可直接读 `e.code` / `e.message` / `e.data`。

## 数据约定（实测口径，写页面前先看）

| 约定 | 说明 |
|---|---|
| **id 全是字符串** | `order_id` / `item_id` / `apply_id` / `transactions[].id` 都是 `string`（契约写的是 `int`）。`=== 27` 永远不成立；**也别按 id 排序**（字符串序 `"9" > "10"`） |
| **`1001` 的 `data.errors` 是字符串数组** | 不是对象数组，逐条展示即可 |
| **`3001` 分接口不一致** | `/wallet/deduct` 带 `{balance}`；**订单级 `/pay` 是 `null`** → 想显示"还差多少"要另调 `GET /wallet/balance` |
| **订单 `status` 语义有坑** | 受理那一刻订单就是 `status: 1`。**判"处理中"必须看 item 的 `status === 1`**，不能看订单 status |
| **`/pay` 字段名与契约不符** | 契约 `order_status` / `reason` → 实现 **`status` / `fail_reason`** |

### 支付是异步受理（重要）

`POST /shop/orders/:id/pay` 的扣费是**同步**的（返回时钱已扣），但**开通是异步**的（后台 worker 每 3 秒扫队列）。所以：

1. `code === 0` 只代表**已受理**，不代表开通成功
2. **绝不能再点一次支付**（重复支付返回 `4002`）
3. 每 **1~2 秒**拉 `GET /shop/orders/{id}`，**停止条件是「没有任何项 `status === 1`」**
4. 上限 **60 秒**；超时**不报错**，显示"处理中" + 给一个刷新按钮
5. 轮询中遇 `1003` → 先 refresh 再继续

## 下一步

认证 → 商品列表 → 下单 → 订单详情 → 支付 → 钱包余额 → 流水 → 充值申请。
字段与错误码一律以《云平台统一门户 API 契约 v1.0》为准。
