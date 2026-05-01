import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Declare global hideSplash function type
declare global {
  interface Window {
    hideSplash?: () => void;
  }
}

// Render app - splash screen will be hidden by App component after content loads
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Fallback: hide splash after React mounts (in case App doesn't trigger it)
requestAnimationFrame(() => {
  setTimeout(() => {
    if (typeof window !== 'undefined' && (window as any).hideSplash) {
      (window as any).hideSplash();
    }
  }, 100);
});
