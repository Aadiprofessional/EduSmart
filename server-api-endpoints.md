# Antom Payment Server API Endpoints

This document describes the server-side API endpoints needed to integrate Antom payment system with EduSmart.

## Required Server Dependencies

```bash
npm install axios crypto node-rsa
```

## Configuration

Create a `.env` file with the following variables:

```env
ANTOM_CLIENT_ID=5YEX0L302DFU04384
ANTOM_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0XBVdJHHjFm5ueULwMSPAkUcA3zJPvgxLrUzc4jUBsoFg5uqSvkoJnAdqNQwTMw9LZo8usG2A43uZzUIcw7Nw1oJipxcuFvFNuFJikZSnlfoRRE1TK/U2xNoADjHtDlcdpZjDcukytpY/5S+S6e17VIZUu+N+38nUaedL6fTZNapJDO6Min6jaPawHkazBbzahkiSQLiuWb5I+1QSxz4Tg98Yd3XMwa+fh0xKpXawn6fqDKyfKXQZMxbd/Gw9W84pzrWrsB8cZBhqwzHMkEEallarTCe+AFTv6R5P06AjGKw/1P/+HPrYrBX+CSEmL+lDcRKvFiaeS98Dhf4meu9tQIDAQAB
ANTOM_PRIVATE_KEY=MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2YimUOYiFij0WGduZP/71uF2dsY8envBCIn/KGN0OlWWVXOYDVXEEK58JbEens1KyJ/oHoudMXkexGhQo1ovba4XKsITLX4NZge41ywOOZRzwxLKp+9NjPLNtR9cxV5cUAZcGkNLzMZoGnC4Uy6wX6niOpwx7EurZAvu/+ZKv8TRpJ5Gu/m75yxVy5s72tk+qO8J4iKW2956dsOXZ7kPvEo8yGV6zl8PeB752dffNgEJeWpF+DUH/drWXvP+Jm5c6OsjprZv5GoVixNFod30igJkOsjwiJP5cFx/D6q6Ko14x7cwprKZEgpSPg/TKYifpUJVo/v5uQSOWZdRnhENPAgMBAAECggEAdj19p1MFZ04P/FwXOmt65+L3Dl0m5Ds2mCm1n1gvOF0y1nq7xD2IX6PIH1vLuLVRT58LQhgizCfzYqX9m9w8H6y9uIJoFVF+3nCV9tn/HDoBYTakff99NEEOMjL5GEwo7hd5yg/qMzBdIxvt5B2HHJouPo2eUcwZ5UdB31v19YnWu3RacQQX+JOjiSxZtCD/EnyaynsT80DyH2qkUrJypyY6LqjIWjN8/L4hJKA4RvYxlX+NtDCA9/yft4PmycW4JwTL4R24FLmrNtrgSqFw+oabzJKDNixVsGIT9Wey5iIwL0myv9ofJDwNojH1IVyGW3Kus3NRB2S6ekn3Z9ETgQKBgQD/0UOeDUDWk1+FcdinR5LK+GseS5FroURmztEBBK/6rjJ6OvmrChEn/fml/IiR3n9p20zDB7gqWbC0vGuTWLjF1Pg7ne9LmC7BLAzWfif4fljlljE2z8CEBZAxjFFbuGKYgrlNy7GBPaN9rK2nyzhcClRodkvCN91m0CMhXgeCpwKBgQC2g3uCzqAW/4kiODLqaq0E16Gc2r8IcmkyHjv8Lb/SCmbk+ZzKovJ9UFi5jNzJhgdl3Z5L3GLxhFX76kl6ww4Xc9XW3U2ot8UoOrseT3nRTnRmeSQKbVcN86qfN6xchd7iZ196NmDCm8u/y8A6d5wVqxC+rGjhh0kqupGkzoiXGQKBgFfFnyOdfH+i9QU+OI28mvsVHPu6Bd0d6fA0SbXFu/OQzTTvAzbSL2y/UWbILLuP0buqSL4p6eBuAZkhhO97Y3pNRhZ+a9pODsyspoL5qhEymKG9VIlv4qfpmL3HXSrRKtMVFytAFlk3ot693p9RtLavvKJS5E9xB3/9LfCG6KDFAoGAIAYD5tiwWDiv7BQmQuFCyGW5UpdDC41fjc6mQcIZNRZkJWryqs9acshlOPFRT/63T5VKEA90QOIyYAgkqmiNEWpeq9uao67S5hMf/9p8ClCUteItg7LZonYNivAuyvEmQV1X8E6YPa0uW9G5Qcj41whz4LDJmkCtgtTHdz5R0wkCgYEAlggQkGTEtFMFBDCA8KLNWbRTP4ZoBwzHzWeS244o0Qnt5Dihe77G/weDyiyxSzKBj2RX7D27y686b9fUdUchEAwNB/ou8eWvqwrgxDL0LN1xTZzGyT0KZCEBQ8eJe3vMgB3phYtzMGFqEs42gzOWsNgxOnGZzR6y20nbKVXfuGs=
ANTOM_DOMAIN=https://open-sea-global.alipay.com
ANTOM_ENVIRONMENT=sandbox
ANTOM_NOTIFY_URL=https://your-domain.com/api/antom/payment-notification
ANTOM_REDIRECT_URL=https://your-domain.com/payment-result
```

## API Endpoints

### 1. Create Payment Session

**Endpoint:** `POST /api/antom/create-payment-session`

**Headers:**
- `Authorization: Bearer <jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "planId": "plan_123",
  "addonId": "addon_456",
  "amount": 4200,
  "currency": "USD",
  "paymentMethod": "ALIPAY",
  "orderDescription": "EduSmart Pro Subscription",
  "buyerInfo": {
    "email": "user@example.com",
    "name": "John Doe",
    "userId": "user_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentSessionData": "encrypted_session_data",
    "paymentSessionId": "session_123",
    "paymentSessionExpiryTime": "2024-01-01T01:00:00+08:00",
    "paymentRequestId": "edusmart_1234567890_abc123"
  }
}
```

### 2. Payment Notification Webhook

**Endpoint:** `POST /api/antom/payment-notification`

**Headers:**
- `Content-Type: application/json`
- `X-Alipay-Signature: <signature>`

**Request Body:**
```json
{
  "notifyType": "PAYMENT_RESULT",
  "paymentId": "20240101123456789XXXX",
  "paymentRequestId": "edusmart_1234567890_abc123",
  "paymentAmount": {
    "value": "4200",
    "currency": "USD"
  },
  "paymentTime": "2024-01-01T00:01:00+08:00",
  "paymentCreateTime": "2024-01-01T00:00:00+08:00",
  "result": {
    "resultCode": "SUCCESS",
    "resultStatus": "S",
    "resultMessage": "success"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

### 3. Inquire Payment Status

**Endpoint:** `POST /api/antom/inquire-payment`

**Headers:**
- `Authorization: Bearer <jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "paymentRequestId": "edusmart_1234567890_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "20240101123456789XXXX",
    "paymentRequestId": "edusmart_1234567890_abc123",
    "paymentStatus": "SUCCESS",
    "paymentAmount": {
      "value": "4200",
      "currency": "USD"
    },
    "paymentTime": "2024-01-01T00:01:00+08:00",
    "paymentMethod": "ALIPAY"
  }
}
```

### 4. Get Supported Payment Methods

**Endpoint:** `GET /api/antom/payment-methods`

**Response:**
```json
{
  "success": true,
  "data": [
    "ALIPAY",
    "WECHATPAY",
    "SHOPEEPAY_SG",
    "GCASH",
    "GRABPAY",
    "DANA",
    "TOUCH_N_GO"
  ]
}
```

### 5. Verify Payment Signature

**Endpoint:** `POST /api/antom/verify-signature`

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "data": "notification_data_string",
  "signature": "signature_string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true
  }
}
```

## Implementation Notes

1. **Signature Verification**: All webhook notifications must be verified using the Antom public key
2. **Database Integration**: Payment sessions and results should be stored in the database
3. **Error Handling**: Implement proper error handling for all API endpoints
4. **Logging**: Add comprehensive logging for debugging and monitoring
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Security**: Use HTTPS for all endpoints and validate all inputs

## Server-Side Implementation Structure

```
/server
  /src
    /routes
      /antom
        - paymentRoutes.js
        - webhookRoutes.js
    /services
      - antomService.js
      - signatureService.js
    /middleware
      - authMiddleware.js
      - signatureMiddleware.js
    /utils
      - antomClient.js
      - cryptoUtils.js
```

This structure provides a complete Antom payment integration that can be implemented in your server-side application. 