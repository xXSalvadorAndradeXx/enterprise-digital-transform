import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="Logo Woden"
      width={160}
      height={50}
      priority
    />
  );
}