import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/core/config.dart';

void main() {
  test('AppConfig returns correct base URL based on environment variables', () {
    // Note: To test the actual String.fromEnvironment switching in a test, 
    // it usually requires passing --dart-define to the test runner.
    // By default without defines, it should fallback to local.
    
    // Testing default behavior
    expect(AppConfig.apiBaseUrl, 'http://localhost:8080/api/v1');
  });
}
