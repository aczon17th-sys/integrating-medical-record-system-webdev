const STAFF_ROLES = ['nurse', 'receptionist'];
const CLINIC_ROLES = ['admin', 'nurse', 'receptionist'];

function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

module.exports = { STAFF_ROLES, CLINIC_ROLES, isStaff };
