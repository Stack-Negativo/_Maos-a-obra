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

export async function listAddresses(): Promise<Address[]> {
  return readAddresses();
}

export async function createAddress(
  payload: AddressPayload,
): Promise<Address> {
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
  const addresses =
    readAddresses().filter(
      (address) => address.id !== addressId,
    );

  saveAddresses(addresses);
}
