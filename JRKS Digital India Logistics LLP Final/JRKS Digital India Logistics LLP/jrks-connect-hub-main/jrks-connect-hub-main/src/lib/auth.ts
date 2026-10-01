import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

export const checkAuthServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const isLoggedIn = getCookie("isLoggedIn");
  return isLoggedIn === "true";
});

export const getIsAdmin = (): boolean => {
  if (typeof window === "undefined") return true;
  const username = (sessionStorage.getItem("userName") || "").toLowerCase().trim();
  const role = (sessionStorage.getItem("userRole") || "").toLowerCase().trim();
  if (username === "trichybranch" || username === "trichy branch" || role === "branch") {
    return false;
  }
  return true; // Default to admin for all admin/default sessions
};
