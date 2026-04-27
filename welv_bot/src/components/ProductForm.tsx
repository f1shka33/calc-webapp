"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductValues = {
  id?: string;
  slug: string;
  title: string;
  shortDesc: string;
  description: string;
  priceUsd: number;
  priceRub: number;
  format: string;
  license: string;
  compatibility: string;
  includes: string;
  tags: string;
  categoryId: string;
  imageUrl: string;
  fileUrl: string;
  featured: boolean;
};

const EMPTY: ProductValues = {
  slug: "",
  title: "",
  shortDesc: "",
  description: "",
  priceUsd: 0,
  priceRub: 0,
  format: "",
  license: "Personal use, single artist",
  compatibility: "",
  includes: "",
  tags: "",
  categoryId: "",
  imageUrl: "",
  fileUrl: "",
  featured: false
};

export function ProductForm({
  mode,
  product,
  categories
}: {
  mode: "create" | "edit";
  product?: ProductValues;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [v, setV] = useState<ProductValues>(product ?? { ...EMPTY, categoryId: categories[0]?.id ?? "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  function bind<K extends keyof ProductValues>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val =
        (e.target as HTMLInputElement).type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setV((s) => ({ ...s, [key]: val } as ProductValues));
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    const url = mode === "edit" ? `/api/admin/products/${v.id}` : "/api/admin/products";
    const method = mode === "edit" ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v)
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error ?? "Save failed");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  async function remove() {
    if (!v.id) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/products/${v.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>, field: "imageUrl" | "fileUrl") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    setUploadBusy(false);
    if (!res.ok) {
      setErr("Upload failed.");
      return;
    }
    const { url } = await res.json();
    setV((s) => ({ ...s, [field]: url }));
  }

  return (
    <form onSubmit={save} className="glass-card grid gap-5 p-6 md:grid-cols-2">
      <Text label="Title" value={v.title} onChange={bind("title")} required />
      <Text label="Slug" value={v.slug} onChange={bind("slug")} required placeholder="lowercase-dashes" />

      <Text label="Short description" value={v.shortDesc} onChange={bind("shortDesc")} required full />

      <div className="md:col-span-2">
        <label className="label">Description</label>
        <textarea
          className="input min-h-[140px]"
          rows={6}
          value={v.description}
          onChange={bind("description")}
          required
        />
      </div>

      <Text label="Price USD" type="number" value={String(v.priceUsd)} onChange={bind("priceUsd")} required />
      <Text label="Price RUB" type="number" value={String(v.priceRub)} onChange={bind("priceRub")} required />

      <Text label="Format" value={v.format} onChange={bind("format")} required placeholder="FXP, PSD, ZIP…" />
      <div>
        <label className="label">Category</label>
        <select className="input" value={v.categoryId} onChange={bind("categoryId")} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-ink-900">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <Text label="License" value={v.license} onChange={bind("license")} />
      <Text label="Compatibility" value={v.compatibility} onChange={bind("compatibility")} placeholder="FL Studio, Waves…" />

      <div className="md:col-span-2">
        <label className="label">Includes (one per line)</label>
        <textarea className="input min-h-[100px]" rows={4} value={v.includes} onChange={bind("includes")} />
      </div>

      <Text label="Tags (comma-separated)" value={v.tags} onChange={bind("tags")} full />

      <div>
        <label className="label">Image URL</label>
        <input className="input" value={v.imageUrl} onChange={bind("imageUrl")} placeholder="https://…" />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => uploadFile(e, "imageUrl")}
          className="mt-2 text-xs text-silver-400"
        />
      </div>
      <div>
        <label className="label">File URL (download)</label>
        <input className="input" value={v.fileUrl} onChange={bind("fileUrl")} placeholder="https://…" />
        <input
          type="file"
          onChange={(e) => uploadFile(e, "fileUrl")}
          className="mt-2 text-xs text-silver-400"
        />
      </div>

      <label className="md:col-span-2 flex items-center gap-2 text-sm text-silver-200">
        <input type="checkbox" checked={v.featured} onChange={bind("featured")} className="h-4 w-4" />
        Featured (best seller)
      </label>

      {err && <p className="md:col-span-2 text-sm text-blood-500">{err}</p>}
      {uploadBusy && <p className="md:col-span-2 text-sm text-silver-300">Uploading…</p>}

      <div className="md:col-span-2 flex flex-wrap gap-3">
        <button disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? "Saving…" : mode === "edit" ? "Save changes" : "Create product"}
        </button>
        {mode === "edit" && (
          <button type="button" onClick={remove} className="btn-ghost text-blood-500 hover:text-white">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

function Text({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  full
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="label">{label}{required && <span className="text-blood-500"> *</span>}</label>
      <input
        className="input"
        value={value}
        onChange={onChange}
        required={required}
        type={type}
        placeholder={placeholder}
      />
    </div>
  );
}
