export const MIN_PASSWORD_CHARACTERS = 15;
export const MAX_PASSWORD_BYTES = 72;
export const passwordPolicyError = (password: string): string | null => {
  if ([...password].length < MIN_PASSWORD_CHARACTERS) return 'password.tooShort';
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) return 'password.tooLong';
  return null;
};
