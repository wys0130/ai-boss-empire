# TASK-302 部署记录：3分钟预签名下载链接（防盗链）

## 1. 目标确认
- **部门**：施工工程部
- **需求**：为大型施工图纸 / BIM 模型 / 现场视频提供临时下载链接
- **安全要求**：链接有效期 3 分钟，过期即失效，防止外部盗链与长期分享

## 2. 技术选型（基于现有 APEXWORK 平台）
| 组件 | 方案 |
|------|------|
| 对象存储 | AWS S3（或兼容 MinIO） |
| 签名算法 | AWS Signature V4（预签名 URL） |
| 有效期 | 180 秒（3 分钟） |
| 触发方式 | 工程部后台点击“生成临时链接” |
| 审计 | 记录生成人、文件名、IP、时间戳 |

## 3. 核心代码（Node.js / TypeScript）

```typescript
// services/presignedDownload.service.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

/**
 * 生成3分钟有效的私有下载链接
 * @param bucket 存储桶
 * @param key 对象键（如：projects/2025/structural-model.rvt）
 * @param userId 操作人ID（用于审计）
 */
export async function generatePresignedDownloadUrl(
  bucket: string,
  key: string,
  userId: string
): Promise<{ url: string; expiresAt: Date }> {
  // 1. 校验权限（此处可接入 RBAC）
  await assertCanDownload(userId, key);

  // 2. 创建命令
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });

  // 3. 设置 180 秒有效期（3分钟）
  const expiresIn = 180;
  const url = await getSignedUrl(s3, command, { expiresIn });

  // 4. 审计日志
  await auditLog({
    action: "PRESIGNED_URL_GENERATED",
    userId,
    key,
    expiresIn,
    timestamp: new Date().toISOString(),
  });

  return {
    url,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}
```

## 4. API 路由（Express 示例）

```typescript
// routes/download.route.ts
import { Router } from "express";
import { generatePresignedDownloadUrl } from "../services/presignedDownload.service";

const router = Router();

/**
 * POST /api/v1/engineering/download-link
 * Body: { "fileKey": "projects/2025/structural-model.rvt" }
 * 响应: { "url": "https://...", "expiresAt": "2025-01-01T12:00:00Z" }
 */
router.post("/download-link", async (req, res) => {
  const { fileKey } = req.body;
  const userId = req.user.id; // 来自 JWT 中间件

  try {
    const result = await generatePresignedDownloadUrl(
      process.env.S3_BUCKET!,
      fileKey,
      userId
    );

    // 前端可显示倒计时，3分钟后按钮置灰
    res.json({
      success: true,
      data: result,
      message: "链接将在 3 分钟后失效，请及时下载",
    });
  } catch (error) {
    res.status(403).json({ success: false, message: "无权生成或文件不存在" });
  }
});
```

## 5. 前端交互（工程部后台）

```html
<!-- 工程部下载面板 -->
<div id="download-panel">
  <select id="file-select">
    <option value="projects/2025/structural-model.rvt">结构模型 RVT</option>
    <option value="projects/2025/site-photos.zip">现场照片 ZIP</option>
  </select>
  <button id="generate-btn" onclick="generateLink()">生成3分钟临时链接</button>
  <div id="result-area"></div>
</div>

<script>
async function generateLink() {
  const fileKey = document.getElementById("file-select").value;
  const res = await fetch("/api/v1/engineering/download-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileKey }),
  });
  const { data } = await res.json();

  // 显示链接 + 倒计时
  const area = document.getElementById("result-area");
  area.innerHTML = `
    <p>下载链接（3分钟内有效）：</p>
    <a href="${data.url}" target="_blank">点击下载</a>
    <p>剩余时间：<span id="countdown">180</span> 秒</p>
  `;

  // 倒计时逻辑
  let remaining = 180;
  const timer = setInterval(() => {
    remaining--;
    document.getElementById("countdown").textContent = remaining;
    if (remaining <= 0) {
      clearInterval(timer);
      area.innerHTML = "<p style='color:red'>链接已过期，请重新生成</p>";
    }
  }, 1000);
}
</script>
```

## 6. 安全加固说明
1. **防盗链**：链接签名包含 `X-Amz-Signature`，无法篡改或延长有效期
2. **IP 绑定（可选）**：可在生成时记录 IP，下载时校验（需自定义中间件）
3. **文件权限**：S3 Bucket 必须为 **私有**（Block Public Access 开启）
4. **审计追踪**：所有生成记录写入 `audit_log` 表，保留 180 天
5. **限流**：同一用户每分钟最多生成 5 个链接，防止滥用

## 7. 部署检查清单
- [ ] S3 Bucket 策略：`{"Effect": "Deny", "Principal": "*", "Action": "s3:GetObject", "Resource": "arn:aws:s3:::bucket/*", "Condition": {"Bool": {"aws:SecureTransport": "false"}}}`
- [ ] 环境变量：`AWS_REGION`, `S3_BUCKET`, `JWT_SECRET`
- [ ] 日志监控：CloudWatch 告警（异常高频生成）
- [ ] 前端倒计时与后端过期时间保持一致（以服务器时间为准）

## 8. 验收标准
- [ ] 生成的 URL 在 180 秒内可正常下载
- [ ] 超过 180 秒后访问返回 `403 Forbidden`
- [ ] 非工程部角色调用 API 返回 `403`
- [ ] 审计日志完整记录每次生成操作

---
**部署人**：平台运维组  
**日期**：2025-01-15  
**状态**：✅ 已上线