import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:frontend/providers/auth_provider.dart';
import 'package:frontend/services/auth_service.dart';
import 'package:frontend/services/secure_storage_service.dart';
import 'package:frontend/models/user.dart';
import 'package:frontend/models/auth_tokens.dart';

class MockAuthService extends Mock implements AuthService {}
class MockSecureStorageService extends Mock implements SecureStorageService {}

void main() {
  late MockAuthService mockAuthService;
  late MockSecureStorageService mockSecureStorageService;

  setUp(() {
    mockAuthService = MockAuthService();
    mockSecureStorageService = MockSecureStorageService();
  });

  test('AuthProvider initializes correctly when not logged in', () async {
    when(() => mockSecureStorageService.getAccessToken()).thenAnswer((_) async => null);

    final provider = AuthProvider(mockAuthService, mockSecureStorageService);
    
    // allow microtasks to finish since _init is async inside constructor
    await Future.delayed(Duration.zero); 

    expect(provider.isAuthenticated, false);
    expect(provider.isLoading, false);
    expect(provider.currentUser, null);
  });

  test('AuthProvider initializes correctly when logged in', () async {
    when(() => mockSecureStorageService.getAccessToken()).thenAnswer((_) async => 'fake_token');
    when(() => mockAuthService.getMyProfile()).thenAnswer((_) async => User(
      id: '1',
      email: 'test@test.com',
      displayName: 'Test User',
    ));

    final provider = AuthProvider(mockAuthService, mockSecureStorageService);
    
    await Future.delayed(Duration.zero); 

    expect(provider.isAuthenticated, true);
    expect(provider.isLoading, false);
    expect(provider.currentUser?.email, 'test@test.com');
  });

  test('login updates state properly', () async {
    when(() => mockSecureStorageService.getAccessToken()).thenAnswer((_) async => null);
    when(() => mockAuthService.login('test@test.com', 'password')).thenAnswer((_) async => AuthTokens(
      accessToken: 'access',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
    ));
    when(() => mockAuthService.getMyProfile()).thenAnswer((_) async => User(
      id: '1',
      email: 'test@test.com',
      displayName: 'Test User',
    ));

    final provider = AuthProvider(mockAuthService, mockSecureStorageService);
    await Future.delayed(Duration.zero); 

    expect(provider.isAuthenticated, false);

    final loginFuture = provider.login('test@test.com', 'password');
    expect(provider.isLoading, true); // Loading should be true while login is in progress

    await loginFuture;

    expect(provider.isLoading, false);
    expect(provider.isAuthenticated, true);
    expect(provider.currentUser?.displayName, 'Test User');
  });
}
