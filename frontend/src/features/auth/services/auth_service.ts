import type {
  AuthResponse,
  LoginPayload,
} from "../types";

export async function loginService(
  data: LoginPayload,
): Promise<AuthResponse> {
  console.log("payload login:", data);

  await new Promise((resolve) =>
    setTimeout(resolve, 1000),
  );

  return {
    token: "fake-jwt-token",
    user: {
      id: "1",
      name: "Everton",
      email: data.email,
    },
  };
}