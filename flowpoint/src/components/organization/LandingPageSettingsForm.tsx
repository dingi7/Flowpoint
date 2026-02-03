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
  landingPage?: LandingPageSettings,
): LandingPageSettings => ({
  enabled: landingPage?.enabled ?? false,
  templateId: landingPage?.templateId ?? "first-class",
  seo: landingPage?.seo ?? {},
  branding: landingPage?.branding ?? {},
  hero: landingPage?.hero ?? {},
  gallery: {
    imageUrls: landingPage?.gallery?.imageUrls ?? [],
  },
  social: landingPage?.social ?? {},
  location: landingPage?.location ?? {},
  copyOverrides: landingPage?.copyOverrides ?? {},
});

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
    () => ({
      slug: organization.slug || "",
      landingPage: buildLandingDefaults(organization.landingPage),
    }),
    [organization.landingPage, organization.slug],
  );

  const { handleSubmit, setValue, watch } = useForm<LandingPageFormValues>({
    defaultValues,
  });

  useEffect(() => {
    setValue("slug", organization.slug || "");
    setValue("landingPage", buildLandingDefaults(organization.landingPage));
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
      <Card>
        <CardHeader>
          <CardTitle>{t("organization.landingPageForm.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
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

          <div className="space-y-2">
            <Label htmlFor="slug">
              {t("organization.landingPageForm.slug")}
            </Label>
            <Input
              id="slug"
              value={slug}
              placeholder={t("organization.landingPageForm.slugPlaceholder")}
              onChange={(event) => handleSlugChange(event.target.value)}
              disabled={isLoading}
            />
            <div className="text-sm text-muted-foreground">
              {t("organization.landingPageForm.slugHelper", {
                domain: `${slug || "your-slug"}.${rootDomain}`,
              })}
            </div>
            {slugStatus === "checking" && (
              <p className="text-sm text-muted-foreground">
                {t("organization.landingPageForm.slugChecking")}
              </p>
            )}
            {slugStatus === "available" && (
              <p className="text-sm text-emerald-500">
                {t("organization.landingPageForm.slugAvailable")}
              </p>
            )}
            {slugStatus === "taken" && (
              <p className="text-sm text-red-500">
                {t("organization.landingPageForm.slugTaken")}
              </p>
            )}
            {slugStatus === "invalid" && slug && (
              <p className="text-sm text-red-500">
                {t("organization.landingPageForm.slugInvalid")}
              </p>
            )}
            {showSlugError && (
              <p className="text-sm text-red-500">
                {t("organization.landingPageForm.slugRequired")}
              </p>
            )}
            {slug && slugStatus !== "taken" && slugStatus !== "invalid" && (
              <a
                href={`https://${slug}.${rootDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {t("organization.landingPageForm.previewLink")}
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("organization.landingPageForm.template")}</Label>
            <Select
              value={watch("landingPage.templateId")}
              onValueChange={(value) =>
                setValue("landingPage.templateId", value as "first-class", {
                  shouldDirty: true,
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("organization.landingPageForm.seoTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("organization.landingPageForm.brandingTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("organization.landingPageForm.heroTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
            <div key={`${index}-${url}`} className="flex gap-2 items-center">
              <Input
                value={url}
                onChange={(event) => handleUpdateImage(index, event.target.value)}
                placeholder={t("organization.landingPageForm.galleryPlaceholder")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveImage(index)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddImage}
            disabled={isLoading}
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
        <CardContent className="space-y-4">
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("organization.landingPageForm.locationTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("organization.landingPageForm.copyTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading || slugStatus === "taken" || slugStatus === "invalid"}
        >
          {isLoading
            ? t("organization.landingPageForm.saving")
            : t("organization.landingPageForm.save")}
        </Button>
      </div>
    </form>
  );
}
