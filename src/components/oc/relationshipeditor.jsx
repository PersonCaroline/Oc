import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

const TYPES = [
  { key: "family", label: "Family" },
  { key: "friends", label: "Friends" },
  { key: "enemies", label: "Enemies" },
  { key: "lovers", label: "Lovers" },
  { key: "other", label: "Other" },
];

const STATUS_SUGGESTIONS = [
  "alive", "dead", "missing", "unknown", "close", "estranged",
  "allied", "hostile", "trusts", "betrays", "married", "divorced",
];

function AddRow({ characters, onAdd }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [charId, setCharId] = useState("none");

  const submit = () => {
    if (!name.trim() && charId === "none") return;
    const linked = characters.find((c) => c.id === charId);
    onAdd({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: "",
      name: name.trim() || (linked ? [linked.name, linked.last_name].filter(Boolean).join(" ") : ""),
      status: status.trim() || "unknown",
      character_id: charId === "none" ? "" : charId,
    });
    setName("");
    setStatus("");
    setCharId("none");
  };

  return (
    <div className="flex flex-wrap gap-2 items-center mt-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name…"
        className="w-36 h-8 text-xs"
      />
      <Select value={charId} onValueChange={setCharId}>
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="Pick a character…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Pick a character…</SelectItem>
          {characters.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {[c.name, c.last_name].filter(Boolean).join(" ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        list="rel-status-options"
        placeholder="Status…"
        className="w-32 h-8 text-xs"
      />
      <Button type="button" size="sm" variant="secondary" className="h-8 text-xs" onClick={submit}>
        <Plus className="w-3.5 h-3.5" /> Add
      </Button>
    </div>
  );
}

export default function RelationshipEditor({ relationships = [], onChange, characters = [] }) {
  const update = (rid, patch) =>
    onChange(relationships.map((r) => (r.id === rid ? { ...r, ...patch } : r)));
  const remove = (rid) => onChange(relationships.filter((r) => r.id !== rid));
  const add = (type) => (entry) => onChange([...relationships, { ...entry, type }]);

  return (
    <div>
      <datalist id="rel-status-options">
        {STATUS_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {TYPES.map(({ key, label }) => {
        const entries = relationships.filter((r) => r.type === key);
        return (
          <div key={key} className="mb-6 last:mb-0">
            <div className="ornate-divider mb-3">{label}</div>
            {entries.length === 0 && (
              <p className="text-xs text-muted-foreground mb-1">None yet.</p>
            )}
            <div className="space-y-2">
              {entries.map((r) => {
                const linked = characters.find((c) => c.id === r.character_id);
                return (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 bg-secondary/40 border border-border rounded-xl px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      {linked ? (
                        <Link to={`/character/${linked.id}`} className="text-sm hover:text-primary truncate">
                          {r.name || "Unnamed"}
                        </Link>
                      ) : (
                        <div className="text-sm truncate">{r.name || "Unnamed"}</div>
                      )}
                      {linked && (
                        <div className="text-[10px] text-muted-foreground">linked character</div>
                      )}
                    </div>
                    <Input
                      value={r.status}
                      onChange={(e) => update(r.id, { status: e.target.value })}
                      list="rel-status-options"
                      className="w-28 h-7 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={() => remove(r.id)}
                      aria-label="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <AddRow characters={characters} onAdd={add(key)} />
          </div>
        );
      })}
    </div>
  );
}