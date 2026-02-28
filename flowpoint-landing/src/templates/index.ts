import { FirstClassTemplate } from "./first-class/FirstClassTemplate";
import { ClinicTemplate } from "./clinic/ClinicTemplate";
import { TemplateProps } from "./types";
import type { ReactElement } from "react";

export const templateRegistry: Record<
  string,
  (props: TemplateProps) => ReactElement
> = {
  "first-class": FirstClassTemplate,
  "clinic": ClinicTemplate,
};

export function getTemplateComponent(templateId?: string) {
  if (templateId && templateRegistry[templateId]) {
    return templateRegistry[templateId];
  }

  return templateRegistry["first-class"];
}

export type { TemplateProps };
