"use client";

import { useState } from "react";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    server: "",
  });

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

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

    const newErrors = {
      email: "",
      password: "",
      server: "",
    };

    let isValid = true;

    // Validar email
    if (!formData.email.trim()) {

      newErrors.email = "El email es obligatorio";
      isValid = false;

    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {

      newErrors.email = "Email inválido";
      isValid = false;

    }

    // Validar contraseña
    if (!formData.password.trim()) {

      newErrors.password =
        "La contraseña es obligatoria";

      isValid = false;
    }

    setErrors(newErrors);

    return isValid;
  };

  // Enviar formulario
  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    try {

      setLoading(true);

      // Delay para visualizar loading
      await new Promise((resolve) =>
        setTimeout(resolve, 3000)
      );

      const response = await fetch(
        "http://localhost:3000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      // Manejo de errores
      if (!response.ok) {

        if (
          data.message === "Usuario no encontrado"
        ) {

          setErrors({
            ...errors,
            server: "Usuario no encontrado",
          });

        } else {

          setErrors({
            ...errors,
            server: "Credenciales inválidas",
          });

        }

        return;
      }

      // Login exitoso
      // Guardar token
        localStorage.setItem(
       "token",
        data.access_token
        );

// Guardar usuario
        localStorage.setItem(
        "user",
        JSON.stringify(data.user)
        );

         setMessage("Login exitoso");

         // Redirección automática
          window.location.href = "/dashboard";

      console.log(data);

    } catch (error) {

      setErrors({
        ...errors,
        server: "Error de conexión con el servidor",
      });

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">

        <h1 className="text-3xl font-bold mb-6 text-center text-black">
          Login
        </h1>

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}
          <div className="mb-4">

            <label className="block mb-2 text-black">
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="correo@email.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-3 rounded text-black"
            />

            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email}
              </p>
            )}

          </div>

          {/* PASSWORD */}
          <div className="mb-4">

            <label className="block mb-2 text-black">
              Contraseña
            </label>

            <input
              type="password"
              name="password"
              placeholder="******"
              value={formData.password}
              onChange={handleChange}
              className="w-full border p-3 rounded text-black"
            />

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password}
              </p>
            )}

          </div>

          {/* ERROR SERVIDOR */}
          {errors.server && (
            <p className="text-red-500 text-center mb-4">
              {errors.server}
            </p>
          )}

          {/* MENSAJE EXITOSO */}
          {message && (
            <p className="text-green-600 text-center mb-4">
              {message}
            </p>
          )}

          {/* BOTÓN */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >

            {loading
              ? "Cargando..."
              : "Iniciar Sesión"}

          </button>

        </form>

      </div>

    </div>
  );
}