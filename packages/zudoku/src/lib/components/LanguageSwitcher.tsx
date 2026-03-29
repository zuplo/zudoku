import { GlobeIcon } from "lucide-react";
import { useLocale } from "../i18n/I18nContext.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select.js";

export const LanguageSwitcher = () => {
  const { locale, locales, setLocale } = useLocale();

  if (!locales || Object.keys(locales).length <= 1) {
    return null;
  }

  return (
    <Select value={locale} onValueChange={setLocale}>
      <SelectTrigger
        size="sm"
        className="w-auto gap-1.5 border-transparent bg-transparent text-sm"
      >
        <GlobeIcon className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(locales).map(([code, { label }]) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
