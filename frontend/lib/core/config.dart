class AppConfig {
  static const String environment = String.fromEnvironment('ENV', defaultValue: 'prod');
  
  static String get apiBaseUrl {
    const overrideUrl = String.fromEnvironment('API_BASE_URL');
    if (overrideUrl.isNotEmpty) return overrideUrl;
    
    switch (environment) {
      case 'prod':
        return 'https://axion.id.vn/api/v1';
      case 'staging':
        return 'https://axion.id.vn/api/v1';
      case 'local':
      default:
        // Lưu ý: Nếu chạy máy ảo Android (Emulator) thì đổi localhost thành 10.0.2.2
        return 'http://localhost:8080/api/v1';
    }
  }
}
