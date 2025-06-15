import { SessionOptions } from 'next-auth';
import RedisAdapter from '@auth/redis-adapter';
import redisClient, { redisPool } from './redis';
import { logger } from './logger';

/**
 * Configure Next.js session with Redis for horizontal scaling
 */
export const getSessionOptions = async (): Promise<SessionOptions> => {
  // Connect to Redis if not already connected
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  // Get instance ID from environment or generate one
  const instanceId = process.env.INSTANCE_ID || `instance-${Math.random().toString(36).substring(2, 9)}`;
  logger.info(`Initializing session for instance: ${instanceId}`);

  return {
    // Use Redis adapter for session storage
    adapter: RedisAdapter(redisClient),
    
    // Session configuration for horizontal scaling
    secret: process.env.NEXTAUTH_SECRET as string,
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60,   // 24 hours
    },
    
    // JWT configuration
    jwt: {
      secret: process.env.JWT_SECRET as string,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    
    // Cookies configuration for horizontal scaling
    cookies: {
      sessionToken: {
        name: `next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          // Don't set domain to allow load balancer to route to any instance
          domain: undefined,
        },
      },
    },
  };
};

/**
 * Get session data from Redis
 * This function can be used to retrieve session data from any instance
 */
export const getSessionData = async (sessionToken: string): Promise<any> => {
  try {
    // Use the session prefix from NextAuth
    const sessionKey = `next-auth.session-token.${sessionToken}`;
    const sessionData = await redisClient.get(sessionKey);
    
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    logger.error('Failed to get session data', { error });
    return null;
  }
};

/**
 * Check if a session is valid
 */
export const isSessionValid = async (sessionToken: string): Promise<boolean> => {
  try {
    const sessionData = await getSessionData(sessionToken);
    
    if (!sessionData) {
      return false;
    }
    
    // Check if session has expired
    const expiryDate = new Date(sessionData.expires);
    const now = new Date();
    
    return expiryDate > now;
  } catch (error) {
    logger.error('Failed to validate session', { error });
    return false;
  }
};