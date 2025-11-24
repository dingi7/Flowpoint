import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { useState } from "react";

type Locale = Record<string, string>;

interface Localisation {
  name: Locale;
  description: Locale;
}

interface LocaleEditorProps {
  value?: Localisation;
  onChange: (value: Localisation | undefined) => void;
  disabled?: boolean;
}

const COMMON_LOCALES = [
  { code: "en", name: "English" },
  { code: "bg", name: "Bulgarian" },
  { code: "tr", name: "Turkish" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
];

export function LocaleEditor({
  value,
  onChange,
  disabled = false,
}: LocaleEditorProps) {
  const [open, setOpen] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string | undefined>(
    undefined,
  );

  const localisation = value || { name: {}, description: {} };
  const localeCodes = Array.from(
    new Set([
      ...Object.keys(localisation.name),
      ...Object.keys(localisation.description),
    ]),
  );

  const handleAddLocale = (localeCode: string) => {
    if (!localeCode) return;

    const code = localeCode.toLowerCase();
    if (localeCodes.includes(code)) {
      setOpen(false);
      setAccordionValue(code);
      return;
    }

    const updated = {
      name: { ...localisation.name, [code]: "" },
      description: { ...localisation.description, [code]: "" },
    };
    onChange(updated);
    setOpen(false);
    setAccordionValue(code);
  };

  const handleRemoveLocale = (localeCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = {
      name: { ...localisation.name },
      description: { ...localisation.description },
    };
    delete updated.name[localeCode];
    delete updated.description[localeCode];

    const hasAnyValues =
      Object.keys(updated.name).length > 0 ||
      Object.keys(updated.description).length > 0;

    onChange(hasAnyValues ? updated : undefined);
  };

  const handleNameChange = (localeCode: string, name: string) => {
    const updated = {
      name: { ...localisation.name, [localeCode]: name },
      description: { ...localisation.description },
    };
    onChange(updated);
  };

  const handleDescriptionChange = (localeCode: string, description: string) => {
    const updated = {
      name: { ...localisation.name },
      description: { ...localisation.description, [localeCode]: description },
    };
    onChange(updated);
  };

  const availableLocales = COMMON_LOCALES.filter(
    (locale) => !localeCodes.includes(locale.code),
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium flex items-center gap-2">
          Translations
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
              disabled={disabled}
            >
              Add Language
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search language..." />
              <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                  {availableLocales.map((locale) => (
                    <CommandItem
                      key={locale.code}
                      value={locale.name}
                      onSelect={() => handleAddLocale(locale.code)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          localeCodes.includes(locale.code)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {locale.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {localeCodes.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg border-dashed">
          No translations added. Add a language to get started.
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={accordionValue}
          onValueChange={setAccordionValue}
          className="w-full border rounded-lg"
        >
          {localeCodes.map((localeCode) => {
            const localeName =
              COMMON_LOCALES.find((l) => l.code === localeCode)?.name ||
              localeCode.toUpperCase();

            return (
              <AccordionItem
                key={localeCode}
                value={localeCode}
                className="px-4 border-b last:border-0"
              >
                <AccordionTrigger className="hover:no-underline py-3 items-center [&>svg]:translate-y-0">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-medium">
                      {localeName}{" "}
                      <span className="text-muted-foreground font-normal text-sm ml-1">
                        ({localeCode})
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleRemoveLocale(localeCode, e)}
                      disabled={disabled}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-1 space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor={`name-${localeCode}`}
                      className="text-xs text-muted-foreground uppercase"
                    >
                      Name
                    </Label>
                    <Input
                      id={`name-${localeCode}`}
                      value={localisation.name[localeCode] || ""}
                      onChange={(e) =>
                        handleNameChange(localeCode, e.target.value)
                      }
                      placeholder={`Enter name in ${localeName}`}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`description-${localeCode}`}
                      className="text-xs text-muted-foreground uppercase"
                    >
                      Description
                    </Label>
                    <Textarea
                      id={`description-${localeCode}`}
                      value={localisation.description[localeCode] || ""}
                      onChange={(e) =>
                        handleDescriptionChange(localeCode, e.target.value)
                      }
                      placeholder={`Enter description in ${localeName}`}
                      disabled={disabled}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
