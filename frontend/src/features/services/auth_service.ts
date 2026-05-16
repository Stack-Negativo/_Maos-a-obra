type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  token: string;

  user: {
    id: string;
    name: string;
    email: string;
  };
};

export async function loginService({
  email,
  password,
}: LoginPayload): Promise<LoginResponse> {
  await new Promise((resolve) =>
    setTimeout(resolve, 1000),
  );

  return {
    token: "token_fake_123",

    user: {
      id: "1",
      name: "Everton",
      email,
    },
  };
}