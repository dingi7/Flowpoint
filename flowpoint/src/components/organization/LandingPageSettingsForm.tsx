import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LandingPageSettings, Organization } from "@/core";
import { serviceHost } from "@/services";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type LandingPageFormValues = {
  slug: string;
  landingPage: LandingPageSettings;
};

type SlugStatus = "idle" | "invalid" | "checking" | "available" | "taken";

const slugPattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildLandingDefaults = (
  organization: Organization,
): { slug: string; landingPage: LandingPageSettings } => {
  const landingPage = organization.landingPage;
  const contactInfo = organization.settings?.contactInfo;

  const rawSlug = organization.slug || organization.name || "";
  const fallbackSlug = normalizeSlug(rawSlug).slice(0, 63).replace(/-+$/g, "");

  const defaults: LandingPageSettings = {
    enabled: landingPage?.enabled ?? false,
    templateId: landingPage?.templateId ?? "first-class",
    seo: {
      title: landingPage?.seo?.title ?? organization.name,
      description:
        landingPage?.seo?.description ??
        (organization.industry
          ? `${organization.name} | ${organization.industry}`
          : undefined),
      keywords: landingPage?.seo?.keywords,
      ogImageUrl: landingPage?.seo?.ogImageUrl ?? organization.image,
      canonicalHost: landingPage?.seo?.canonicalHost,
    },
    branding: {
      logoUrl: landingPage?.branding?.logoUrl ?? organization.image,
      primaryColor: landingPage?.branding?.primaryColor,
      secondaryColor: landingPage?.branding?.secondaryColor,
    },
    hero: {
      title: landingPage?.hero?.title ?? organization.name,
      subtitle: landingPage?.hero?.subtitle ?? organization.industry,
      ctaLabel: landingPage?.hero?.ctaLabel,
      backgroundVideoUrl: landingPage?.hero?.backgroundVideoUrl,
      backgroundImageUrl: landingPage?.hero?.backgroundImageUrl,
    },
    gallery: {
      imageUrls: landingPage?.gallery?.imageUrls ?? [],
    },
    social: landingPage?.social ?? {},
    location: {
      mapEmbedUrl:
        landingPage?.location?.mapEmbedUrl ||
        contactInfo?.googleMapsUrl ||
        undefined,
      sectionTitle: landingPage?.location?.sectionTitle ?? "Location",
      sectionDescription:
        landingPage?.location?.sectionDescription ??
        contactInfo?.address ??
        undefined,
    },
    copyOverrides: landingPage?.copyOverrides ?? {},
  };

  return {
    slug: fallbackSlug,
    landingPage: defaults,
  };
};

interface LandingPageSettingsFormProps {
  organization: Organization;
  onSubmit: (data: Partial<Organization>) => void | Promise<void>;
  isLoading?: boolean;
}

export function LandingPageSettingsForm({
  organization,
  onSubmit,
  isLoading = false,
}: LandingPageSettingsFormProps) {
  const { t } = useTranslation();
  const databaseService = serviceHost.getDatabaseService();

  const defaultValues = useMemo(
    () => buildLandingDefaults(organization),
    [organization],
  );

  const { handleSubmit, setValue, watch } = useForm<LandingPageFormValues>({
    defaultValues,
  });

  useEffect(() => {
    const defaults = buildLandingDefaults(organization);
    setValue("slug", defaults.slug);
    setValue("landingPage", defaults.landingPage);
  }, [organization, setValue]);

  const slug = watch("slug") || "";
  const landingEnabled = watch("landingPage.enabled") ?? false;
  const imageUrls = watch("landingPage.gallery.imageUrls") || [];

  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");

  useEffect(() => {
    const trimmed = slug.trim();

    if (!trimmed) {
      setSlugStatus("idle");
      return;
    }

    if (
      trimmed.length < 3 ||
      trimmed.length > 63 ||
      !slugPattern.test(trimmed)
    ) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");

    const timeout = setTimeout(async () => {
      try {
        const result = await databaseService.getByField<Organization>(
          "organizations",
          [
            {
              field: "slug",
              operator: "==",
              value: trimmed,
            },
          ],
        );

        const conflict = result && result.id !== organization.id;
        setSlugStatus(conflict ? "taken" : "available");
      } catch (error) {
        console.error("Failed to validate slug", error);
        setSlugStatus("invalid");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [slug, organization.id, databaseService]);

  const handleSlugChange = (value: string) => {
    const normalized = normalizeSlug(value);
    setValue("slug", normalized, { shouldDirty: true, shouldValidate: true });
  };

  const handleAddImage = () => {
    setValue("landingPage.gallery.imageUrls", [...imageUrls, ""], {
      shouldDirty: true,
    });
  };

  const handleUpdateImage = (index: number, value: string) => {
    const updated = [...imageUrls];
    updated[index] = value;
    setValue("landingPage.gallery.imageUrls", updated, { shouldDirty: true });
  };

  const handleRemoveImage = (index: number) => {
    const updated = imageUrls.filter((_, i) => i !== index);
    setValue("landingPage.gallery.imageUrls", updated, { shouldDirty: true });
  };

  const rootDomain =
    import.meta.env.VITE_ROOT_DOMAIN || "flowpoint.services";

  const showSlugError =
    landingEnabled && (!slug || slugStatus === "invalid" || slugStatus === "taken");

  const statusLabel = !landingEnabled
    ? "Disabled"
    : slug && slugStatus === "available"
      ? "Live"
      : "Draft";

  const statusClasses =
    statusLabel === "Live"
      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
      : statusLabel === "Draft"
        ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
        : "bg-muted text-muted-foreground border-border";

  const previewUrl =
    slug && slugStatus !== "taken" && slugStatus !== "invalid"
      ? `https://${slug}.${rootDomain}`
      : null;

  const fieldsDisabled = isLoading || !landingEnabled;

  const submitHandler = handleSubmit(async (values) => {
    const normalizedSlug = values.slug.trim();
    const cleanedGallery = (values.landingPage.gallery?.imageUrls || []).filter(
      (url) => url.trim() !== "",
    );

    if (landingEnabled && !normalizedSlug) {
      toast.error(t("organization.landingPageForm.slugRequired"));
      return;
    }

    if (slugStatus === "taken") {
      toast.error(t("organization.landingPageForm.slugTaken"));
      return;
    }

    const payload: Partial<Organization> = {
      slug: normalizedSlug ? normalizedSlug : undefined,
      landingPage: {
        ...values.landingPage,
        gallery: {
          ...values.landingPage.gallery,
          imageUrls: cleanedGallery,
        },
      },
    };

    await onSubmit(payload);
  });

  return (
    <form onSubmit={submitHandler} className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">{t("organization.landingPageForm.title")}</h3>
          <p className="text-sm text-muted-foreground">
            Configure and publish a tailored landing page for this organization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`border ${statusClasses}`}>{statusLabel}</Badge>
          {previewUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
            >
              {t("organization.landingPageForm.previewLink")}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status & URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Label className="text-base">
                {t("organization.landingPageForm.enabled")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("organization.landingPageForm.enabledDescription")}
              </p>
            </div>
            <Switch
              checked={landingEnabled}
              onCheckedChange={(value) =>
                setValue("landingPage.enabled", value, {
                  shouldDirty: true,
                })
              }
              disabled={isLoading}
            />
          </div>

          <div className={`space-y-2 ${landingEnabled ? "" : "opacity-60"}`}>
            <Label htmlFor="slug">{t("organization.landingPageForm.slug")}</Label>
            <Input
              id="slug"
              value={slug}
              placeholder={t("organization.landingPageForm.slugPlaceholder")}
              onChange={(event) => handleSlugChange(event.target.value)}
              disabled={isLoading || !landingEnabled}
            />
            <div className="text-sm text-muted-foreground">
              {t("organization.landingPageForm.slugHelper", {
                domain: `${slug || "your-slug"}.${rootDomain}`,
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {slugStatus === "checking" && (
                <span className="text-muted-foreground">
                  {t("organization.landingPageForm.slugChecking")}
                </span>
              )}
              {slugStatus === "available" && (
                <span className="text-emerald-600">
                  {t("organization.landingPageForm.slugAvailable")}
                </span>
              )}
              {slugStatus === "taken" && (
                <span className="text-red-500">
                  {t("organization.landingPageForm.slugTaken")}
                </span>
              )}
              {slugStatus === "invalid" && slug && (
                <span className="text-red-500">
                  {t("organization.landingPageForm.slugInvalid")}
                </span>
              )}
              {showSlugError && (
                <span className="text-red-500">
                  {t("organization.landingPageForm.slugRequired")}
                </span>
              )}
            </div>
            {previewUrl && (
              <div className="text-sm">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {previewUrl}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Template & Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {t("organization.landingPageForm.templateFirstClass")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Editorial layout with hero, services, gallery, and team.
                  </p>
                </div>
                <Select
                  value={watch("landingPage.templateId")}
                  onValueChange={(value) =>
                    setValue("landingPage.templateId", value as "first-class", {
                      shouldDirty: true,
                    })
                  }
                  disabled={fieldsDisabled}
                >
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue
                      placeholder={t("organization.landingPageForm.selectTemplate")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first-class">
                      {t("organization.landingPageForm.templateFirstClass")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandingLogo">
                  {t("organization.landingPageForm.brandingLogo")}
                </Label>
                <Input
                  id="brandingLogo"
                  value={watch("landingPage.branding.logoUrl") || ""}
                  onChange={(event) =>
                    setValue("landingPage.branding.logoUrl", event.target.value, {
                      shouldDirty: true,
                    })
                  }
                  disabled={fieldsDisabled}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brandingPrimary">
                    {t("organization.landingPageForm.brandingPrimary")}
                  </Label>
                  <Input
                    id="brandingPrimary"
                    value={watch("landingPage.branding.primaryColor") || ""}
                    onChange={(event) =>
                      setValue(
                        "landingPage.branding.primaryColor",
                        event.target.value,
                        { shouldDirty: true },
                      )
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandingSecondary">
                    {t("organization.landingPageForm.brandingSecondary")}
                  </Label>
                  <Input
                    id="brandingSecondary"
                    value={watch("landingPage.branding.secondaryColor") || ""}
                    onChange={(event) =>
                      setValue(
                        "landingPage.branding.secondaryColor",
                        event.target.value,
                        { shouldDirty: true },
                      )
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed border-border bg-gradient-to-br from-muted/40 via-background to-muted/50 p-4">
              <p className="text-sm font-semibold">Hero snapshot</p>
              <p className="text-xs text-muted-foreground">
                This reflects your hero title and imagery.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-base font-semibold">
                  {watch("landingPage.hero.title") || organization.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {watch("landingPage.hero.subtitle") || organization.industry || "Add a short description."}
                </p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {watch("landingPage.hero.ctaLabel") || "Call to action"}
                  </span>
                </div>
              </div>
            </div>
            {previewUrl ? (
              <div className="text-sm text-muted-foreground">
                Preview:{" "}
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {previewUrl}
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add a valid slug to generate a preview URL.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("organization.landingPageForm.heroTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="heroTitle">
              {t("organization.landingPageForm.heroHeading")}
            </Label>
            <Input
              id="heroTitle"
              value={watch("landingPage.hero.title") || ""}
              onChange={(event) =>
                setValue("landingPage.hero.title", event.target.value, {
                  shouldDirty: true,
                })
              }
              disabled={fieldsDisabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heroCta">
              {t("organization.landingPageForm.heroCta")}
            </Label>
            <Input
              id="heroCta"
              value={watch("landingPage.hero.ctaLabel") || ""}
              onChange={(event) =>
                setValue("landingPage.hero.ctaLabel", event.target.value, {
                  shouldDirty: true,
                })
              }
              disabled={fieldsDisabled}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="heroSubtitle">
              {t("organization.landingPageForm.heroSubtitle")}
            </Label>
            <Textarea
              id="heroSubtitle"
              value={watch("landingPage.hero.subtitle") || ""}
              onChange={(event) =>
                setValue("landingPage.hero.subtitle", event.target.value, {
                  shouldDirty: true,
                })
              }
              disabled={fieldsDisabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heroVideo">
              {t("organization.landingPageForm.heroVideo")}
            </Label>
            <Input
              id="heroVideo"
              value={watch("landingPage.hero.backgroundVideoUrl") || ""}
              onChange={(event) =>
                setValue(
                  "landingPage.hero.backgroundVideoUrl",
                  event.target.value,
                  { shouldDirty: true },
                )
              }
              disabled={fieldsDisabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heroImage">
              {t("organization.landingPageForm.heroImage")}
            </Label>
            <Input
              id="heroImage"
              value={watch("landingPage.hero.backgroundImageUrl") || ""}
              onChange={(event) =>
                setValue(
                  "landingPage.hero.backgroundImageUrl",
                  event.target.value,
                  { shouldDirty: true },
                )
              }
              disabled={fieldsDisabled}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("organization.landingPageForm.galleryTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageUrls.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("organization.landingPageForm.galleryEmpty")}
              </p>
            )}
            {imageUrls.map((url, index) => (
              <div key={`${index}-${url}`} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px]">
                <Input
                  value={url}
                  onChange={(event) =>
                    handleUpdateImage(index, event.target.value)
                  }
                  placeholder={t("organization.landingPageForm.galleryPlaceholder")}
                  disabled={fieldsDisabled}
                />
                <div className="flex items-center gap-2">
                  {url ? (
                    <img
                      src={url}
                      alt={`Gallery ${index + 1}`}
                      className="h-16 w-24 rounded-md border border-border object-cover"
                    />
                  ) : (
                    <div className="h-16 w-24 rounded-md border border-dashed border-border bg-muted/40" />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveImage(index)}
                    disabled={fieldsDisabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddImage}
              disabled={fieldsDisabled}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("organization.landingPageForm.galleryAdd")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("organization.landingPageForm.socialTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="socialInstagram">
                {t("organization.landingPageForm.socialInstagram")}
              </Label>
              <Input
                id="socialInstagram"
                value={watch("landingPage.social.instagram") || ""}
                onChange={(event) =>
                  setValue("landingPage.social.instagram", event.target.value, {
                    shouldDirty: true,
                  })
                }
                disabled={fieldsDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialFacebook">
                {t("organization.landingPageForm.socialFacebook")}
              </Label>
              <Input
                id="socialFacebook"
                value={watch("landingPage.social.facebook") || ""}
                onChange={(event) =>
                  setValue("landingPage.social.facebook", event.target.value, {
                    shouldDirty: true,
                  })
                }
                disabled={fieldsDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialTiktok">
                {t("organization.landingPageForm.socialTiktok")}
              </Label>
              <Input
                id="socialTiktok"
                value={watch("landingPage.social.tiktok") || ""}
                onChange={(event) =>
                  setValue("landingPage.social.tiktok", event.target.value, {
                    shouldDirty: true,
                  })
                }
                disabled={fieldsDisabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("organization.landingPageForm.locationTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationSectionTitle">
                {t("organization.landingPageForm.locationSectionTitle")}
              </Label>
              <Input
                id="locationSectionTitle"
                value={watch("landingPage.location.sectionTitle") || ""}
                onChange={(event) =>
                  setValue(
                    "landingPage.location.sectionTitle",
                    event.target.value,
                    { shouldDirty: true },
                  )
                }
                disabled={fieldsDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationSectionDescription">
                {t("organization.landingPageForm.locationSectionDescription")}
              </Label>
              <Textarea
                id="locationSectionDescription"
                value={watch("landingPage.location.sectionDescription") || ""}
                onChange={(event) =>
                  setValue(
                    "landingPage.location.sectionDescription",
                    event.target.value,
                    { shouldDirty: true },
                  )
                }
                disabled={fieldsDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationMap">
                {t("organization.landingPageForm.locationMap")}
              </Label>
              <Input
                id="locationMap"
                value={watch("landingPage.location.mapEmbedUrl") || ""}
                onChange={(event) =>
                  setValue(
                    "landingPage.location.mapEmbedUrl",
                    event.target.value,
                    { shouldDirty: true },
                  )
                }
                disabled={fieldsDisabled}
              />
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
            {watch("landingPage.location.mapEmbedUrl") ? (
              <iframe
                title="Map preview"
                src={watch("landingPage.location.mapEmbedUrl") || ""}
                className="h-56 w-full rounded-md border border-border"
                loading="lazy"
              />
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                Map preview appears here.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="copy-overrides" className="border-none">
          <AccordionTrigger className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-left">
            {t("organization.landingPageForm.copyTitle")}
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <Card>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="copyServicesTitle">
                    {t("organization.landingPageForm.copyServicesTitle")}
                  </Label>
                  <Input
                    id="copyServicesTitle"
                    value={watch("landingPage.copyOverrides.servicesTitle") || ""}
                    onChange={(event) =>
                      setValue(
                        "landingPage.copyOverrides.servicesTitle",
                        event.target.value,
                        { shouldDirty: true },
                      )
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copyTeamTitle">
                    {t("organization.landingPageForm.copyTeamTitle")}
                  </Label>
                  <Input
                    id="copyTeamTitle"
                    value={watch("landingPage.copyOverrides.teamTitle") || ""}
                    onChange={(event) =>
                      setValue(
                        "landingPage.copyOverrides.teamTitle",
                        event.target.value,
                        { shouldDirty: true },
                      )
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copyTeamSubtitle">
                    {t("organization.landingPageForm.copyTeamSubtitle")}
                  </Label>
                  <Input
                    id="copyTeamSubtitle"
                    value={watch("landingPage.copyOverrides.teamSubtitle") || ""}
                    onChange={(event) =>
                      setValue(
                        "landingPage.copyOverrides.teamSubtitle",
                        event.target.value,
                        { shouldDirty: true },
                      )
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copyGalleryTitle">
                    {t("organization.landingPageForm.copyGalleryTitle")}
                  </Label>
                  <Input
                    id="copyGalleryTitle"
                    value={watch("landingPage.copyOverrides.galleryTitle") || ""}
                    onChange={(event) =>
                      setValue(
                        "landingPage.copyOverrides.galleryTitle",
                        event.target.value,
                        { shouldDirty: true },
                      )
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="seo" className="border-none">
          <AccordionTrigger className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-left">
            {t("organization.landingPageForm.seoTitle")}
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">
                    {t("organization.landingPageForm.seoMetaTitle")}
                  </Label>
                  <Input
                    id="seoTitle"
                    value={watch("landingPage.seo.title") || ""}
                    onChange={(event) =>
                      setValue("landingPage.seo.title", event.target.value, {
                        shouldDirty: true,
                      })
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">
                    {t("organization.landingPageForm.seoMetaDescription")}
                  </Label>
                  <Textarea
                    id="seoDescription"
                    value={watch("landingPage.seo.description") || ""}
                    onChange={(event) =>
                      setValue("landingPage.seo.description", event.target.value, {
                        shouldDirty: true,
                      })
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoKeywords">
                    {t("organization.landingPageForm.seoKeywords")}
                  </Label>
                  <Input
                    id="seoKeywords"
                    value={watch("landingPage.seo.keywords") || ""}
                    onChange={(event) =>
                      setValue("landingPage.seo.keywords", event.target.value, {
                        shouldDirty: true,
                      })
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoOgImage">
                    {t("organization.landingPageForm.seoOgImage")}
                  </Label>
                  <Input
                    id="seoOgImage"
                    value={watch("landingPage.seo.ogImageUrl") || ""}
                    onChange={(event) =>
                      setValue("landingPage.seo.ogImageUrl", event.target.value, {
                        shouldDirty: true,
                      })
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoCanonical">
                    {t("organization.landingPageForm.seoCanonical")}
                  </Label>
                  <Input
                    id="seoCanonical"
                    value={watch("landingPage.seo.canonicalHost") || ""}
                    onChange={(event) =>
                      setValue("landingPage.seo.canonicalHost", event.target.value, {
                        shouldDirty: true,
                      })
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="sticky bottom-6 z-10">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/95 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">
              {landingEnabled ? "Ready to publish updates?" : "Landing page is disabled."}
            </p>
            <p className="text-xs text-muted-foreground">
              {landingEnabled
                ? "Save changes to update the live landing page."
                : "Enable the landing page to publish and share the URL."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
              >
                Preview
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                isLoading ||
                (landingEnabled &&
                  (slugStatus === "taken" || slugStatus === "invalid"))
              }
            >
              {isLoading
                ? t("organization.landingPageForm.saving")
                : landingEnabled
                  ? "Publish changes"
                  : t("organization.landingPageForm.save")}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
