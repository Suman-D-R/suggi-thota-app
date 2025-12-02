// Authentication methods constants
export const AUTH_METHODS = {
  GOOGLE: 'google',
  OTP: 'otp',
  PASSWORD: 'password',
} as const;

export type AuthMethod = typeof AUTH_METHODS[keyof typeof AUTH_METHODS];

