"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

import { sidebarItems } from "../sidebar/sidebar-items";

export default function Breadcrumb() {
const pathname = usePathname();

const activeItem = sidebarItems.find(
(item) =>
pathname === item.href ||
pathname.startsWith(`${item.href}/`),
);

const currentLabel =
activeItem?.label ?? getLabelFromPathname(pathname);

return (
<nav aria-label="Migas de pan">
<ol className="flex items-center text-sm">
<li>
<Link
href="/dashboard"
className="text-gray-500 transition-colors hover:text-black"
>
Admin
</Link>
</li>

{currentLabel && (
<>
<li aria-hidden="true">
    <ChevronRight
    size={16}
    className="mx-2 text-gray-400"
    />
</li>

<li
    className="font-medium text-black"
    aria-current="page"
>
    {currentLabel}
</li>
</>
)}
</ol>
</nav>
);
}

function getLabelFromPathname(pathname: string): string {
const segment = pathname
.split("/")
.filter(Boolean)
.at(-1);

if (!segment) {
return "";
}

return decodeURIComponent(segment)
.replaceAll("-", " ")
.replaceAll("_", " ")
.replace(/\b\w/g, (character) =>
character.toUpperCase(),
);
}