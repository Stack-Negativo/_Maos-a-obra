# Política de Tipagem Estrita e Uso de Ignores

## Objetivo

Este documento define a política oficial do projeto **Mãos à Obra** para garantir a integridade do código através de tipagem estrita e o controle rigoroso sobre o uso de supressões de avisos do linter e verificador de tipos (`# type: ignore`, `# pyright: ignore`, `# noqa`).

---

# 1. Política Oficial de Ignores

O uso de diretivas de ignore é desencorajado e deve ser tratado como exceção técnica, nunca como solução para problemas de design ou preguiça de implementação.

## Ignores Permitidos

São permitidos SOMENTE em casos específicos e tecnicamente justificados:

- **SQLAlchemy ORM**:
    - Importações de modelos em arquivos de testes para registro de metadata e mappers.
    - Importações circulares dentro de `TYPE_CHECKING` quando o `BasedPyright` falha na inferência de relacionamentos.
    - Uso de `# noqa: F401` e `# pyright: ignore[reportUnusedImport]` nesses casos é aceitável.
- **Value Objects Frozen**:
    - Testes unitários que tentam modificar atributos de um VO imutável para validar o bloqueio do `dataclass(frozen=True)`.
- **Pydantic Settings**:
    - Limitações conhecidas de tipagem do Pydantic v2 em relação ao reconhecimento de atributos dinâmicos.
- **Incompatibilidades de Terceiros**:
    - Casos onde bibliotecas externas não possuem `py.typed` ou possuem definições de tipos comprovadamente incorretas e impossíveis de corrigir localmente.

### Requisitos para o uso de Ignore

Sempre que um ignore for utilizado, ele deve seguir estes critérios:
1. **Granularidade Mínima**: Use o código específico da regra (ex: `# pyright: ignore[reportUnusedImport]`).
2. **Justificativa Inline**: Deve haver um comentário explicando o motivo técnico da supressão.

---

## Ignores Proibidos

É terminantemente proibido o uso de supressões em pontos críticos do domínio e segurança:

- **Regras de Domínio**: Lógica central, State Machine e transições de status.
- **Segurança**: Autenticação, Autorização e Ownership checks.
- **Narrowing de Tipos**: Não ignore erros de `Optional`. Use guardas explícitos.
- **Retorno de Repositories**: Garantir que o Service trate `None` corretamente.
- **Regras Transacionais e Financeiras**: Cálculos e persistência de `Money` ou `DateRange`.

---

# 2. Narrowing Explícito (Guardas de Tipo)

O projeto exige o uso de guardas explícitos para resolver problemas de tipos opcionais ou uniões.

- **Proibido**: Usar `cast()` ou `assert` apenas para satisfazer o verificador de tipos.
- **Obrigatório**: Usar verificações condicionais que lançam exceções de domínio.

### Exemplo Correto

```python
# Incorreto: esconder o problema
# user = await repo.get_by_email(email) # type: ignore

# Correto: resolver semanticamente
if email is None:
    raise AuthenticationException("E-mail não fornecido.")

user = await repo.get_by_email(str(email))
```

---

# 3. Contratos de Repositories e Services

- **Repositories**: Devem declarar tipos de retorno explícitos (ex: `User | None`).
- **Services**: São responsáveis por tratar o caso `None` retornado pelos repositories, convertendo-o em exceções semânticas (ex: `NotFoundException`) ou executando lógica alternativa.
- **Services** nunca devem assumir que um objeto opcional está presente sem validá-lo primeiro.

---

# 4. SQLAlchemy Runtime Imports

Para garantir que o SQLAlchemy configure corretamente os mappers e relacionamentos durante a execução de testes ou inicialização do sistema, imports de modelos "não utilizados" são permitidos e devem ser marcados da seguinte forma:

```python
from models.user import User as _User  # noqa: F401 # pyright: ignore[reportUnusedImport]
```

---

# 5. Ferramentas de Validação

O projeto utiliza:
- **BasedPyright (Strict)**: Verificação estática rigorosa de tipos.
- **Ruff**: Linting e formatação seguindo regras modernas de Python.

Qualquer violação não justificada e não permitida nestas ferramentas impedirá o merge de código.
