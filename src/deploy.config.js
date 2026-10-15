// 部署形态开关：false = 测试（根路径 + /api）；true = 生产统一门户（门户接口 /portal/api）
export const MOUNTED = true

export const API_BASE = MOUNTED ? '/portal/api' : '/api'
