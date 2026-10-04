import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, Loader2, Trash2 } from "lucide-react";
import { Field, FieldArea } from "@/components/oc/Field";
import PipBar from "@/components/oc/PipBar";
import PersonalitySlider from "@/components/oc/PersonalitySlider";
import ImageUploader from "@/components/oc/ImageUploader";
import RelationshipEditor from "@/components/oc/RelationshipEditor";

const TRAITS = [
  ["nice", "mean"],
  ["brave", "coward"],
  ["pacifist", "violent"],
  ["thoughtful", "impulsive"],
  ["agreeable", "contrary"],
  ["idealistic", "pragmatic"],
  ["frugal", "big spender"],
  ["collected", "wild"],
  ["honest", "deceptive"],
  ["polite", "rude"],
  ["smart", "idiot"],
  ["confident", "insecure"],
  ["calm", "anxious"],
  ["patient", "impatient"],
  ["gullible", "skeptical"],
  ["reserved", "flirty"],
];

const SKILLS = [
  "perception", "communication", "persuasion", "mediation", "literacy",
  "creativity", "cooking", "tech savvy", "combat", "survival", "stealth",
  "street smarts", "seduction", "luck", "handling animals", "pacifying children",
  "reflexes", "strength", "speed", "battle iq", "resistance", "endurance", "flexibility",
];

const SOCIAL = ["charisma", "empathy", "generosity", "wealth", "aggression", "libido"];

const EMPTY = {
  name: "", last_name: "", nicknames: [], age: "", date_of_birth: "",
  gender: "", pronouns: "", sexuality: "", nationality: "", origins: "", species: "",
  eye_color: "", hair_color: "", hair_style: "", height: "", weight: "",
  mbti: "", status: "alive", later_status: "unknown",
  ability: "", ability_description: "", side_effects: "", weapon: "",
  affiliation: "", past_affiliation: "", rank: "", past_rank: "", job: "", side_job: "",
  fears: "", sickness: "", addictions: "", likes: "", dislikes: "", lore: "",
  avatar_url: "", appearance_images: [], clothes_images: [], moodboard_images: [],
  personality: {}, skills: {}, social: {}, relationships: [],
  organization_id: "", branch: "",
};

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
        <SelectTrigger className="mt-1.5">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(([val, text]) => (
            <SelectItem key={val} value={val}>{text}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function CharacterEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [others, setOthers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const dirtyRef = useRef(false);
  const idRef = useRef(id);
  const formRef = useRef(null);
  idRef.current = id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [orgList, allChars] = await Promise.all([
        base44.entities.Organization.list("-created_date", 100),
        base44.entities.Character.list("-updated_date", 500),
      ]);
      if (cancelled) return;
      setOrgs(orgList);
      setOthers(allChars.filter((c) => c.id !== id));
      if (id && id !== "new") {
        try {
          const rec = await base44.entities.Character.get(id);
          if (!cancelled) setForm({ ...EMPTY, ...rec });
        } catch {
          if (!cancelled) setForm(null);
        }
      } else {
        setForm({ ...EMPTY });
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const set = (field, value) => {
    dirtyRef.current = true;
    setSavedFlash(false);
    setForm((f) => ({ ...f, [field]: value }));
  };

  // Debounced auto-save: nothing is ever lost when the app closes
  useEffect(() => {
    if (!form || !dirtyRef.current) return;
    const snap = form;
    setSaving(true);
    const t = setTimeout(async () => {
      try {
        const payload = { ...snap };
        delete payload.id;
        delete payload.created_date;
        delete payload.updated_date;
        delete payload.created_by_id;
        if (idRef.current && idRef.current !== "new") {
          await base44.entities.Character.update(idRef.current, payload);
        } else {
          const created = await base44.entities.Character.create(payload);
          dirtyRef.current = false;
          idRef.current = created.id;
          navigate(`/character/${created.id}`, { replace: true });
        }
        if (formRef.current === snap) {
          dirtyRef.current = false;
          setSavedFlash(true);
        }
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [form]);

  const remove = async () => {
    if (!window.confirm("Delete this character? This cannot be undone.")) return;
    if (idRef.current && idRef.current !== "new") {
      await base44.entities.Character.delete(idRef.current);
    }
    navigate("/");
  };

  if (loaded && !form) {
    return (
      <div className="py-20 text-center">
        <p className="font-heading text-xl mb-3">This character could not be found.</p>
        <Button asChild variant="secondary"><Link to="/">Back to the archive</Link></Button>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="py-20 text-center text-muted-foreground">Opening the character sheet…</div>
    );
  }

  const org = orgs.find((o) => o.id === form.organization_id);

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-heading text-2xl truncate">
          {[form.name, form.last_name].filter(Boolean).join(" ") || "New Character"}
        </h1>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          {saving ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
          ) : savedFlash ? (
            <><Check className="w-3.5 h-3.5 text-primary" /> Saved</>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 inline-block" />
          )}
          <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete character">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Core card */}
      <div className="glow-card p-5 mb-6">
        <div className="flex gap-4 items-start flex-wrap">
          <ImageUploader
            label="Portrait"
            multiple={false}
            images={form.avatar_url ? [form.avatar_url] : []}
            onChange={(urls) => set("avatar_url", urls[0] || "")}
          />
          <div className="flex-1 min-w-[220px] grid sm:grid-cols-2 gap-3">
            <Field label="Name" value={form.name} onChange={(v) => set("name", v)} placeholder="First name" />
            <Field label="Last name" value={form.last_name} onChange={(v) => set("last_name", v)} placeholder="Family name" />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <SelectField
            label="Status"
            value={form.status}
            onChange={(v) => set("status", v)}
            options={[["alive", "Alive"], ["dead", "Dead"]]}
            placeholder="Alive"
          />
          <SelectField
            label="Later status"
            value={form.later_status}
            onChange={(v) => set("later_status", v)}
            options={[["unknown", "Unknown"], ["alive", "Alive"], ["dead", "Dead"]]}
            placeholder="Unknown"
          />
          <Field label="MBTI" value={form.mbti} onChange={(v) => set("mbti", v)} placeholder="e.g. INTJ" />
        </div>
      </div>

      <Tabs defaultValue="identity">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4 bg-transparent p-0">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="combat">Combat</TabsTrigger>
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="lore">Lore</TabsTrigger>
          <TabsTrigger value="bonds">Bonds</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* IDENTITY */}
        <TabsContent value="identity" className="glow-card p-5">
          <div className="ornate-divider mb-4">Core</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Nickname(s)"
              value={(form.nicknames || []).join(", ")}
              onChange={(v) => set("nicknames", v.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="Comma separated"
            />
            <Field label="Age" value={form.age} onChange={(v) => set("age", v)} />
            <Field label="Date of birth" type="date" value={form.date_of_birth} onChange={(v) => set("date_of_birth", v)} />
            <Field label="Gender" value={form.gender} onChange={(v) => set("gender", v)} />
            <Field label="Pronouns" value={form.pronouns} onChange={(v) => set("pronouns", v)} placeholder="she/her…" />
            <Field label="Sexuality" value={form.sexuality} onChange={(v) => set("sexuality", v)} />
          </div>
          <div className="ornate-divider my-5">Origins & appearance</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nationality" value={form.nationality} onChange={(v) => set("nationality", v)} />
            <Field label="Origins" value={form.origins} onChange={(v) => set("origins", v)} />
            <Field label="Species / race" value={form.species} onChange={(v) => set("species", v)} />
            <Field label="Eye color" value={form.eye_color} onChange={(v) => set("eye_color", v)} />
            <Field label="Hair color" value={form.hair_color} onChange={(v) => set("hair_color", v)} />
            <Field label="Hair style" value={form.hair_style} onChange={(v) => set("hair_style", v)} />
            <Field label="Height" value={form.height} onChange={(v) => set("height", v)} />
            <Field label="Weight" value={form.weight} onChange={(v) => set("weight", v)} />
          </div>
          <div className="ornate-divider my-5">Life</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Job" value={form.job} onChange={(v) => set("job", v)} />
            <Field label="Side job" value={form.side_job} onChange={(v) => set("side_job", v)} />
          </div>
          <div className="ornate-divider my-5">Affiliations</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Affiliation" value={form.affiliation} onChange={(v) => set("affiliation", v)} />
            <Field label="Past affiliation" value={form.past_affiliation} onChange={(v) => set("past_affiliation", v)} />
            <Field label="Rank" value={form.rank} onChange={(v) => set("rank", v)} />
            <Field label="Past rank" value={form.past_rank} onChange={(v) => set("past_rank", v)} />
            <SelectField
              label="Organization"
              value={form.organization_id}
              onChange={(v) => {
                set("organization_id", v);
                if (!v) set("branch", "");
              }}
              options={[["none", "Unaffiliated"], ...orgs.map((o) => [o.id, o.name])]}
              placeholder="Unaffiliated"
            />
            <SelectField
              label="Branch"
              value={form.branch}
              onChange={(v) => set("branch", v)}
              options={[["none", "No branch"], ...(org ? org.branches.map((b) => [b, b]) : [])]}
              placeholder="No branch"
            />
          </div>
        </TabsContent>

        {/* COMBAT */}
        <TabsContent value="combat" className="glow-card p-5 space-y-4">
          <Field label="Ability" value={form.ability} onChange={(v) => set("ability", v)} />
          <FieldArea label="Ability description" rows={5} value={form.ability_description} onChange={(v) => set("ability_description", v)} />
          <FieldArea label="Side effects & risks" rows={4} value={form.side_effects} onChange={(v) => set("side_effects", v)} />
          <Field label="Weapon" value={form.weapon} onChange={(v) => set("weapon", v)} />
        </TabsContent>

        {/* PERSONALITY */}
        <TabsContent value="personality" className="glow-card p-5">
          <p className="text-xs text-muted-foreground mb-4">
            Slide each cursor toward the trait that fits this character.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {TRAITS.map(([l, r]) => (
              <PersonalitySlider
                key={l}
                left={l}
                right={r}
                value={form.personality?.[l] ?? 50}
                onChange={(v) => set("personality", { ...form.personality, [l]: v })}
              />
            ))}
          </div>
        </TabsContent>

        {/* SKILLS */}
        <TabsContent value="skills" className="glow-card p-5">
          <div className="ornate-divider mb-4">Skills · tap the pips (0–5)</div>
          <div className="grid sm:grid-cols-2 gap-x-8">
            {SKILLS.map((s) => (
              <PipBar
                key={s}
                label={s}
                value={form.skills?.[s] ?? 0}
                onChange={(v) => set("skills", { ...form.skills, [s]: v })}
              />
            ))}
          </div>
          <div className="ornate-divider my-5">Social</div>
          <div className="grid sm:grid-cols-2 gap-x-8">
            {SOCIAL.map((s) => (
              <PipBar
                key={s}
                label={s}
                value={form.social?.[s] ?? 0}
                onChange={(v) => set("social", { ...form.social, [s]: v })}
              />
            ))}
          </div>
        </TabsContent>

        {/* LORE */}
        <TabsContent value="lore" className="glow-card p-5 space-y-4">
          <FieldArea label="Lore" rows={10} value={form.lore} onChange={(v) => set("lore", v)} placeholder="Their story, secrets, past…" />
          <div className="grid sm:grid-cols-2 gap-4">
            <FieldArea label="Fear(s)" rows={2} value={form.fears} onChange={(v) => set("fears", v)} />
            <FieldArea label="Sickness" rows={2} value={form.sickness} onChange={(v) => set("sickness", v)} />
            <Field label="Addiction(s)" value={form.addictions} onChange={(v) => set("addictions", v)} />
            <div />
            <FieldArea label="Likes" rows={3} value={form.likes} onChange={(v) => set("likes", v)} />
            <FieldArea label="Dislikes" rows={3} value={form.dislikes} onChange={(v) => set("dislikes", v)} />
          </div>
        </TabsContent>

        {/* BONDS */}
        <TabsContent value="bonds" className="glow-card p-5">
          <p className="text-xs text-muted-foreground mb-4">
            Add a person by name, or pick one of your other characters to link them.
          </p>
          <RelationshipEditor
            relationships={form.relationships || []}
            onChange={(v) => set("relationships", v)}
            characters={others}
          />
        </TabsContent>

        {/* MEDIA */}
        <TabsContent value="media" className="glow-card p-5 space-y-6">
          <ImageUploader
            label="Appearance images"
            images={form.appearance_images || []}
            onChange={(v) => set("appearance_images", v)}
          />
          <ImageUploader
            label="Clothes images"
            images={form.clothes_images || []}
            onChange={(v) => set("clothes_images", v)}
          />
          <ImageUploader
            label="Moodboard"
            images={form.moodboard_images || []}
            onChange={(v) => set("moodboard_images", v)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
