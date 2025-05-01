import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hlgfitness.app',
  appName: 'HLG Fitness',
  webDir: 'client/dist',
  bundledWebRuntime: false,
  server: {
 androidScheme: "http",
    // URL atualizada para o domínio correto
    url: "http://141.148.21.91:5000",
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
      // Opções de compilação personalizadas
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
  },
  // Permitir download direto no iOS
  ios: {
    contentInset: "always",
    allowsLinkPreview: true,
    scrollEnabled: true
  }
};

export default config;