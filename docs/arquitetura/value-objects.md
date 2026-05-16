# Value Objects (VO)

## Objetivo dos Value Objects

Value Objects são objetos que não possuem identidade própria e são definidos exclusivamente por seus atributos. No sistema **Mãos à Obra**, o uso de VOs visa:

- **Encapsulamento Semântico:** Agrupar dados relacionados que formam um conceito único.
- **Imutabilidade:** Garantir que o estado de um VO nunca mude após a criação, reduzindo efeitos colaterais.
- **Regras de Domínio:** Centralizar validações e comportamentos específicos (ex: soma de valores monetários) dentro do próprio objeto.
- **Linguagem Ubíqua:** Refletir conceitos reais do negócio diretamente no código.
- **Previsibilidade para IA:** Facilitar a geração de código consistente ao utilizar tipos especializados em vez de primitivos.
- **Redução de Lógica Espalhada:** Evitar que validações como "data inicial < data final" se repitam em múltiplos services.

---

## Value Objects Oficiais do Sistema

### Money

Representa valores monetários, preços estimados e pagamentos.

- **Regras:**
    - Utilizar obrigatoriamente `Decimal`.
    - Proibir terminantemente o uso de `float` para representação financeira.
    - Precisão fixa (ex: 2 casas decimais).
    - Rounding explícito definido pelo domínio.
    - Imutabilidade total.

### DateRange

Representa intervalos operacionais, agenda, execução e disponibilidade.

- **Regras:**
    - Uso obrigatório de UTC.
    - Todos os objetos `datetime` devem ser *timezone-aware*.
    - Implementar detecção de sobreposição (*overlap detection*).
    - Validação automática (data final deve ser posterior à inicial).

### GeoCoordinates

Representa a localização operacional para matching geográfico futuro.

- **Regras:**
    - Validação de ranges válidos (latitude/longitude).
    - Serialização estável para armazenamento e comparação.
    - Imutabilidade.

### AuditMetadata

Representa a rastreabilidade e auditoria de eventos e mudanças no sistema.

- **Regras:**
    - `actor_id`: Identificador do usuário que realizou a ação.
    - `timestamp`: Registro temporal em UTC.
    - `source`: Origem da ação (ex: "api", "system", "worker").
    - `correlation_id`: ID para rastreio de fluxos complexos.

---

# Regras Arquiteturais Obrigatórias

- **Localização:** Value Objects pertencem exclusivamente à camada **Domain**.
- **Uso em Services:** Services devem preferir receber e retornar VOs em vez de primitivos.
- **Integração com Entities:** Entidades (Models/Domain objects) podem conter VOs como atributos.
- **Persistência:** Repositories são responsáveis por serializar VOs para o banco e deserializá-los ao recuperar dados.
- **Isolamento de API:** A camada API nunca deve implementar regras semânticas de VOs (ex: não validar se uma data é maior que outra no endpoint).
- **Desacoplamento Técnico:**
    - VOs não podem depender de FastAPI ou qualquer framework web.
    - VOs não podem acessar o banco de dados.
    - VOs não podem conhecer ou utilizar Repositories.
- **Igualdade Semântica:** Dois VOs são considerados iguais se todos os seus atributos forem idênticos.
