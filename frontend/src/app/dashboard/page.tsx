"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {

  const [authorized, setAuthorized] =
    useState(false);

  useEffect(() => {

    const token =
      localStorage.getItem("token");

    // Si no existe token → login
    if (!token) {

      window.location.href = "/login";

    } else {

      setAuthorized(true);

    }

  }, []);

  // Logout
  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  // Mientras valida
  if (!authorized) {

    return null;

  }

  return (

    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">

      <h1 className="text-4xl font-bold text-black mb-6">
        Dashboard
      </h1>

      <p className="text-black mb-6">
        Sesión iniciada correctamente
      </p>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-6 py-3 rounded"
      >
        Cerrar Sesión
      </button>

    </div>
  );
}