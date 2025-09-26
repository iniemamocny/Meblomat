export type FormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

export const INITIAL_STATE: FormState = { status: 'idle' };
