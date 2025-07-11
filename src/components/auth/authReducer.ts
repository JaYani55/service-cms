import { AuthState, AuthAction } from '@/types/auth';

export const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  isFirstLogin: false,
  error: null,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_STATE_CHANGED':
      return {
        ...state,
        session: action.payload.session,
        user: action.payload.user ?? state.user,
        loading: false,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        session: action.payload.session,
        user: action.payload.user,
        loading: false,
      };
    case 'LOGOUT_SUCCESS':
      return {
        ...initialState,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload.loading,
      };
    case 'SET_FIRST_LOGIN':
      return {
        ...state,
        isFirstLogin: action.payload.isFirstLogin,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        loading: false,
      };
    case 'SWITCH_ROLE':
      return {
        ...state,
        user: state.user
          ? {
              ...state.user,
              role: action.payload.role,
              originalRole: state.user.originalRole || state.user.role,
            }
          : null,
      };
    default:
      return state;
  }
}