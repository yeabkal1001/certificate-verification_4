import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiHandler } from '@/lib/api-wrapper';
import { csrfTokenHandler } from '@/lib/csrf-protection';

/**
 * API endpoint to generate a CSRF token
 * This endpoint should be called before making any state-changing requests
 */
export default withApiHandler(csrfTokenHandler);