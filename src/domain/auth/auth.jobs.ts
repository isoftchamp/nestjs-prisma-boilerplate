export enum AUTH_JOB {
  SEND_SIGNUP_EMAIL = 'SEND_SIGNUP_EMAIL',
}

export interface SendSignupEmailJob {
  email: string;
}
