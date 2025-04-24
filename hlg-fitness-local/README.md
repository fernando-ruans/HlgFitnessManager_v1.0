# HLG Fitness - Sistema de Gerenciamento

Sistema de gerenciamento completo para a loja HLG Fitness, com interface responsiva e adaptada para dispositivos móveis.

## Funcionalidades

- 📱 Interface responsiva e adaptada para dispositivos móveis
- 👤 Gerenciamento de usuários com autenticação segura
- 📦 Controle de produtos e estoque 
- 👥 Cadastro e gestão de clientes
- 💰 Registro e acompanhamento de vendas
- 📊 Relatórios em PDF com dados de vendas e estoque
- 🔔 Alertas de estoque baixo
- 📁 Suporte para upload de imagens

## Requisitos do Sistema

- Node.js (versão 16 ou superior)
- NPM ou Yarn

## Instalação e Execução

### Método Rápido (Windows)

1. Execute o arquivo `start-windows.bat` para iniciar a aplicação em modo de desenvolvimento

### Para Desenvolvedores (Windows PowerShell)

1. Execute o script PowerShell `dev.ps1` para iniciar o ambiente de desenvolvimento

### Versão de Produção (Windows)

1. Execute o arquivo `build-and-run.bat` para construir e iniciar a aplicação em modo de produção

### Método Manual (Qualquer Sistema Operacional)

1. Instale as dependências:
   ```
   npm install
   ```

2. Configure o ambiente:
   - Copie o arquivo `.env.example` para `.env` e ajuste as configurações conforme necessário
   - Para usar o banco de dados local, você precisa ter o PostgreSQL instalado e configurado

3. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

4. Para construir a versão de produção:
   ```
   npm run build
   ```

5. Para executar a versão de produção após a construção:
   ```
   npm start
   ```

## Estrutura do Projeto

- `/client` - Interface de usuário (Frontend React)
- `/server` - Servidor e API (Backend Express)
- `/shared` - Código compartilhado entre frontend e backend
- `/uploads` - Diretório para armazenamento de imagens enviadas

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Autenticação**: Passport.js com sessão
- **Ferramentas**: Vite, TanStack Query, React Hook Form

## Acessando a Aplicação

Após iniciar o servidor, acesse a aplicação em:

```
http://localhost:5000
```

## Credenciais de Teste

- **Usuário**: admin
- **Senha**: senha123

## Suporte

Em caso de dúvidas ou problemas, entre em contato com o suporte técnico.