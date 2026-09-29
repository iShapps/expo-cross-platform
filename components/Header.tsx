import { ScreenHeader } from "@/components/design";
import React from "react";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

/**
 * @deprecated Use `ScreenHeader` from `@/components/design`. Kept so any
 * remaining import renders the redesigned header instead of the old green bar.
 */
const Header: React.FC<HeaderProps> = (props) => <ScreenHeader {...props} />;

export default Header;
