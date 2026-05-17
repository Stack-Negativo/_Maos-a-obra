import { useAuth } from "@/features/auth/providers/auth_provider";
import { UserRole } from "@/features/auth/types/auth_types";
import { OrdersPage } from "./orders_page";
import { OrdersClientPage } from "./orders_client_page";
import { OrdersProviderPage } from "./orders_provider_page";
import { OrdersAdminPage } from "./orders_admin_page";

export function OrdersRoleBasedPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Carregando...</div>;
  }

  switch (user.role) {
    case UserRole.ADMIN:
      return <OrdersAdminPage />;
    case UserRole.PROVIDER:
      return <OrdersProviderPage />;
    case UserRole.CLIENT:
      return <OrdersClientPage />;
    default:
      return <OrdersPage />;
  }
}
