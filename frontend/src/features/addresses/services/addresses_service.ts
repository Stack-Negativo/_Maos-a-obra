import httpClient from "@/api/http-client";
import type { ApiResponse as BaseApiResponse } from "@/api/auth";
import type { Address, AddressPayload } from "../types/address_types";

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

function toApiPayload(payload: AddressPayload) {
  return {
    label: payload.label,
    zip_code: payload.zipCode,
    street: payload.street,
    number: payload.number,
    complement: payload.complement,
    neighborhood: payload.neighborhood,
    city: payload.city,
    state: payload.state,
  };
}

export async function listAddresses(): Promise<Address[]> {
  const response = await httpClient.get<BaseApiResponse<AddressApiResponse[]>>(
    "/addresses/",
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message ?? "Falha ao buscar enderecos");
  }

  return response.data.data.map(mapAddress);
}

export async function createAddress(
  payload: AddressPayload,
): Promise<Address> {
  const response = await httpClient.post<BaseApiResponse<AddressApiResponse>>(
    "/addresses/",
    toApiPayload(payload),
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message ?? "Falha ao criar endereco");
  }

  return mapAddress(response.data.data);
}

export async function updateAddress(
  addressId: string,
  payload: AddressPayload,
): Promise<Address> {
  const response = await httpClient.patch<BaseApiResponse<AddressApiResponse>>(
    `/addresses/${addressId}`,
    toApiPayload(payload),
  );

  if (!response.data.success) {
    throw new Error(
      response.data.error?.message ?? "Falha ao atualizar endereco",
    );
  }

  return mapAddress(response.data.data);
}

export async function deleteAddress(addressId: string): Promise<void> {
  await httpClient.delete(`/addresses/${addressId}`);
}
