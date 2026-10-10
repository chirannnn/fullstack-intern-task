import axios from 'axios';

/** Turns any thrown value into a message that is safe and useful to show to users. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (axios.isCancel(error)) return null;

  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Unable to reach the server. Check your connection and try again.';
    const apiMessage = error.response.data?.error?.message;
    if (error.response.status >= 500) return 'The server ran into a problem. Please try again shortly.';
    return apiMessage || fallback;
  }
  return fallback;
}

export function getErrorStatus(error) {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/** Field-level validation errors returned by the API as `[{ field, message }]`. */
export function getFieldErrors(error) {
  const details = axios.isAxiosError(error) ? error.response?.data?.error?.details : undefined;
  return Array.isArray(details) ? details : [];
}
