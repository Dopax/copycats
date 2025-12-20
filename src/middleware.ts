
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req
  const role = req.auth?.user?.role as string | undefined

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isLoginPage = nextUrl.pathname === "/login"
  const isPublicApi = nextUrl.pathname.startsWith("/api/portal") || nextUrl.pathname.startsWith("/api/public") || nextUrl.pathname.startsWith("/api/demographics")
  const isPublicRoute = isLoginPage || isPublicApi || nextUrl.pathname.startsWith("/portal")

  // Redirect Logic
  if (isApiAuthRoute) return null;

  if (isLoginPage) {
    if (isLoggedIn) {
      if (role === "CREATOR") {
          return Promise.resolve(NextResponse.redirect(new URL("/portal", nextUrl)))
      }
      return Promise.resolve(NextResponse.redirect(new URL("/", nextUrl)))
    }
    return null;
  }

  if (nextUrl.pathname.startsWith("/portal")) {
      // Magic Link Access
      if (nextUrl.searchParams.get("token")) {
          return null; // Update session? ideally we rely on page logic or transient handling
      }
      
      // If logged in as Creator
      if (isLoggedIn && role === "CREATOR") return null;
      
      // Otherwise public access check (we let the page decide if it's 403 or if it renders a 'enter token' screen)
      // But user said 'creators dont need a login'.
      // So if no token and no session, we might want to let them see the portal login (if we build one) or just fail.
      // For now, let's allow access to /portal so the page can handle "Missing Token" state.
      return null;
  }

  if (!isLoggedIn && !isPublicRoute) {
    return Promise.resolve(NextResponse.redirect(new URL("/login", nextUrl)))
  }
  
  // Role Based Access Control
  if (isLoggedIn) {
      const path = nextUrl.pathname;

      if (role === "CREATOR") {
          if (!path.startsWith("/portal") && path !== "/login") {
              return Promise.resolve(NextResponse.redirect(new URL("/portal", nextUrl)))
          }
      }

      if (role === "CREATIVE_STRATEGIST") {
          // Block Tags, Settings, Format/Assets
          const blocked = ["/tags", "/settings", "/brand-assets", "/formats"];
          if (blocked.some(b => path.startsWith(b))) {
               return Promise.resolve(NextResponse.redirect(new URL("/", nextUrl)))
          }
      }
      
      if (role === "VIDEO_EDITOR") {
          // Allowed: /batches, /creatives, /login. Block others?
          // "Video editor should have access to his steps in the ad batches and to the creatives tabs."
          // It's safer to whitelist or blacklist.
          // Let's Blacklist sensitive generic stuff for now: 
          const blocked = ["/settings", "/brand-assets", "/ads", "/concepts"];
          // Note: "No access to /ads" isn't explicitly said but implied by "access to his steps... and creatives". 
          // Assuming /ads is "Ad Library" which might be sensitive. 
          // User said "access to his steps in ad batches and to creatives tabs". 
          // So Batches + Creatives are OK. 
          
          if (blocked.some(b => path.startsWith(b))) {
               return Promise.resolve(NextResponse.redirect(new URL("/batches", nextUrl)))
          }
      }
  }

  return null;
})

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
