// Test Script for Antom Payment Integration
// This script tests the Antom payment integration to ensure everything works correctly

const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'https://server.matrixedu.ai', // Your API base URL
  // For local testing, use: 'http://localhost:3001'
  testUser: {
    email: 'test@example.com',
    name: 'Test User',
    userId: 'test_user_123'
  },
  testPlan: {
    id: 'plan_pro_monthly',
    name: 'Pro Monthly',
    price: 29.99
  }
};

// Helper function to make API calls
async function makeApiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${TEST_CONFIG.baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      ...(data && { data })
    };

    console.log(`\n🔄 Making ${method} request to ${endpoint}`);
    console.log('Request data:', JSON.stringify(data, null, 2));

    const response = await axios(config);
    
    console.log('✅ Response received:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API call failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

// Test 1: Get supported payment methods
async function testGetPaymentMethods() {
  console.log('\n📋 Test 1: Get Supported Payment Methods');
  console.log('=' .repeat(50));
  
  const result = await makeApiCall('GET', '/api/antom/payment-methods');
  
  if (result.success) {
    console.log('✅ Test 1 PASSED: Successfully retrieved payment methods');
    return result.data;
  } else {
    console.log('❌ Test 1 FAILED: Could not retrieve payment methods');
    return null;
  }
}

// Test 2: Create payment session
async function testCreatePaymentSession() {
  console.log('\n💳 Test 2: Create Payment Session');
  console.log('=' .repeat(50));
  
  const requestData = {
    planId: TEST_CONFIG.testPlan.id,
    amount: TEST_CONFIG.testPlan.price,
    currency: 'USD',
    paymentMethod: 'ALIPAY',
    orderDescription: `EduSmart ${TEST_CONFIG.testPlan.name} Subscription`,
    buyerInfo: TEST_CONFIG.testUser
  };
  
  const result = await makeApiCall('POST', '/api/antom/create-payment-session', requestData);
  
  if (result.success && result.data.success) {
    console.log('✅ Test 2 PASSED: Successfully created payment session');
    return result.data.data;
  } else {
    console.log('❌ Test 2 FAILED: Could not create payment session');
    return null;
  }
}

// Test 3: Inquire payment status
async function testInquirePayment(paymentRequestId) {
  console.log('\n🔍 Test 3: Inquire Payment Status');
  console.log('=' .repeat(50));
  
  const requestData = {
    paymentRequestId: paymentRequestId
  };
  
  const result = await makeApiCall('POST', '/api/antom/inquire-payment', requestData);
  
  if (result.success && result.data.success) {
    console.log('✅ Test 3 PASSED: Successfully inquired payment status');
    return result.data.data;
  } else {
    console.log('❌ Test 3 FAILED: Could not inquire payment status');
    return null;
  }
}

// Test 4: Verify signature
async function testVerifySignature() {
  console.log('\n🔐 Test 4: Verify Payment Signature');
  console.log('=' .repeat(50));
  
  const testData = {
    data: JSON.stringify({
      notifyType: 'PAYMENT_RESULT',
      paymentId: 'test_payment_123',
      result: { resultStatus: 'S' }
    }),
    signature: 'test_signature_123'
  };
  
  const result = await makeApiCall('POST', '/api/antom/verify-signature', testData);
  
  if (result.success && result.data.success) {
    console.log('✅ Test 4 PASSED: Successfully verified signature');
    return result.data.data;
  } else {
    console.log('❌ Test 4 FAILED: Could not verify signature');
    return null;
  }
}

// Test 5: Simulate payment notification
async function testPaymentNotification() {
  console.log('\n📢 Test 5: Payment Notification Webhook');
  console.log('=' .repeat(50));
  
  const notificationData = {
    notifyType: 'PAYMENT_RESULT',
    paymentId: '20241201123456789TEST',
    paymentRequestId: 'edusmart_test_payment_123',
    paymentAmount: {
      value: '2999',
      currency: 'USD'
    },
    paymentTime: new Date().toISOString(),
    paymentCreateTime: new Date().toISOString(),
    result: {
      resultCode: 'SUCCESS',
      resultStatus: 'S',
      resultMessage: 'success'
    }
  };
  
  const headers = {
    'X-Alipay-Signature': 'test_signature_123'
  };
  
  const result = await makeApiCall('POST', '/api/antom/payment-notification', notificationData, headers);
  
  if (result.success && result.data.success) {
    console.log('✅ Test 5 PASSED: Successfully processed payment notification');
    return result.data;
  } else {
    console.log('❌ Test 5 FAILED: Could not process payment notification');
    return null;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Antom Payment Integration Tests');
  console.log('=' .repeat(60));
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Test User: ${TEST_CONFIG.testUser.email}`);
  console.log(`Test Plan: ${TEST_CONFIG.testPlan.name} - $${TEST_CONFIG.testPlan.price}`);
  
  let testResults = {
    passed: 0,
    failed: 0,
    total: 5
  };
  
  try {
    // Test 1: Get payment methods
    const paymentMethods = await testGetPaymentMethods();
    if (paymentMethods) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    // Test 2: Create payment session
    const paymentSession = await testCreatePaymentSession();
    if (paymentSession) {
      testResults.passed++;
      
      // Test 3: Inquire payment (only if session created successfully)
      const paymentStatus = await testInquirePayment(paymentSession.paymentRequestId);
      if (paymentStatus) {
        testResults.passed++;
      } else {
        testResults.failed++;
      }
    } else {
      testResults.failed += 2; // Both create and inquire failed
    }
    
    // Test 4: Verify signature
    const signatureResult = await testVerifySignature();
    if (signatureResult) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    // Test 5: Payment notification
    const notificationResult = await testPaymentNotification();
    if (notificationResult) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.failed = testResults.total;
  }
  
  // Print final results
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  
  if (testResults.passed === testResults.total) {
    console.log('🎉 All tests passed! Antom integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Deploy the server-side APIs to your production environment');
  console.log('2. Update the frontend API base URL to point to your server');
  console.log('3. Configure the actual Antom credentials in your environment');
  console.log('4. Test with real Antom sandbox environment');
  console.log('5. Implement proper database storage for payment sessions');
  console.log('6. Add proper error handling and logging');
  console.log('7. Set up monitoring and alerting for payment failures');
  
  return testResults;
}

// Frontend integration test
async function testFrontendIntegration() {
  console.log('\n🌐 Frontend Integration Test');
  console.log('=' .repeat(50));
  
  console.log('To test the frontend integration:');
  console.log('1. Start your React development server: npm start');
  console.log('2. Navigate to the payment page');
  console.log('3. Select Alipay or WeChat Pay as payment method');
  console.log('4. Click "Pay Securely" button');
  console.log('5. Check browser console for Antom SDK logs');
  console.log('6. Verify payment session creation in network tab');
  
  console.log('\n✅ Frontend components added:');
  console.log('- Antom SDK configuration');
  console.log('- Payment method selection (Alipay, WeChat Pay)');
  console.log('- Payment session creation');
  console.log('- Payment event handling');
  console.log('- Error handling and user feedback');
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then(() => {
      testFrontendIntegration();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testFrontendIntegration,
  TEST_CONFIG
}; 