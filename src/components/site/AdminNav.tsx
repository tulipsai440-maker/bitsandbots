import { Link } from "@tanstack/react-router";
import {
  Award,
  Calendar,
  Image as ImageIcon,
  Mail,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { AdminNavKey } from "@/components/admin/AdminShell";

export function AdminNav({ active }: { active: AdminNavKey }) {
  const linkClass = (key: AdminNavKey) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
      active === key ? "bg-forest text-cream font-medium" : "border border-border hover:bg-muted"
    }`;

  return (
    <nav className="flex flex-wrap gap-2">
      <Link to="/admin/events" className={linkClass("events")}>
        <Calendar size={16} /> Events
      </Link>
      <Link to="/admin/eagle-scouts" className={linkClass("eagle-scouts")}>
        <Award size={16} /> Eagle Scouts Review
      </Link>
      <Link to="/admin/scoutmasters" className={linkClass("scoutmasters")}>
        <Users size={16} /> Scoutmasters Review
      </Link>
      <Link to="/admin/announcements" className={linkClass("announcements")}>
        <Megaphone size={16} /> Announcements
      </Link>
      <Link to="/admin/gallery-photos" className={linkClass("gallery-photos")}>
        <ImageIcon size={16} /> Photo Review
      </Link>
      <Link to="/admin/join-notifications" className={linkClass("join-notifications")}>
        <Mail size={16} /> Join Notifications
      </Link>
      <Link to="/admin/troop-admins" className={linkClass("troop-admins")}>
        <ShieldCheck size={16} /> Troop Admins
      </Link>
    </nav>
  );
}
