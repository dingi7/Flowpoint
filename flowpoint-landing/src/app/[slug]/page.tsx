import { getLandingPageData } from "@/server/get-landing-page-data";
import { getTemplateComponent } from "@/templates";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getLandingPageData(params.slug);

  if (!data) {
    notFound();
  }

  const Template = getTemplateComponent(data.landingPage.templateId);

  return (
    <Template
      organization={data.organization}
      landingPage={data.landingPage}
      services={data.services}
      members={data.members}
    />
  );
}
