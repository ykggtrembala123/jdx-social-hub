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

interface AdminData {
  discord_id: string;
  name: string;
  isAdmin: true;
}

interface AuthContextType {
  affiliateData: AffiliateData | null;
  adminData: AdminData | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Verifica se há dados do afiliado no localStorage
    const storedAffiliateData = localStorage.getItem('affiliate_data');
    if (storedAffiliateData) {
      try {
        setAffiliateData(JSON.parse(storedAffiliateData));
      } catch (error) {
        console.error('Error parsing affiliate data:', error);
        localStorage.removeItem('affiliate_data');
      }
    }

    // Verifica se há dados do admin no localStorage
    const storedAdminData = localStorage.getItem('admin_data');
    if (storedAdminData) {
      try {
        setAdminData(JSON.parse(storedAdminData));
      } catch (error) {
        console.error('Error parsing admin data:', error);
        localStorage.removeItem('admin_data');
      }
    }

    setLoading(false);
  }, []);

  const signOut = () => {
    localStorage.removeItem('affiliate_data');
    localStorage.removeItem('admin_data');
    setAffiliateData(null);
    setAdminData(null);
    toast({
      title: "Logout realizado",
      description: "Até logo!"
    });
  };

  return (
    <AuthContext.Provider 
      value={{ 
        affiliateData,
        adminData,
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
