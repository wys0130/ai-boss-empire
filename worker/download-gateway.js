// Cloudflare Worker: 处理所有 /download/* 请求，验证 Ed25519 签名与 3 分钟有效期。

// 1. 引入 Web Crypto API 的 Ed25519 支持 (Cloudflare Workers 原生支持)
// 2. 环境变量需配置:
//    - PUBLIC_KEY: 用于验证签名的 Ed25519 公钥 (Base64 编码)
//    - TURSO_DB_URL / TURSO_DB_TOKEN: 用于查询订单状态 (可选，用于更严格的校验)

// 辅助函数：将 Base64 编码的公钥转换为 CryptoKey 对象
async function importPublicKey(base64Key) {
  const keyBuffer = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0)).buffer;
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'Ed25519' },
    true,
    ['verify']
  );
}

// 辅助函数：Base64url 解码
function base64urlToUint8Array(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const raw = atob(base64 + padding);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

// 辅助函数：将 Uint8Array 转换为十六进制字符串 (用于日志)
function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(2);
  }).join('');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);

    // 只处理 /download/ 开头的请求
    if (pathParts[0] !== 'download' || pathParts.length < 3) {
      return new Response('Not Found', { status: 404 });
    }

    // 路径格式: /download/{fileId}/{signature}
    const fileId = pathParts[1];
    const signatureBase64Url = pathParts[2];

    // 1. 从查询参数中获取过期时间 (由前端签发时生成)
    const expiresAt = url.searchParams.get('expires');

    // 2. 基础校验：过期时间必须存在且未过期
    if (!expiresAt) {
      return new Response('Unauthorized: Missing expiration', { status: 401 });
    }
    const expiryTimestamp = parseInt(expiresAt, 10);
    if (isNaN(expiryTimestamp) || Date.now() > expiryTimestamp) {
      return new Response('Forbidden: Link expired', { status: 403 });
    }

    // 3. 构造待签名的消息 (与前端签发时完全一致)
    const message = `${fileId}:${expiresAt}`;

    // 4. 导入公钥
    const publicKey = await importPublicKey(env.ED25519_PUBLIC_KEY);

    // 5. 解码签名
    const signatureBytes = base64urlToUint8Array(signatureBase64Url);

    // 6. 验证签名
    const encoder = new TextEncoder();
    const valid = await crypto.subtle.verify(
      'Ed25519',
      publicKey,
      signatureBytes,
      encoder.encode(message)
    );

    if (!valid) {
      return new Response('Forbidden: Invalid signature', { status: 403 });
    }

    // 7. (可选) 更严格的校验：查询 Turso 数据库，确认订单存在且状态为已支付
    //    这可以防止签名被滥用，即使签名有效但订单被退款。
    //    此处为示例，假设订单状态已通过其他方式验证。
    //    const orderCheck = await fetch(env.TURSO_DB_URL, { ... });
    //    if (!orderCheck.ok) return new Response('Forbidden: Order not paid', { status: 403 });

    // 8. 验证通过，重定向到真实的文件存储 (例如 R2 或 CDN)
    //    将 fileId 映射到实际存储路径
    const filePathMap = {
      'premium-ppt-pack': '/assets/paid/premium-ppt-pack-v2.zip',
      'excel-financial-model': '/assets/paid/excel-financial-model-pro.xlsx',
      // ... 更多映射
    };

    const targetPath = filePathMap[fileId];
    if (!targetPath) {
      return new Response('Not Found', { status: 404 });
    }

    // 重定向到 CDN 上的私有文件 (CDN 需配置为仅允许通过此 Worker 访问)
    // 或者，如果文件在 R2 中，可以直接从 R2 流式返回。
    const cdnUrl = `https://your-private-cdn.com${targetPath}`;
    return Response.redirect(cdnUrl, 302);
  },
};
```

### 2. 前端签发与下载按钮组件

这是收银台回调后，在用户浏览器本地生成签名并触发下载的组件。

```html
<!--