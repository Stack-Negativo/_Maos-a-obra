import axios from "axios";
import httpClient from "@/api/http-client";
import type {
  ApiResponse as BaseApiResponse,
} from "@/api/auth";
import type {
  Address,
  AddressPayload,
} from "../types/address_types";

const MOCK_ADDRESSES_STORAGE_KEY =
  "mock_addresses";

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: "mock-address-home",
    label: "Casa",
    zipCode: "49000000",
    street: "Rua das Mangueiras",
    number: "120",
    complement: "Apto 302",
    neighborhood: "Centro",
    city: "Aracaju",
    state: "SE",
  },
  {
    id: "mock-address-work",
    label: "Trabalho",
    zipCode: "49010000",
    street: "Avenida Principal",
    number: "45",
    complement: "",
    neighborhood: "Jardins",
    city: "Aracaju",
    state: "SE",
  },
];

type AddressApiResponse = {
  id: string;
  label?: string;
  zip_code: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
};

function readAddresses(): Address[] {
  const storedAddresses =
    localStorage.getItem(MOCK_ADDRESSES_STORAGE_KEY);

  if (!storedAddresses) {
    return DEFAULT_ADDRESSES;
  }

  try {
    return JSON.parse(storedAddresses) as Address[];
  } catch {
    localStorage.removeItem(
      MOCK_ADDRESSES_STORAGE_KEY,
    );

    return DEFAULT_ADDRESSES;
  }
}

function saveAddresses(addresses: Address[]) {
  localStorage.setItem(
    MOCK_ADDRESSES_STORAGE_KEY,
    JSON.stringify(addresses),
  );
}

function mapAddress(item: AddressApiResponse): Address {
  return {
    id: item.id,
    label: item.label ?? "",
    zipCode: item.zip_code,
    street: item.street,
    number: item.number ?? "",
    complement: item.complement ?? "",
    neighborhood: item.neighborhood,
    city: item.city,
    state: item.state,
  };
}

function isNetworkError(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    !error.response
  );
}

function isMockSession() {
  return localStorage.getItem("token") === "mock-token-mvp";
}

export async function listAddresses(): Promise<Address[]> {
  if (isMockSession()) {
    return readAddresses();
  }

  try {
    const response = await httpClient.get<
      BaseApiResponse<AddressApiResponse[]>
    >("/addresses");

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message ?? "Falha ao buscar endereços",
      );
    }

    return response.data.data.map(mapAddress);
  } catch (error) {
    if (isNetworkError(error)) {
      return readAddresses();
    }

    throw error;
  }
}

export async function createAddress(
  payload: AddressPayload,
): Promise<Address> {
  if (!isMockSession()) {
    try {
      const response = await httpClient.post<
        BaseApiResponse<AddressApiResponse>
      >("/addresses/", {
        label: payload.label,
        zip_code: payload.zipCode,
        street: payload.street,
        number: payload.number,
        complement: payload.complement,
        neighborhood: payload.neighborhood,
        city: payload.city,
        state: payload.state,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message ?? "Falha ao criar endereço",
        );
      }

      return mapAddress(response.data.data);
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  const address: Address = {
    id: `mock-address-${Date.now()}`,
    ...payload,
  };

  const addresses = [
    address,
    ...readAddresses(),
  ];

  saveAddresses(addresses);

  return address;
}

export async function deleteAddress(
  addressId: string,
): Promise<void> {
  if (!isMockSession()) {
    try {
      await httpClient.delete(`/addresses/${addressId}`);
      return;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  const addresses =
    readAddresses().filter(
      (address) => address.id !== addressId,
    );

  saveAddresses(addresses);
}
