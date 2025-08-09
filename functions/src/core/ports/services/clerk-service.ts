import type {
  DeletedObjectJSON,
  Invitation,
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
}
