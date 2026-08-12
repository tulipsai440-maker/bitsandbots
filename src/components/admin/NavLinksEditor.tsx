import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { NavLinkItem } from "@/lib/site-settings";

function moveLink(links: NavLinkItem[], index: number, delta: -1 | 1): NavLinkItem[] {
  const target = index + delta;
  if (target < 0 || target >= links.length) return links;
  const next = [...links];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function navLinkKey(link: NavLinkItem, index: number): string {
  return link.kind === "internal" ? `${link.to}-${index}` : `${link.href}-${index}`;
}

function LinkField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

export function NavLinksEditor({
  links,
  onChange,
  reorderable = true,
  defaultNewLink = { kind: "internal", label: "New link", to: "/" } as NavLinkItem,
}: {
  links: NavLinkItem[];
  onChange: (links: NavLinkItem[]) => void;
  reorderable?: boolean;
  defaultNewLink?: NavLinkItem;
}) {
  return (
    <div className="space-y-3">
      {links.map((link, index) => (
        <div
          key={navLinkKey(link, index)}
          className={`grid gap-2 rounded-xl border border-border/80 p-3 md:items-end ${
            reorderable
              ? "md:grid-cols-[auto_120px_1fr_1fr_auto_auto]"
              : "md:grid-cols-[120px_1fr_1fr_auto]"
          }`}
        >
          {reorderable && (
            <div className="flex flex-row gap-1 md:flex-col md:pb-2">
              <button
                type="button"
                aria-label={`Move ${link.label} up`}
                disabled={index === 0}
                onClick={() => onChange(moveLink(links, index, -1))}
                className="btn-outline !px-2 !py-2 disabled:opacity-40"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                aria-label={`Move ${link.label} down`}
                disabled={index === links.length - 1}
                onClick={() => onChange(moveLink(links, index, 1))}
                className="btn-outline !px-2 !py-2 disabled:opacity-40"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}
          <label className="grid gap-1">
            <span className="text-xs font-medium">Type</span>
            <select
              value={link.kind}
              onChange={(e) => {
                const next = [...links];
                if (e.target.value === "external") {
                  next[index] = { kind: "external", label: link.label, href: "https://" };
                } else {
                  next[index] = { kind: "internal", label: link.label, to: "/" };
                }
                onChange(next);
              }}
              className="rounded-lg border border-input bg-background px-2 py-2 text-sm"
            >
              <option value="internal">Internal page</option>
              <option value="external">External URL</option>
            </select>
          </label>
          <LinkField
            label="Label"
            value={link.label}
            onChange={(label) => {
              const next = [...links];
              next[index] = { ...next[index], label } as NavLinkItem;
              onChange(next);
            }}
          />
          {link.kind === "internal" ? (
            <LinkField
              label="Path"
              value={link.to}
              onChange={(to) => {
                const next = [...links];
                next[index] = { kind: "internal", label: link.label, to };
                onChange(next);
              }}
            />
          ) : (
            <LinkField
              label="URL"
              value={link.href}
              onChange={(href) => {
                const next = [...links];
                next[index] = { kind: "external", label: link.label, href };
                onChange(next);
              }}
            />
          )}
          <span className="hidden pb-2 text-xs text-muted-foreground md:block md:text-right">
            {index + 1}
          </span>
          <button
            type="button"
            className="btn-outline px-3 md:mb-0.5"
            onClick={() => onChange(links.filter((_, i) => i !== index))}
            aria-label={`Remove ${link.label}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-outline gap-2 text-sm"
        onClick={() => onChange([...links, defaultNewLink])}
      >
        <Plus size={14} /> Add link
      </button>
    </div>
  );
}
