/**
 * APEXWORK 支付代理 Worker
 * 部署至 Cloudflare Workers，用于代理支付请求，保护密钥安全
 */

// 支付配置（生产环境使用环境变量）
const PAYMENT_CONFIG = {
    // 支付宝配置
    alipay: {
        appId: 'YOUR_ALIPAY_APP_ID',
        privateKey: 'YOUR_ALIPAY_PRIVATE_KEY',
        gateway: 'https://openapi.alipay.com/gateway.do',
        notifyUrl: 'https://payment.apexwork.workers.dev/api/alipay/notify'
    },
    // 微信支付配置
    wechat: {
        appId: 'YOUR_WECHAT_APP_ID',
        mchId: 'YOUR_MERCHANT_ID',
        apiKey: 'YOUR_WECHAT_API_KEY',
        gateway: 'https://api.mch.weixin.qq.com',
        notifyUrl: 'https://payment.apexwork.workers.dev/api/wechat/notify'
    }
};

// 订单存储（使用 KV 存储）
const ORDER_STORE = 'APEXWORK_ORDERS';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // CORS 头
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        };

        // 处理预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // 路由分发
            if (path === '/api/create-order' && request.method === 'POST') {
                return await handleCreateOrder(request, env, corsHeaders);
            }
            
            if (path.startsWith('/api/payment-status/')) {
                const paymentId = path.split('/').pop();
                return await handlePaymentStatus(paymentId, env, corsHeaders);
            }

            // 支付回调
            if (path === '/api/alipay/notify') {
                return await handleAlipayNotify(request, env, corsHeaders);
            }
            
            if (path === '/api/wechat/notify') {
                return await handleWechatNotify(request, env, corsHeaders);
            }

            return new Response('Not Found', { status: 404, headers: corsHeaders });

        } catch (error) {
            console.error('Worker 异常:', error);
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

// 创建订单
async function handleCreateOrder(request, env, corsHeaders) {
    const { orderId, amount, method, product } = await request.json();
    
    // 验证参数
    if (!orderId || !amount || !method || !product) {
        return new Response(JSON.stringify({ error: '参数不完整' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 生成支付二维码
    let qrCodeUrl;
    let paymentId;
    
    if (method === 'alipay') {
        // 支付宝预下单
        const result = await createAlipayOrder(orderId, amount, product);
        qrCodeUrl = result.qrCodeUrl;
        paymentId = result.tradeNo;
    } else if (method === 'wechat') {
        // 微信预下单
        const result = await createWechatOrder(orderId, amount, product);
        qrCodeUrl = result.codeUrl;
        paymentId = result.prepayId;
    } else {
        return new Response(JSON.stringify({ error: '不支持的支付方式' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 存储订单信息
    const orderData = {
        orderId,
        paymentId,
        amount,
        method,
        product,
        status: 'pending',
        createdAt: Date.now()
    };
    
    await env.APEXWORK_ORDERS.put(paymentId, JSON.stringify(orderData));

    return new Response(JSON.stringify({
        paymentId,
        qrCodeUrl,
        orderId
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// 查询支付状态
async function handlePaymentStatus(paymentId, env, corsHeaders) {
    const orderData = await env.APEXWORK_ORDERS.get(paymentId, 'json');
    
    if (!orderData) {
        return new Response(JSON.stringify({ error: '订单不存在' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        status: orderData.status,
        license: orderData.status === 'success' ? orderData.license : null
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// 支付宝回调处理
async function handleAlipayNotify(request, env, corsHeaders) {
    const formData = await request.formData();
    const params = Object.fromEntries(formData);
    
    // 验证签名
    if (!verifyAlipaySign(params)) {
        return new Response('failure');
    }

    const tradeStatus = params.trade_status;
    const paymentId = params.trade_no;
    const orderId = params.out_trade_no;

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
        // 更新订单状态
        const orderData = await env.APEXWORK_ORDERS.get(paymentId, 'json');
        if (orderData) {
            orderData.status = 'success';
            orderData.license = generateLicense(orderId);
            await env.APEXWORK_ORDERS.put(paymentId, JSON.stringify(orderData));
        }
        return new Response('success');
    }

    return new Response('failure');
}

// 微信回调处理
async function handleWechatNotify(request, env, corsHeaders) {
    const body = await request.text();
    
    // 验证签名
    if (!verifyWechatSign(body)) {
        return new Response('<xml><return_code>FAIL</return_code><return_msg>签名失败</return_msg></xml>', {
            headers: { 'Content-Type': 'application/xml' }
        });
    }

    const xmlData = parseXml(body);
    const resultCode = xmlData.result_code;
    const paymentId = xmlData.transaction_id;
    const orderId = xmlData.out_trade_no;

    if (resultCode === 'SUCCESS') {
        // 更新订单状态
        const orderData = await env.APEXWORK_ORDERS.get(paymentId, 'json');
        if (orderData) {
            orderData.status = 'success';
            orderData.license = generateLicense(orderId);
            await env.APEXWORK_ORDERS.put(paymentId, JSON.stringify(orderData));
        }
        return new Response('<xml><return_code>SUCCESS</return_code><return_msg>OK</return_msg></xml>', {
            headers: { 'Content-Type': 'application/xml' }
        });
    }

    return new Response('<xml><return_code>FAIL</return_code><return_msg>处理失败</return_msg></xml>', {
        headers: { 'Content-Type': 'application/xml' }
    });
}

// 生成授权许可证
function generateLicense(orderId) {
    // 使用 Web Crypto API 生成 Ed25519 签名
    const crypto = require('crypto');
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    
    const payload = JSON.stringify({
        orderId,
        timestamp: Date.now(),
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000)
    });
    
    const signature = crypto.sign(null, Buffer.from(payload), privateKey);
    
    return {
        payload: Buffer.from(payload).toString('base64'),
        signature: signature.toString('base64'),
        publicKey: publicKey.export({ type: 'spki', format: 'pem' })
    };
}

// 辅助函数
function createAlipayOrder(orderId, amount, product) {
    // 实现支付宝预下单逻辑
    // 使用支付宝 SDK 或直接调用 API
    // 这里返回模拟数据
    return {
        qrCodeUrl: `https://qr.alipay.com/${orderId}`,
        tradeNo: `ALI${Date.now()}`
    };
}

function createWechatOrder(orderId, amount, product) {
    // 实现微信预下单逻辑
    // 使用微信支付 API
    // 这里返回模拟数据
    return {
        codeUrl: `weixin://wxpay/bizpayurl?pr=${orderId}`,
        prepayId: `WX${Date.now()}`
    };
}

function verifyAlipaySign(params) {
    // 实现支付宝签名验证
    return true; // 生产环境需要实现真实验证
}

function verifyWechatSign(body) {
    // 实现微信签名验证
    return true; // 生产环境需要实现真实验证
}

function parseXml(xml) {
    // 简单的 XML 解析
    const result = {};
    const regex = /<(\w+)>([^<]+)<\/\1>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
        result[match[1]] = match[2];
    }
    return result;
}
```

---

###