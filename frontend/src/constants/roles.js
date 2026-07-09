// Application roles — mirror of backend Roles.cs. Import these instead of
// scattering role string literals through the UI (route guards, hasRole checks).

export const ROLES = {
  Admin: 'Admin',
  Doctor: 'Doctor',
  Receptionist: 'Receptionist',
}

export const ALL_ROLES = Object.values(ROLES)
