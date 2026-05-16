import { createBrowserRouter } from "react-router-dom";

import { LoginPage } from "@/features/auth/pages/login_page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
]);