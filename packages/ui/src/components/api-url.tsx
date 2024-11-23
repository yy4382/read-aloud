import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";

interface ApiUrlContextType {
  apiUrl: string;
  setApiUrl: (url: string) => void;
}

export const ApiUrlContext = createContext<ApiUrlContextType | undefined>(
  undefined,
);

export function ApiUrlProvider({ children }: { children: ReactNode }) {
  const [apiUrl, setApiUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("api-site") || "";
  });

  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    if (apiUrl) {
      currentParams.set("api-site", apiUrl);
    } else {
      currentParams.delete("api-site");
    }
    const newSearch = currentParams.toString();
    const newUrl = newSearch ? `?${newSearch}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [apiUrl]);

  return (
    <ApiUrlContext.Provider value={{ apiUrl, setApiUrl }}>
      {children}
    </ApiUrlContext.Provider>
  );
}

export default function ApiUrl() {
  const context = useContext(ApiUrlContext);
  if (!context) {
    throw new Error("ApiUrl must be used within an ApiUrlProvider");
  }
  const { apiUrl, setApiUrl } = context;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiUrl(e.target.value);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label>API URL</Label>
      <Input value={apiUrl} onChange={handleInputChange} />
    </div>
  );
}
