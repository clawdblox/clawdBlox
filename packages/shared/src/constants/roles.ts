export const ROLES = ['owner', 'editor', 'viewer'] as const;

export type Role = typeof ROLES[number];

export type Permission =
  | 'project:read'
  | 'project:write'
  | 'project:delete'
  | 'project:manage_keys'
  | 'npc:read'
  | 'npc:write'
  | 'npc:delete'
  | 'memory:read'
  | 'memory:write'
  | 'memory:delete'
  | 'conversation:read'
  | 'conversation:write'
  | 'life:read'
  | 'life:write'
  | 'life:delete'
  | 'user:read'
  | 'user:write'
  | 'user:delete';

export const PERMISSIONS_MATRIX: Record<Role, Permission[]> = {
  owner: [
    'project:read', 'project:write', 'project:delete', 'project:manage_keys',
    'npc:read', 'npc:write', 'npc:delete',
    'memory:read', 'memory:write', 'memory:delete',
    'conversation:read', 'conversation:write',
    'life:read', 'life:write', 'life:delete',
    'user:read', 'user:write', 'user:delete',
  ],
  editor: [
    'project:read',
    'npc:read', 'npc:write',
    'memory:read', 'memory:write',
    'conversation:read', 'conversation:write',
    'life:read', 'life:write',
    'user:read',
  ],
  viewer: [
    'project:read',
    'npc:read',
    'memory:read',
    'conversation:read',
    'life:read',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS_MATRIX[role].includes(permission);
}
