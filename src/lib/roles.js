const config = require("../../config.json");

// Role hierarchy from lowest to highest
const ROLE_HIERARCHY = [
  "whitelisted",
  "eventManager",
  "support",
  "mod",
  "admin",
  "seniorAdmin",
  "owner"
];

// Returns true if the member has the specified role or any role higher in the hierarchy
function hasRole(member, minimumRole) {
  const minIndex = ROLE_HIERARCHY.indexOf(minimumRole);
  if (minIndex === -1) return false;

  // Check from the minimum role upward
  for (let i = minIndex; i < ROLE_HIERARCHY.length; i++) {
    const roleId = config.roles[ROLE_HIERARCHY[i]];
    if (roleId && member.roles.cache.has(roleId)) return true;
  }
  return false;
}

module.exports = { hasRole };