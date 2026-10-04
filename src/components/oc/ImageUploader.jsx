import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Upload, X, Loader2 } from "lucide-react";

export default function ImageUploader({ label, images = [], onChange, multiple = true }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of multiple ? files : files.slice(0, 1)) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
        urls.push(file_url);
      }
      onChange(multiple ? [...images, ...urls] : urls);
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (i) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div>
      {label && <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative">
            <Image src={url} fittingType="fill" className="w-20 h-20 rounded-xl" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
              aria-label="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-ring hover:text-foreground transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span className="text-[10px] mt-1">Upload</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}
