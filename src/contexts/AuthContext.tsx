import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AffiliateData {
  code: string;
  name: string;
  discord_user_id: string;
  total_earnings: number;
  total_sales: number;
  total_leads: number;
  tier: string;
  commission: number;
}

interface AuthContextType {
  affiliateData: AffiliateData | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Verifica se há dados do afiliado no localStorage
    const storedData = localStorage.getItem('affiliate_data');
    if (storedData) {
      try {
        setAffiliateData(JSON.parse(storedData));
      } catch (error) {
        console.error('Error parsing affiliate data:', error);
        localStorage.removeItem('affiliate_data');
      }
    }
    setLoading(false);
  }, []);

  const signOut = () => {
    localStorage.removeItem('affiliate_data');
    setAffiliateData(null);
    toast({
      title: "Logout realizado",
      description: "Até logo!"
    });
  };

  return (
    <AuthContext.Provider 
      value={{ 
        affiliateData, 
        loading, 
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
