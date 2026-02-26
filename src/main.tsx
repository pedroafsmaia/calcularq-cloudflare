import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageLoadingState } from "@/components/ui/LoadingStates";
import "./index.css";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingState compact />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
)
