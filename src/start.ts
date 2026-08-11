import { createStart, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { runWithTenantContext } from "@/lib/tenant/context.server";
import { resolveTenantFromHost } from "@/lib/tenant/resolve";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const tenantMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest();
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost";
  const tenant = await resolveTenantFromHost(host);
  return runWithTenantContext(tenant, () => next());
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, tenantMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
