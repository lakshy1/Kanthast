// Identity of this backend. Tokens are issued for and accepted from this app only,
// so an account from the other Kanthast product can never authenticate here.
export const APP_ID = "kanthast-school";
export const APP_NAME = "Kanthast School";
export const JWT_OPTIONS = { issuer: APP_ID, audience: APP_ID };
