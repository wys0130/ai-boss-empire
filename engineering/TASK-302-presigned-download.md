# TASK-302：施工工程部 - 私有预签名下载链接部署

## 1. 目标概述
为施工工程部提供**3分钟有效期**的私有预签名下载链接，防止图纸、BOM清单、施工日志等敏感文件被盗链或长期暴露。

## 2. 核心机制（S3 / OSS 兼容）

### 2.1 预签名 URL 生成（服务端）
```python
# Python (boto3 for AWS S3)
import boto3
from datetime import timedelta

s3 = boto3.client('s3', region_name='ap-southeast-1')

def generate_presigned_url(bucket: str, key: str, expires_minutes: int = 3):
    url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': key},
        ExpiresIn=expires_minutes * 60
    )
    return url
```

### 2.2 关键参数
| 参数 | 值 | 说明 |
|------|-----|------|
| `ExpiresIn` | 180 秒 | 3分钟硬限制 |
| `ResponseContentDisposition` | `attachment; filename="..."` | 强制下载，不预览 |
| `ResponseCacheControl` | `no-store, no-cache` | 禁止缓存 |

### 2.3 权限模型（最小权限）
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::construction-eng-private/*",
      "Condition": {
        "IpAddress": {"aws:SourceIp": "10.20.0.0/16"},
        "NumericLessThan": {"s3:ExistingObjectTag/expiry": "180"}
      }
    }
  ]
}
```

## 3. 部署步骤（施工工程部）

### 3.1 文件上传（私有桶）
```bash
aws s3 cp ./drawings/A-101.pdf s3://construction-eng-private/drawings/A-101.pdf \
  --storage-class STANDARD_IA \
  --metadata "department=construction,owner=pm-lee"
```

### 3.2 生成链接（API 端点）
**POST /api/v1/secure-download**
```json
{
  "file_key": "drawings/A-101.pdf",
  "expires_in": 180
}
```

**响应：**
```json
{
  "url": "https://construction-eng-private.s3.ap-southeast-1.amazonaws.com/drawings/A-101.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA...&X-Amz-Date=20250617T030000Z&X-Amz-Expires=180&X-Amz-Signature=...",
  "expires_at": "2025-06-17T03:03:00Z",
  "policy": "3-minute-private-download"
}
```

### 3.3 前端调用（施工平板 / 桌面）
```javascript
// 3分钟倒计时，过期自动隐藏下载按钮
const downloadBtn = document.getElementById('downloadBtn');
let countdown = 180;

function refreshLink() {
  fetch('/api/v1/secure-download', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({file_key: currentFileKey})
  })
  .then(res => res.json())
  .then(data => {
    downloadBtn.href = data.url;
    startCountdown(data.expires_at);
  });
}

function startCountdown(expiry) {
  const interval = setInterval(() => {
    const remaining = Math.floor((new Date(expiry) - Date.now()) / 1000);
    if (remaining <= 0) {
      downloadBtn.disabled = true;
      downloadBtn.textContent = '链接已过期，请重新获取';
      clearInterval(interval);
    } else {
      downloadBtn.textContent = `下载 (${remaining}s)`;
    }
  }, 1000);
}
```

## 4. 安全加固（防盗链）

### 4.1 防盗链策略
- **Referer 白名单**：仅允许 `*.apexwork.internal` 域名
- **IP 限制**：仅允许施工工程部 VPN 网段（10.20.0.0/16）
- **User-Agent 校验**：拒绝非标准浏览器/脚本

### 4.2 日志审计
```json
{
  "event": "presigned_url_issued",
  "file": "drawings/A-101.pdf",
  "issued_by": "pm-lee@apexwork",
  "ip": "10.20.3.45",
  "expires_in": 180,
  "timestamp": "2025-06-17T03:00:00Z"
}
```

### 4.3 失败熔断
- 同一 IP 每分钟超过 10 次请求 → 封禁 15 分钟
- 同一文件 5 分钟内超过 3 次生成 → 需管理员审批

## 5. 验证清单

| 检查项 | 预期结果 |
|--------|----------|
| 链接生成后 3 分钟访问 | 200 OK |
| 链接生成后 4 分钟访问 | 403 AccessDenied |
| 非白名单 Referer 访问 | 403 Forbidden |
| 非 VPN IP 访问 | 403 Forbidden |
| 重复使用同一链接 | 仅首次有效（若启用一次性） |
| 下载文件名 | 正确显示 `A-101.pdf` |
| 浏览器缓存 | 无缓存（no-store） |

## 6. 回滚方案
```bash
# 紧急撤销所有预签名 URL
aws s3api delete-bucket-policy --bucket construction-eng-private
# 或切换至静态 IP 白名单模式
```

## 7. 运维监控
- CloudWatch 告警：`PresignedUrlIssued` 速率异常
- 审计日志保留 90 天
- 每周自动扫描过期链接

---
**部署负责人**：施工工程部 - 王工  
**审批人**：信息安全组 - 李总监  
**生效日期**：2025-06-17 03:00 UTC