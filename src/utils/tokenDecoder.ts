import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  header: any;
  payload: any;
  raw: string;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwtDecode(token, { header: true });
    return {
      header: decoded,
      payload: jwtDecode(token),
      raw: token
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const formatTokenExpiry = (exp: number): string => {
  const date = new Date(exp * 1000);
  const now = new Date();
  const isExpired = date < now;
  
  return `${date.toLocaleString()} ${isExpired ? '(EXPIRED)' : '(Valid)'}`;
};