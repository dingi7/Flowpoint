"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmailTemplate, Organization } from "@/core";
import { useUpdateOrganization } from "@/hooks";
import {
  useCurrentOrganizationId,
  useOrganizationActions,
} from "@/stores/organization-store";
import { Mail, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface EmailTemplatesTabProps {
  organization: Organization;
}

const EMAIL_TEMPLATE_VARIABLES = [
  { name: "customerName", label: "Customer Name", example: "John Doe" },
  { name: "serviceName", label: "Service Name", example: "Consultation" },
  {
    name: "appointmentDate",
    label: "Appointment Date",
    example: "Monday, January 15, 2024 at 2:00 PM EET",
  },
  { name: "duration", label: "Duration", example: "1 hour" },
  { name: "fee", label: "Fee", example: "$50.00" },
  {
    name: "organizationName",
    label: "Organization Name",
    example: "My Business",
  },
  {
    name: "organizationAddress",
    label: "Organization Address",
    example: "123 Main St",
  },
  {
    name: "organizationPhone",
    label: "Organization Phone",
    example: "+1 234 567 8900",
  },
  {
    name: "organizationEmail",
    label: "Organization Email",
    example: "contact@example.com",
  },
] as const;

type TemplateType = "confirmation" | "reminder" | "info";

const DEFAULT_TEMPLATES: Record<TemplateType, EmailTemplate> = {
  confirmation: {
    subject: "Appointment Confirmed - {{serviceName}}",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4a90e2; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .appointment-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4a90e2; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Confirmed</h1>
    </div>
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>Your appointment has been confirmed!</p>
      <div class="appointment-details">
        <div class="detail-row">
          <span class="detail-label">Service:</span> {{serviceName}}
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span> {{appointmentDate}}
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span> {{duration}}
        </div>
        {{#if fee}}
        <div class="detail-row">
          <span class="detail-label">Fee:</span> {{fee}}
        </div>
        {{/if}}
      </div>
      {{#if organizationAddress}}
      <p><strong>Location:</strong> {{organizationAddress}}</p>
      {{/if}}
      {{#if organizationPhone}}
      <p><strong>Phone:</strong> {{organizationPhone}}</p>
      {{/if}}
      <p>If you need to reschedule or cancel your appointment, please contact us at {{organizationEmail}}.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>{{organizationName}}</p>
    </div>
  </div>
</body>
</html>`,
    text: `Appointment Confirmed

Dear {{customerName}},

Your appointment has been confirmed!

Appointment Details:
- Service: {{serviceName}}
- Date & Time: {{appointmentDate}}
- Duration: {{duration}}
{{#if fee}}- Fee: {{fee}}{{/if}}
{{#if organizationAddress}}- Location: {{organizationAddress}}{{/if}}
{{#if organizationPhone}}- Phone: {{organizationPhone}}{{/if}}

If you need to reschedule or cancel your appointment, please contact us at {{organizationEmail}}.

Best regards,
{{organizationName}}`,
  },
  reminder: {
    subject: "Appointment Reminder - {{serviceName}}",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f39c12; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .appointment-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f39c12; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Reminder</h1>
    </div>
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>This is a reminder about your upcoming appointment.</p>
      <div class="appointment-details">
        <div class="detail-row">
          <span class="detail-label">Service:</span> {{serviceName}}
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span> {{appointmentDate}}
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span> {{duration}}
        </div>
        {{#if fee}}
        <div class="detail-row">
          <span class="detail-label">Fee:</span> {{fee}}
        </div>
        {{/if}}
      </div>
      {{#if organizationAddress}}
      <p><strong>Location:</strong> {{organizationAddress}}</p>
      {{/if}}
      {{#if organizationPhone}}
      <p><strong>Phone:</strong> {{organizationPhone}}</p>
      {{/if}}
      <p>If you need to reschedule or cancel your appointment, please contact us at {{organizationEmail}}.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>{{organizationName}}</p>
    </div>
  </div>
</body>
</html>`,
    text: `Appointment Reminder

Dear {{customerName}},

This is a reminder about your upcoming appointment.

Appointment Details:
- Service: {{serviceName}}
- Date & Time: {{appointmentDate}}
- Duration: {{duration}}
{{#if fee}}- Fee: {{fee}}{{/if}}
{{#if organizationAddress}}- Location: {{organizationAddress}}{{/if}}
{{#if organizationPhone}}- Phone: {{organizationPhone}}{{/if}}

If you need to reschedule or cancel your appointment, please contact us at {{organizationEmail}}.

Best regards,
{{organizationName}}`,
  },
  info: {
    subject: "New Appointment - {{serviceName}} with {{customerName}}",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .appointment-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #27ae60; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Appointment Assigned</h1>
    </div>
    <div class="content">
      <p>You have been assigned a new appointment.</p>
      <div class="appointment-details">
        <div class="detail-row">
          <span class="detail-label">Customer:</span> {{customerName}}
        </div>
        <div class="detail-row">
          <span class="detail-label">Service:</span> {{serviceName}}
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span> {{appointmentDate}}
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span> {{duration}}
        </div>
        {{#if fee}}
        <div class="detail-row">
          <span class="detail-label">Fee:</span> {{fee}}
        </div>
        {{/if}}
      </div>
      {{#if organizationAddress}}
      <p><strong>Location:</strong> {{organizationAddress}}</p>
      {{/if}}
      {{#if organizationPhone}}
      <p><strong>Phone:</strong> {{organizationPhone}}</p>
      {{/if}}
    </div>
    <div class="footer">
      <p>Best regards,<br>{{organizationName}}</p>
    </div>
  </div>
</body>
</html>`,
    text: `New Appointment Assigned

You have been assigned a new appointment.

Appointment Details:
- Customer: {{customerName}}
- Service: {{serviceName}}
- Date & Time: {{appointmentDate}}
- Duration: {{duration}}
{{#if fee}}- Fee: {{fee}}{{/if}}
{{#if organizationAddress}}- Location: {{organizationAddress}}{{/if}}
{{#if organizationPhone}}- Phone: {{organizationPhone}}{{/if}}

Best regards,
{{organizationName}}`,
  },
};

export function EmailTemplatesTab({ organization }: EmailTemplatesTabProps) {
  const { t } = useTranslation();
  const organizationId = useCurrentOrganizationId();
  const { updateOrganization: updateOrganizationStore } =
    useOrganizationActions();
  const updateOrganizationMutation = useUpdateOrganization();
  const [activeTab, setActiveTab] = useState<"confirmation" | "reminder" | "info">(
    "confirmation",
  );

  const currentTemplate = organization.settings?.emailTemplates?.[activeTab];
  const [template, setTemplate] = useState<EmailTemplate>(
    () => currentTemplate || DEFAULT_TEMPLATES[activeTab],
  );

  // Reset template when switching tabs
  useEffect(() => {
    const tabTemplate = organization.settings?.emailTemplates?.[activeTab];
    setTemplate(tabTemplate || DEFAULT_TEMPLATES[activeTab]);
  }, [activeTab, organization.settings?.emailTemplates]);

  const handleSave = async () => {
    if (!organizationId) {
      toast.error(t("organization.emailTemplates.organizationIdRequired"));
      return;
    }

    try {
      const currentTemplates = organization.settings?.emailTemplates || {};
      const updatedTemplates = {
        ...currentTemplates,
        [activeTab]: template,
      };

      await updateOrganizationMutation.mutateAsync({
        id: organizationId,
        data: {
          settings: {
            ...organization.settings,
            emailTemplates: updatedTemplates,
          },
        },
      });

      // Update the organization store immediately for instant UI updates
      updateOrganizationStore(organizationId, {
        settings: {
          ...organization.settings,
          emailTemplates: updatedTemplates,
        },
      });

      const templateName = activeTab === "confirmation" 
        ? t("organization.emailTemplates.confirmationEmail")
        : activeTab === "reminder"
        ? t("organization.emailTemplates.reminderEmail")
        : t("organization.emailTemplates.infoEmail");
      toast.success(
        `${templateName} ${t("organization.emailTemplates.savedSuccess")}`,
      );
    } catch (error) {
      console.error("Failed to save email template:", error);
      toast.error(
        `${t("organization.emailTemplates.saveError")} ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleReset = () => {
    setTemplate(DEFAULT_TEMPLATES[activeTab]);
    toast.info(t("organization.emailTemplates.resetInfo"));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.activeElement as HTMLTextAreaElement;
    if (textarea && textarea.tagName === "TEXTAREA") {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{{${variable}}}` + after;
      textarea.value = newText;
      textarea.setSelectionRange(
        start + variable.length + 4,
        start + variable.length + 4,
      );
      textarea.focus();

      // Update state
      const field = textarea.name as keyof EmailTemplate;
      setTemplate((prev) => ({ ...prev, [field]: newText }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("organization.emailTemplates.title")}
          </CardTitle>
          <CardDescription>
            {t("organization.emailTemplates.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as "confirmation" | "reminder" | "info")
            }
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="confirmation">{t("organization.emailTemplates.confirmationEmail")}</TabsTrigger>
              <TabsTrigger value="reminder">{t("organization.emailTemplates.reminderEmail")}</TabsTrigger>
              <TabsTrigger value="info">{t("organization.emailTemplates.infoEmail")}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t("organization.emailTemplates.emailSubject")}</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={template.subject}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      placeholder={t("organization.emailTemplates.emailSubjectPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="html">{t("organization.emailTemplates.htmlTemplate")}</Label>
                    <Textarea
                      id="html"
                      name="html"
                      value={template.html}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          html: e.target.value,
                        }))
                      }
                      rows={20}
                      className="font-mono text-sm"
                      placeholder={t("organization.emailTemplates.htmlTemplatePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text">{t("organization.emailTemplates.plainTextTemplate")}</Label>
                    <Textarea
                      id="text"
                      name="text"
                      value={template.text}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                      rows={10}
                      className="font-mono text-sm"
                      placeholder={t("organization.emailTemplates.plainTextTemplatePlaceholder")}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={updateOrganizationMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateOrganizationMutation.isPending
                        ? t("organization.emailTemplates.saving")
                        : t("organization.emailTemplates.saveTemplate")}
                    </Button>
                    <Button onClick={handleReset} variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t("organization.emailTemplates.resetToDefault")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {t("organization.emailTemplates.availableVariables")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {EMAIL_TEMPLATE_VARIABLES.map((variable) => (
                        <div key={variable.name} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => insertVariable(variable.name)}
                            className="text-left w-full p-2 rounded border hover:bg-muted transition-colors"
                          >
                            <div className="font-mono text-xs text-primary">
                              {"{{" + variable.name + "}}"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {variable.label}
                            </div>
                            <div className="text-xs text-muted-foreground italic">
                              Example: {variable.example}
                            </div>
                          </button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {t("organization.emailTemplates.conditionalBlocks")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        {t("organization.emailTemplates.conditionalBlocksDescription")}
                      </p>
                      <pre className="bg-muted p-2 rounded text-xs font-mono">
                        {`{{#if fee}}
  Fee: {{fee}}
{{/if}}`}
                      </pre>
                      <p className="text-xs">
                        {t("organization.emailTemplates.conditionalBlocksSupported")}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
