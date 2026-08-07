# APEXWORK 商业模板协同中枢 | TASK-302

## 任务概述
- **任务ID**: TASK-302  
- **目标**: 为施工工程部部署 3 分钟有效期的私有预签名下载链接，防止盗链  
- **部门**: 施工工程部  
- **状态**: 已部署 / 生产可用  

---

## 背景

施工工程部每天对外分发大量图纸、BOM、验收单、现场照片等敏感文件。  
传统直链存在三个致命问题：

1. **永久有效** → 一旦泄露，文件永久暴露  
2. **无身份绑定** → 任何人拿到 URL 即可下载  
3. **无审计** → 无法追踪谁在何时下载了哪个文件  

本次部署将彻底解决以上问题。

---

## 解决方案：私有预签名 URL（3 分钟 TTL）

### 核心机制

```
生成流程：
  客户端请求 → APEXWORK 鉴权（IAM/SSO） → 生成预签名 URL（TTL=180s） → 返回给客户端

下载流程：
  客户端携带 URL → S3/OSS 校验签名 + 过期时间 → 通过则返回文件流，否则 403
```

### 技术规格

| 项目 | 值 |
|------|-----|
| 签名算法 | AWS Signature V4 / 阿里云 OSS V1（按存储端自动适配） |
| 有效期 | 180 秒（3 分钟） |
| 签名绑定 | `method=GET` + `object-key` + `expires` + `secret-key` |
| 防盗链 | 禁止 Referer 为空/跨域，强制 HTTPS |
| 访问控制 | 仅限已登录施工工程部成员（RBAC 角色：`site-engineer` / `project-admin`） |
| 审计日志 | 每次生成和下载均记录至 `audit://construction/2025-*` |

---

## 部署内容

### 1. 新增 API 端点

```
POST /api/v1/construction/presign
```

请求示例：
```json
{
  "object_key": "projects/杭州西站/结构图_v3.dwg",
  "ttl_seconds": 180,
  "requester": "user:zhang.wei@apexwork.cn"
}
```

响应示例：
```json
{
  "url": "https://storage.apexwork.cn/construction/...?...&X-Amz-Expires=180&X-Amz-Signature=...",
  "expires_at": "2025-04-01T10:23:45Z",
  "note": "该链接 3 分钟后自动失效，请勿转发"
}
```

### 2. 存储端策略（S3 / OSS）

- Bucket Policy 禁止公共读  
- 仅允许 `PresignedGetObject` 操作  
- 强制 `SecureTransport`（HTTPS）  
- 开启 Access Logging 至审计桶

### 3. 前端集成

施工工程部文件管理界面已更新：

- 每个文件行新增「生成 3 分钟链接」按钮  
- 点击后显示倒计时，过期自动置灰  
- 复制到剪贴板时自动附带 `[APEXWORK 3min 有效]` 前缀提示

---

## 安全加固细节

- **防重放**：签名内嵌 `X-Amz-Date`，服务端拒绝时间偏差 > 60s 的请求  
- **防枚举**：object-key 使用 UUID 前缀，无法猜测  
- **防代理缓存**：响应头 `Cache-Control: no-store`  
- **IP 限制（可选）**：可配置仅允许公司 VPN 出口 IP 访问  
- **下载次数限制（可选）**：单链接最多下载 3 次（通过 DynamoDB 计数器实现）

---

## 审计与监控

- 每次生成：记录 `user_id`, `object_key`, `ip`, `timestamp`  
- 每次下载：记录 `url_hash`, `user_agent`, `ip`, `status_code`  
- 异常检测：同一 URL 在 1 分钟内被不同 IP 访问 → 触发告警至安全组

---

## 使用示例（施工工程部）

```bash
# 生成链接（内部工具）
curl -X POST https://api.apexwork.cn/api/v1/construction/presign \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"object_key":"projects/杭州西站/结构图_v3.dwg"}'

# 返回
{
  "url": "https://storage.apexwork.cn/construction/9f2c.../结构图_v3.dwg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=180&X-Amz-Signature=...",
  "expires_at": "2025-04-01T10:23:45Z"
}

# 3 分钟内下载
curl -L "https://storage.apexwork.cn/construction/9f2c...?...&X-Amz-Signature=..."

# 3 分钟后下载 → 403 AccessDenied
```

---

## 验证结果

| 测试场景 | 结果 |
|----------|------|
| 有效期内下载 | ✅ 200 OK，文件完整 |
| 过期后下载 | ✅ 403 AccessDenied |
| 篡改签名 | ✅ 403 SignatureDoesNotMatch |
| 非授权用户生成链接 | ✅ 401 Unauthorized |
| 跨域 Referer 下载 | ✅ 403 Forbidden |
| 审计日志记录 | ✅ 完整记录 |

---

## 回滚方案

若出现异常，可一键关闭预签名功能并恢复为内部直链（仅限内网访问），操作路径：

```
APEXWORK 控制台 → 施工工程部 → 文件服务 → 安全模式 → 切换为「内网直链」
```

---

## 交付物清单

- [x] 预签名 API 部署（生产环境）  
- [x] 存储桶策略更新  
- [x] 前端按钮及倒计时 UI  
- [x] 审计日志接入 SIEM  
- [x] 操作手册已推送至施工工程部 Wiki  
- [x] 安全测试报告已归档

---

## 备注

- 默认 TTL 为 180 秒，如需调整（如 60 秒或 300 秒），请在配置中心修改 `presign.ttl`  
- 该机制同样适用于其他部门（采购、质检、监理），只需替换 RBAC 角色即可

---