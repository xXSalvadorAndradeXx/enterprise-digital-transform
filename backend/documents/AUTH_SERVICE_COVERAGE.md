# 📊 Reporte de Cobertura de Pruebas: `AuthService`

**Fecha de ejecución:** 24 de Julio de 2026  
**Tecnología / Framework:** NestJS (Jest)  
**Módulo Evaluado:** `src/auth/auth.service.ts`  
**Resultado Global del Test Suite:** 🟢 **20/20 Pruebas Pasadas (100%)**

---

## 🎯 Resumen Ejecutivo

El servicio **`AuthService`** presenta un nivel sobresaliente de cobertura de pruebas unitarias e integración, superando ampliamente el estándar de la industria (>80%). 

* **Métrica Destacada:** **92.9% de cobertura en líneas** y **93.33% en funciones**.
* **Estado del Módulo:** 🟢 **Apto para Producción / Altamente Confiable**

---

## 📈 Cobertura Específica de `AuthService`

| Métrica | Porcentaje Alcanzado | Estado | Observación |
| :--- | :---: | :---: | :--- |
| **Líneas (Lines)** | **92.90%** | 🟢 Excelente | Cobertura casi total de la lógica de negocio. |
| **Instrucciones (Statements)** | **93.00%** | 🟢 Excelente | Gran mayoría de sentencias validadas. |
| **Funciones (Functions)** | **93.33%** | 🟢 Excelente | Casi todos los métodos públicos y privados probados. |
| **Ramas / Condicionales (Branches)** | **75.67%** | 🟡 Aceptable | Faltan evaluar algunos caminos/validaciones borde. |

---

## 📌 Reporte Tabular Completo de Jest

```text
------------------------------------------------------|---------|----------|---------|---------|-----------------------------------
File                                                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                 
------------------------------------------------------|---------|----------|---------|---------|-----------------------------------
src/auth                                              |   48.18 |    35.66 |   45.16 |   49.62 |                                   
  auth.service.ts                                     |      93 |    75.67 |   93.33 |    92.9 | 58-66,206,228-230,236,278,414,420 
------------------------------------------------------|---------|----------|---------|---------|-----------------------------------
```

---

## ⚠️ Líneas No Cubiertas y Deuda Técnica

Las siguientes líneas del archivo `src/auth/auth.service.ts` no fueron ejecutadas durante la suite de pruebas actual:

| Líneas | Tipo de Escenario / Causa Potencial | Prioridad |
| :--- | :--- | :---: |
| **58 - 66** | Captura de errores inesperados / Fallos en dependencias externas. | Media |
| **206** | Rama condicional específica (Ej. Token expirado / Revocado). | Baja |
| **228 - 230** | Caso borde en validación de credenciales / Bloqueo de usuario. | Media |
| **236** | Retorno por defecto o manejo de excepción secundaria. | Baja |
| **278** | Flujo alternativo en cambio o reseteo de contraseña. | Media |
| **414, 420** | Manejo de excepciones en métodos auxiliares / Helpers. | Baja |

---

## 🧪 Resumen del Test Runner (Jest)

```text
Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        5.868 s
```

---

## 💡 Recomendaciones para Siguientes Sprints

1. **Aumentar Cobertura de Ramas (Branches) en `AuthService`:** Agregar casos de prueba (*edge cases*) para cubrir las líneas especificadas (`58-66`, `228-230`, `278`), llevando la cobertura de branches por encima del **85%**.
2. **Expandir Pruebas a Componentes Adyacentes:**
   * `auth.controller.ts` (Actualmente en **0%**).
   * `jwt.strategy.ts` y `local.strategy.ts` (Actualmente en **0%**).
   * Guards de autenticación (`jwt-auth.guard.ts`, `roles.guard.ts`, etc.).
