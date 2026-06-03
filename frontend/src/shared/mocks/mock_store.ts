import { UserRole } from "@/features/auth/types/auth_types";
import type { User } from "@/features/auth/types/auth_types";
import type {
  Address,
  AddressPayload,
} from "@/features/addresses/types/address_types";
import type {
  ProviderPayload,
  ProviderProfile,
} from "@/features/providers/types/provider_types";
import type {
  Specialty,
  SpecialtyRequest,
} from "@/features/specialties/types/specialty_types";
import type {
  Application,
  CreateOrderInput,
  Order,
  OrderHistoryActor,
  OrderReview,
} from "@/features/orders/types/order_types";
import { OrderStatus } from "@/features/orders/types/order_types";

const STORE_KEY = "maos_a_obra_frontend_mock_store_v1";
const TOKEN_PREFIX = "mock-token:";

type MockUser = User & {
  password: string;
};

type MockStore = {
  users: MockUser[];
  specialties: Specialty[];
  specialtyRequests: SpecialtyRequest[];
  addressesByUserId: Record<string, Address[]>;
  providers: ProviderProfile[];
  orders: Order[];
};

function now(offsetHours = 0) {
  const date = new Date();
  date.setHours(date.getHours() + offsetHours);
  return date.toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

const providerPhotoUrls = [
  "/provider-photos/rafael-eletricista.png",
  "/provider-photos/lucas-hidraulica.png",
  "/provider-photos/paula-pinturas.png",
];

function createProviderPhoto(seed: string) {
  const hash = Array.from(seed).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
  return providerPhotoUrls[hash % providerPhotoUrls.length];
}

function getSeededProviderPhoto(provider: { id: string; name: string }) {
  return (
    seededProviders.find((seededProvider) => seededProvider.id === provider.id)
      ?.photoUrl ??
    seededProviders.find((seededProvider) => seededProvider.name === provider.name)
      ?.photoUrl ??
    createProviderPhoto(provider.id || provider.name)
  );
}

function withProviderPhoto<T extends { id: string; name: string; photoUrl?: string }>(
  provider: T,
): T & { photoUrl: string } {
  return {
    ...provider,
    photoUrl:
      provider.photoUrl?.startsWith("/provider-photos/")
        ? provider.photoUrl
        : getSeededProviderPhoto(provider),
  };
}

function hydrateProviderPhotos(store: MockStore) {
  let changed = false;
  const providers = store.providers.map((provider) => {
    const hydratedProvider = withProviderPhoto(provider);
    if (hydratedProvider.photoUrl !== provider.photoUrl) {
      changed = true;
    }
    return hydratedProvider;
  });
  const providersById = new Map(providers.map((provider) => [provider.id, provider]));

  const orders = store.orders.map((order) => {
    let selectedProvider = order.selectedProvider;
    if (selectedProvider) {
      const hydratedProvider = withProviderPhoto(
        providersById.get(selectedProvider.id) ?? selectedProvider,
      );
      if (hydratedProvider.photoUrl !== selectedProvider.photoUrl) {
        changed = true;
      }
      selectedProvider = hydratedProvider;
    }

    const applications = order.applications?.map((application) => {
      const hydratedProvider = withProviderPhoto(
        providersById.get(application.provider.id) ?? application.provider,
      );
      if (hydratedProvider.photoUrl !== application.provider.photoUrl) {
        changed = true;
      }
      return {
        ...application,
        provider: hydratedProvider,
      };
    });

    return {
      ...order,
      selectedProvider,
      applications,
    };
  });

  if (!changed) {
    return store;
  }

  return {
    ...store,
    providers,
    orders,
  };
}

const seededSpecialties: Specialty[] = [
  {
    id: "spec-eletrica",
    name: "Elétrica",
    description: "Instalações, reparos e manutenção elétrica residencial.",
    isActive: true,
  },
  {
    id: "spec-hidraulica",
    name: "Hidráulica",
    description: "Vazamentos, torneiras, sifões e encanamentos.",
    isActive: true,
  },
  {
    id: "spec-pintura",
    name: "Pintura",
    description: "Pintura interna, externa e pequenos acabamentos.",
    isActive: true,
  },
  {
    id: "spec-marcenaria",
    name: "Marcenaria",
    description: "Ajustes, montagem e reparos em móveis.",
    isActive: false,
  },
];

const seededUsers: MockUser[] = [
  {
    id: "user-admin",
    name: "Administrador Mãos à Obra",
    email: "admin@maosaobra.com.br",
    password: "Admin12345",
    phone: "11999990000",
    role: UserRole.ADMIN,
    isAdmin: true,
    isProvider: false,
    specialties: [],
  },
  {
    id: "user-cliente",
    name: "Marina Cliente",
    email: "cliente@maosaobra.com.br",
    password: "Cliente123",
    phone: "11988887777",
    role: UserRole.CLIENT,
    isAdmin: false,
    isProvider: false,
    specialties: [],
  },
  {
    id: "user-prestador",
    name: "Rafael Prestador",
    email: "prestador@maosaobra.com.br",
    password: "Prestador123",
    phone: "11977776666",
    role: UserRole.PROVIDER,
    providerId: "provider-rafael",
    bio: "Eletricista residencial com foco em reparos rápidos, instalações seguras e atendimento em apartamentos.",
    isAdmin: false,
    isProvider: true,
    specialties: [seededSpecialties[0]],
  },
];

const seededProviders: ProviderProfile[] = [
  {
    id: "provider-rafael",
    userId: "user-prestador",
    name: "Rafael Prestador",
    photoUrl: "/provider-photos/rafael-eletricista.png",
    bio: "Eletricista residencial com foco em reparos rápidos, instalações seguras e atendimento em apartamentos.",
    specialties: [seededSpecialties[0]],
    ratingAverage: 4.8,
    completedServices: 18,
    isSuspended: false,
  },
  {
    id: "provider-lucas",
    userId: "user-lucas",
    name: "Lucas Hidráulica",
    photoUrl: "/provider-photos/lucas-hidraulica.png",
    bio: "Especialista em vazamentos, torneiras, registros e manutenção hidráulica preventiva.",
    specialties: [seededSpecialties[1]],
    ratingAverage: 4.6,
    completedServices: 12,
    isSuspended: false,
  },
  {
    id: "provider-paula",
    userId: "user-paula",
    name: "Paula Pinturas",
    photoUrl: "/provider-photos/paula-pinturas.png",
    bio: "Pintora residencial com experiência em acabamento fino, pintura interna e pequenos reparos.",
    specialties: [seededSpecialties[2]],
    ratingAverage: 4.9,
    completedServices: 24,
    isSuspended: false,
  },
];

const seededAddress: Address = {
  id: "addr-cliente-casa",
  label: "Casa",
  zipCode: "01310930",
  street: "Avenida Paulista",
  number: "1000",
  complement: "Apto 82",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
};

function addHistory(
  order: Order,
  title: string,
  description: string,
  actor: OrderHistoryActor = "SYSTEM",
) {
  order.history = [
    ...(order.history ?? []),
    {
      id: createId("hist"),
      actor,
      title,
      description,
      createdAt: now(),
    },
  ];
  order.updatedAt = now();
}

function createSeedOrder(partial: Partial<Order> & Pick<Order, "id" | "title" | "description" | "status" | "specialty">): Order {
  return {
    address: seededAddress,
    preferredDate: now(30),
    createdAt: now(-24),
    updatedAt: now(-12),
    applications: [],
    history: [
      {
        id: `${partial.id}-hist-created`,
        actor: "CLIENT",
        title: "Criada",
        description: "Ordem criada pelo cliente.",
        createdAt: now(-24),
      },
    ],
    ...partial,
  };
}

function seedStore(): MockStore {
  const orderSelection = createSeedOrder({
    id: "order-eletrica-candidaturas",
    title: "Tomada da cozinha parou de funcionar",
    description:
      "A tomada principal da cozinha deixou de funcionar após queda de energia. Preciso avaliar a fiação e trocar se necessário.",
    status: OrderStatus.AWAITING_SELECTION,
    specialty: seededSpecialties[0],
    applications: [
      {
        id: "app-rafael-eletrica",
        orderId: "order-eletrica-candidaturas",
        provider: seededProviders[0],
        status: "PENDING",
        appliedAt: now(-8),
      },
    ],
  });

  const orderScheduled = createSeedOrder({
    id: "order-hidraulica-agendada",
    title: "Vazamento embaixo da pia",
    description:
      "Há um vazamento constante no sifão da pia do banheiro social.",
    status: OrderStatus.SCHEDULED,
    specialty: seededSpecialties[1],
    selectedProvider: seededProviders[1],
    scheduledAt: now(18),
    applications: [
      {
        id: "app-lucas-hidraulica",
        orderId: "order-hidraulica-agendada",
        provider: seededProviders[1],
        status: "ACCEPTED",
        appliedAt: now(-18),
        respondedAt: now(-10),
      },
    ],
  });

  const orderOpen = createSeedOrder({
    id: "order-pintura-aberta",
    title: "Pintura de parede com infiltração tratada",
    description:
      "A parede do quarto já foi tratada contra infiltração e precisa de acabamento e pintura.",
    status: OrderStatus.AWAITING_CANDIDATES,
    specialty: seededSpecialties[2],
    preferredDate: now(48),
  });

  return {
    users: seededUsers,
    specialties: seededSpecialties,
    specialtyRequests: [
      {
        id: "req-jardinagem",
        name: "Jardinagem",
        description: "Poda, manutenção de jardins e limpeza de áreas verdes.",
        requestedBy: "user-prestador",
        requestedByName: "Rafael Prestador",
        status: "PENDING",
        createdAt: now(-30),
      },
    ],
    addressesByUserId: {
      "user-cliente": [seededAddress],
    },
    providers: seededProviders,
    orders: [orderSelection, orderScheduled, orderOpen],
  };
}

function readStore(): MockStore {
  const stored = localStorage.getItem(STORE_KEY);
  if (!stored) {
    const seeded = seedStore();
    localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsedStore = JSON.parse(stored) as MockStore;
    const hydratedStore = hydrateProviderPhotos(parsedStore);
    if (hydratedStore !== parsedStore) {
      writeStore(hydratedStore);
    }
    return hydratedStore;
  } catch {
    const seeded = seedStore();
    localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeStore(store: MockStore) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function getSessionUserId() {
  const token = localStorage.getItem("token");
  if (token?.startsWith(TOKEN_PREFIX)) {
    return token.slice(TOKEN_PREFIX.length);
  }

  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return null;
  }

  try {
    return (JSON.parse(storedUser) as User).id;
  } catch {
    return null;
  }
}

function getSessionUser(store = readStore()) {
  const userId = getSessionUserId();
  return store.users.find((user) => user.id === userId) ?? null;
}

function toPublicUser(user: MockUser): User {
  const { password: _password, ...publicUser } = user;
  void _password;
  return publicUser;
}

function ensureOrder(store: MockStore, orderId: string) {
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) {
    throw new Error("Ordem não encontrada.");
  }
  return order;
}

function ensureProvider(store: MockStore) {
  const user = getSessionUser(store);
  const provider = store.providers.find((item) => item.userId === user?.id);
  if (!provider || provider.isSuspended) {
    throw new Error("Perfil de prestador indisponível para esta ação.");
  }
  return provider;
}

export const mockStore = {
  reset() {
    const seeded = seedStore();
    writeStore(seeded);
    return seeded;
  },

  login(email: string, password: string) {
    const store = readStore();
    const user = store.users.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
    );

    if (!user || user.password !== password) {
      throw new Error("Email ou senha inválidos.");
    }

    return {
      token: `${TOKEN_PREFIX}${user.id}`,
      user: toPublicUser(user),
    };
  },

  register(input: {
    nome: string;
    email: string;
    senha: string;
    telefone: string;
    role?: UserRole.CLIENT | UserRole.PROVIDER;
    bio?: string;
    specialtyIds?: string[];
  }) {
    const store = readStore();
    const email = input.email.trim().toLowerCase();

    if (store.users.some((user) => user.email.toLowerCase() === email)) {
      throw new Error("Já existe uma conta com este email.");
    }

    const specialties = store.specialties.filter((specialty) =>
      input.specialtyIds?.includes(specialty.id),
    );
    const user: MockUser = {
      id: createId("user"),
      name: input.nome.trim(),
      email,
      password: input.senha,
      phone: input.telefone,
      role: input.role ?? UserRole.CLIENT,
      isAdmin: false,
      isProvider: input.role === UserRole.PROVIDER,
      bio: input.bio,
      specialties,
    };

    if (input.role === UserRole.PROVIDER) {
      const provider: ProviderProfile = {
        id: createId("provider"),
        userId: user.id,
        name: user.name,
        photoUrl: createProviderPhoto(user.name),
        bio: input.bio ?? "",
        specialties,
        ratingAverage: 0,
        completedServices: 0,
        isSuspended: false,
      };
      user.providerId = provider.id;
      store.providers.push(provider);
    }

    store.users.push(user);
    store.addressesByUserId[user.id] = [];
    writeStore(store);

    return {
      token: `${TOKEN_PREFIX}${user.id}`,
      user: toPublicUser(user),
    };
  },

  updateProfile(input: { name: string; phone: string }) {
    const store = readStore();
    const user = getSessionUser(store);
    if (!user) {
      throw new Error("Sessão expirada.");
    }

    user.name = input.name.trim();
    user.phone = input.phone.replace(/\D/g, "");

    const provider = store.providers.find((item) => item.userId === user.id);
    if (provider) {
      provider.name = user.name;
    }

    writeStore(store);
    return { name: user.name, phone: user.phone };
  },

  becomeProvider(user: User, input: { bio: string; specialtyIds: string[] }) {
    const store = readStore();
    const specialties = store.specialties.filter((specialty) =>
      input.specialtyIds.includes(specialty.id),
    );
    const storedUser = store.users.find((item) => item.id === user.id);
    if (!storedUser) {
      throw new Error("Usuário não encontrado.");
    }

    const provider: ProviderProfile = {
      id: storedUser.providerId ?? createId("provider"),
      userId: storedUser.id,
      name: storedUser.name,
      photoUrl: createProviderPhoto(storedUser.name),
      bio: input.bio.trim(),
      specialties,
      ratingAverage: 0,
      completedServices: 0,
      isSuspended: false,
    };

    storedUser.role = UserRole.PROVIDER;
    storedUser.providerId = provider.id;
    storedUser.bio = provider.bio;
    storedUser.isProvider = true;
    storedUser.isAdmin = false;
    storedUser.specialties = specialties;

    store.providers = [
      provider,
      ...store.providers.filter((item) => item.id !== provider.id),
    ];
    writeStore(store);

    return toPublicUser(storedUser);
  },

  listSpecialties() {
    return readStore().specialties;
  },

  listSpecialtyRequests() {
    return readStore().specialtyRequests;
  },

  requestSpecialty(input: {
    name: string;
    description: string;
    requestedBy: string;
    requestedByName: string;
  }) {
    const store = readStore();
    const name = input.name.trim();
    const description = input.description.trim();
    const normalizedName = name.toLowerCase();
    const existsInCatalog = store.specialties.some(
      (specialty) => specialty.name.toLowerCase() === normalizedName,
    );
    const existsAsPendingRequest = store.specialtyRequests.some(
      (request) =>
        request.status === "PENDING" &&
        request.name.toLowerCase() === normalizedName,
    );

    if (existsInCatalog) {
      throw new Error("Essa especialidade ja existe no catalogo.");
    }

    if (existsAsPendingRequest) {
      throw new Error("Ja existe uma solicitacao pendente para essa especialidade.");
    }

    const request: SpecialtyRequest = {
      id: createId("spec-req"),
      name,
      description,
      requestedBy: input.requestedBy,
      requestedByName: input.requestedByName,
      status: "PENDING",
      createdAt: now(),
    };

    store.specialtyRequests.unshift(request);
    writeStore(store);
    return request;
  },

  createSpecialty(input: { name: string; description: string; isActive?: boolean }) {
    const store = readStore();
    const name = input.name.trim();
    const exists = store.specialties.some(
      (specialty) => specialty.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      throw new Error("Já existe uma especialidade com esse nome.");
    }

    const specialty: Specialty = {
      id: createId("spec"),
      name,
      description: input.description.trim(),
      isActive: input.isActive ?? true,
    };
    store.specialties.push(specialty);
    writeStore(store);
    return specialty;
  },

  toggleSpecialtyStatus(specialtyId: string) {
    const store = readStore();
    const specialty = store.specialties.find((item) => item.id === specialtyId);
    if (!specialty) {
      throw new Error("Especialidade não encontrada.");
    }
    specialty.isActive = !specialty.isActive;
    writeStore(store);
    return specialty;
  },

  approveSpecialtyRequest(requestId: string) {
    const store = readStore();
    const request = store.specialtyRequests.find((item) => item.id === requestId);
    if (!request) {
      throw new Error("Solicitação não encontrada.");
    }
    const exists = store.specialties.some(
      (specialty) => specialty.name.toLowerCase() === request.name.toLowerCase(),
    );
    request.status = "APPROVED";
    request.reviewedAt = now();
    if (exists) {
      writeStore(store);
      return { request, specialty: undefined };
    }

    const specialty: Specialty = {
      id: createId("spec"),
      name: request.name,
      description: request.description,
      isActive: true,
    };
    store.specialties.push(specialty);
    writeStore(store);
    return { request, specialty };
  },

  rejectSpecialtyRequest(requestId: string) {
    const store = readStore();
    const request = store.specialtyRequests.find((item) => item.id === requestId);
    if (!request) {
      throw new Error("Solicitação não encontrada.");
    }
    request.status = "REJECTED";
    request.reviewedAt = now();
    writeStore(store);
    return request;
  },

  listAddresses() {
    const store = readStore();
    const user = getSessionUser(store);
    return user ? store.addressesByUserId[user.id] ?? [] : [];
  },

  createAddress(payload: AddressPayload) {
    const store = readStore();
    const user = getSessionUser(store);
    if (!user) {
      throw new Error("Sessão expirada.");
    }
    const address = { ...payload, id: createId("addr") };
    store.addressesByUserId[user.id] = [
      ...(store.addressesByUserId[user.id] ?? []),
      address,
    ];
    writeStore(store);
    return address;
  },

  updateAddress(addressId: string, payload: AddressPayload) {
    const store = readStore();
    const user = getSessionUser(store);
    if (!user) {
      throw new Error("Sessão expirada.");
    }
    const addresses = store.addressesByUserId[user.id] ?? [];
    const index = addresses.findIndex((address) => address.id === addressId);
    if (index < 0) {
      throw new Error("Endereço não encontrado.");
    }
    addresses[index] = { ...payload, id: addressId };
    writeStore(store);
    return addresses[index];
  },

  deleteAddress(addressId: string) {
    const store = readStore();
    const user = getSessionUser(store);
    if (!user) {
      throw new Error("Sessão expirada.");
    }
    store.addressesByUserId[user.id] = (store.addressesByUserId[user.id] ?? [])
      .filter((address) => address.id !== addressId);
    writeStore(store);
  },

  listProviders() {
    return readStore().providers;
  },

  createProviderProfile(payload: ProviderPayload) {
    const store = readStore();
    const user = getSessionUser(store);
    if (!user) {
      throw new Error("Sessão expirada.");
    }
    const provider: ProviderProfile = {
      id: user.providerId ?? createId("provider"),
      userId: user.id,
      name: user.name,
      photoUrl: createProviderPhoto(user.name),
      bio: payload.bio,
      specialties: payload.specialties,
      ratingAverage: 0,
      completedServices: 0,
      isSuspended: false,
    };
    store.providers = [
      provider,
      ...store.providers.filter((item) => item.id !== provider.id),
    ];
    const storedUser = store.users.find((item) => item.id === user.id);
    if (storedUser) {
      storedUser.role = UserRole.PROVIDER;
      storedUser.providerId = provider.id;
      storedUser.isProvider = true;
      storedUser.specialties = payload.specialties;
      storedUser.bio = payload.bio;
    }
    writeStore(store);
    return provider;
  },

  suspendProvider(providerId: string) {
    const store = readStore();
    const provider = store.providers.find((item) => item.id === providerId);
    if (!provider) {
      throw new Error("Prestador não encontrado.");
    }
    provider.isSuspended = true;
    writeStore(store);
    return provider;
  },

  unsuspendProvider(providerId: string) {
    const store = readStore();
    const provider = store.providers.find((item) => item.id === providerId);
    if (!provider) {
      throw new Error("Prestador não encontrado.");
    }
    provider.isSuspended = false;
    writeStore(store);
    return provider;
  },

  deleteProvider(providerId: string) {
    const store = readStore();
    const hasLinkedOrder = store.orders.some(
      (order) => order.selectedProvider?.id === providerId,
    );
    if (hasLinkedOrder) {
      throw new Error(
        "Não é possível excluir prestador vinculado a ordens. Suspenda o perfil para bloquear novas ações.",
      );
    }
    store.providers = store.providers.filter((item) => item.id !== providerId);
    store.users = store.users.map((user) =>
      user.providerId === providerId
        ? {
            ...user,
            role: UserRole.CLIENT,
            providerId: undefined,
            isProvider: false,
            specialties: [],
            bio: undefined,
          }
        : user,
    );
    writeStore(store);
  },

  listOrders(source: "client" | "provider" | "admin") {
    const store = readStore();
    const user = getSessionUser(store);
    if (source === "admin") {
      return store.orders;
    }
    if (source === "provider") {
      const providerId = user?.providerId;
      const provider = store.providers.find((item) => item.id === providerId);
      const specialtyIds = provider?.specialties.map((specialty) => specialty.id) ?? [];
      return store.orders.filter((order) => {
        const isMine =
          order.selectedProvider?.id === providerId ||
          order.applications?.some((application) => application.provider.id === providerId);
        const isAvailable =
          [
            OrderStatus.CREATED,
            OrderStatus.AWAITING_CANDIDATES,
            OrderStatus.AWAITING_SELECTION,
          ].includes(order.status) &&
          !order.selectedProvider &&
          specialtyIds.includes(order.specialty.id) &&
          !order.applications?.some(
            (application) =>
              application.provider.id === providerId &&
              ["REJECTED", "CANCELLED"].includes(application.status),
          );
        return isMine || isAvailable;
      });
    }
    return user ? store.orders : [];
  },

  getOrderById(orderId: string) {
    return ensureOrder(readStore(), orderId);
  },

  createOrder(input: CreateOrderInput) {
    const store = readStore();
    const user = getSessionUser(store);
    if (!user) {
      throw new Error("Sessão expirada.");
    }
    const address = store.addressesByUserId[user.id]?.find(
      (item) => item.id === input.addressId,
    );
    const specialty = store.specialties.find((item) => item.id === input.specialtyId);
    if (!address || !specialty) {
      throw new Error("Endereço ou especialidade inválidos.");
    }
    const order = createSeedOrder({
      id: createId("order"),
      title: input.title,
      description: input.description,
      status: OrderStatus.AWAITING_CANDIDATES,
      specialty,
      address,
      preferredDate: new Date(input.preferredDate).toISOString(),
      createdAt: now(),
      updatedAt: now(),
    });
    store.orders.unshift(order);
    writeStore(store);
    return order;
  },

  getApplications(orderId: string) {
    return ensureOrder(readStore(), orderId).applications ?? [];
  },

  applyForOrder(orderId: string) {
    const store = readStore();
    const provider = ensureProvider(store);
    const order = ensureOrder(store, orderId);
    if (order.selectedProvider) {
      throw new Error("Esta ordem já possui prestador selecionado.");
    }
    if (order.applications?.some((item) => item.provider.id === provider.id)) {
      throw new Error("Você já se candidatou a esta ordem.");
    }
    const application: Application = {
      id: createId("app"),
      orderId,
      provider,
      status: "PENDING",
      appliedAt: now(),
    };
    order.applications = [...(order.applications ?? []), application];
    order.status = OrderStatus.AWAITING_SELECTION;
    addHistory(order, "Candidatura recebida", `${provider.name} enviou candidatura.`);
    writeStore(store);
    return application;
  },

  acceptApplication(applicationId: string) {
    const store = readStore();
    const order = store.orders.find((item) =>
      item.applications?.some((application) => application.id === applicationId),
    );
    if (!order) {
      throw new Error("Candidatura não encontrada.");
    }
    const application = order.applications?.find((item) => item.id === applicationId);
    if (!application) {
      throw new Error("Candidatura não encontrada.");
    }
    application.status = "ACCEPTED";
    application.respondedAt = now();
    order.selectedProvider = application.provider;
    order.status = OrderStatus.PROVIDER_SELECTED;
    order.applications = order.applications?.map((item) =>
      item.id === applicationId
        ? application
        : item.status === "PENDING"
          ? { ...item, status: "REJECTED" as const, respondedAt: now() }
          : item,
    );
    addHistory(order, "Prestador selecionado", `${application.provider.name} foi selecionado.`);
    writeStore(store);
    return application;
  },

  rejectApplication(applicationId: string) {
    const store = readStore();
    const order = store.orders.find((item) =>
      item.applications?.some((application) => application.id === applicationId),
    );
    const application = order?.applications?.find((item) => item.id === applicationId);
    if (!order || !application) {
      throw new Error("Candidatura não encontrada.");
    }
    application.status = "REJECTED";
    application.respondedAt = now();
    if (!order.applications?.some((item) => item.status === "PENDING")) {
      order.status = OrderStatus.AWAITING_CANDIDATES;
    }
    addHistory(order, "Candidatura recusada", `${application.provider.name} foi recusado.`, "CLIENT");
    writeStore(store);
    return application;
  },

  cancelApplication(applicationId: string) {
    const store = readStore();
    const order = store.orders.find((item) =>
      item.applications?.some((application) => application.id === applicationId),
    );
    const application = order?.applications?.find((item) => item.id === applicationId);
    if (!order || !application) {
      throw new Error("Candidatura não encontrada.");
    }
    application.status = "CANCELLED";
    application.respondedAt = now();
    addHistory(order, "Candidatura cancelada", `${application.provider.name} cancelou a candidatura.`, "PROVIDER");
    writeStore(store);
    return application;
  },

  scheduleOrder(orderId: string, scheduledAtValue: string) {
    const store = readStore();
    const order = ensureOrder(store, orderId);
    order.scheduledAt = new Date(scheduledAtValue).toISOString();
    order.status = OrderStatus.SCHEDULED;
    addHistory(order, "Agendada", "Cliente confirmou data e horário.");
    writeStore(store);
    return order;
  },

  startOrder(orderId: string) {
    const store = readStore();
    const order = ensureOrder(store, orderId);
    order.startedAt = now();
    order.status = OrderStatus.IN_PROGRESS;
    addHistory(order, "Atendimento iniciado", "Prestador iniciou o atendimento.", "PROVIDER");
    writeStore(store);
    return order;
  },

  finishOrder(orderId: string) {
    const store = readStore();
    const order = ensureOrder(store, orderId);
    order.finishedAt = now();
    order.status = OrderStatus.AWAITING_CONFIRMATION;
    addHistory(order, "Aguardando confirmação", "Prestador sinalizou a conclusão.", "PROVIDER");
    writeStore(store);
    return order;
  },

  confirmOrder(orderId: string) {
    const store = readStore();
    const order = ensureOrder(store, orderId);
    order.status = OrderStatus.FINISHED;
    order.payment = {
      id: createId("pay"),
      status: "APPROVED",
      amount: 180,
      createdAt: now(),
      processedAt: now(),
    };
    addHistory(order, "Finalizada", "Cliente confirmou a conclusão e o pagamento mock foi aprovado.", "CLIENT");
    writeStore(store);
    return order;
  },

  createReview(orderId: string, review: { rating: number; comment?: string }) {
    const store = readStore();
    const order = ensureOrder(store, orderId);
    const orderReview: OrderReview = {
      rating: review.rating,
      comment: review.comment,
      reviewedAt: now(),
    };
    order.review = orderReview;
    if (order.selectedProvider) {
      const provider = store.providers.find((item) => item.id === order.selectedProvider?.id);
      if (provider) {
        provider.completedServices += 1;
        provider.ratingAverage = Number(
          ((provider.ratingAverage + review.rating) / 2).toFixed(1),
        );
      }
    }
    writeStore(store);
    return orderReview;
  },

  cancelOrder(orderId: string, reason = "Cancelamento solicitado.") {
    const store = readStore();
    const order = ensureOrder(store, orderId);
    order.status = OrderStatus.CANCELLED;
    addHistory(order, "Cancelada", reason);
    writeStore(store);
    return order;
  },

  expireOrder(orderId: string, reason = "Expiração administrativa.") {
    const store = readStore();
    const order = ensureOrder(store, orderId);
    order.status = OrderStatus.EXPIRED;
    addHistory(order, "Expirada", reason, "ADMIN");
    writeStore(store);
    return order;
  },
};
