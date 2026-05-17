import { createBrowserRouter } from "react-router-dom";

import { LoginPage, RegisterPage } from "@/features/auth/pages";
import { AddressesPage } from "@/features/addresses/pages/addresses_page/addresses_page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard_page";
import { ProvidersPage } from "@/features/providers/pages/providers_page/providers_page";
import { SpecialtiesPage } from "@/features/specialties/pages/specialties_page/specialties_page";
import {
  OrdersPage,
  OrderDetailPage,
  OrderCreatePage,
} from "@/features/orders/pages";
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
    {
      path: "/providers",
      element: (
        <ProtectedRoute>
          <ProvidersPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders",
      element: (
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders/create",
      element: (
        <ProtectedRoute>
          <OrderCreatePage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders/:id",
      element: (
        <ProtectedRoute>
          <OrderDetailPage />
        </ProtectedRoute>
      ),
    },
  ]);
