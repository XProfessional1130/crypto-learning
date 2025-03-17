import { AuthUser } from '../auth';

export interface NavItem {
  name: string;
  href: string;
  public: boolean;
}

export interface NavLinkProps {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface MobileMenuProps {
  navItems: NavItem[];
  user: AuthUser;
  pathname: string;
  onSignOut: () => Promise<void>;
  onItemClick: () => void;
}

export interface AuthButtonsProps {
  user: AuthUser;
  onSignOut: () => Promise<void>;
} 