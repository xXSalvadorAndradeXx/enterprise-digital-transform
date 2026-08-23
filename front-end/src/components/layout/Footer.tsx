import { Camera, Clock3, Mail, MapPin, MessageCircle, Phone, Video } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return <footer className="mt-auto bg-[#f2f5fb] text-[#111]">
    <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-14 sm:px-10 md:grid-cols-2 lg:grid-cols-[1.25fr_.8fr_.8fr_1.7fr]">
      <div><p className="font-serif text-3xl">Woden</p><p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">Creamos piezas únicas con materiales de alta calidad para acompañarte en tus mejores días.</p><div className="mt-5 flex gap-3">{[MessageCircle,Camera,Video].map((Icon,index)=><a key={index} href="#" aria-label="Red social" className="rounded-full bg-white p-2 shadow-sm"><Icon className="h-4 w-4"/></a>)}</div></div>
      <div><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Soporte</h2><nav className="mt-5 space-y-3 text-sm"><Link href="#" className="block">Preguntas frecuentes</Link><Link href="#" className="block">Términos y condiciones</Link><Link href="#" className="block">Política de privacidad</Link></nav></div>
      <div><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Empresa</h2><nav className="mt-5 text-sm"><Link href="#">Sobre nosotros</Link></nav></div>
      <div><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contacto</h2><ul className="mt-5 space-y-3 text-sm text-slate-700"><li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0"/>Av. Primavera 1234, San Benito, San Salvador</li><li className="flex gap-3"><Mail className="h-4 w-4 shrink-0"/>Hola@Woden.com</li><li className="flex gap-3"><Phone className="h-4 w-4 shrink-0"/>+503 7877 6562</li><li className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0"/><span>Lun - Vie: 8:00 A.M. - 6:00 P.M.<br/>Sáb: 9:00 A.M. - 1:00 P.M.</span></li></ul></div>
    </div>
    <div className="mx-auto max-w-[1280px] border-t border-[#dfe3eb] px-6 py-5 text-center text-xs text-slate-500">© 2026 Woden. Todos los derechos reservados.</div>
  </footer>;
}
