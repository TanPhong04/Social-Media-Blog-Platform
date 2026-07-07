class AppConfig {
  static const String environment = String.fromEnvironment('ENV', defaultValue: 'local');
  
  static String get apiBaseUrl {
    const overrideUrl = String.fromEnvironment('API_BASE_URL');
    if (overrideUrl.isNotEmpty) return overrideUrl;
    
    switch (environment) {
      case 'prod':
        return 'https://api.socialblog.com/v1';
      case 'staging':
        return 'https://staging-api.socialblog.com/v1';
      case 'local':
      default:
        return 'http://localhost:8080/api/v1';
    }
  }
}
