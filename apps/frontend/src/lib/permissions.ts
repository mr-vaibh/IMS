export function hasPermission(
  userPermissions: string[],
  permission: string
) {
  return userPermissions.includes(permission);
}
