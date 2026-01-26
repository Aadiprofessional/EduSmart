// Mock Server Implementation for Antom Payment Integration
// This is a demonstration of how the server-side APIs would be implemented

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Antom Configuration (from environment variables)
const ANTOM_CONFIG = {
  clientId: process.env.ANTOM_CLIENT_ID || '5YEX0L302DFU04384',
  antomPublicKey: process.env.ANTOM_PUBLIC_KEY || 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0XBVdJHHjFm5ueULwMSPAkUcA3zJPvgxLrUzc4jUBsoFg5uqSvkoJnAdqNQwTMw9LZo8usG2A43uZzUIcw7Nw1oJipxcuFvFNuFJikZSnlfoRRE1TK/U2xNoADjHtDlcdpZjDcukytpY/5S+S6e17VIZUu+N+38nUaedL6fTZNapJDO6Min6jaPawHkazBbzahkiSQLiuWb5I+1QSxz4Tg98Yd3XMwa+fh0xKpXawn6fqDKyfKXQZMxbd/Gw9W84pzrWrsB8cZBhqwzHMkEEallarTCe+AFTv6R5P06AjGKw/1P/+HPrYrBX+CSEmL+lDcRKvFiaeS98Dhf4meu9tQIDAQAB',
  merchantPrivateKey: process.env.ANTOM_PRIVATE_KEY || 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2YimUOYiFij0WGduZP/71uF2dsY8envBCIn/KGN0OlWWVXOYDVXEEK58JbEens1KyJ/oHoudMXkexGhQo1ovba4XKsITLX4NZge41ywOOZRzwxLKp+9NjPLNtR9cxV5cUAZcGkNLzMZoGnC4Uy6wX6niOpwx7EurZAvu/+ZKv8TRpJ5Gu/m75yxVy5s72tk+qO8J4iKW2956dsOXZ7kPvEo8yGV6zl8PeB752dffNgEJeWpF+DUH/drWXvP+Jm5c6OsjprZv5GoVixNFod30igJkOsjwiJP5cFx/D6q6Ko14x7cwprKZEgpSPg/TKYifpUJVo/v5uQSOWZdRnhENPAgMBAAECggEAdj19p1MFZ04P/FwXOmt65+L3Dl0m5Ds2mCm1n1gvOF0y1nq7xD2IX6PIH1vLuLVRT58LQhgizCfzYqX9m9w8H6y9uIJoFVF+3nCV9tn/HDoBYTakff99NEEOMjL5GEwo7hd5yg/qMzBdIxvt5B2HHJouPo2eUcwZ5UdB31v19YnWu3RacQQX+JOjiSxZtCD/EnyaynsT80DyH2qkUrJypyY6LqjIWjN8/L4hJKA4RvYxlX+NtDCA9/yft4PmycW4JwTL4R24FLmrNtrgSqFw+oabzJKDNixVsGIT9Wey5iIwL0myv9ofJDwNojH1IVyGW3Kus3NRB2S6ekn3Z9ETgQKBgQD/0UOeDUDWk1+FcdinR5LK+GseS5FroURmztEBBK/6rjJ6OvmrChEn/fml/IiR3n9p20zDB7gqWbC0vGuTWLjF1Pg7ne9LmC7BLAzWfif4fljlljE2z8CEBZAxjFFbuGKYgrlNy7GBPaN9rK2nyzhcClRodkvCN91m0CMhXgeCpwKBgQC2g3uCzqAW/4kiODLqaq0E16Gc2r8IcmkyHjv8Lb/SCmbk+ZzKovJ9UFi5jNzJhgdl3Z5L3GLxhFX76kl6ww4Xc9XW3U2ot8UoOrseT3nRTnRmeSQKbVcN86qfN6xchd7iZ196NmDCm8u/y8A6d5wVqxC+rGjhh0kqupGkzoiXGQKBgFfFnyOdfH+i9QU+OI28mvsVHPu6Bd0d6fA0SbXFu/OQzTTvAzbSL2y/UWbILLuP0buqSL4p6eBuAZkhhO97Y3pNRhZ+a9pODsyspoL5qhEymKG9VIlv4qfpmL3HXSrRKtMVFytAFlk3ot693p9RtLavvKJS5E9xB3/9LfCG6KDFAoGAIAYD5tiwWDiv7BQmQuFCyGW5UpdDC41fjc6mQcIZNRZkJWryqs9acshlOPFRT/63T5VKEA90QOIyYAgkqmiNEWpeq9uao67S5hMf/9p8ClCUteItg7LZonYNivAuyvEmQV1X8E6YPa0uW9G5Qcj41whz4LDJmkCtgtTHdz5R0wkCgYEAlggQkGTEtFMFBDCA8KLNWbRTP4ZoBwzHzWeS244o0Qnt5Dihe77G/weDyiyxSzKBj2RX7D27y686b9fUdUchEAwNB/ou8eWvqwrgxDL0LN1xTZzGyT0KZCEBQ8eJe3vMgB3phYtzMGFqEs42gzOWsNgxOnGZzR6y20nbKVXfuGs=',
  domain: process.env.ANTOM_DOMAIN || 'https://open-sea-global.alipay.com',
  environment: process.env.ANTOM_ENVIRONMENT || 'sandbox',
  notifyUrl: process.env.ANTOM_NOTIFY_URL || 'https://your-domain.com/api/antom/payment-notification',
  redirectUrl: process.env.ANTOM_REDIRECT_URL || 'https://your-domain.com/payment-result'
};

// Helper functions
function generatePaymentRequestId() {
  return `edusmart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generatePaymentId() {
  return `${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${Date.now()}XXXX`;
}

function signRequest(data, privateKey) {
  // This would use the actual private key to sign the request
  // For demo purposes, we'll return a mock signature
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('base64');
}

function verifySignature(data, signature, publicKey) {
  // This would use the actual public key to verify the signature
  // For demo purposes, we'll return true
  return true;
}

// Mock Antom API client
class AntomAPIClient {
  constructor(config) {
    this.config = config;
  }

  async createPaymentSession(request) {
    // Mock implementation of createPaymentSession
    const paymentRequestId = generatePaymentRequestId();
    const paymentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // In real implementation, this would call Antom's API
    const mockResponse = {
      paymentSessionData: `mock_session_data_${paymentSessionId}`,
      paymentSessionId: paymentSessionId,
      paymentSessionExpiryTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      paymentRequestId: paymentRequestId,
      result: {
        resultCode: 'SUCCESS',
        resultStatus: 'S',
        resultMessage: 'success'
      }
    };

    return { success: true, data: mockResponse };
  }

  async inquirePayment(paymentRequestId) {
    // Mock implementation of inquirePayment
    const mockResponse = {
      paymentId: generatePaymentId(),
      paymentRequestId: paymentRequestId,
      paymentStatus: 'SUCCESS',
      paymentAmount: {
        value: '4200',
        currency: 'USD'
      },
      paymentTime: new Date().toISOString(),
      paymentMethod: 'ALIPAY',
      result: {
        resultCode: 'SUCCESS',
        resultStatus: 'S',
        resultMessage: 'success'
      }
    };

    return { success: true, data: mockResponse };
  }
}

const antomClient = new AntomAPIClient(ANTOM_CONFIG);

// API Routes

// 1. Create Payment Session
app.post('/api/antom/create-payment-session', async (req, res) => {
  try {
    const { planId, addonId, amount, currency, paymentMethod, orderDescription, buyerInfo } = req.body;

    // Validate required fields
    if (!amount || !currency || !paymentMethod || !buyerInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create payment session request
    const paymentSessionRequest = {
      productCode: 'CASHIER_PAYMENT',
      paymentAmount: {
        value: (amount * 100).toString(), // Convert to cents
        currency: currency
      },
      paymentMethod: {
        paymentMethodType: paymentMethod
      },
      order: {
        referenceOrderId: planId || addonId || `order_${Date.now()}`,
        orderDescription: orderDescription,
        orderAmount: {
          value: (amount * 100).toString(),
          currency: currency
        },
        buyer: {
          referenceBuyerId: buyerInfo.userId,
          buyerName: buyerInfo.name,
          buyerEmail: buyerInfo.email
        }
      },
      paymentNotifyUrl: ANTOM_CONFIG.notifyUrl,
      paymentRedirectUrl: ANTOM_CONFIG.redirectUrl
    };

    // Call Antom API
    const result = await antomClient.createPaymentSession(paymentSessionRequest);

    if (result.success) {
      // Store payment session in database (mock)
      console.log('Payment session created:', result.data);
      
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to create payment session'
      });
    }
  } catch (error) {
    console.error('Create payment session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 2. Payment Notification Webhook
app.post('/api/antom/payment-notification', async (req, res) => {
  try {
    const notificationData = req.body;
    const signature = req.headers['x-alipay-signature'];

    // Verify signature
    const isValidSignature = verifySignature(notificationData, signature, ANTOM_CONFIG.antomPublicKey);
    
    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Process payment notification
    const { paymentId, paymentRequestId, paymentAmount, result } = notificationData;
    
    if (result.resultStatus === 'S') {
      // Payment successful
      console.log('Payment successful:', {
        paymentId,
        paymentRequestId,
        amount: paymentAmount
      });
      
      // Update database with payment success
      // Update user subscription status
      // Send confirmation email
      
    } else {
      // Payment failed
      console.log('Payment failed:', {
        paymentId,
        paymentRequestId,
        result
      });
      
      // Update database with payment failure
      // Send failure notification
    }

    // Return success response to Antom
    res.json({
      success: true
    });
  } catch (error) {
    console.error('Payment notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 3. Inquire Payment Status
app.post('/api/antom/inquire-payment', async (req, res) => {
  try {
    const { paymentRequestId } = req.body;

    if (!paymentRequestId) {
      return res.status(400).json({
        success: false,
        error: 'Payment request ID is required'
      });
    }

    // Call Antom API
    const result = await antomClient.inquirePayment(paymentRequestId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to inquire payment'
      });
    }
  } catch (error) {
    console.error('Inquire payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 4. Get Supported Payment Methods
app.get('/api/antom/payment-methods', async (req, res) => {
  try {
    const supportedMethods = [
      'ALIPAY',
      'WECHATPAY',
      'SHOPEEPAY_SG',
      'GCASH',
      'GRABPAY',
      'DANA',
      'TOUCH_N_GO'
    ];

    res.json({
      success: true,
      data: supportedMethods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 5. Verify Payment Signature
app.post('/api/antom/verify-signature', async (req, res) => {
  try {
    const { data, signature } = req.body;

    if (!data || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Data and signature are required'
      });
    }

    const isValid = verifySignature(data, signature, ANTOM_CONFIG.antomPublicKey);

    res.json({
      success: true,
      data: {
        isValid: isValid
      }
    });
  } catch (error) {
    console.error('Verify signature error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Antom Payment Server running on port ${PORT}`);
  console.log('Environment:', ANTOM_CONFIG.environment);
  console.log('Client ID:', ANTOM_CONFIG.clientId);
});

module.exports = app; 