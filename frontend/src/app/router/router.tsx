import { createBrowserRouter } from "react-router-dom";

import { LoginPage, ProfilePage, RegisterPage } from "@/features/auth/pages";
import { AddressesPage } from "@/features/addresses/pages/addresses_page/addresses_page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard_page";
import { ProvidersPage } from "@/features/providers/pages/providers_page/providers_page";
import { SpecialtiesPage } from "@/features/specialties/pages/specialties_page/specialties_page";
import {
  OrdersRoleBasedPage,
  OrderDetailPage,
  OrderCreatePage,
  OrdersAdminPage,
  OrdersClientPage,
  OrdersProviderPage,
} from "@/features/orders/pages";
import { ProtectedRoute } from "./protected_route";
import { UserRole } from "@/features/auth/types/auth_types";

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
      path: "/profile",
      element: (
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/specialties",
      element: (
        <ProtectedRoute roles={[UserRole.ADMIN, UserRole.PROVIDER]}>
          <SpecialtiesPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/addresses",
      element: (
        <ProtectedRoute roles={[UserRole.ADMIN, UserRole.CLIENT]}>
          <AddressesPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/providers",
      element: (
        <ProtectedRoute roles={[UserRole.ADMIN]}>
          <ProvidersPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders",
      element: (
        <ProtectedRoute>
          <OrdersRoleBasedPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders/client",
      element: (
        <ProtectedRoute roles={[UserRole.CLIENT]}>
          <OrdersClientPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders/provider",
      element: (
        <ProtectedRoute roles={[UserRole.PROVIDER]}>
          <OrdersProviderPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders/admin",
      element: (
        <ProtectedRoute roles={[UserRole.ADMIN]}>
          <OrdersAdminPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders/create",
      element: (
        <ProtectedRoute roles={[UserRole.CLIENT]}>
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
