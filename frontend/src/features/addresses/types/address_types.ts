export type Address = {
  id: string;
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type AddressPayload = Omit<Address, "id">;
