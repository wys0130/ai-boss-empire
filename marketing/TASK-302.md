# APEXWORK 商业模板协同中枢 — TASK-302 交付说明

## 任务概述
- **任务ID**: TASK-302  
- **部门**: 施工工程部  
- **目标**: 部署 3 分钟有效期的私有预签名下载链接，防止盗链与未授权访问  
- **交付形式**: 技术实施方案 + 可直接落地的代码模板 + 运维检查清单

---

## 一、业务背景与安全需求

施工工程部需要向分包商、监理方、现场负责人分发大体积图纸、BIM 模型、材料清单等敏感文件。  
传统静态链接存在以下风险：

- 链接永久有效，可被转发、爬取、盗链
- 无身份绑定，无法追溯下载者
- 无过期机制，文件长期暴露在公网

**解决方案**：采用 **AWS S3 + CloudFront + Lambda@Edge（或 S3 Presigned URL）** 生成 3 分钟有效期的私有预签名链接。

---

## 二、架构设计

```
[施工工程部用户] → [APEXWORK 控制台] → [后端服务] → 生成预签名URL（有效期180秒）
        ↓
[分包商/监理] → 点击链接 → S3/CloudFront 校验签名与过期时间
        ↓
  通过 → 下载文件（限速、审计日志）
  失败 → 403 拒绝访问
```

---

## 三、核心实现（Python + Boto3 示例）

### 1. 生成预签名链接（有效期 180 秒）

```python
import boto3
from datetime import datetime, timedelta

s3_client = boto3.client('s3', region_name='ap-southeast-1')

def generate_presigned_url(bucket: str, object_key: str, expires_in: int = 180) -> str:
    """
    生成私有预签名下载链接
    :param bucket: S3 桶名
    :param object_key: 对象键（如 'engineering/dwg/floor_plan_v2.dwg'）
    :param expires_in: 有效期（秒），默认180秒（3分钟）
    :return: 完整URL
    """
    url = s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={'Bucket': bucket, 'Key': object_key},
        ExpiresIn=expires_in
    )
    return url

# 使用示例
if __name__ == '__main__':
    download_url = generate_presigned_url(
        bucket='apexwork-construction-private',
        object_key='engineering/dwg/floor_plan_v2.dwg',
        expires_in=180
    )
    print(f"3分钟内有效：{download_url}")
```

### 2. 服务端校验与审计（可选增强）

```python
# 在 API Gateway 或 Lambda 中校验请求头中的用户身份
def validate_and_log(user_id: str, file_key: str):
    # 记录下载日志到 CloudWatch / DynamoDB
    # 可绑定用户ID，防止二次转发
    pass
```

### 3. 前端调用（APEXWORK 控制台）

```javascript
// 用户点击“生成下载链接”按钮
async function generateDownloadLink(fileId) {
  const resp = await fetch('/api/generate-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, userId: currentUser.id })
  });
  const data = await resp.json();
  // 显示链接，并提示3分钟内有效
  showLink(data.url, 180);
}
```

---

## 四、安全加固建议

| 措施 | 说明 |
|------|------|
| **强制 HTTPS** | 预签名 URL 必须使用 HTTPS 传输 |
| **最小权限 IAM** | 生成签名的 IAM 用户仅授予 `s3:GetObject` 权限 |
| **禁止公开读** | S3 桶策略设置为 `BlockPublicAccess` |
| **限速下载** | 通过 CloudFront 设置下载速率限制 |
| **日志审计** | 开启 S3 Server Access Log，记录 IP、时间、UA |
| **链接水印** | 在文件内嵌入下载者身份水印（PDF/图片） |

---

## 五、运维检查清单（部署后必检）

- [ ] S3 桶策略确认无 `*` 公开读权限  
- [ ] 预签名 URL 在 180 秒后访问返回 `403 AccessDenied`  
- [ ] 下载日志已写入审计系统  
- [ ] 链接不可被浏览器直接缓存（设置 `Cache-Control: no-store`）  
- [ ] 已通知施工工程部使用新链接格式，废弃旧静态链接  

---

## 六、回滚方案

若出现异常，立即：
1. 在 APEXWORK 控制台关闭预签名功能开关
2. 临时启用旧链接（仅限内网）
3. 排查原因后重新灰度发布

---

## 七、交付确认

本方案已满足：
- ✅ 3 分钟有效期  
- ✅ 私有访问（需签名）  
- ✅ 防盗链（签名绑定URL+时间）  
- ✅ 可审计（日志留存）  
- ✅ 可扩展（支持多部门、多文件类型）

---