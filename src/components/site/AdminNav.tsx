import { Link } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  ClipboardList,
  Contact,
  Image as ImageIcon,
  Megaphone,
  ShieldCheck,
  Users,
  UserRound,
} from "lucide-react";
import type { AdminNavKey } from "@/components/admin/AdminShell";

export function AdminNav({ active }: { active: AdminNavKey }) {
  const linkClass = (key: AdminNavKey) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
      active === key ? "bg-forest text-cream font-medium" : "border border-border hover:bg-muted"
    }`;

  return (
    <nav className="flex flex-wrap gap-2">
      <Link to="/admin/calendar" className={linkClass("calendar")}>
        <Calendar size={16} /> Calendar
      </Link>
      <Link to="/admin/broadcast" className={linkClass("broadcast")}>
        <Megaphone size={16} /> Broadcast
      </Link>
      <Link to="/admin/assignments" className={linkClass("assignments")}>
        <ClipboardList size={16} /> Assignments
      </Link>
      <Link to="/admin/team" className={linkClass("team")}>
        <Users size={16} /> Our Team
      </Link>
      <Link to="/admin/parent-contacts" className={linkClass("parent-contacts")}>
        <Contact size={16} /> Parents
      </Link>
      <Link to="/admin/parent-consents" className={linkClass("parent-consents")}>
        <Contact size={16} /> Consents
      </Link>
      <Link to="/admin/coaches" className={linkClass("coaches")}>
        <UserRound size={16} /> Coaches
      </Link>
      <Link to="/admin/sponsors" className={linkClass("sponsors")}>
        <Building2 size={16} /> Sponsors
      </Link>
      <Link to="/admin/site-images" className={linkClass("site-images")}>
        <ImageIcon size={16} /> Site Images
      </Link>
      <Link to="/admin/gallery-photos" className={linkClass("gallery-photos")}>
        <ImageIcon size={16} /> Photo Review
      </Link>
      <Link to="/admin/team-admins" className={linkClass("team-admins")}>
        <ShieldCheck size={16} /> Team Admins
      </Link>
    </nav>
  );
}
