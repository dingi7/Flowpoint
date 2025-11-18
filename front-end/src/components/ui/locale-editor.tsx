import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
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
  const [newLocaleCode, setNewLocaleCode] = useState<string>("");

  const localisation = value || { name: {}, description: {} };
  const localeCodes = Array.from(
    new Set([
      ...Object.keys(localisation.name),
      ...Object.keys(localisation.description),
    ])
  );

  const handleAddLocale = () => {
    if (!newLocaleCode.trim()) return;

    const localeCode = newLocaleCode.trim().toLowerCase();
    if (localeCodes.includes(localeCode)) {
      setNewLocaleCode("");
      return;
    }

    const updated = {
      name: { ...localisation.name, [localeCode]: "" },
      description: { ...localisation.description, [localeCode]: "" },
    };
    onChange(updated);
    setNewLocaleCode("");
  };

  const handleRemoveLocale = (localeCode: string) => {
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
    (locale) => !localeCodes.includes(locale.code)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Translations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Locale Section */}
        <div className="flex gap-2">
          <Select
            value={newLocaleCode}
            onValueChange={setNewLocaleCode}
            disabled={disabled || availableLocales.length === 0}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a locale to add" />
            </SelectTrigger>
            <SelectContent>
              {availableLocales.map((locale) => (
                <SelectItem key={locale.code} value={locale.code}>
                  {locale.name} ({locale.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="text"
            placeholder="Or enter locale code (e.g., en, bg)"
            value={newLocaleCode}
            onChange={(e) => setNewLocaleCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddLocale();
              }
            }}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddLocale}
            disabled={disabled || !newLocaleCode.trim()}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Locale List */}
        {localeCodes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No translations added. Add a locale to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {localeCodes.map((localeCode) => {
              const localeName = COMMON_LOCALES.find(
                (l) => l.code === localeCode
              )?.name || localeCode.toUpperCase();

              return (
                <Card key={localeCode} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">
                        {localeName} ({localeCode})
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLocale(localeCode)}
                        disabled={disabled}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${localeCode}`}>Name</Label>
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
                      <Label htmlFor={`description-${localeCode}`}>
                        Description
                      </Label>
                      <Textarea
                        id={`description-${localeCode}`}
                        value={localisation.description[localeCode] || ""}
                        onChange={(e) =>
                          handleDescriptionChange(
                            localeCode,
                            e.target.value
                          )
                        }
                        placeholder={`Enter description in ${localeName}`}
                        disabled={disabled}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

