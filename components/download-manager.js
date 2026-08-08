// 前端下载管理器：负责生成 Ed25519 签名并触发下载

class DownloadManager {
  constructor() {
    this.privateKey = null;
    this.publicKey = null;
    this.init();
  }

  async init() {
    // 1. 从 localStorage 获取或生成密钥对
    const storedKeys = localStorage.getItem('apexwork_ed25519_keys');
    if (storedKeys) {
      const keyPair = JSON.parse(storedKeys);
      this.privateKey = await this.importPrivateKey(keyPair.privateKey);
      this.publicKey = keyPair.publicKey;
    } else {
      await this.generateAndStoreKeys();
    }
  }

  async generateAndStoreKeys() {
    // 生成 Ed25519 密钥对
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );

    // 导出私钥 (PKCS#8) 和公钥 (SPKI) 为 Base64
    const exportedPrivateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const exportedPublicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);

    const privateKeyBase64 = this.arrayBufferToBase64(exportedPrivateKey);
    const publicKeyBase64 = this.arrayBufferToBase64(exportedPublicKey);

    // 存储到 localStorage
    localStorage.setItem('apexwork_ed25519_keys', JSON.stringify({
      privateKey: privateKeyBase64,
      publicKey: publicKeyBase64
    }));

    this.privateKey = keyPair.privateKey;
    this.publicKey = publicKeyBase64;
  }

  async importPrivateKey(base64Key) {
    const keyBuffer = this.base64ToArrayBuffer(base64Key);
    return crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'Ed25519' },
      true,
      ['sign']
    );
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async generateSignedUrl(fileId) {
    // 1. 生成过期时间 (3分钟后)
    const expiresAt = Date.now() + 3 * 60 * 1000;

    // 2. 构造待签名消息
    const message = `${fileId}:${expiresAt}`;

    // 3. 签名
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      'Ed25519',
      this.privateKey,
      encoder.encode(message)
    );

    // 4. 将签名转为 Base64url 格式
    const signatureBase64 = this.arrayBufferToBase64(signature);
    const signatureBase64Url = signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // 5. 构造完整 URL
    const downloadUrl = `/download/${fileId}/${signatureBase64Url}?expires=${expiresAt}`;
    return downloadUrl;
  }

  async handleDownload(fileId) {
    const downloadBtn = document.getElementById('download-btn');
    const errorDiv = document.getElementById('download-error');

    try {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Generating secure link...';

      // 生成签名 URL
      const signedUrl = await this.generateSignedUrl(fileId);

      // 触发下载
      window.location.href = signedUrl;

      // 下载成功后显示成功状态
      downloadBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Download Started!';
      setTimeout(() => {
        downloadBtn.innerHTML = '<i class="bi bi-download me-2"></i>Download Again';
        downloadBtn.disabled = false;
      }, 3000);

    } catch (error) {
      console.error('Download failed:', error);
      errorDiv.textContent = 'Failed to generate secure link. Please try again.';
      errorDiv.classList.remove('d-none');
      downloadBtn.innerHTML = '<i class="bi bi-download me-2"></i>Download';
      downloadBtn.disabled = false;
    }
  }
}

// 初始化下载管理器
const downloadManager = new DownloadManager();

// 监听下载按钮点击事件
document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      // 从按钮的 data 属性或全局变量获取 fileId
      const fileId = downloadBtn.dataset.fileId || 'premium-ppt-pack';
      downloadManager.handleDownload(fileId);
    });
  }
});
```

### 3. 收银台回调集成示例

这是支付成功后，如何调用下载管理器并激活按钮的示例。

```javascript
//