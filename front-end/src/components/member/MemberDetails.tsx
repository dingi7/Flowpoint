"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Member } from "@/core";
import { useRoles } from "@/hooks/repository-hooks/role/use-role";
import {
  Clock,
  Edit,
  Users,
  Shield,
} from "lucide-react";

interface MemberDetailsProps {
  member: Member;
  onEdit: () => void;
}

export function MemberDetails({ member, onEdit }: MemberDetailsProps) {
  // Fetch roles for display
  const { data: rolesData } = useRoles({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  const roles = rolesData || [];
  const roleMap = new Map(roles.map(role => [role.id, role]));

  const getMemberRoles = (roleIds: string[]) => {
    return roleIds.map(roleId => roleMap.get(roleId)).filter((role): role is NonNullable<typeof role> => Boolean(role));
  };

  const memberRoles = getMemberRoles(member.roleIds || []);

  return (
    <div className="space-y-6">
      {/* Member Header */}
      <div className="flex sm:items-start justify-between sm:flex-row flex-col">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 ring-4 ring-muted/20 hover:ring-primary/20 transition-all duration-200">
            <AvatarImage
              src={member.image}
              alt={member.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xl">
              {member.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-2xl font-bold font-sans">{member.name}</h3>
            <p className="text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              Team Member
            </p>
          </div>
        </div>
        <Button onClick={onEdit} className="gap-2 mt-4 sm:mt-0">
          <Edit className="h-4 w-4" />
          Edit Member
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans">
              Member Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Name:</span>
              <span>{member.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Member Since:</span>
              <span>
                {member.createdAt 
                  ? new Date(member.createdAt).toLocaleDateString()
                  : "N/A"
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Last Updated:</span>
              <span>
                {member.updatedAt 
                  ? new Date(member.updatedAt).toLocaleDateString()
                  : "N/A"
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Roles & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Assigned Roles:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {memberRoles.length > 0 ? (
                    memberRoles.map((role) => (
                      <Badge key={role.id} variant="secondary">
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No roles assigned</span>
                  )}
                </div>
              </div>
              
              {memberRoles.length > 0 && (
                <div>
                  <span className="font-medium">Permissions:</span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {memberRoles.flatMap(role => role.permissions || []).map((permission, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Activity tracking will be implemented in future updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}