/** Keep post-login navigation inside the application. @param {string | null} next */
export function loginDestination(next) {
  if (
    !next ||
    !next.startsWith('/') ||
    next.startsWith('//') ||
    /[\\\s]/.test(next) ||
    next.split(/[?#]/)[0] === '/login'
  ) {
    return '/';
  }
  return next;
}
