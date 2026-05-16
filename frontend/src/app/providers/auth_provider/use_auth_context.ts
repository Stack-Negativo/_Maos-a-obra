import { useContext } from "react";

import { AuthContext } from "./auth_context";

export const useAuthContext = () => {
  const context =
    useContext(AuthContext);

  return context;
};