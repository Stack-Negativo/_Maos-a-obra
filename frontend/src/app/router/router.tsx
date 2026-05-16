import { createBrowserRouter } from "react-router-dom";

import { LoginPage } from "@/features/auth/pages";

import { DashboardPage } from "@/features/dashboard/pages/dashboard_page";

export const router =
  createBrowserRouter([
    {
      path: "/",
      element: <LoginPage />,
    },

    {
      path: "/dashboard",
      element: <DashboardPage />,
    },
  ]);