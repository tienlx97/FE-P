/**
 * @typedef {Object} LoginFormValues
 * @property {string} nationalId
 * @property {string} password
 * @property {boolean} rememberMe
 */

/**
 * @typedef {Object} LoginSuccess
 * The client learns nothing about the session beyond a name to greet the user
 * with. Tokens and identifiers stay on the server — see
 * `src/app/api/session/login/route.js`.
 * @property {true} success
 * @property {string} [displayName]
 */

/**
 * @typedef {Object} LoginFailure
 * @property {false} success
 * @property {string} message
 */

/** @typedef {LoginSuccess | LoginFailure} LoginResult */

export {};
