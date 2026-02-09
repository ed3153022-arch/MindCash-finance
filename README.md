# MindCash Finance

MindCash Finance é um SaaS de controle financeiro pessoal com foco em **consciência financeira, veredito mensal e tomada de decisão**.

O sistema funciona com um **período de uso gratuito de 7 dias**, sem necessidade de cadastro inicial, e após esse período exige **cadastro + pagamento** para continuar utilizando.

---

## 🔁 Fluxo do Usuário

### 1. Entrada pelo Quiz
- O usuário entra no sistema através de um **quiz externo** (link diferente do SaaS).
- Ao final do quiz, ele recebe um **resultado imediato** indicando se controla ou não o próprio dinheiro.
- Após concluir o quiz uma vez, ele **não verá mais o quiz** nas próximas visitas.

### 2. Uso Gratuito (7 dias)
- Durante os primeiros 7 dias:
  - Pode registrar **gastos**
  - Pode registrar **ganhos**
  - Pode visualizar dados normalmente
- Não é necessário cadastro nesse período.
- Os dados ficam salvos localmente/temporariamente para migração posterior.

### 3. Avisos e Notificações
- O usuário recebe notificações avisando:
  - Faltam 2 dias
  - Falta 1 dia
  - Último dia de uso gratuito

### 4. Bloqueio após 7 dias
Após o fim do período gratuito:
- O usuário **não consegue mais**:
  - Registrar gastos
  - Registrar ganhos
  - Visualizar o veredito mensal completo
- Para continuar usando, é obrigatório:
  - ✅ Fazer cadastro
  - ✅ Efetuar o pagamento
- Apenas **cadastro ou pagamento isolado não libera o sistema**.

### 5. Migração Automática
- Após cadastro + pagamento:
  - Todos os dados dos 7 dias são **migrados automaticamente**
  - O acesso completo é liberado sem perda de informações

---

## 💰 Plano e Pagamento

- Modelo: **plano único**
- Pagamento processado via **Kiwify**
- Liberação do acesso ocorre somente após:
  - Confirmação de pagamento
  - Conta criada no sistema

---

## 📊 Veredito Mensal

- O veredito financeiro é:
  - Gerado com base no **primeiro registro do usuário**
  - Exibido automaticamente no último dia do mês
- Não depende de clique manual para aparecer

---

## 🧠 Tecnologias

- Next.js (App Router)
- Frontend focado em UX simples e direta
- Arquitetura pensada para SaaS e escalabilidade

---

## 🚀 Rodando o projeto localmente

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
