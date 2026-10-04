import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Trash2, User as UserIcon } from "lucide-react";
import BackupControls from "@/components/oc/BackupControls";

export default function Home() {
  const [characters, setCharacters] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [orgF, setOrgF] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    const [chars, orgList] = await Promise.all([
      base44.entities.Character.list("-updated_date", 300),
      base44.entities.Organization.list("-created_date", 100),
    ]);
    setCharacters(chars);
    setOrgs(orgList);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (e, c) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete ${[c.name, c.last_name].filter(Boolean).join(" ")}? This cannot be undone.`)) return;
    await base44.entities.Character.delete(c.id);
    toast({ title: "Character deleted" });
    setCharacters((list) => list.filter((x) => x.id !== c.id));
  };

  const filtered = (characters || []).filter((c) => {
    const hay = [c.name, c.last_name, ...(c.nicknames || [])].join(" ").toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (status !== "all" && c.status !== status) return false;
    if (orgF === "none" && c.organization_id) return false;
    if (orgF !== "all" && orgF !== "none" && c.organization_id !== orgF) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Character Archive</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {characters ? `${filtered.length} of ${characters.length} characters` : "…"}
          </p>
        </div>
        <Button asChild>
          <Link to="/character/new">
            <Plus className="w-4 h-4 mr-1" /> New character
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or nickname…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="alive">Alive</SelectItem>
            <SelectItem value="dead">Dead</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orgF} onValueChange={setOrgF}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All organizations</SelectItem>
            <SelectItem value="none">Unaffiliated</SelectItem>
            {orgs.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6">
        <BackupControls characters={characters || []} orgs={orgs} onRestored={load} />
      </div>

      {characters === null ? (
        <div className="py-20 text-center text-muted-foreground">Summoning your characters…</div>
      ) : filtered.length === 0 ? (
        <div className="glow-card p-10 text-center">
          <p className="font-heading text-xl mb-2">No characters here yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Every legend starts somewhere. Create your first sheet.
          </p>
          <Button asChild>
            <Link to="/character/new">
              <Plus className="w-4 h-4 mr-1" /> New character
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link key={c.id} to={`/character/${c.id}`} className="glow-card block p-4">
              <div className="flex gap-3">
                {c.avatar_url ? (
                  <Image src={c.avatar_url} fittingType="fill" className="w-14 h-14 rounded-2xl shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                    <UserIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-heading text-lg leading-tight truncate">
                        {[c.name, c.last_name].filter(Boolean).join(" ") || "Unnamed"}
                      </div>
                      {(c.nicknames || []).length > 0 && (
                        <div className="text-xs text-muted-foreground truncate">
                          “{c.nicknames.join("”, “")}”
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => remove(e, c)}
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      aria-label="Delete character"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${c.status === "dead" ? "badge-dead" : "badge-alive"}`}
                    >
                      {c.status}
                    </span>
                    {c.later_status && c.later_status !== "unknown" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                        later: {c.later_status}
                      </span>
                    )}
                    {c.mbti && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {c.mbti}
                      </span>
                    )}
                    {c.age && <span className="text-[10px] text-muted-foreground">{c.age}</span>}
                  </div>
                  {(c.organization_id || c.branch) && (
                    <div className="text-xs text-muted-foreground mt-2 truncate">
                      {[orgs.find((o) => o.id === c.organization_id)?.name, c.branch]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
