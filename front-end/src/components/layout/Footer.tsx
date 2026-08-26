import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

const socialLinks = [
  { label: "Facebook", path: "M13.5 21v-8h2.8l.4-3h-3.2V8.1c0-.9.3-1.6 1.6-1.6h1.8V3.8c-.8-.1-1.8-.2-2.7-.2-2.7 0-4.5 1.6-4.5 4.6V10H7v3h2.7v8h3.8Z" },
  { label: "X", path: "M4.5 4h3.7l4.5 6 5-6h1.8l-5.9 7.4L20 20h-3.7l-4.9-6.5L6 20H4.2l6.3-7.9L4.5 4Zm2.8 1.5 10 13h1.1l-10-13H7.3Z" },
  { label: "Instagram", path: "M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 2A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 16.5 5h-9ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm4.8-3.4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" },
  { label: "YouTube", path: "M21 7.2a2.7 2.7 0 0 0-1.9-1.9C17.4 4.8 12 4.8 12 4.8s-5.4 0-7.1.5A2.7 2.7 0 0 0 3 7.2 28 28 0 0 0 2.5 12 28 28 0 0 0 3 16.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.1.5 7.1.5s5.4 0 7.1-.5a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .5-4.8 28 28 0 0 0-.5-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z" },
];

export default function Footer() {
  return <footer className="mt-auto bg-[#f2f5fb] text-[#111]">
    <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-14 sm:px-10 md:grid-cols-2 lg:grid-cols-[1.25fr_.8fr_.8fr_1.7fr]">
      <div><p className="font-serif text-3xl">Woden</p><p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">Creamos piezas únicas con materiales de alta calidad para acompañarte en tus mejores días.</p><div className="mt-5 flex gap-3">{socialLinks.map(social=><a key={social.label} href="#" aria-label={social.label} title={social.label} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1822d9] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d={social.path}/></svg></a>)}</div></div>
      <div><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Soporte</h2><nav className="mt-5 space-y-3 text-sm"><Link href="#" className="block">Preguntas frecuentes</Link><Link href="#" className="block">Términos y condiciones</Link><Link href="#" className="block">Política de privacidad</Link></nav></div>
      <div><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Empresa</h2><nav className="mt-5 text-sm"><Link href="#">Sobre nosotros</Link></nav></div>
      <div><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contacto</h2><ul className="mt-5 space-y-3 text-sm text-slate-700"><li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0"/>Av. Primavera 1234, San Benito, San Salvador</li><li className="flex gap-3"><Mail className="h-4 w-4 shrink-0"/>Hola@Woden.com</li><li className="flex gap-3"><Phone className="h-4 w-4 shrink-0"/>+503 7877 6562</li><li className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0"/><span>Lun - Vie: 8:00 A.M. - 6:00 P.M.<br/>Sáb: 9:00 A.M. - 1:00 P.M.</span></li></ul></div>
    </div>
    <div className="mx-auto max-w-[1280px] border-t border-[#dfe3eb] px-6 py-5 text-center text-xs text-slate-500">© 2026 Woden. Todos los derechos reservados.</div>
  </footer>;
}
