import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { checkIsAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

type AdminEditContextValue = {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  canInlineEdit: boolean;
};

const AdminEditContext = createContext<AdminEditContextValue>({
  isAdmin: false,
  editMode: false,
  setEditMode: () => {},
  canInlineEdit: false,
});

export function AdminEditProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search }) as { edit?: string };
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/auth");

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkIsAdmin().then(setIsAdmin);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (search.edit === "1" && isAdmin) {
      setEditMode(true);
    }
  }, [search.edit, isAdmin]);

  const canInlineEdit = isAdmin && editMode && !isAdminRoute;

  return (
    <AdminEditContext.Provider value={{ isAdmin, editMode, setEditMode, canInlineEdit }}>
      {children}
    </AdminEditContext.Provider>
  );
}

export function useAdminEdit() {
  return useContext(AdminEditContext);
}
