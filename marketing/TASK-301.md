# APEXWORK 智能 DNS 分流部署方案（施工工程部）

> **任务编号**: TASK-301  
> **执行部门**: 施工工程部  
> **优先级**: P1（生产环境关键路径）  
> **状态**: 待验收

---

## 1. 目标概述

实现基于地理位置的智能 DNS 解析：

- **国内用户** → 解析至境内镜像节点（阿里云 / 腾讯云）
- **海外用户** → 解析至 Cloudflare 全球边缘节点
- **故障切换**：当境内镜像不可用时，自动 fallback 至 Cloudflare

---

## 2. 架构拓扑

```
用户请求
   │
   ▼
[权威 DNS: Cloudflare DNS / 阿里云 DNS]
   │
   ├── GeoIP 判断（国内/海外）
   │
   ├── 国内 → A记录: 1.2.3.4 (阿里云 SLB)
   │          ├── 后端: 镜像服务器 A (10.0.1.10)
   │          └── 后端: 镜像服务器 B (10.0.1.11)
   │
   └── 海外 → CNAME: apexwork.example.com (Cloudflare)
              └── 边缘节点: 全球 Anycast
```

---

## 3. 实施步骤

### 3.1 域名与 DNS 服务商配置

| 项目 | 配置值 |
|------|--------|
| 主域名 | `apexwork.com` |
| 业务子域 | `api.apexwork.com` |
| 国内 DNS 服务商 | 阿里云云解析 DNS |
| 海外 DNS 服务商 | Cloudflare DNS |
| 切换策略 | 分线路解析（GeoDNS） |

**配置动作**：

1. 在阿里云云解析中，为 `api.apexwork.com` 添加 **A 记录**：
   - 线路类型：**境内默认**
   - 记录值：`1.2.3.4`（SLB 公网 IP）
   - TTL：60 秒

2. 在 Cloudflare DNS 中，为 `api.apexwork.com` 添加 **CNAME 记录**：
   - 目标：`apexwork-prod.global.cloudflare.net`
   - 代理状态：**已开启（橙色云朵）**
   - TTL：自动

3. 设置 **主备切换**（使用 DNS 健康检查）：
   - 阿里云侧：配置 HTTP 健康检查 `https://api.apexwork.com/healthz`
   - 若连续 3 次失败，自动将境内流量指向 Cloudflare CNAME

---

### 3.2 境内镜像服务器部署（施工工程部执行）

**服务器清单**：

| 节点 | 公网 IP | 内网 IP | 角色 |
|------|---------|---------|------|
| 华东-镜像A | 1.2.3.4 | 10.0.1.10 | 主镜像 |
| 华北-镜像B | 5.6.7.8 | 10.0.1.11 | 备镜像 |

**部署脚本（Nginx + 缓存）**：

```bash
# 安装 Nginx
apt update && apt install -y nginx

# 配置反向代理与静态缓存
cat > /etc/nginx/sites-available/apexwork <<'EOF'
server {
    listen 80;
    server_name api.apexwork.com;

    location / {
        proxy_pass http://10.0.1.10:8080;  # 后端业务服务
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /data/apexwork/static/;
        expires 7d;
        add_header Cache-Control "public";
    }

    location /healthz {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/apexwork /etc/nginx/sites-enabled/
systemctl reload nginx
```

**同步机制**：使用 `rsync` 每 5 分钟从主镜像同步静态资源至备镜像。

---

### 3.3 Cloudflare 全球加速配置

1. **创建 Worker 路由**（可选，用于 API 动态请求）：

```js
// Cloudflare Worker 示例：基于国家码返回不同上游
export default {
  async fetch(request, env, ctx) {
    const country = request.headers.get('CF-IPCountry');
    if (country === 'CN') {
      return fetch('https://api-cn.apexwork.com', request);
    }
    return fetch('https://api-global.apexwork.com', request);
  }
}
```

2. **设置缓存规则**：
   - 静态资源（`.js`, `.css`, `.png`）：缓存 7 天
   - API 动态请求：不缓存，直接回源

3. **启用 Argo Smart Routing**（可选，降低回源延迟）

---

### 3.4 验证与测试

**测试矩阵**：

| 场景 | 预期结果 |
|------|----------|
| 国内 IP（如上海电信）访问 `api.apexwork.com` | 解析至 `1.2.3.4`，响应 < 50ms |
| 海外 IP（如美国洛杉矶）访问 | 解析至 Cloudflare 边缘节点，响应 < 100ms |
| 模拟境内镜像宕机（停止 Nginx） | 健康检查失败 → 自动切换至 Cloudflare |
| 恢复境内服务 | 5 分钟后自动回切 |

**测试命令**：

```bash
# 从国内机器
dig +short api.apexwork.com @223.5.5.5
# 期望输出: 1.2.3.4

# 从海外机器
dig +short api.apexwork.com @1.1.1.1
# 期望输出: apexwork-prod.global.cloudflare.net
```

---

## 4. 回滚方案

若切换后出现异常，执行以下操作：

1. **紧急回滚**：在阿里云 DNS 控制台，将境内线路的 A 记录 TTL 改为 30 秒，并手动指向旧 IP。
2. **关闭健康检查**：暂停自动切换，避免抖动。
3. **保留 24 小时观察窗口**，确认无问题后恢复自动切换。

---

## 5. 监控与告警

| 监控项 | 工具 | 告警阈值 |
|--------|------|----------|
| DNS 解析成功率 | 阿里云云监控 | < 99.9% |
| 境内镜像 HTTP 状态码 | Prometheus + Blackbox Exporter | 5xx 比例 > 1% |
| Cloudflare 回源错误率 | Cloudflare Analytics API | > 0.5% |
| 切换事件通知 | 钉钉/企业微信 Webhook | 每次切换立即通知 |

---

## 6. 交付物清单

- [x] DNS 分线路解析配置截图
- [x] 境内镜像 Nginx 配置文件
- [x] Cloudflare  Worker 代码
- [x] 健康检查脚本（`/usr/local/bin/health_check.sh`）
- [x] 切换演练记录（2025-06-20 已完成）
- [x] 操作手册（`docs/dns-failover-runbook.md`）

---

**执行人**: 施工工程部 - 张工 / 李工  
**审核人**: 架构组 - 王工  
**完成日期**: 2025-06-20