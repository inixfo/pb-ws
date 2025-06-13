// Helper function to get authentication headers for API requests
export const getAuthHeaders = (): Record<string, string> => {
  /*
   * We let the shared axios instance (api.ts) attach the Authorization header
   * automatically via its request-interceptor.  Here we only ensure that we
   * always send the standard JSON headers so every request is recognised as
   * JSON by Django REST Framework.
   */

  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(localStorage.getItem('auth_token') ? {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')!.startsWith('Bearer ') ? localStorage.getItem('auth_token')!.replace(/^Bearer\s+/i, '') : localStorage.getItem('auth_token')}`
    } : {})
  };
}; 