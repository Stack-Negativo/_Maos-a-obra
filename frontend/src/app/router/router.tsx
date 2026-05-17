import { createBrowserRouter } from "react-router-dom";

import { LoginPage, RegisterPage } from "@/features/auth/pages";
import { AddressesPage } from "@/features/addresses/pages/addresses_page/addresses_page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard_page";
import { SpecialtiesPage } from "@/features/specialties/pages/specialties_page/specialties_page";
import { ProtectedRoute } from "./protected_route";

export const router =
  createBrowserRouter([
    {
      path: "/",
      element: <LoginPage />,
    },
    {
      path: "/register",
      element: <RegisterPage />,
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/specialties",
      element: (
        <ProtectedRoute>
          <SpecialtiesPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/addresses",
      element: (
        <ProtectedRoute>
          <AddressesPage />
        </ProtectedRoute>
      ),
    },
  ]);
