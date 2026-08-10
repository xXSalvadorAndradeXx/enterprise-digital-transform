/* ============================================================
COMPONENTE: PasswordRequirementsHint
============================================================ */

/**
 * Este componente muestra visualmente los requisitos que debe
 * cumplir la contraseña.
 *
 * IMPORTANTE
 * ----------------------------------------------------------------
 * Este componente NO valida la contraseña.
 *
 * La validación se realiza desde la página utilizando:
 *
 * - React Hook Form
 * - watch()
 *
 * La página únicamente envía un objeto llamado "rules"
 * indicando qué requisitos ya se cumplen y cuáles no.
 *
 * Este componente solamente se encarga de pintar la interfaz.
 */

/* ============================================================
TIPADO DE LAS PROPS
============================================================ */

/**
 * Cada propiedad representa un requisito de la contraseña.
 *
 * true  -> requisito cumplido (verde)
 * false -> requisito pendiente (rojo)
 */

interface Props {
rules: {
minLength: boolean;
uppercase: boolean;
lowercase: boolean;
number: boolean;
symbol: boolean;
};
}

/* ============================================================
COMPONENTE
============================================================ */

export default function PasswordRequirementsHint({
rules,
}: Props) {
return (
<div className="mt-4">

{/* ---------------------------------------------------------
Título
---------------------------------------------------------- */}

<p className="mb-2 text-sm font-medium text-[#4A4A4A]">
La contraseña debe cumplir con:
</p>

{/* ---------------------------------------------------------
Lista de requisitos
---------------------------------------------------------- */}

<ul className="space-y-1 text-sm">

{/* =====================================================
Mínimo 8 caracteres
====================================================== */}

<li
className={
rules.minLength
    ? "text-[#4CAF50]" // Requisito cumplido
    : "text-[#F44336]" // Requisito pendiente
}
>
• Mínimo 8 caracteres
</li>

{/* =====================================================
Una letra mayúscula
====================================================== */}

<li
className={
rules.uppercase
    ? "text-[#4CAF50]"
    : "text-[#F44336]"
}
>
• Una letra mayúscula
</li>

<li
className={
rules.lowercase
    ? "text-[#4CAF50]"
    : "text-[#F44336]"
}
>
• Una letra minúscula
</li>

{/* =====================================================
Un número
====================================================== */}

<li
className={
rules.number
    ? "text-[#4CAF50]"
    : "text-[#F44336]"
}
>
• Un número
</li>

{/* =====================================================
Un símbolo especial
====================================================== */}

<li
className={
rules.symbol
    ? "text-[#4CAF50]"
    : "text-[#F44336]"
}
>
• Un símbolo
</li>

</ul>

</div>
);
}
