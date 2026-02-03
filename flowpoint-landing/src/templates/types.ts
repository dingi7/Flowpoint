import { LandingPageSettings, Member, Organization, Service } from "@/core";

export type TemplateProps = {
  organization: Organization;
  landingPage: LandingPageSettings;
  services: Service[];
  members: Member[];
};
