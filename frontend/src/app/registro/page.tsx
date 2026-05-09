"use client";

import { useState } from "react";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function RegistroPage() {

  const [formData, setFormData] =
    useState<RegisterFormData>({
      name: "",
      email: "",
      password: "",
    });

  const [errors, setErrors] =
    useState<FormErrors>({
      name: "",
      email: "",
      password: "",
    });

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // Manejar cambios
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  // Validaciones
  const validateForm = () => {

    let newErrors: FormErrors = {};

    // Nombre
    if (!formData.name.trim()) {

      newErrors.name =
        "El nombre es obligatorio";

    }

    // Email
    if (!formData.email.trim()) {

      newErrors.email =
        "El email es obligatorio";

    }

    // Validar dominios reales
    else if (
      !/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com)$/i.test(
        formData.email
      )
    ) {

      newErrors.email =
        "Ingrese un correo válido";

    }

    // Password
    if (!formData.password.trim()) {

      newErrors.password =
        "La contraseña es obligatoria";

    } else if (
      formData.password.length < 8
    ) {

      newErrors.password =
        "La contraseña debe tener al menos 8 caracteres";

    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );

  };

  // Enviar formulario
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    try {

      setLoading(true);

      const response = await fetch(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      // Registro exitoso
      if (response.ok) {

        setMessage(
          "Usuario registrado correctamente"
        );

        setFormData({
          name: "",
          email: "",
          password: "",
        });

        setErrors({});

      } else {

        // Correo ya registrado
        if (
          typeof data.message === "string" &&
          data.message.toLowerCase().includes("registrado")
        ) {

          setMessage(
            "El correo ya está registrado"
          );

        } else {

          setMessage(
            "El correo ya esta registrado"
          );

        }

      }

    } catch (error) {

      console.error(error);

      setMessage(
        "Error de conexión con el servidor"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="flex justify-center items-center min-h-screen bg-gray-100">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >

        <h1 className="text-3xl font-bold mb-6 text-center text-black">
          Registro
        </h1>

        {/* Nombre */}
        <div className="mb-4">

          <label className="block mb-1 text-black">
            Nombre
          </label>

          <input
            type="text"
            name="name"
            placeholder="Ingresa tu nombre"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded text-black placeholder:text-gray-500"
          />

          {errors.name && (
            <p className="text-red-500 text-sm mt-1">
              {errors.name}
            </p>
          )}

        </div>

        {/* Email */}
        <div className="mb-4">

          <label className="block mb-1 text-black">
            Email
          </label>

          <input
            type="email"
            name="email"
            placeholder="correo@gmail.com"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-2 rounded text-black placeholder:text-gray-500"
          />

          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email}
            </p>
          )}

        </div>

        {/* Password */}
        <div className="mb-4">

          <label className="block mb-1 text-black">
            Contraseña
          </label>

          <input
            type="password"
            name="password"
            placeholder="********"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-2 rounded text-black placeholder:text-gray-500"
          />

          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password}
            </p>
          )}

        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
        >

          {loading
            ? "Registrando..."
            : "Registrarse"}

        </button>

        {/* Mensaje */}
        {message && (
          <p className="mt-4 text-center text-black">
            {message}
          </p>
        )}

      </form>

    </div>

  );

}