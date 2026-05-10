"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    Omit<LinkProps, "href"> {
  href?: LinkProps["href"];
  to?: LinkProps["href"];
  className?: string;
  activeClassName?: string;
  children?: ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, href, to, ...props }, ref) => {
    const pathname = usePathname() ?? "/";
    const target = href ?? to ?? "/";
    const targetPath = typeof target === "string" ? target : target.pathname ?? "/";
    const isActive = targetPath === "/" ? pathname === "/" : pathname.startsWith(targetPath);

    return (
      <Link
        ref={ref}
        href={target}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
