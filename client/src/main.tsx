import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG, NATIVE_TOKEN_KEY, NATIVE_API_BASE } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { Capacitor } from "@capacitor/core";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // On native: clear the stored token if it's invalid
  if (Capacitor.isNativePlatform()) {
    localStorage.removeItem(NATIVE_TOKEN_KEY);
  }

  window.location.href = "/login";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// On native iOS/Android: use absolute URL to the production server.
// On web: use relative URL (proxied by Vite dev server or served from same origin).
const trpcUrl = Capacitor.isNativePlatform()
  ? `${NATIVE_API_BASE}/api/trpc`
  : "/api/trpc";

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      fetch(input, init) {
        // On native: read token from localStorage and send via Authorization header.
        // Cookies don't work cross-domain in Capacitor (capacitor://localhost vs durakonlinefromkz.online).
        const nativeToken = Capacitor.isNativePlatform()
          ? localStorage.getItem(NATIVE_TOKEN_KEY)
          : null;

        const headers: Record<string, string> = {};
        if (nativeToken) {
          headers["Authorization"] = `Bearer ${nativeToken}`;
        }

        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
          headers: {
            ...(init?.headers as Record<string, string> ?? {}),
            ...headers,
          },
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
