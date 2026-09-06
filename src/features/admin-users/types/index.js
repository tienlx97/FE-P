/**
 * @typedef {'Male' | 'Female' | 'Other'} Gender
 */

/**
 * @typedef {Object} CreateUserFormValues
 * @property {string} nationalId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} password
 * @property {number | undefined} yearOfBirth
 * @property {Gender | ''} gender
 * @property {string} nationalIdIssueDate - ISO date (YYYY-MM-DD)
 * @property {string} nationalIdIssuePlace
 * @property {string} passportNumber - optional, empty string when unset
 * @property {string} phone
 * @property {string} oldProvince
 * @property {string} oldDistrict
 * @property {string} oldWard
 * @property {string} oldAddressDetail
 * @property {string} newProvince
 * @property {string} newWard
 * @property {string} newAddressDetail
 * @property {string} positionId
 * @property {string} companyId
 * @property {string} branchId
 * @property {string} departmentId
 * @property {string[]} extraPermissions
 */

/**
 * @typedef {Object} EditUserFormValues
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} nationalId
 * @property {number | undefined} yearOfBirth
 * @property {Gender | ''} gender
 * @property {string} nationalIdIssueDate - ISO date (YYYY-MM-DD)
 * @property {string} nationalIdIssuePlace
 * @property {string} passportNumber - optional, empty string when unset
 * @property {string} phone
 * @property {string} oldProvince
 * @property {string} oldDistrict
 * @property {string} oldWard
 * @property {string} oldAddressDetail
 * @property {string} newProvince
 * @property {string} newWard
 * @property {string} newAddressDetail
 * @property {string} positionId
 * @property {string} companyId
 * @property {string} branchId
 * @property {string} departmentId
 */

/**
 * @typedef {Object} CreateUserSuccess
 * @property {true} success
 * @property {string} id
 * @property {string} [employeeCode] System-generated login identifier — the
 *   Admin must hand this to the new employee, since nobody typed it in.
 */

/**
 * @typedef {Object} CreateUserFailure
 * @property {false} success
 * @property {string} message
 */

/** @typedef {CreateUserSuccess | CreateUserFailure} CreateUserResult */

/** @typedef {{ id: string, name: string }} Company */
/** @typedef {{ id: string, name: string, companyId: string }} Branch */
/** @typedef {{ id: string, name: string, branchId: string }} Department */
/** @typedef {{ id: string, name: string }} Position */
/** @typedef {{ key: string, description: string, scopeType: 'branch', scopeId: string }} InheritedPermission */
/** @typedef {{ key: string, description: string | null }} GrantablePermission */

/**
 * Shape of `GET /users` list items — `UserResponse` (BE-kt-xnk,
 * `CompanyManagement.Contracts/Users/UserResponse.cs`).
 * A row from `GET /api/v1/users`. Deliberately **slim** — the endpoint omits
 * identity-document and address fields so a staff list does not ship every
 * employee's papers to the browser (see the API's `docs/security.md`, M-4).
 * For the complete record use {@link UserDetail} via `GET /users/{id}`.
 * @typedef {Object} UserListItem
 * @property {string} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} nationalId
 * @property {string} employeeCode System-generated login identifier — this,
 *   not `nationalId`, is what `Login` takes.
 * @property {string | null} phone
 * @property {string | null} positionId
 * @property {string | null} companyId
 * @property {string | null} branchId
 * @property {string[]} departmentIds
 * @property {boolean} isAdmin Whether the user holds the Admin role. Replaces
 *   the removed `GET /users/{id}/profiles`, a leftover of the gym template the
 *   API was scaffolded from.
 */

/**
 * The full record from `GET /api/v1/users/{userId}`. This — not
 * {@link UserListItem} — is what the edit form must be populated from:
 * `PUT` replaces everything, so saving a form built from a list row would
 * blank out every field the row omits.
 * @typedef {UserListItem & {
 *   yearOfBirth: number | null,
 *   gender: Gender | null,
 *   nationalIdIssueDate: string | null,
 *   nationalIdIssuePlace: string | null,
 *   passportNumber: string | null,
 *   oldProvince: string | null,
 *   oldDistrict: string | null,
 *   oldWard: string | null,
 *   oldAddressDetail: string | null,
 *   newProvince: string | null,
 *   newWard: string | null,
 *   newAddressDetail: string | null,
 *   allowConcurrentSessions: boolean,
 *   extraPermissions: string[],
 * }} UserDetail
 */

/**
 * @typedef {Object} UserListSuccess
 * @property {true} success
 * @property {UserListItem[]} users One page of rows, not the whole table —
 *   `GET /api/v1/users` is paginated and returns a slim projection.
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalCount
 * @property {number} totalPages
 */

/**
 * @typedef {Object} UserListFailure
 * @property {false} success
 * @property {string} message
 */

/** @typedef {UserListSuccess | UserListFailure} UserListResult */

/**
 * Shape of `GET /vietnam-banks` items — `VietnamBankResponse` (BE-kt-xnk,
 * `CompanyManagement.Contracts/Banks/VietnamBankResponse.cs`).
 * @typedef {Object} VietnamBank
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} shortName
 */

/**
 * `public/data/vn-address-old.json` — pre-2025-merger units (3 levels).
 * @typedef {Object} OldAddressData
 * @property {{ code: string, name: string }[]} provinces
 * @property {{ code: string, name: string, provinceCode: string }[]} districts
 * @property {{ code: string, name: string, districtCode: string }[]} wards
 */

/**
 * `public/data/vn-address-new.json` — post-2025-merger units (2 levels).
 * @typedef {Object} NewAddressData
 * @property {{ code: string, name: string }[]} provinces
 * @property {{ code: string, name: string, provinceCode: string }[]} wards
 */

/**
 * One editable row in the bank accounts grid (`CreateUserForm`/
 * `EditUserForm`). Local-only state until saved — `bankAccountId` is `null`
 * for a row the user added but hasn't been persisted yet (Create: every
 * row, until the user itself is created; Edit: a row added in this
 * session, until submit).
 * @typedef {Object} BankAccountRow
 * @property {string} rowKey - client-only stable React key, never sent to the API
 * @property {string | null} bankAccountId
 * @property {string} vietnamBankId
 * @property {string} accountNumber
 * @property {string} branch
 * @property {boolean} isPrimary
 */

/**
 * Shape of `GET .../bank-accounts` items — `BankAccountResponse`
 * (BE-kt-xnk, `CompanyManagement.Contracts/BankAccounts/BankAccountResponse.cs`).
 * @typedef {Object} BankAccountApiItem
 * @property {string} id
 * @property {string} vietnamBankId
 * @property {string} accountNumber
 * @property {string | null} branch
 * @property {boolean} isPrimary
 */

/**
 * @typedef {Object} BankAccountSuccess
 * @property {true} success
 * @property {BankAccountApiItem} bankAccount
 */

/**
 * @typedef {Object} BankAccountFailure
 * @property {false} success
 * @property {string} message
 */

/** @typedef {BankAccountSuccess | BankAccountFailure} BankAccountResult */

/**
 * @typedef {Object} BankAccountListSuccess
 * @property {true} success
 * @property {BankAccountApiItem[]} bankAccounts
 */

/** @typedef {BankAccountListSuccess | BankAccountFailure} BankAccountListResult */

export {};

/**
 * What the v2 dialog (`user-form-dialog.jsx`) needs from a form hook. Both
 * `useCreateUserFormV2` and `useEditUserFormV2` return this shape, so the
 * dialog renders the same card stack either way and never branches on the
 * hook it came from — only on the handful of fields below that genuinely
 * differ between creating and editing.
 * @typedef {Object} UserFormV2Controller
 * @property {'create' | 'edit'} mode
 * @property {string} title Dialog header text.
 * @property {string} submitLabel Primary button label.
 * @property {string} [loadError]
 * @property {() => void} [retryLoad]
 * @property {boolean} isLoadingUser True while the detail record is in flight (edit only).
 * @property {string | null} password Create only — `null` in edit mode, where the
 *   password has its own reset endpoint and is not part of `PUT /users/{id}`.
 * @property {string} editableNationalId The CCCD input's value — editable in
 *   both modes now (BE-kt-xnk `openspec/changes/add-employee-code-login/`:
 *   the login identifier is the system-generated `EmployeeCode`, not CCCD,
 *   so CCCD is free to be corrected).
 * @property {string | null} readOnlyEmployeeCode Edit only — the login
 *   identifier, immutable, shown as text. `null` in create mode: it does
 *   not exist until the account is actually created (see `submitSuccess`,
 *   which surfaces the newly generated code once it does).
 * @property {CreateUserFormValues | EditUserFormValues} values
 * @property {(field: string, value: string | number | undefined) => void} setField
 * @property {Record<string, { type: 'error', message: string } | undefined>} fieldStatuses
 * @property {string} submitError
 * @property {string} submitSuccess
 * @property {boolean} isSubmitting
 * @property {Company[]} companies
 * @property {Branch[]} branches
 * @property {Department[]} departments
 * @property {Position[]} positions
 * @property {VietnamBank[]} vietnamBanks
 * @property {{ code: string, name: string }[]} oldProvinces
 * @property {{ code: string, name: string }[]} oldDistricts
 * @property {{ code: string, name: string }[]} oldWards
 * @property {{ code: string, name: string }[]} newProvinces
 * @property {{ code: string, name: string }[]} newWards
 * @property {BankAccountRow[]} bankAccountRows
 * @property {() => void} addBankAccountRow
 * @property {(rowKey: string) => void} removeBankAccountRow
 * @property {() => void} clearBankAccountRows
 * @property {(rowKey: string, field: 'vietnamBankId' | 'accountNumber' | 'branch', value: string) => void} updateBankAccountRowField
 * @property {(rowKey: string) => void} setPrimaryBankAccountRow
 * @property {{ userId: string, extraPermissions: string[], isLoading: boolean } | null} permissionsFieldsProps
 *   Edit only — granting a permission to an account that doesn't exist yet is
 *   meaningless, so the create flow leaves this `null` and the card doesn't render.
 * @property {{
 *   inheritedPermissions: InheritedPermission[],
 *   grantablePermissions: GrantablePermission[],
 *   selectedPermissions: string[],
 *   isLoading: boolean,
 *   hasDepartment: boolean,
 *   onChange: (permissions: string[]) => void,
 * } | null} createPermissionsFieldsProps Create only — inherited permissions
 *   are read-only while grantable permissions are submitted with registration.
 * @property {{
 *   allowed: boolean,
 *   isUpdating: boolean,
 *   status?: { type: 'error' | 'success', message: string },
 *   onChange: (allowed: boolean) => void,
 * } | null} concurrentSessionsProps Edit only — the account must exist before
 *   its session policy can be changed through the dedicated endpoint.
 * @property {(event: import('react').FormEvent<HTMLFormElement>) => void} handleSubmit
 */
