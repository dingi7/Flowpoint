import {
  LoggerService,
  MemberRepository,
  PermissionKey,
  RoleRepository,
} from "@/core";

interface Dependencies {
  memberRepository: MemberRepository;
  roleRepository: RoleRepository;
  loggerService: LoggerService;
}

export async function checkPermission(
  userId: string,
  organizationId: string,
  permission: PermissionKey,
  dependencies: Dependencies,
): Promise<void> {
  const { memberRepository, roleRepository, loggerService } = dependencies;

  // 1. Check if user is a member of the organization
  const member = await memberRepository.get({
    organizationId,
    id: userId,
  });

  if (!member) {
    loggerService.info("Member not found", { userId, organizationId });
    throw new Error("Member not found");
  }

  loggerService.info("Member found", { member });

  // 2. Get member's roles
  loggerService.info("Querying roles", {
    organizationId,
    memberRoleIds: member.roleIds,
    roleIdsType: typeof member.roleIds,
    roleIdsLength: member.roleIds?.length,
  });

  const roles = await roleRepository.getMany({
    organizationId,
    ids: member.roleIds,
  });

  loggerService.info("Roles query result", {
    roles,
    rolesCount: roles.length,
    queryParams: { organizationId, ids: member.roleIds },
  });

  if (roles.length === 0) {
    loggerService.info("Member has no roles");
    throw new Error("Member has no roles");
  }

  // 3. Check if any role has the required permission
  const hasPermission = roles.some((role) =>
    role.permissions.includes(permission),
  );

  if (!hasPermission) {
    loggerService.info("Member does not have the required permission", {
      userId,
      organizationId,
      permission,
    });
    throw new Error("Member does not have the required permission");
  }
}

