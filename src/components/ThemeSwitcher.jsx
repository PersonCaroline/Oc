import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THEMES, applyTheme, getTheme } from "@/lib/themes";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    applyTheme(getTheme());
  }, []);

  return (
    <Select value={theme} onValueChange={(t) => { setTheme(t); applyTheme(t); }}>
      <SelectTrigger className="w-28 sm:w-36 h-9 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {THEMES.map((t) => (
          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
