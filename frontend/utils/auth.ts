/** Clears every piece of client-side auth state. Logging out (or a 401 from
 * the API) must remove both keys — leaving `user` behind let a stale
 * previous account's name/id linger in localStorage after logout. */
export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const saveSession = (data: { token: string; userId: number; name: string | null; isGuest?: boolean }) => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify({ id: data.userId, name: data.name, isGuest: Boolean(data.isGuest) }));
};

export const getStoredUser = (): { id: number; name: string | null; isGuest: boolean } | null => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
