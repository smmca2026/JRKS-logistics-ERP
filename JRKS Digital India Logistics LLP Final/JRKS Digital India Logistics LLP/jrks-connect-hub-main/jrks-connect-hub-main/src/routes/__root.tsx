import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "../components/ui/sonner";

import appCss from "../styles.css?url";
import { useMasterStore } from "../lib/master-store";
import { useOpsStore } from "../lib/ops-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JRKS Logistics — Enterprise Logistics ERP" },
      {
        name: "description",
        content:
          "JRKS Logistics ERP — digitize market truck, company, bank and lorry vendor master data for your transport brokerage in one premium workspace.",
      },
      { name: "author", content: "JRKS Logistics" },
      { property: "og:title", content: "JRKS Logistics — Enterprise Logistics ERP" },
      {
        property: "og:description",
        content: "Premium logistics ERP for transport brokerage master data management.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const loadMaster = useMasterStore((s) => s.loadData);
  const loadOps = useOpsStore((s) => s.loadData);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search });

  useEffect(() => {
    loadMaster();
    loadOps();
  }, [loadMaster, loadOps]);

  // Global ERP Keyboard Navigation Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInput = target.tagName === "INPUT";
      const isTextarea = target.tagName === "TEXTAREA";
      const isSelect = target.tagName === "SELECT";
      const isCustomSelect = target.getAttribute("role") === "combobox";
      const isToggle =
        target.getAttribute("role") === "switch" ||
        target.getAttribute("role") === "checkbox" ||
        target.classList.contains("toggle");

      if (!isInput && !isTextarea && !isSelect && !isCustomSelect && !isToggle) {
        return;
      }

      if (isInput && (target as HTMLInputElement).type === "number") {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
        }
      }

      if (e.key === "Enter") {
        if (isTextarea && e.ctrlKey) {
          // CTRL + ENTER creates a new line in textarea
          return;
        }

        const container =
          target.closest("form") || target.closest('[role="dialog"]') || document.body;

        const selector = [
          'input:not([type="hidden"]):not([disabled]):not([readonly])',
          "textarea:not([disabled]):not([readonly])",
          "select:not([disabled])",
          'button[role="combobox"]',
          'button[role="switch"]',
          'button[role="checkbox"]',
        ].join(", ");

        const fields = Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
          (el) => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              style.display !== "none" &&
              style.visibility !== "hidden"
            );
          },
        );

        const index = fields.indexOf(target);
        if (index > -1 && index < fields.length - 1) {
          e.preventDefault();
          const nextField = fields[index + 1];
          nextField.focus();
          if (nextField instanceof HTMLInputElement && nextField.type !== "date") {
            nextField.select();
          }
        } else if (isTextarea && !e.ctrlKey) {
          // Prevent default Enter behavior in textarea unless it is CTRL+Enter
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
    };
  }, []);

  // Global ERP Number Input Wheel/Scroll Prevention
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "INPUT" && (target as HTMLInputElement).type === "number") {
        // Blur active number input so mouse scrolling does not increment/decrement its value
        target.blur();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Autofocus first field of new forms / open dialogs
  useEffect(() => {
    const focusFirstField = () => {
      const selector = [
        'form input:not([type="hidden"]):not([disabled]):not([readonly])',
        "form textarea:not([disabled]):not([readonly])",
        'form button[role="combobox"]',
        'form button[role="switch"]',
        '[role="dialog"] input:not([type="hidden"]):not([disabled]):not([readonly])',
        '[role="dialog"] textarea:not([disabled]):not([readonly])',
        '[role="dialog"] button[role="combobox"]',
        '[role="dialog"] button[role="switch"]',
      ].join(", ");

      const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
      const visibleElement = elements.find((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      });

      if (visibleElement) {
        visibleElement.focus();
        if (visibleElement instanceof HTMLInputElement && visibleElement.type !== "date") {
          visibleElement.select();
        }
      }
    };

    const timer = setTimeout(focusFirstField, 150);

    const observer = new MutationObserver((mutations) => {
      let dialogAdded = false;
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            const hasDialogRole =
              node.getAttribute("role") === "dialog" || node.querySelector('[role="dialog"]');
            const hasDialogClass =
              node.classList.contains("DialogContent") || node.querySelector(".DialogContent");

            // Exclude popovers/popper wrappers to prevent autofocus from closing them
            const isPopover =
              node.hasAttribute("data-radix-popper-content-wrapper") ||
              node.querySelector("[data-radix-popper-content-wrapper]") ||
              node.classList.contains("PopoverContent") ||
              node.querySelector('[class*="PopoverContent"]');

            if ((hasDialogRole || hasDialogClass) && !isPopover) {
              dialogAdded = true;
              break;
            }
          }
        }
        if (dialogAdded) break;
      }
      if (dialogAdded) {
        setTimeout(focusFirstField, 150);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname, search]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
