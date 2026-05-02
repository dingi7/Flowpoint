import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { isReservedOrganizationSlug, LandingPageSettings, Organization } from "@/core";
import { useSetAiMirrorGeminiKey } from "@/hooks";
import { serviceHost } from "@/services";
import { Plus, Trash2, Pipette, Settings, Palette, ImageIcon, Share2, LayoutTemplate, Star, MessageSquareQuote, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

const maxSlugLength = 63;
const reservedSlugFallbackSuffix = "-site";

function buildSafeDefaultSlug(payload: { rawSlug: string }) {
  const normalized = normalizeSlug(payload.rawSlug)
    .slice(0, maxSlugLength)
    .replace(/-+$/g, "");

  if (!normalized || !isReservedOrganizationSlug({ slug: normalized })) {
    return normalized;
  }

  const truncatedBase = normalized
    .slice(0, maxSlugLength - reservedSlugFallbackSuffix.length)
    .replace(/-+$/g, "");
  const fallbackBase = truncatedBase || "org";

  return `${fallbackBase}${reservedSlugFallbackSuffix}`;
}

const buildLandingDefaults = (
  organization: Organization,
): { slug: string; landingPage: LandingPageSettings } => {
  const landingPage = organization.landingPage;
  const contactInfo = organization.settings?.contactInfo;

  const rawSlug = organization.slug || organization.name || "";
  const fallbackSlug = buildSafeDefaultSlug({ rawSlug });

  const defaults: LandingPageSettings = {
    enabled: landingPage?.enabled ?? false,
    templateId: landingPage?.templateId ?? "first-class",
    aiMirror: {
      enabled: landingPage?.aiMirror?.enabled ?? false,
      hasGeminiKey: landingPage?.aiMirror?.hasGeminiKey ?? false,
    },
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
      primaryColor: landingPage?.branding?.primaryColor ?? "#0f766e",
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
    aboutUs: {
      title: landingPage?.aboutUs?.title,
      description: landingPage?.aboutUs?.description,
      patientsServed: landingPage?.aboutUs?.patientsServed,
      specialists: landingPage?.aboutUs?.specialists,
      yearsOfService: landingPage?.aboutUs?.yearsOfService,
      patientSatisfaction: landingPage?.aboutUs?.patientSatisfaction,
      bullets: landingPage?.aboutUs?.bullets ?? [],
    },
    testimonials: {
      items: landingPage?.testimonials?.items ?? [],
    },
    copyOverrides: landingPage?.copyOverrides ?? {},
    footerTagline: landingPage?.footerTagline,
  };

  return {
    slug: fallbackSlug,
    landingPage: defaults,
  };
};

// Color swatch presets
const COLOR_PRESETS = [
  { label: "Teal", value: "#0f766e" },
  { label: "Ocean", value: "#0369a1" },
  { label: "Violet", value: "#6d28d9" },
  { label: "Rose", value: "#be123c" },
  { label: "Amber", value: "#b45309" },
  { label: "Slate", value: "#334155" },
  { label: "Forest", value: "#166534" },
  { label: "Indigo", value: "#3730a3" },
];

function ColorPickerField({
  id,
  label,
  value,
  onChange,
  disabled,
  description,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  description?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            ref={inputRef}
            type="color"
            value={value || "#0f766e"}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="sr-only"
            id={`${id}-native`}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="w-10 h-10 rounded-lg border border-border shadow-sm flex items-center justify-center hover:ring-2 hover:ring-ring hover:ring-offset-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: value || "#0f766e" }}
            aria-label="Open color picker"
          >
            <Pipette className="w-4 h-4 text-white mix-blend-difference" />
          </button>
        </div>
        <Input
          id={id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#0f766e"
          disabled={disabled}
          className="font-mono text-sm flex-1"
          maxLength={7}
        />
      </div>
      {/* Preset swatches */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset.value)}
            title={preset.label}
            className="w-6 h-6 rounded-md border border-border/50 hover:scale-110 hover:ring-2 hover:ring-ring hover:ring-offset-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: preset.value }}
          />
        ))}
      </div>
    </div>
  );
}

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
  const setAiMirrorGeminiKeyMutation = useSetAiMirrorGeminiKey();

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
  const primaryColor = watch("landingPage.branding.primaryColor") || "#0f766e";
  const templateId = watch("landingPage.templateId");
  const aiMirrorEnabled = watch("landingPage.aiMirror.enabled") ?? false;
  const aiMirrorHasGeminiKey = watch("landingPage.aiMirror.hasGeminiKey") ?? false;
  const aboutUsBullets = watch("landingPage.aboutUs.bullets") || [];
  const testimonialItems = watch("landingPage.testimonials.items") || [];

  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [geminiApiKey, setGeminiApiKey] = useState("");

  useEffect(() => {
    const trimmed = slug.trim().toLowerCase();

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

    if (isReservedOrganizationSlug({ slug: trimmed })) {
      setSlugStatus("taken");
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

  useEffect(() => {
    setGeminiApiKey("");
  }, [organization.id]);

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

  const handleAddBullet = () => {
    setValue("landingPage.aboutUs.bullets", [...aboutUsBullets, ""], { shouldDirty: true });
  };

  const handleUpdateBullet = (index: number, value: string) => {
    const updated = [...aboutUsBullets];
    updated[index] = value;
    setValue("landingPage.aboutUs.bullets", updated, { shouldDirty: true });
  };

  const handleRemoveBullet = (index: number) => {
    setValue("landingPage.aboutUs.bullets", aboutUsBullets.filter((_, i) => i !== index), { shouldDirty: true });
  };

  const handleAddTestimonial = () => {
    setValue("landingPage.testimonials.items", [
      ...testimonialItems,
      { quote: "", authorName: "", authorRole: "", rating: 5 },
    ], { shouldDirty: true });
  };

  const handleUpdateTestimonial = (index: number, field: string, value: string | number) => {
    const updated = [...testimonialItems];
    updated[index] = { ...updated[index], [field]: value };
    setValue("landingPage.testimonials.items", updated, { shouldDirty: true });
  };

  const handleRemoveTestimonial = (index: number) => {
    setValue("landingPage.testimonials.items", testimonialItems.filter((_, i) => i !== index), { shouldDirty: true });
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

  // const previewUrl =
  //   slug && slugStatus !== "taken" && slugStatus !== "invalid"
  //     ? `https://${slug}.${rootDomain}`
  //     : null;

  const previewUrl = `http://localhost:3000/${slug}`;

  const isBusy = isLoading || setAiMirrorGeminiKeyMutation.isPending;
  const fieldsDisabled = isBusy || !landingEnabled;
  const aiMirrorAvailable = templateId === "first-class";

  const submitHandler = handleSubmit(async (values) => {
    const normalizedSlug = values.slug.trim().toLowerCase();
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

    if (normalizedSlug && isReservedOrganizationSlug({ slug: normalizedSlug })) {
      toast.error(t("organization.landingPageForm.slugTaken"));
      return;
    }

    let hasGeminiKey = values.landingPage.aiMirror?.hasGeminiKey ?? false;

    if (geminiApiKey.trim()) {
      const result = await setAiMirrorGeminiKeyMutation.mutateAsync({
        organizationId: organization.id,
        geminiApiKey: geminiApiKey.trim(),
      });
      hasGeminiKey = result.hasGeminiKey;
      setValue("landingPage.aiMirror.hasGeminiKey", hasGeminiKey);
    }

    if (values.landingPage.aiMirror?.enabled && !hasGeminiKey) {
      toast.error(t("organization.landingPageForm.aiMirrorKeyRequired"));
      return;
    }

    const payload: Partial<Organization> = {
      slug: normalizedSlug ? normalizedSlug : undefined,
      landingPage: {
        ...values.landingPage,
        aiMirror: {
          enabled: values.landingPage.aiMirror?.enabled ?? false,
          hasGeminiKey,
        },
        gallery: {
          ...values.landingPage.gallery,
          imageUrls: cleanedGallery,
        },
      },
    };

    await onSubmit(payload);
    setGeminiApiKey("");
  });

  return (
    <form onSubmit={submitHandler} className="space-y-8">
      {/* HEADER_SECTION */}
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

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto bg-muted/50 p-1 mb-8 gap-1">
          <TabsTrigger value="general" className="gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="design" className="gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Palette className="h-4 w-4" />Design</TabsTrigger>
          <TabsTrigger value="hero" className="gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"><ImageIcon className="h-4 w-4" />Hero</TabsTrigger>
          <TabsTrigger value="content" className="gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"><LayoutTemplate className="h-4 w-4" />Content</TabsTrigger>
          <TabsTrigger value="marketing" className="gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Share2 className="h-4 w-4" />Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Status & URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-lg border border-border/50 bg-muted/20 p-4">
                <div>
                  <Label className="text-base text-foreground">
                    {t("organization.landingPageForm.enabled")}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("organization.landingPageForm.enabledDescription")}
                  </p>
                </div>
                <Switch
                  checked={landingEnabled}
                  onCheckedChange={(value) =>
                    setValue("landingPage.enabled", value, { shouldDirty: true })
                  }
                  disabled={isBusy}
                />
              </div>

              <div className={`space-y-2 transition-opacity ${landingEnabled ? "" : "opacity-50 pointer-events-none"}`}>
                <Label htmlFor="slug">{t("organization.landingPageForm.slug")}</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    https://
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    placeholder={t("organization.landingPageForm.slugPlaceholder")}
                    onChange={(event) => handleSlugChange(event.target.value)}
                    disabled={isLoading || !landingEnabled}
                    className="rounded-l-none"
                  />
                  <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    .{rootDomain}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
                  {slugStatus === "checking" && (
                    <span className="text-muted-foreground">
                      {t("organization.landingPageForm.slugChecking")}
                    </span>
                  )}
                  {slugStatus === "available" && (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t("organization.landingPageForm.slugAvailable")}
                    </span>
                  )}
                  {slugStatus === "taken" && (
                    <span className="text-red-500">
                      {t("organization.landingPageForm.slugTaken") || "Slug is taken"}
                    </span>
                  )}
                  {slugStatus === "invalid" && slug && (
                    <span className="text-red-500">
                      {t("organization.landingPageForm.slugInvalid") || "Invalid slug format"}
                    </span>
                  )}
                  {showSlugError && (
                    <span className="text-red-500">
                      {t("organization.landingPageForm.slugRequired") || "Slug is required when enabled"}
                    </span>
                  )}
                </div>
              </div>

              <div className={`space-y-4 rounded-lg border border-border/50 bg-muted/20 p-4 transition-opacity ${landingEnabled ? "" : "opacity-50 pointer-events-none"}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Label className="text-base text-foreground">
                      {t("organization.landingPageForm.aiMirrorEnabled")}
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("organization.landingPageForm.aiMirrorEnabledDescription")}
                    </p>
                    {!aiMirrorAvailable && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("organization.landingPageForm.aiMirrorTemplateHint")}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={aiMirrorEnabled}
                    onCheckedChange={(value) =>
                      setValue("landingPage.aiMirror.enabled", value, {
                        shouldDirty: true,
                      })
                    }
                    disabled={isBusy || !landingEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="aiMirrorGeminiKey">
                      {t("organization.landingPageForm.aiMirrorKeyLabel")}
                    </Label>
                    <Badge
                      className={
                        aiMirrorHasGeminiKey
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700"
                          : "border-border bg-muted text-muted-foreground"
                      }
                    >
                      {aiMirrorHasGeminiKey
                        ? t("organization.landingPageForm.aiMirrorKeySaved")
                        : t("organization.landingPageForm.aiMirrorKeyMissing")}
                    </Badge>
                  </div>
                  <Input
                    id="aiMirrorGeminiKey"
                    type="password"
                    autoComplete="off"
                    value={geminiApiKey}
                    onChange={(event) => setGeminiApiKey(event.target.value)}
                    disabled={isBusy || !landingEnabled}
                    placeholder={
                      aiMirrorHasGeminiKey
                        ? t("organization.landingPageForm.aiMirrorKeyPlaceholderExisting")
                        : t("organization.landingPageForm.aiMirrorKeyPlaceholder")
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("organization.landingPageForm.aiMirrorKeyDescription")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="design" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle>Template & Theme</CardTitle>
                <p className="text-sm text-muted-foreground">Define the layout and brand colors of your landing page.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template selector */}
                <div className="space-y-3">
                  <Label>Layout Template</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`relative flex cursor-pointer flex-col gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 ${templateId === "first-class" ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border"}`}>
                      <input
                        type="radio"
                        className="peer sr-only"
                        value="first-class"
                        checked={templateId === "first-class"}
                        onChange={(e) => setValue("landingPage.templateId", e.target.value as "first-class", { shouldDirty: true })}
                        disabled={fieldsDisabled}
                      />
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">First Class (Standard)</p>
                          <p className="text-xs text-muted-foreground">Editorial layout with hero, services, gallery, and team.</p>
                        </div>
                        <div className={`h-4 w-4 rounded-full border border-primary flex items-center justify-center ${templateId === "first-class" ? "bg-primary" : "bg-transparent border-input"}`}>
                          {templateId === "first-class" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </label>

                    <label className={`relative flex cursor-pointer flex-col gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 ${templateId === "clinic" ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border"}`}>
                      <input
                        type="radio"
                        className="peer sr-only"
                        value="clinic"
                        checked={templateId === "clinic"}
                        onChange={(e) => setValue("landingPage.templateId", e.target.value as "clinic", { shouldDirty: true })}
                        disabled={fieldsDisabled}
                      />
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">Clinic</p>
                          <p className="text-xs text-muted-foreground">Clean, modern light-themed layout for medical businesses.</p>
                        </div>
                        <div className={`h-4 w-4 rounded-full border border-primary flex items-center justify-center ${templateId === "clinic" ? "bg-primary" : "bg-transparent border-input"}`}>
                          {templateId === "clinic" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandingLogo">
                    {t("organization.landingPageForm.brandingLogo")}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">Upload a high-quality logo with a transparent background.</p>
                  <div className="flex items-center gap-3">
                    {watch("landingPage.branding.logoUrl") ? (
                      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted/30 flex items-center justify-center p-1">
                        <img
                          src={watch("landingPage.branding.logoUrl")}
                          alt="Logo preview"
                          className="h-full w-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/20 text-xs text-muted-foreground">
                        No Logo
                      </div>
                    )}
                    <Input
                      id="brandingLogo"
                      value={watch("landingPage.branding.logoUrl") || ""}
                      onChange={(event) =>
                        setValue("landingPage.branding.logoUrl", event.target.value, { shouldDirty: true })
                      }
                      disabled={fieldsDisabled}
                      placeholder="https://your-image-url.com/logo.png"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                  <ColorPickerField
                    id="brandingPrimary"
                    label={t("organization.landingPageForm.brandingPrimary")}
                    description="Used for buttons, accents, and highlights."
                    value={primaryColor}
                    onChange={(v) =>
                      setValue("landingPage.branding.primaryColor", v, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                  />
                  <ColorPickerField
                    id="brandingSecondary"
                    label={t("organization.landingPageForm.brandingSecondary")}
                    description="Optional secondary accent color."
                    value={watch("landingPage.branding.secondaryColor") || ""}
                    onChange={(v) =>
                      setValue("landingPage.branding.secondaryColor", v, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerTagline">Footer Tagline</Label>
                  <p className="text-xs text-muted-foreground">A short description shown in the footer under your logo.</p>
                  <Input
                    id="footerTagline"
                    value={watch("landingPage.footerTagline") || ""}
                    onChange={(event) =>
                      setValue("landingPage.footerTagline", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                    placeholder="Your trusted healthcare partner"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="hero" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Hero Section</CardTitle>
              <p className="text-sm text-muted-foreground">The first thing visitors see on your landing page.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">
                    {t("organization.landingPageForm.heroHeading")}
                  </Label>
                  <Input
                    id="heroTitle"
                    value={watch("landingPage.hero.title") || ""}
                    onChange={(event) =>
                      setValue("landingPage.hero.title", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                    placeholder="E.g. The Best Clinic in Town"
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
                      setValue("landingPage.hero.ctaLabel", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                    placeholder="Book Appointment"
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
                      setValue("landingPage.hero.subtitle", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                    rows={3}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/10 p-5 space-y-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Background Media</h4>
                  <p className="text-xs text-muted-foreground">Add a stunning image or video loop to the background.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="heroImage">
                      {t("organization.landingPageForm.heroImage")}
                    </Label>
                    <Input
                      id="heroImage"
                      value={watch("landingPage.hero.backgroundImageUrl") || ""}
                      onChange={(event) =>
                        setValue("landingPage.hero.backgroundImageUrl", event.target.value, { shouldDirty: true })
                      }
                      disabled={fieldsDisabled}
                      placeholder="https://..."
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
                        setValue("landingPage.hero.backgroundVideoUrl", event.target.value, { shouldDirty: true })
                      }
                      disabled={fieldsDisabled}
                      placeholder="https://... (.mp4)"
                    />
                  </div>
                </div>
                {(watch("landingPage.hero.backgroundImageUrl") || watch("landingPage.hero.backgroundVideoUrl")) && (
                  <div className="aspect-21/9 w-full rounded-xl border border-border/50 overflow-hidden bg-black/10 flex items-center justify-center relative ring-1 ring-border/10 shadow-sm">
                    {watch("landingPage.hero.backgroundVideoUrl") ? (
                      <video src={watch("landingPage.hero.backgroundVideoUrl")} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline />
                    ) : watch("landingPage.hero.backgroundImageUrl") ? (
                      <img src={watch("landingPage.hero.backgroundImageUrl")} className="absolute inset-0 w-full h-full object-cover" alt="Background Preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : null}
                    <div className="relative z-10 bg-black/60 px-3 py-1.5 rounded-full text-white text-xs backdrop-blur-md">Media Preview</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="content" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("organization.landingPageForm.galleryTitle")}</CardTitle>
                  <p className="text-sm text-muted-foreground">Manage the images displayed in the website gallery.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddImage}
                  disabled={fieldsDisabled}
                  className="flex items-center gap-2 h-9 w-full md:w-auto shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  {t("organization.landingPageForm.galleryAdd")}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {imageUrls.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-border/70 bg-muted/20">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground font-medium">
                      {t("organization.landingPageForm.galleryEmpty")}
                    </p>
                    <Button type="button" variant="link" onClick={handleAddImage} className="mt-2 h-auto p-0">
                      Add your first image
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={`${index}-${url}`} className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/10 p-3 relative group">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-3 -right-3 h-7 w-7 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => handleRemoveImage(index)}
                        disabled={fieldsDisabled}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="aspect-video w-full rounded-md border border-border/50 bg-muted/50 overflow-hidden flex items-center justify-center">
                        {url ? (
                          <img
                            src={url}
                            alt={`Gallery ${index + 1}`}
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground opacity-30" />
                        )}
                      </div>
                      <Input
                        value={url}
                        onChange={(event) => handleUpdateImage(index, event.target.value)}
                        placeholder={t("organization.landingPageForm.galleryPlaceholder")}
                        disabled={fieldsDisabled}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle>Copy Overrides</CardTitle>
                <p className="text-sm text-muted-foreground">Customize default section headings to better fit your tone.</p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="copyServicesTitle">
                    {t("organization.landingPageForm.copyServicesTitle")}
                  </Label>
                  <Input
                    id="copyServicesTitle"
                    value={watch("landingPage.copyOverrides.servicesTitle") || ""}
                    onChange={(event) =>
                      setValue("landingPage.copyOverrides.servicesTitle", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                    placeholder="E.g. Our Offerings"
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
                      setValue("landingPage.copyOverrides.teamTitle", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                    placeholder="E.g. Meet the Staff"
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
                      setValue("landingPage.copyOverrides.teamSubtitle", event.target.value, { shouldDirty: true })
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
                      setValue("landingPage.copyOverrides.galleryTitle", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                    placeholder="E.g. Our Portfolio"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><Info className="h-4 w-4" />About Us</CardTitle>
                  <p className="text-sm text-muted-foreground">Customise the "About Us" section on the clinic template.</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="aboutUsTitle">Section Title</Label>
                    <Input
                      id="aboutUsTitle"
                      value={watch("landingPage.aboutUs.title") || ""}
                      onChange={(e) => setValue("landingPage.aboutUs.title", e.target.value, { shouldDirty: true })}
                      disabled={fieldsDisabled}
                      placeholder="Trusted Healthcare Since 2005"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aboutUsYears">Years of Service</Label>
                    <Input
                      id="aboutUsYears"
                      value={watch("landingPage.aboutUs.yearsOfService") || ""}
                      onChange={(e) => setValue("landingPage.aboutUs.yearsOfService", e.target.value, { shouldDirty: true })}
                      disabled={fieldsDisabled}
                      placeholder="20+"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aboutUsDescription">Description</Label>
                  <Textarea
                    id="aboutUsDescription"
                    value={watch("landingPage.aboutUs.description") || ""}
                    onChange={(e) => setValue("landingPage.aboutUs.description", e.target.value, { shouldDirty: true })}
                    disabled={fieldsDisabled}
                    rows={3}
                    placeholder="We are committed to providing exceptional healthcare services..."
                  />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="aboutUsPatients">Patients Served</Label>
                    <Input
                      id="aboutUsPatients"
                      value={watch("landingPage.aboutUs.patientsServed") || ""}
                      onChange={(e) => setValue("landingPage.aboutUs.patientsServed", e.target.value, { shouldDirty: true })}
                      disabled={fieldsDisabled}
                      placeholder="50,000+"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aboutUsSpecialists">Specialists</Label>
                    <Input
                      id="aboutUsSpecialists"
                      value={watch("landingPage.aboutUs.specialists") || ""}
                      onChange={(e) => setValue("landingPage.aboutUs.specialists", e.target.value, { shouldDirty: true })}
                      disabled={fieldsDisabled}
                      placeholder="25+"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aboutUsSatisfaction">Patient Satisfaction</Label>
                    <Input
                      id="aboutUsSatisfaction"
                      value={watch("landingPage.aboutUs.patientSatisfaction") || ""}
                      onChange={(e) => setValue("landingPage.aboutUs.patientSatisfaction", e.target.value, { shouldDirty: true })}
                      disabled={fieldsDisabled}
                      placeholder="98%"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Key Highlights</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddBullet} disabled={fieldsDisabled} className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                  {aboutUsBullets.map((bullet, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={bullet}
                        onChange={(e) => handleUpdateBullet(index, e.target.value)}
                        disabled={fieldsDisabled}
                        placeholder="e.g. State-of-the-art medical equipment"
                        className="flex-1"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveBullet(index)} disabled={fieldsDisabled} className="shrink-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><MessageSquareQuote className="h-4 w-4" />Testimonials</CardTitle>
                  <p className="text-sm text-muted-foreground">Add patient reviews to display on the landing page.</p>
                </div>
                <Button type="button" variant="outline" onClick={handleAddTestimonial} disabled={fieldsDisabled} className="flex items-center gap-2 h-9 w-full md:w-auto shrink-0">
                  <Plus className="h-4 w-4" /> Add Testimonial
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {testimonialItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-border/70 bg-muted/20">
                    <MessageSquareQuote className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground font-medium">No testimonials yet</p>
                    <Button type="button" variant="link" onClick={handleAddTestimonial} className="mt-2 h-auto p-0">Add your first testimonial</Button>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4">
                  {testimonialItems.map((item, index) => (
                    <div key={index} className="relative rounded-xl border border-border/50 bg-muted/10 p-5 space-y-4 group">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-3 -right-3 h-7 w-7 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => handleRemoveTestimonial(index)}
                        disabled={fieldsDisabled}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="space-y-2">
                        <Label>Quote</Label>
                        <Textarea
                          value={item.quote || ""}
                          onChange={(e) => handleUpdateTestimonial(index, "quote", e.target.value)}
                          disabled={fieldsDisabled}
                          rows={2}
                          placeholder="The care I received was exceptional..."
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Author Name</Label>
                          <Input
                            value={item.authorName || ""}
                            onChange={(e) => handleUpdateTestimonial(index, "authorName", e.target.value)}
                            disabled={fieldsDisabled}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role / Title</Label>
                          <Input
                            value={item.authorRole || ""}
                            onChange={(e) => handleUpdateTestimonial(index, "authorRole", e.target.value)}
                            disabled={fieldsDisabled}
                            placeholder="Patient"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex items-center gap-1 pt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                disabled={fieldsDisabled}
                                onClick={() => handleUpdateTestimonial(index, "rating", star)}
                                className="p-0.5 transition-colors disabled:opacity-50"
                              >
                                <Star className={`h-5 w-5 ${star <= (item.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="marketing" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle>SEO Optimization</CardTitle>
                <p className="text-sm text-muted-foreground">Improve how your landing page appears in search engines and social media.</p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">
                    {t("organization.landingPageForm.seoMetaTitle")}
                  </Label>
                  <Input
                    id="seoTitle"
                    value={watch("landingPage.seo.title") || ""}
                    onChange={(event) =>
                      setValue("landingPage.seo.title", event.target.value, { shouldDirty: true })
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
                      setValue("landingPage.seo.keywords", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="seoDescription">
                    {t("organization.landingPageForm.seoMetaDescription")}
                  </Label>
                  <Textarea
                    id="seoDescription"
                    value={watch("landingPage.seo.description") || ""}
                    onChange={(event) =>
                      setValue("landingPage.seo.description", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoOgImage">
                    {t("organization.landingPageForm.seoOgImage")} <span className="text-muted-foreground text-xs font-normal">(Open Graph)</span>
                  </Label>
                  <Input
                    id="seoOgImage"
                    value={watch("landingPage.seo.ogImageUrl") || ""}
                    onChange={(event) =>
                      setValue("landingPage.seo.ogImageUrl", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                    placeholder="https://.../og-image.jpg"
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
                      setValue("landingPage.seo.canonicalHost", event.target.value, { shouldDirty: true })
                    }
                    disabled={fieldsDisabled}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-border/50 shadow-sm flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle>{t("organization.landingPageForm.socialTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="socialInstagram">Instagram URL</Label>
                    <Input
                      id="socialInstagram"
                      value={watch("landingPage.social.instagram") || ""}
                      onChange={(event) =>
                        setValue("landingPage.social.instagram", event.target.value, { shouldDirty: true })
                      }
                      disabled={fieldsDisabled}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socialFacebook">Facebook URL</Label>
                    <Input
                      id="socialFacebook"
                      value={watch("landingPage.social.facebook") || ""}
                      onChange={(event) =>
                        setValue("landingPage.social.facebook", event.target.value, { shouldDirty: true })
                      }
                      disabled={fieldsDisabled}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socialTiktok">TikTok URL</Label>
                    <Input
                      id="socialTiktok"
                      value={watch("landingPage.social.tiktok") || ""}
                      onChange={(event) =>
                        setValue("landingPage.social.tiktok", event.target.value, { shouldDirty: true })
                      }
                      disabled={fieldsDisabled}
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle>{t("organization.landingPageForm.locationTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="locationSectionTitle">
                      {t("organization.landingPageForm.locationSectionTitle")}
                    </Label>
                    <Input
                      id="locationSectionTitle"
                      value={watch("landingPage.location.sectionTitle") || ""}
                      onChange={(event) =>
                        setValue("landingPage.location.sectionTitle", event.target.value, { shouldDirty: true })
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
                        setValue("landingPage.location.sectionDescription", event.target.value, { shouldDirty: true })
                      }
                      disabled={fieldsDisabled}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationMap">
                      Google Maps Embed URL
                    </Label>
                    <Input
                      id="locationMap"
                      value={watch("landingPage.location.mapEmbedUrl") || ""}
                      onChange={(event) =>
                        setValue("landingPage.location.mapEmbedUrl", event.target.value, { shouldDirty: true })
                      }
                      disabled={fieldsDisabled}
                      placeholder="<iframe src=... /> link"
                    />
                  </div>
                  {watch("landingPage.location.mapEmbedUrl") && (
                    <div className="rounded-lg border border-dashed border-border/70 p-1 bg-muted/20">
                      <iframe
                        title="Map preview"
                        src={watch("landingPage.location.mapEmbedUrl") || ""}
                        className="h-32 w-full rounded border border-border"
                        loading="lazy"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* FOOTER_SECTION */}
      <div className="sticky bottom-6 z-10 transition-transform mt-12">
        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/80 p-4 shadow-lg backdrop-blur-md md:flex-row md:items-center md:justify-between supports-backdrop-filter:bg-background/60">
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
                className="hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
              >
                Preview Live Site
              </Button>
            )}
            <Button
              type="submit"
              className="min-w-32 shadow-sm transition-all active:scale-[0.98]"
              disabled={
                isBusy ||
                (landingEnabled && (slugStatus === "taken" || slugStatus === "invalid"))
              }
            >
              {isBusy
                ? t("organization.landingPageForm.saving")
                : landingEnabled
                  ? "Publish Changes"
                  : t("organization.landingPageForm.save")}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
