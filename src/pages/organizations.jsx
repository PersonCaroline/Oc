import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Network, Plus, Trash2, X } from "lucide-react";

export default function Organizations() {
  const [orgs, setOrgs] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [branchDraft, setBranchDraft] = useState({});
  const { toast } = useToast();

  const load = async () => {
    const [o, c] = await Promise.all([
      base44.entities.Organization.list("-created_date", 100),
      base44.entities.Character.list("-updated_date", 500),
    ]);
    setOrgs(o);
    setCharacters(c);
  };

  useEffect(() => { load(); }, []);

  const createOrg = async () => {
    if (!newName.trim()) return;
    await base44.entities.Organization.create({
      name: newName.trim(),
      description: newDesc.trim(),
      branches: [],
    });
    setNewName("");
    setNewDesc("");
    toast({ title: "Organization created" });
    load();
  };

  const updateOrg = async (org, patch) => {
    await base44.entities.Organization.update(org.id, patch);
    load();
  };

  const deleteOrg = async (org) => {
    if (!window.confirm(`Delete ${org.name}? Its characters become unaffiliated.`)) return;
    await base44.entities.Character.updateMany(
      { organization_id: org.id },
      { $set: { organization_id: "", branch: "" } }
    );
    await base44.entities.Organization.delete(org.id);
    toast({ title: "Organization deleted" });
    load();
  };

  const addBranch = (org) => {
    const name = (branchDraft[org.id] || "").trim();
    if (!name || (org.branches || []).includes(name)) return;
    updateOrg(org, { branches: [...(org.branches || []), name] });
    setBranchDraft({ ...branchDraft, [org.id]: "" });
  };

  const removeBranch = (org, b) => {
    const moved = characters.filter((c) => c.organization_id === org.id && c.branch === b);
    // clear branch on members of that branch
    Promise.all(
      moved.map((c) => base44.entities.Character.update(c.id, { branch: "" }))
    ).then(() => updateOrg(org, { branches: org.branches.filter((x) => x !== b) }));
  };

  const assign = async (charId, orgId, branch) => {
    if (!charId) return;
    await base44.entities.Character.update(charId, { organization_id: orgId, branch });
    load();
  };

  const unassign = async (charId) => {
    await base44.entities.Character.update(charId, { organization_id: "", branch: "" });
    load();
  };

  const charName = (c) => [c.name, c.last_name].filter(Boolean).join(" ") || "Unnamed";

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create organizations, add branches, and place your characters among them.
          </p>
        </div>
        <Network className="w-8 h-8 text-primary" />
      </div>

      {/* Create new organization */}
      <div className="glow-card p-5 mb-8">
        <div className="ornate-divider mb-4">New organization</div>
        <div className="flex flex-wrap gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Organization name…"
            className="flex-1 min-w-[180px]"
          />
          <Input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Short description…"
            className="flex-1 min-w-[180px]"
          />
          <Button onClick={createOrg}>
            <Plus className="w-4 h-4 mr-1" /> Create
          </Button>
        </div>
      </div>

      {orgs === null ? (
        <div className="py-16 text-center text-muted-foreground">Loading…</div>
      ) : orgs.length === 0 ? (
        <div className="glow-card p-10 text-center">
          <p className="font-heading text-xl mb-2">No organizations yet</p>
          <p className="text-sm text-muted-foreground">Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orgs.map((org) => {
            const members = characters.filter((c) => c.organization_id === org.id);
            return (
              <div key={org.id} className="glow-card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      defaultValue={org.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== org.name) updateOrg(org, { name: v });
                      }}
                      className="font-heading text-lg"
                    />
                    <Textarea
                      defaultValue={org.description || ""}
                      rows={2}
                      placeholder="Description… (saved when you click away)"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (org.description || "")) updateOrg(org, { description: v });
                      }}
                      className="mt-2 text-sm"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteOrg(org)} aria-label="Delete organization">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                {/* Branches */}
                <div className="ornate-divider mb-3">Branches</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(org.branches || []).map((b) => (
                    <span key={b} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-full border border-border">
                      {b}
                      <button type="button" onClick={() => removeBranch(org, b)} aria-label={`Remove branch ${b}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {(org.branches || []).length === 0 && (
                    <span className="text-xs text-muted-foreground">No branches yet.</span>
                  )}
                </div>
                <div className="flex gap-2 mb-5">
                  <Input
                    value={branchDraft[org.id] || ""}
                    onChange={(e) => setBranchDraft({ ...branchDraft, [org.id]: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addBranch(org)}
                    placeholder="Add a branch…"
                    className="w-48 h-8 text-xs"
                  />
                  <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={() => addBranch(org)}>
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>

                {/* Members per branch */}
                <div className="ornate-divider mb-3">Members</div>
                {members.length === 0 && (
                  <p className="text-xs text-muted-foreground mb-2">No members assigned yet.</p>
                )}
                <div className="space-y-2">
                  {(org.branches || []).map((b) => {
                    const inBranch = members.filter((c) => c.branch === b);
                    return (
                      <div key={b} className="flex flex-wrap items-center gap-2 bg-secondary/30 border border-border rounded-xl px-3 py-2">
                        <span className="text-xs font-semibold tracking-wide text-foreground w-28">{b}</span>
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {inBranch.map((c) => (
                            <span key={c.id} className="inline-flex items-center gap-1 bg-card border border-border text-xs px-2 py-0.5 rounded-full">
                              {charName(c)}
                              <button type="button" onClick={() => unassign(c.id)} aria-label="Remove member">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {inBranch.length === 0 && (
                            <span className="text-xs text-muted-foreground">empty</span>
                          )}
                        </div>
                        <Select onValueChange={(charId) => assign(charId, org.id, b)}>
                          <SelectTrigger className="w-40 h-7 text-xs">
                            <SelectValue placeholder="Add member…" />
                          </SelectTrigger>
                          <SelectContent>
                            {characters
                              .filter((c) => !(c.organization_id === org.id && c.branch === b))
                              .map((c) => (
                                <SelectItem key={c.id} value={c.id}>{charName(c)}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                  {members.filter((c) => !c.branch).length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 bg-secondary/30 border border-border rounded-xl px-3 py-2">
                      <span className="text-xs font-semibold tracking-wide text-muted-foreground w-28">No branch</span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {members.filter((c) => !c.branch).map((c) => (
                          <span key={c.id} className="inline-flex items-center gap-1 bg-card border border-border text-xs px-2 py-0.5 rounded-full">
                            {charName(c)}
                            <button type="button" onClick={() => unassign(c.id)} aria-label="Remove member">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}