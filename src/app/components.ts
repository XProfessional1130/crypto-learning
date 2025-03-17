// Re-export components to fix Vercel path resolution issues
import NavigationUI from "@/components/ui/Navigation";
import NavigationLayout from "@/components/layouts/Navigation"; 
import FooterComponent from "@/components/layouts/Footer";
import AppEnhancerComponent from "@/components/ui/AppEnhancer";
import GlobalStylesComponent from "@/components/ui/GlobalStyles";
import AuthTokenScriptComponent from "@/components/ui/AuthTokenScript";
import BackgroundElementsComponent from "@/components/layouts/BackgroundElements";
import DataPrefetcherComponent from "@/components/ui/DataPrefetcher";

// Navigation could be either the UI or layouts version
export const Navigation = NavigationUI;
export const Footer = FooterComponent;
export const AppEnhancer = AppEnhancerComponent;
export const GlobalStyles = GlobalStylesComponent;
export const AuthTokenScript = AuthTokenScriptComponent;
export const BackgroundElements = BackgroundElementsComponent;
export const DataPrefetcher = DataPrefetcherComponent; 