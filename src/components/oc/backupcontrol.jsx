import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload } from "lucide-react";

const stripBuiltins = (r) => {
  const { id, created_date, updated_date, created_by_id, owner_id, ...rest } = r;
  return rest;
};

export default function BackupControls({ characters, orgs, onRestored }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const exportBackup = () => {
    const data = {
      app: "Arcane Archives",
      exported_at: new Date().toISOString(),
      characters,
      organizations: orgs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grimoire-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Backup downloaded", description: "Keep the file somewhere safe on your phone." });
  };

  const importBackup = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const charsIn = Array.isArray(data.characters) ? data.characters : [];
      const orgsIn = Array.isArray(data.organizations) ? data.organizations : [];

      const existingOrgIds = new Set(orgs.map((o) => o.id));
      for (const o of orgsIn) {
        if (existingOrgIds.has(o.id)) {
          await base44.entities.Organization.update(o.id, stripBuiltins(o));
        } else {
          await base44.entities.Organization.create(stripBuiltins(o));
        }
      }

      const existingCharIds = new Set(characters.map((c) => c.id));
      for (const c of charsIn) {
        if (existingCharIds.has(c.id)) {
          await base44.entities.Character.update(c.id, stripBuiltins(c));
        } else {
          await base44.entities.Character.create(stripBuiltins(c));
        }
      }

      toast({
        title: "Backup restored",
        description: `${charsIn.length} characters and ${orgsIn.length} organizations imported.`,
      });
      if (onRestored) onRestored();
    } catch (err) {
      toast({
        title: "Import failed",
        description: "That file doesn't look like a Grimoire backup.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportBackup}>
        <Download className="w-4 h-4" /> Export backup
      </Button>
      <Button variant="outline" size="sm" disabled={busy} asChild>
        <label className="cursor-pointer">
          <Upload className="w-4 h-4" /> {busy ? "Restoring…" : "Import backup"}
          <input type="file" accept=".json,application/json" className="hidden" onChange={importBackup} />
        </label>
      </Button>
    </div>
  );
}