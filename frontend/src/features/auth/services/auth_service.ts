import axios from "axios";

import { authApi } from "@/api/auth";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from "../types";

type MockUser = {
  id: string;
  name: string;
  email: string;
};

const MOCK_USER_STORAGE_KEY =
  "mock_user";

function isNetworkError(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    !error.response
  );
}

function createMockUser(
  email: string,
  name?: string,
): MockUser {
  return {
    id: "mock-user-1",
    name:
      name?.trim() ||
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
      "Usuario MVP",
    email,
  };
}

function saveMockUser(user: MockUser) {
  localStorage.setItem(
    MOCK_USER_STORAGE_KEY,
    JSON.stringify(user),
  );
}

function getMockUser(email: string) {
  const storedUser =
    localStorage.getItem(MOCK_USER_STORAGE_KEY);

  if (!storedUser) {
    return createMockUser(email);
  }

  try {
    const user =
      JSON.parse(storedUser) as MockUser;

    if (user.email === email) {
      return user;
    }
  } catch {
    localStorage.removeItem(
      MOCK_USER_STORAGE_KEY,
    );
  }

  return createMockUser(email);
}

function mockLogin(
  data: LoginPayload,
): AuthResponse {
  return {
    token: "mock-token-mvp",
    user: getMockUser(data.email.trim()),
  };
}

function mockRegister(
  data: RegisterPayload,
) {
  const user =
    createMockUser(
      data.email.trim(),
      data.nome,
    );

  saveMockUser(user);

  return user;
}

export async function loginService(
  data: LoginPayload,
): Promise<AuthResponse> {
  try {
    const loginResponse = await authApi.login({
      email: data.email,
      senha: data.password,
    });

    if (!loginResponse.success) {
      throw new Error(
        loginResponse.error?.message ?? "Falha ao realizar login",
      );
    }

    const token =
      loginResponse.data.access_token;

    const profileResponse =
      await authApi.me(token);

    if (!profileResponse.success) {
      throw new Error(
        profileResponse.error?.message ??
          "Falha ao buscar perfil do usuario",
      );
    }

    return {
      token,
      user: {
        id: profileResponse.data.id,
        name: profileResponse.data.nome,
        email: profileResponse.data.email,
      },
    };
  } catch (error) {
    if (isNetworkError(error)) {
      return mockLogin(data);
    }

    throw error;
  }
}

export async function registerService(
  data: RegisterPayload,
): Promise<{ id: string; name: string; email: string }> {
  try {
    const response =
      await authApi.register(data);

    if (!response.success) {
      throw new Error(
        response.error?.message ?? "Falha ao cadastrar usuario",
      );
    }

    return {
      id: response.data.id,
      name: response.data.nome,
      email: response.data.email,
    };
  } catch (error) {
    if (isNetworkError(error)) {
      return mockRegister(data);
    }

    throw error;
  }
}
