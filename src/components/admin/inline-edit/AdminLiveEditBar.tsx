import { useRouterState, useNavigate, Link } from "@tanstack/react-router";

import {

  ClipboardList,

  Contact,

  FileCheck,

  FileText,

  ImageIcon,

  Images,

  LayoutDashboard,

  LogOut,

  Megaphone,

  Pencil,

  ShieldCheck,

} from "lucide-react";

import { useAdminEdit } from "./AdminEditProvider";

import { COACH_BAR_ADMIN_PATHS, isCoachBarAdminPath } from "@/components/admin/AdminQuickShell";

import { supabase } from "@/integrations/supabase/client";



const adminLinkClass =

  "inline-flex items-center gap-1.5 rounded-full bg-cream/15 px-2.5 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-cream/25 sm:px-3";



const ADMIN_QUICK_LINKS = [

  { to: "/admin", label: "Today", icon: LayoutDashboard, kind: "admin" as const },

  { to: "/admin/broadcast", label: "Send message", icon: Megaphone, kind: "admin" as const },

  { to: "/admin/parent-contacts", label: "Parents", icon: Contact, kind: "admin" as const },

  { to: "/assignments", label: "Assignments", icon: ClipboardList, kind: "public" as const },

  { to: "/admin/parent-consents", label: "Consents", icon: FileCheck, kind: "admin" as const },

  { to: "/admin/gallery-photos", label: "Photo review", icon: Images, kind: "admin" as const },

  { to: "/admin/site-images", label: "Site images", icon: ImageIcon, kind: "admin" as const },

  { to: "/admin/site-settings", label: "Site content", icon: FileText, kind: "admin" as const },

  { to: "/admin/team-admins", label: "Team admins", icon: ShieldCheck, kind: "admin" as const },

] as const;



export function AdminLiveEditBar() {

  const { isAdmin, editMode, setEditMode } = useAdminEdit();

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const navigate = useNavigate();

  if (!isAdmin) return null;

  if (pathname.startsWith("/auth")) return null;

  if (pathname.startsWith("/admin") && !isCoachBarAdminPath(pathname)) return null;



  const onQuickAdmin = isCoachBarAdminPath(pathname);



  async function signOut() {

    await supabase.auth.signOut();

    navigate({ to: "/auth" });

  }



  return (

    <div className="sticky top-0 z-[60] border-b border-forest/20 bg-forest text-cream shadow-md">

      <div className="container-page space-y-2 py-2">

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">

            {!onQuickAdmin && (

              <>

                <div className="flex items-center gap-2">

                  <Pencil size={15} className="shrink-0 text-gold" />

                  <span className="text-sm font-medium">Coach bar</span>

                </div>

                <label className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-3 py-1 text-xs">

                  <input

                    type="checkbox"

                    checked={editMode}

                    onChange={(e) => setEditMode(e.target.checked)}

                    className="accent-gold"

                  />

                  Show pencils

                </label>

              </>

            )}

            {onQuickAdmin && (

              <span className="text-sm font-medium text-cream/90">Team admin</span>

            )}

          </div>

          <button

            type="button"

            onClick={signOut}

            className="inline-flex items-center gap-1.5 rounded-full border border-cream/25 px-3 py-1 text-xs text-cream/90 hover:bg-cream/10"

          >

            <LogOut size={14} /> Sign out

          </button>

        </div>



        <div className="flex flex-wrap gap-2">

          {ADMIN_QUICK_LINKS.map(({ to, label, icon: Icon, kind }) => {

            const active =

              kind === "admin"

                ? pathname === to || (to === "/admin" && pathname === "/admin/")

                : pathname === to;

            return (

              <Link

                key={to}

                to={to}

                className={`${adminLinkClass} ${active ? "bg-gold text-forest-deep hover:brightness-110" : ""}`}

              >

                <Icon size={14} className="shrink-0" />

                {label}

              </Link>

            );

          })}

        </div>

      </div>

    </div>

  );

}



/** Chip for sections managed in a separate admin screen (roster, calendar, etc.). */

export function ManageInAdmin({ label, to }: { label: string; to: string }) {

  const { canInlineEdit } = useAdminEdit();

  if (!canInlineEdit) return null;



  return (

    <Link

      to={to}

      className="inline-flex items-center gap-1 rounded-full border border-forest/25 bg-forest/5 px-3 py-1 text-xs font-medium text-forest hover:bg-forest/10"

    >

      <Pencil size={12} /> {label}

    </Link>

  );

}



/** External admin link when route is not in router tree. */

export function ManageInAdminLink({ label, href }: { label: string; href: string }) {

  const { canInlineEdit } = useAdminEdit();

  if (!canInlineEdit) return null;



  return (

    <a

      href={href}

      className="inline-flex items-center gap-1 rounded-full border border-forest/25 bg-forest/5 px-3 py-1 text-xs font-medium text-forest hover:bg-forest/10"

    >

      <Pencil size={12} /> {label}

    </a>

  );

}

