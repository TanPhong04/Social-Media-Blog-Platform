class AppConfig {
  static const String environment = String.fromEnvironment('ENV', defaultValue: 'local');
  
  static String get apiBaseUrl {
    switch (environment) {
      case 'prod':
        return const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://api.socialblog.com/v1');
      case 'staging':
        return const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://staging-api.socialblog.com/v1');
      case 'local':
      default:
        // By default use localhost:8080 (the gateway)
        return const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:8080/api/v1');
    }
  }
}
