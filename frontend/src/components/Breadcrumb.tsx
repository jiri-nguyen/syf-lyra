import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-40 select-none">/</span>}
          {item.href ? (
            <Link
              to={item.href}
              className="transition-colors hover:underline"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
