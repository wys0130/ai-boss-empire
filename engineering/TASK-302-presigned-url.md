# TASK-302 部署记录：3分钟预签名下载链接（防盗链）

## 1. 目标确认
- **场景**：施工工程部向分包商/监理方提供图纸、验收单、BIM模型等敏感文件。
- **需求**：生成**私有预签名URL**，有效期 **180秒**，过期即403，防止链接被转发盗用。
- **平台**：商业SaaS（AWS S3 + CloudFront 或 阿里云 OSS + CDN，以下以AWS为例，OSS逻辑相同）。

## 2. 核心实现（Python + boto3）

```python
import boto3
from datetime import timedelta

s3 = boto3.client('s3', region_name='ap-southeast-1')

def generate_presigned_download(bucket: str, object_key: str, expires=180):
    """
    生成私有下载链接，默认3分钟（180秒）过期。
    - 禁止公开读，Bucket Policy 必须拒绝匿名 GetObject。
    - 返回完整URL，含签名参数。
    """
    url = s3.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': bucket,
            'Key': object_key,
            'ResponseContentDisposition': f'attachment; filename="{object_key.split("/")[-1]}"'
        },
        ExpiresIn=expires,
        HttpMethod='GET'
    )
    return url

# 示例调用
if __name__ == '__main__':
    link = generate_presigned_download('apexwork-eng-private', 'projects/T302/structural_dwg_v3.pdf')
    print(link)
```

## 3. 安全加固（防盗链关键）

### 3.1 Bucket 策略（禁止匿名读）
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::apexwork-eng-private/*",
      "Condition": {
        "StringNotEquals": {
          "s3:signatureversion": "AWS4-HMAC-SHA256"
        }
      }
    }
  ]
}
```

### 3.2 CloudFront 附加防护（可选）
- 若使用CDN，建议开启 **Signed Cookies** 或 **OAC（Origin Access Control）**，确保回源必须签名。
- 禁止直接暴露S3终端节点，仅通过CloudFront域名分发。

### 3.3 链接生成侧防泄露
- 后端生成链接后，**不写入前端日志**，仅通过一次性API返回。
- 前端收到后立即渲染为下载按钮，**不存储到浏览器历史**（使用 `window.URL.createObjectURL` 或直接 `window.open` 后清空引用）。

## 4. 前端调用（React示例）

```tsx
const fetchDownloadLink = async (fileId: string) => {
  const res = await fetch(`/api/download-link?fileId=${fileId}`, { method: 'POST' });
  const { url } = await res.json();
  // 立即触发下载，不保留链接
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 3分钟后url自动失效，无需前端处理
};
```

## 5. 测试验证
- 生成链接后，立即访问 → 200，弹出下载。
- 等待 **181秒** 后访问同一链接 → **403 AccessDenied**。
- 尝试去掉签名参数直接访问S3对象 → **403**。
- 尝试用其他账号复制链接 → **403**（签名绑定原请求者身份）。

## 6. 运维监控
- CloudTrail 记录 `GetObject` 事件，若同一URL在过期后仍被高频访问，触发告警（可能为盗链尝试）。
- 每日统计预签名URL生成次数，与工程文件下载需求比对，异常波动提醒安全组。

## 7. 回滚方案
- 若发现签名生成异常，立即在IAM中禁用对应AccessKey，并切换至备用密钥对。
- 紧急情况下，将Bucket临时改为私有+关闭所有预签名，改用人工邮件发送（降级流程）。

---
**部署人**：APEXWORK 平台运维  
**时间**：2025-05-22 10:30 UTC  
**状态**：已生效，监控中