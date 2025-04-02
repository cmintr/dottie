import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { logger } from './logger';

/**
 * Utility class for accessing secrets from Google Cloud Secret Manager
 */
export class SecretManager {
  private static client: SecretManagerServiceClient;
  private static projectId: string;
  private static secretCache: Map<string, { value: string; timestamp: number }> = new Map();
  private static readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  /**
   * Initialize the Secret Manager client
   * @param projectId Google Cloud project ID
   */
  static initialize(projectId: string): void {
    this.projectId = projectId;
    this.client = new SecretManagerServiceClient();
    logger.info('Secret Manager initialized');
  }

  /**
   * Get a secret from Secret Manager
   * @param secretName Name of the secret to retrieve
   * @param useCache Whether to use cached values (default: true)
   * @returns The secret value as a string
   */
  static async getSecret(secretName: string, useCache = true): Promise<string> {
    try {
      // Check if we have a valid cached value
      if (useCache) {
        const cachedSecret = this.secretCache.get(secretName);
        if (cachedSecret && Date.now() - cachedSecret.timestamp < this.CACHE_TTL) {
          logger.debug(`Using cached value for secret: ${secretName}`);
          return cachedSecret.value;
        }
      }

      // Construct the resource name
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;

      // Access the secret
      const [version] = await this.client.accessSecretVersion({ name });
      
      // Extract the payload
      const payload = version.payload?.data?.toString() || '';
      
      if (!payload) {
        throw new Error(`Secret ${secretName} has no payload`);
      }

      // Cache the result
      this.secretCache.set(secretName, {
        value: payload,
        timestamp: Date.now(),
      });

      logger.debug(`Retrieved secret: ${secretName}`);
      return payload;
    } catch (error) {
      logger.error(`Error retrieving secret ${secretName}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // For development fallback, check environment variables
      if (process.env.NODE_ENV !== 'production') {
        const envVarName = secretName.toUpperCase().replace(/-/g, '_');
        if (process.env[envVarName]) {
          logger.warn(`Falling back to environment variable ${envVarName} for secret ${secretName}`);
          return process.env[envVarName] as string;
        }
      }
      
      throw error;
    }
  }

  /**
   * Get Firebase service account key
   * @returns Firebase service account key as a JSON string
   */
  static async getFirebaseServiceAccount(): Promise<string> {
    return this.getSecret('firebase-service-account');
  }

  /**
   * Get Google OAuth client ID
   * @returns Google OAuth client ID
   */
  static async getGoogleClientId(): Promise<string> {
    return this.getSecret('google-client-id');
  }

  /**
   * Get Google OAuth client secret
   * @returns Google OAuth client secret
   */
  static async getGoogleClientSecret(): Promise<string> {
    return this.getSecret('google-client-secret');
  }

  /**
   * Get session secret
   * @returns Session secret
   */
  static async getSessionSecret(): Promise<string> {
    return this.getSecret('session-secret');
  }
}
