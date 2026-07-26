"use client";

import Link from "next/link";

import type { SidebarItemProps } from "./Sidebar.types";

export default function SidebarItem({
label,
href,
icon: Icon,
active,
}: SidebarItemProps) {
return (
<Link
href={href}
aria-current={active ? "page" : undefined}
className={`
flex items-center gap-3 rounded-lg px-4 py-3
text-sm font-medium transition-colors
${
active
? "bg-[#CFE2FF] text-[#4A4A4A]"
: "text-[#4A4A4A] hover:bg-[#F2F5FC]"
}
`}
>
<Icon
aria-hidden="true"
className="size-5 shrink-0"
/>

<span>{label}</span>
</Link>
);
}