"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";

export const Link = NextLink;

export function useNavigate() {
  const router = useRouter();

  return (href: string) => {
    router.push(href);
  };
}

export function useLocation() {
  const pathname = usePathname();

  return { pathname };
}
