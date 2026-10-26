/** Clears every piece of client-side auth state. Logging out (or a 401 from
 * the API) must remove both keys — leaving `user` behind let a stale
 * previous account's name/id linger in localStorage after logout. */
export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
