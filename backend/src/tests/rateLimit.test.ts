import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Simple test script to verify rate limiting functionality
 * This can be run manually to test the rate limiting implementation
 */
async function testRateLimiting() {
  const API_URL = 'http://localhost:8080';
  const CHAT_ENDPOINT = `${API_URL}/api/chat`;
  const HEALTH_ENDPOINT = `${API_URL}/health`;
  
  logger.info('Starting rate limit test...');
  
  // Test 1: Standard rate limiting on health endpoint
  logger.info('Test 1: Standard rate limiting on health endpoint');
  try {
    for (let i = 0; i < 60; i++) {
      const response = await axios.get(HEALTH_ENDPOINT);
      logger.info(`Request ${i + 1} successful: ${response.status}`);
      
      // Check for rate limit headers
      const remaining = response.headers['ratelimit-remaining'];
      const limit = response.headers['ratelimit-limit'];
      if (remaining && limit) {
        logger.info(`Rate limit info: ${remaining}/${limit} remaining`);
      }
    }
  } catch (error: any) {
    if (error.response?.status === 429) {
      logger.info('✅ Rate limiting worked as expected on health endpoint!');
      logger.info(`Response: ${JSON.stringify(error.response.data)}`);
    } else {
      logger.error('❌ Unexpected error during health endpoint test', error);
    }
  }
  
  // Test 2: Stricter rate limiting on chat endpoint
  logger.info('\nTest 2: Stricter rate limiting on chat endpoint');
  try {
    const chatPayload = {
      message: 'Hello, this is a test message',
      history: []
    };
    
    for (let i = 0; i < 15; i++) {
      const response = await axios.post(CHAT_ENDPOINT, chatPayload);
      logger.info(`Request ${i + 1} successful: ${response.status}`);
      
      // Check for rate limit headers
      const remaining = response.headers['ratelimit-remaining'];
      const limit = response.headers['ratelimit-limit'];
      if (remaining && limit) {
        logger.info(`Rate limit info: ${remaining}/${limit} remaining`);
      }
    }
  } catch (error: any) {
    if (error.response?.status === 429) {
      logger.info('✅ Rate limiting worked as expected on chat endpoint!');
      logger.info(`Response: ${JSON.stringify(error.response.data)}`);
    } else {
      logger.error('❌ Unexpected error during chat endpoint test', error);
    }
  }
  
  logger.info('\nRate limit testing completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRateLimiting().catch(error => {
    logger.error('Error running rate limit test', error);
  });
}

export default testRateLimiting;
