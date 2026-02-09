import type {
  BillingSubscription,
  DeletedObjectJSON,
  Invitation,
  Organization,
  OrganizationMembership,
  User,
  UserJSON,
  WebhookEvent,
} from "@clerk/backend";

export enum USER_EVENT {
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_DELETED = "user.deleted",
}

export enum CLERK_ORGANIZATION_ROLE {
  ADMIN = "org:admin",
  MEMBER = "org:member",
}

export type ClerkUser = UserJSON;

export interface ValidateWebhookPayload {
  webhookSecret: string;
  svixID: string;
  svixTimestamp: string;
  svixSignature: string;
  rawBody: Buffer | string;
}

type ClerkCreateUserPayload = {
  apiKey: string;
  firstName?: string;
  lastName?: string;
  email: string;
} & UserMetadataParams;

type UserMetadataParams = {
  publicMetadata?: UserPublicMetadata;
  privateMetadata?: UserPrivateMetadata;
  unsafeMetadata?: UserUnsafeMetadata;
};

type ClerkInvitationPayload = {
  apiKey: string;
  email: string;
  ignoreExisting?: boolean;
};

type ClerkDeleteUserPayload = {
  apiKey: string;
  clerkUserID: string;
};

type ClerkCreateOrganizationPayload = {
  apiKey: string;
  name: string;
  slug?: string;
  createdBy?: string;
  publicMetadata?: Record<string, unknown>;
  privateMetadata?: Record<string, unknown>;
};

type ClerkCreateOrganizationMembershipPayload = {
  apiKey: string;
  organizationId: string;
  userId: string;
  role: CLERK_ORGANIZATION_ROLE;
};

type ClerkGetOrganizationBillingSubscriptionPayload = {
  apiKey: string;
  organizationId: string;
};

export interface ClerkService {
  createClerkUser: (clerkUser: ClerkCreateUserPayload) => Promise<User | null>;
  createClerkInvitation: (
    clerkUser: ClerkInvitationPayload,
  ) => Promise<Invitation> | null;
  validateWebhookSignature: (
    payload: ValidateWebhookPayload,
  ) => Promise<WebhookEvent | null>;

  getClerkUserFromEvent: (
    event: WebhookEvent,
  ) => ClerkUser | DeletedObjectJSON | null;

  deleteClerkUser: (payload: ClerkDeleteUserPayload) => Promise<void>;
  createOrganization: (
    payload: ClerkCreateOrganizationPayload,
  ) => Promise<Organization | null>;
  addOrganizationMembership: (
    payload: ClerkCreateOrganizationMembershipPayload,
  ) => Promise<OrganizationMembership | null>;
  getOrganizationBillingSubscription: (
    payload: ClerkGetOrganizationBillingSubscriptionPayload,
  ) => Promise<BillingSubscription | null>;
}
