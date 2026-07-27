"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";

import loginIllustration from "@/assets/login/login-illustration.png";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordRequirementsHint from "@/components/ui/PasswordRequirementsHint";
import SuccessAlert from "./components/SuccessAlert";

interface ChangePasswordForm {
temporaryPassword: string;
newPassword: string;
confirmPassword: string;
}

export default function ChangePasswordPage() {
  const [showSuccess, setShowSuccess] = useState(false);
const {
  register,
  watch,
  handleSubmit,
  formState: { errors },
} = useForm<ChangePasswordForm>({
  defaultValues: {
    temporaryPassword: "",
    newPassword: "",
    confirmPassword: "",
  },
});


const onSubmit = async (data: ChangePasswordForm) => {
  console.log(data);

  // Simulación temporal de la petición al backend
  await new Promise((resolve) => setTimeout(resolve, 800));

  setShowSuccess(true);
};

const temporaryPassword = watch("temporaryPassword") ?? "";

const password = watch("newPassword") ?? "";

const passwordRules = {
minLength: password.length >= 8,
uppercase: /[A-Z]/.test(password),
number: /\d/.test(password),
symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
};
const confirmPassword = watch("confirmPassword") ?? "";

const passwordIsValid =
passwordRules.minLength &&
passwordRules.uppercase &&
passwordRules.number &&
passwordRules.symbol;

const confirmPasswordIsValid =
confirmPassword.length > 0 &&
confirmPassword === password;


const temporaryPasswordIsValid = temporaryPassword.trim().length > 0;

return (
<main className="min-h-screen bg-white">
<div className="grid min-h-screen w-full items-center gap-59 px-9 py-12 lg:grid-cols-[580px_420px] lg:px-12">
{/* ================= COLUMNA IZQUIERDA ================= */}
<section className="flex justify-start">
    
<div className="w-full max-w-[580px]">

<h1 className="text-[40px] w-[580px] font-bold leading-tight text-[#000000]">
    Crea una nueva contraseña
</h1>

<p className="mt-3 text-[16px] leading-relaxed text-[#4A4A4A]">
    Por seguridad, debes cambiar tu contraseña temporal antes de acceder al ERP.
</p>

<form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>

<div className="flex flex-col gap-2 w-[362px] ">

<Input 
  label="Contraseña temporal actual"
  error={!!errors.temporaryPassword}
  errorMessage={errors.temporaryPassword?.message}
  {...register("temporaryPassword", {
    required: "La contraseña temporal es obligatoria.",
  })}
/>


  <Input
    id="newPassword"
    label="Nueva contraseña"
    type="password"
    error={password.length > 0 && !passwordIsValid}
    {...register("newPassword")}
  />


<Input
  id="confirmPassword"
  label="Confirmar nueva contraseña"
  type="password"
  error={
    confirmPassword.length > 0 &&
    !confirmPasswordIsValid
  }
  errorMessage={
    confirmPassword.length > 0 &&
    !confirmPasswordIsValid
      ? "Las contraseñas no coinciden."
      : undefined
  }
  {...register("confirmPassword")}
/>

  <PasswordRequirementsHint rules={passwordRules} />
</div>



<Button
  type="submit"
  className="mt-1 self-center w-[352px]"
>
  Cambiar contraseña y acceder
</Button>

</form>
</div>
</section>

{/* ================= COLUMNA DERECHA ================= */}
<section className="hidden lg:block">
<div className="relative ml-auto h-[calc(100vh-48px)] w-[420px] overflow-hidden rounded-t-full bg-[#F2F5FC]">
<Image
    src={loginIllustration}
    alt="Ilustración de cambio de contraseña"
    priority
    aria-hidden="true"
    sizes="420px"
    className="absolute left-1/2 top-[32%] h-auto w-[165%] max-w-none -translate-x-1/2 object-contain"
/>
</div>
</section>

</div>


<SuccessAlert
  open={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="¡Contraseña actualizada!"
  message="Se guardó su contraseña correctamente."
  buttonText="Aceptar"
/>

</main>
);
}