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
- PostgreSQL (opcional, pode usar armazenamento em memória)

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

## Gerando APK para Android (Guia Completo)

O HLG Fitness está configurado para funcionar como um aplicativo Android nativo através do [Capacitor](https://capacitorjs.com/), permitindo o uso offline e acesso a recursos nativos como download de PDFs e armazenamento de arquivos.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v16 ou superior)
- [Android Studio](https://developer.android.com/studio) instalado e configurado
- JDK 11 ou superior
- Dispositivo Android ou emulador para testes

### Passo 1: Instalação de Dependências

Instalação das ferramentas e plugins necessários do Capacitor:

```bash
# Instale ferramentas principais do Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Instale plugins necessários para recursos nativos
npm install @capacitor/filesystem @capacitor/share @capacitor/app
npm install @capacitor/camera @capacitor/storage @capacitor/file-opener
```

### Passo 2: Constru o Código para Produção

Gere a versão otimizada do aplicativo pronta para conversão em APK:

```bash
# Construir versão de produção do aplicativo
npm run build
```

### Passo 3: Configure o Capacitor

O arquivo `capacitor.config.ts` já está configurado na raiz do projeto com todas as permissões e configurações necessárias:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hlgfitness.app',
  appName: 'HLG Fitness',
  webDir: 'client/dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true // Permitir conexões HTTP para debugging
  },
  plugins: {
    // Configurações para permitir download e visualização de PDF
    CapacitorFileSystem: {
      readWritePermission: true
    },
    // Configurações para compartilhamento de arquivos
    CapacitorShare: {
      shareViaWhatsApp: true,
      shareViaEmail: true
    },
    // Permissão para usar a câmera (fotos de produtos)
    CapacitorCamera: {
      androidPermissions: true
    },
    // Permissões de armazenamento
    CapacitorStorage: {
      androidPermissions: true
    },
    // Permissões de download
    CapacitorFileOpener: {
      androidPermissions: true
    }
  },
  android: {
    // Configurações específicas para Android
    buildOptions: {
      keystorePath: undefined, // Adicione o caminho para o keystore se tiver uma chave de assinatura
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK' // ou 'AAB' para Android App Bundle
    },
    // Permissões específicas do Android
    permissions: [
      "android.permission.INTERNET",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.CAMERA",
      "android.permission.DOWNLOAD_WITHOUT_NOTIFICATION",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.ACCESS_DOWNLOAD_MANAGER"
    ]
  }
};

export default config;
```

### Passo 4: Crie o Projeto Android

```bash
# Adicionar a plataforma Android ao projeto
npx cap add android

# Sincronizar os arquivos do aplicativo web com o projeto Android
npx cap sync android
```

### Passo 5: Configuração Adicional do Android

Abra o projeto no Android Studio para configurações finais:

```bash
npx cap open android
```

No Android Studio, você precisará configurar:

1. **Manifesto Android**:
   - Abra o arquivo `android/app/src/main/AndroidManifest.xml` e certifique-se de que as permissões necessárias estão presentes.
   - Adicione o atributo `android:usesCleartextTraffic="true"` à tag `<application>` para permitir conexões HTTP.

2. **FileProvider para PDFs**:
   - Crie o arquivo XML necessário para configurar os caminhos de acesso aos arquivos:
   
   Crie o diretório: `android/app/src/main/res/xml/` caso não exista
   
   Crie o arquivo `file_paths.xml` com o seguinte conteúdo:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <paths>
       <external-path name="external_files" path="." />
       <cache-path name="cache" path="." />
       <files-path name="files" path="." />
       <root-path name="root" path="." />
       <external-files-path name="external_files_path" path="." />
       <external-cache-path name="external_cache_path" path="." />
   </paths>
   ```

3. **Configurações de Build**:
   - Em `android/app/build.gradle`, atualize:
     - `minSdkVersion` para 23 (Android 6.0) ou superior
     - `compileSdkVersion` para 33 ou superior
     - `targetSdkVersion` para 33 ou superior

### Passo 6: Personalização do Aplicativo

Antes de gerar o APK final:

1. **Ícones do Aplicativo**:
   - Substitua os ícones em `android/app/src/main/res/mipmap-*` com os ícones do HLG Fitness
   - Você pode usar o [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) para gerar os ícones

2. **Tela de Splash**:
   - Personalize a tela de splash em `android/app/src/main/res/drawable/splash.png`

3. **Nome do Aplicativo**:
   - O nome "HLG Fitness" está configurado em `capacitor.config.ts`
   - Verifique se está corretamente refletido em `android/app/src/main/res/values/strings.xml`

### Passo 7: Gerando o APK

No Android Studio:

1. Selecione **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Aguarde a compilação ser concluída
3. Clique em "Locate" para encontrar o arquivo APK gerado
4. O APK estará em `android/app/build/outputs/apk/debug/app-debug.apk`

### Passo 8: Assinando o APK para Distribuição

Para publicação na Google Play Store ou distribuição externa, você precisa assinar o APK:

1. **Crie um keystore**:
   ```bash
   keytool -genkey -v -keystore hlg-fitness-key.keystore -alias hlg-fitness-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure o keystore**:
   - Edite `android/app/build.gradle` para incluir as informações de assinatura
   - Ou use o Android Studio: **Build > Generate Signed Bundle/APK**

3. **Gere o APK assinado**:
   - No Android Studio: **Build > Generate Signed Bundle/APK**
   - Escolha APK
   - Preencha os dados do keystore
   - Escolha a variante de release
   - Clique em "Finish"

### Passo 9: Testando o APK

1. **Instale o APK em um dispositivo Android físico**:
   - Transferira o arquivo APK para o dispositivo
   - No dispositivo, abra o explorador de arquivos, localize o APK e toque para instalar
   - Pode ser necessário permitir a instalação de fontes desconhecidas nas configurações

2. **Teste todas as funcionalidades críticas**:
   - Login e registro
   - Navegação entre telas
   - Cadastro e edição de produtos
   - Geração e download de PDFs
   - Registro de vendas
   - Upload de imagens

### Recursos Especiais no Modo Android

O aplicativo possui adaptações especiais quando executado como APK Android:

1. **Detecção de Ambiente**:
   - Identifica automaticamente se está rodando como aplicativo nativo ou como web
   
2. **Gerenciamento de PDFs**:
   - Utiliza APIs nativas para salvar e visualizar PDFs no armazenamento do dispositivo
   - Fornece melhor experiência de usuário para relatórios em dispositivos móveis

3. **Acesso Offline**:
   - Permite acesso mesmo sem conexão com a internet para funções básicas

4. **Interface Otimizada**:
   - Botões e elementos de interface maiores para uso em telas touchscreen
   - Layout adaptado para melhor experiência em dispositivos móveis

### Solução de Problemas

**Problema de Permissões de Armazenamento**:
- Se o aplicativo não conseguir salvar PDFs, verifique se as permissões de armazenamento foram concedidas nas configurações do Android.

**Erro de Conexão**:
- Para ambiente de desenvolvimento, certifique-se de que o dispositivo Android e o computador estão na mesma rede.
- Configure a URL do servidor em capacitor.config.ts para apontar para o IP do seu computador.

**PDFs Não Abrem**:
- Verifique se há um aplicativo PDF instalado no dispositivo.
- Tente instalar o Adobe Reader ou outro visualizador PDF.

## Banco de Dados

O arquivo `hlg_fitness_database.sql` contém todo o schema do banco de dados, incluindo:
- Todas as tabelas e suas relações
- Funções e triggers para gestão automática de estoque
- Dados iniciais para testes

Para importar o banco de dados:
```
psql -d seu_banco -f hlg_fitness_database.sql
```

## Suporte

Em caso de dúvidas ou problemas, entre em contato com o suporte técnico.