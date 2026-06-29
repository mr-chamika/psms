import { Permission } from "./permissions";

export enum UserRole {
  ADMIN = "admin",
  RECEPTIONIST = "receptionist",
  EDITOR = "editor",
  PHOTOGRAPHER = "photographer"
}

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    // Admins get all permissions
    ...Object.values(Permission)
  ],
  
  [UserRole.RECEPTIONIST]: [
    Permission.READ_USER,
    Permission.CREATE_CLIENT,
    Permission.READ_CLIENT,
    Permission.UPDATE_CLIENT,
    Permission.DELETE_CLIENT,
    Permission.CREATE_SITTING,
    Permission.READ_SITTING,
    Permission.UPDATE_SITTING,
    Permission.DELETE_SITTING,
    Permission.CREATE_FRAMING,
    Permission.READ_FRAMING,
    Permission.UPDATE_FRAMING,
    Permission.DELETE_FRAMING,
    Permission.CREATE_MEDIA,
    Permission.READ_MEDIA,
    Permission.UPDATE_MEDIA,
    Permission.DELETE_MEDIA,
    Permission.CREATE_EXTRA_COPY,
    Permission.READ_EXTRA_COPY,
    Permission.UPDATE_EXTRA_COPY,
    Permission.DELETE_EXTRA_COPY,
  ]
  ,

  [UserRole.EDITOR]: [],
  [UserRole.PHOTOGRAPHER]: [],
};
