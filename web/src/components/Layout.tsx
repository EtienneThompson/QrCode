import type { ReactNode } from "react";
import { AlertIcon } from "./Icons";

const PRODUCT = "QR Tracker";

/** The orange ET logo used across the etiennethompson.com apps. */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      ET
    </span>
  );
}

/** The branded gradient page from login.etiennethompson.com, for when the user isn't signed in. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="public-layout">
      <header className="public-layout-header">
        <a href="#/" className="public-layout-brand">
          <BrandMark size={34} />
          <span className="public-layout-brand-name">Etienne Thompson</span>
          <span className="public-layout-brand-divider" aria-hidden="true" />
          <span className="public-layout-brand-product">{PRODUCT}</span>
        </a>
      </header>
      <main className="public-layout-main">{children}</main>
      <footer className="public-layout-footer">
        <span>© {new Date().getFullYear()} Etienne Thompson</span>
        <span aria-hidden="true">·</span>
        <a href="https://etiennethompson.com">etiennethompson.com</a>
      </footer>
    </div>
  );
}

interface SplashCardProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  iconVariant?: "primary" | "danger";
  children?: ReactNode;
}

/** The white card in the middle of a public page. */
export function SplashCard({ title, description, icon, iconVariant = "primary", children }: SplashCardProps) {
  return (
    <section className="splash-card">
      <header className="splash-card-header">
        {icon && <div className={`splash-card-icon splash-card-icon--${iconVariant}`}>{icon}</div>}
        <h1 className="splash-card-title">{title}</h1>
        {description && <p className="splash-card-description">{description}</p>}
      </header>
      {children && <div className="splash-card-body">{children}</div>}
    </section>
  );
}

/** The dark console header shown once signed in. */
export function Topbar({ children }: { children?: ReactNode }) {
  return (
    <header className="host-topbar">
      <div className="host-topbar-inner">
        <a href="#/" className="host-brand">
          <BrandMark size={34} />
          <span className="host-brand-text">
            <span className="host-brand-name">Etienne Thompson</span>
            <span className="host-brand-product">{PRODUCT}</span>
          </span>
        </a>
        {children && <nav className="host-nav">{children}</nav>}
      </div>
    </header>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  /** Small text above the title, such as a back link. */
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/** The title block at the top of a page. */
export function PageHeader({ title, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Drop the body padding, for lists and tables that run edge to edge. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

/** A white content section on the console background. */
export function Panel({ title, description, actions, flush, className = "", children }: PanelProps) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <header className="panel-header">
          <div className="panel-heading">
            {title && <h2 className="panel-title">{title}</h2>}
            {description && <p className="panel-description">{description}</p>}
          </div>
          {actions && <div className="panel-actions">{actions}</div>}
        </header>
      )}
      <div className={`panel-body ${flush ? "panel-body--flush" : ""}`}>{children}</div>
    </section>
  );
}

/** A red message box with an icon. */
export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div className="alert alert--error" role="alert">
      <AlertIcon />
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="center-block">
      <div className="spinner" role="status" aria-label={label} />
    </div>
  );
}
