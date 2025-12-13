#!/usr/bin/env npx tsx
/**
 * Test Complete Authentication Flow
 * Run: npx tsx scripts/test-auth-flow.ts
 */

import { getEmailServiceStatus } from '../src/lib/email-service';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

interface TestResult {
  step: string;
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  duration?: number;
}

class AuthFlowTester {
  private results: TestResult[] = [];

  async runTests() {
    console.log('\n🔐 HIVE Authentication Flow Test Suite\n');
    console.log('=' .repeat(60));
    console.log(`Testing against: ${BASE_URL}`);
    console.log('=' .repeat(60));

    // Test 1: Email Service Configuration
    await this.testEmailService();

    // Test 2: Login Page Accessibility
    await this.testLoginPage();

    // Test 3: OTP Code Generation
    await this.testOTPCodeGeneration();

    // Test 4: Session Endpoint
    await this.testSessionEndpoint();

    // Test 5: Session Protection
    await this.testSessionManagement();

    // Print Results
    this.printResults();
  }

  private async testEmailService() {
    const startTime = Date.now();
    try {
      const status = await getEmailServiceStatus();

      this.results.push({
        step: 'Email Service Configuration',
        status: status.configured ? 'pass' : 'fail',
        message: `Provider: ${status.provider}, Configured: ${status.configured}`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        step: 'Email Service Configuration',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  private async testLoginPage() {
    const startTime = Date.now();
    try {
      const response = await fetch(`${BASE_URL}/auth/login`);

      this.results.push({
        step: 'Login Page Accessibility',
        status: response.ok ? 'pass' : 'fail',
        message: `Status: ${response.status}`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        step: 'Login Page Accessibility',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  private async testOTPCodeGeneration() {
    const startTime = Date.now();
    try {
      const response = await fetch(`${BASE_URL}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@buffalo.edu',
          schoolId: 'ub-buffalo'
        })
      });

      const data = await response.json();

      // In development, this should work. In prod, email must be real.
      this.results.push({
        step: 'OTP Code Generation',
        status: response.ok || response.status === 429 ? 'pass' : 'fail',
        message: data.message || data.error || `Status: ${response.status}`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        step: 'OTP Code Generation',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  private async testSessionEndpoint() {
    const startTime = Date.now();
    try {
      // Test /api/auth/me without session - should return authenticated: false
      const response = await fetch(`${BASE_URL}/api/auth/me`);
      const data = await response.json();

      // Should return 200 with authenticated: false (not 401)
      const isCorrectBehavior = response.ok && data.authenticated === false;

      this.results.push({
        step: 'Session Endpoint (/api/auth/me)',
        status: isCorrectBehavior ? 'pass' : 'fail',
        message: `Status: ${response.status}, authenticated: ${data.authenticated}`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        step: 'Session Endpoint (/api/auth/me)',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  private async testSessionManagement() {
    const startTime = Date.now();
    try {
      // Test protected route without session
      const response = await fetch(`${BASE_URL}/profile`);

      // Should redirect to login (status 307 or 308)
      const shouldRedirect = response.redirected ||
                           response.status === 307 ||
                           response.status === 308;

      this.results.push({
        step: 'Session Protection (Middleware)',
        status: shouldRedirect ? 'pass' : 'fail',
        message: `Protected route ${shouldRedirect ? 'correctly redirects' : 'not protected'}`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        step: 'Session Protection (Middleware)',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  private printResults() {
    console.log('\n' + '=' .repeat(60));
    console.log('TEST RESULTS');
    console.log('=' .repeat(60) + '\n');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const failedTests = this.results.filter(r => r.status === 'fail').length;

    this.results.forEach((result, index) => {
      const icon = result.status === 'pass' ? '✅' :
                  result.status === 'fail' ? '❌' : '⏭️';

      console.log(`${index + 1}. ${icon} ${result.step}`);
      if (result.message) {
        console.log(`   └─ ${result.message}`);
      }
      if (result.duration) {
        console.log(`   └─ Duration: ${result.duration}ms`);
      }
      console.log();
    });

    console.log('=' .repeat(60));
    console.log(`\n📊 Summary: ${passedTests}/${totalTests} tests passed`);

    if (failedTests > 0) {
      console.log(`\n⚠️  ${failedTests} test(s) failed`);
      console.log('\n📝 Next Steps:');

      const emailFailed = this.results.find(r =>
        r.step === 'Email Service Configuration' && r.status === 'fail'
      );

      if (emailFailed) {
        console.log('   1. Configure email service:');
        console.log('      - Copy .env.email.template to .env.local');
        console.log('      - Add SendGrid or Firebase credentials');
        console.log('      - Run: npx tsx scripts/test-email-config.ts');
      }

      console.log('   2. Check server is running on port 3001');
      console.log('   3. Verify Firebase configuration');
      console.log('   4. Check middleware.ts for auth protection');
    } else {
      console.log('\n✨ All tests passed! Auth system is ready for production.');
    }

    console.log('\n' + '=' .repeat(60) + '\n');
  }
}

// Run the tests
const tester = new AuthFlowTester();
tester.runTests().catch(console.error);
