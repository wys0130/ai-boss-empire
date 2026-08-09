// 支付回调处理：在支付成功后激活下载按钮

// 模拟支付成功回调 (实际应由支付网关调用)
function onPaymentSuccess(orderData) {
  // 1. 更新 UI 状态
  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.disabled = false;
  downloadBtn.innerHTML = '<i class="bi bi-download me-2"></i>Download Your Files';
  downloadBtn.dataset.fileId = orderData.fileId; // 从订单数据获取文件 ID

  // 2. 隐藏支付按钮，显示下载按钮
  document.getElementById('payment-section').classList.add('d-none');
  document.getElementById('download-section').classList.remove('d-none');

  // 3. 记录订单信息到 localStorage (可选)
  localStorage.setItem('apexwork_last_order', JSON.stringify({
    orderId: orderData.orderId,
    fileId: orderData.fileId,
    timestamp: Date.now()
  }));
}

// 示例：模拟支付成功
// setTimeout(() => {
//   onPaymentSuccess({
//     orderId: 'ORD-20240601-001',
//     fileId: 'premium-ppt-pack'
//   });
// }, 2000);
```

### 4. 配置文件与部署说明

```json
//