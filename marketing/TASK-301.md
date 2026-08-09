# TASK-301 智能 DNS 分流施工方案（境内/海外双活）

> 施工工程部 · 版本 v1.0 · 状态：可交付

---

## 1. 任务目标

- 国内用户：解析至 **境内镜像**（阿里云 DNS + 高防 IP）
- 海外用户：解析至 **Cloudflare CDN**
- 故障切换：任一线路不可用，自动 fallback 至另一线路（降级策略）

---

## 2. 架构拓扑

```
                    ┌────────────────────────────┐
                    │     权威 DNS（云解析）       │
                    │   (阿里云 DNS / DNSPod)     │
                    └──────┬──────────┬──────────┘
                           │          │
              geo 判定      │          │   geo 判定
              (CN)          │          │   (非 CN)
                           ▼          ▼
              ┌─────────────────┐  ┌─────────────────┐
              │  境内镜像节点     │  │  Cloudflare CDN │
              │  (阿里云 ECS +   │  │  (海外边缘节点)  │
              │   高防 IP)      │  │                 │
              └─────────────────┘  └─────────────────┘
                           │          │
                           └────┬─────┘
                                ▼
                    ┌──────────────────────┐
                    │   源站（中心机房）      │
                    │  (API / 静态资源)     │
                    └──────────────────────┘
```

---

## 3. DNS 分流规则（核心配置）

### 3.1 线路分组

| 线路组 | 覆盖范围 | 解析目标 | 优先级 |
|--------|----------|----------|--------|
| `CN`   | 中国大陆 | 境内镜像 A 记录（如 1.2.3.4） | 1（最高） |
| `OVERSEAS` | 港澳台 + 海外 | Cloudflare CNAME（如 `cdn.example.com`） | 1 |
| `DEFAULT` | 未匹配 | Cloudflare CNAME（兜底） | 2 |

### 3.2 解析策略（伪代码）

```yaml
# 云解析配置（以阿里云 DNS 为例）
record:
  - name: "www.example.com"
    type: "A"
    line: "cn"
    value: "1.2.3.4"          # 境内镜像 IP
    ttl: 60
    status: "enable"

  - name: "www.example.com"
    type: "CNAME"
    line: "overseas"
    value: "cf.example.com"   # Cloudflare 别名
    ttl: 60
    status: "enable"

  - name: "www.example.com"
    type: "CNAME"
    line: "default"
    value: "cf.example.com"   # 兜底走 CF
    ttl: 120
    status: "enable"
```

---

## 4. 健康检查与故障切换

### 4.1 监控项

- **境内镜像**：TCP 443 端口连通性 + HTTP 状态码 200
- **Cloudflare**：通过 `cloudflare.com` 的 anycast IP 探测（或使用 CF 官方状态 API）

### 4.2 自动切换逻辑

```python
# 伪代码：健康检查失败触发切换
def health_check():
    cn_ok = check_tcp("1.2.3.4", 443)
    cf_ok = check_https("cf.example.com")

    if not cn_ok:
        # 将 CN 线路临时指向 CF
        dns_update("www.example.com", "cn", "CNAME", "cf.example.com")
        alert("境内镜像故障，已切换至 Cloudflare")

    if not cf_ok:
        # 将 overseas 线路指向境内镜像
        dns_update("www.example.com", "overseas", "A", "1.2.3.4")
        alert("Cloudflare 故障，已切换至境内镜像")
```

---

## 5. 实施步骤（Checklist）

- [ ] 1. 在云解析控制台创建域名，完成 NS 托管
- [ ] 2. 添加 `cn` 线路 A 记录 → 境内镜像 IP
- [ ] 3. 添加 `overseas` 线路 CNAME → Cloudflare 别名
- [ ] 4. 添加 `default` 线路 CNAME → Cloudflare（兜底）
- [ ] 5. 在 Cloudflare 侧添加域名，开启橙色云朵（代理）
- [ ] 6. 配置 Cloudflare 规则：缓存静态资源，动态请求回源
- [ ] 7. 部署健康检查脚本（每 60s 执行，失败自动切换）
- [ ] 8. 设置告警通知（钉钉/邮件/短信）
- [ ] 9. 验证测试：
  - 国内：`curl -I https://www.example.com` 应返回境内 IP
  - 海外：使用 `dig @8.8.8.8 www.example.com` 应返回 CF 节点

---

## 6. 验证命令（施工后自测）

```bash
# 国内视角（使用腾讯 DNS）
dig +short www.example.com @119.29.29.29
# 期望输出：1.2.3.4（境内镜像）

# 海外视角（使用 Google DNS）
dig +short www.example.com @8.8.8.8
# 期望输出：cf-edge-ip（Cloudflare 节点）

# 故障模拟：临时停掉境内镜像，观察 60s 后 CN 线路是否自动切至 CF
```

---

## 7. 回滚方案

- 若切换后出现异常，手动在云解析控制台将 `cn` 线路恢复为原 A 记录
- 或执行一键回滚脚本（备份原配置后批量恢复）

---

## 8. 附：推荐参数

| 项目 | 推荐值 |
|------|--------|
| TTL | 60s（切换敏感） |
| 健康检查频率 | 60s |
| 切换阈值 | 连续 2 次失败 |
| 恢复策略 | 连续 3 次成功自动回切 |

---

**施工负责人**：网络架构组  
**预计工期**：2 小时（含验证）  
**风险等级**：中（需监控切换瞬间连接中断）