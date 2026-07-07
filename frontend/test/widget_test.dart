import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:frontend/main.dart';
import 'package:frontend/providers/auth_provider.dart';
import 'package:frontend/providers/article_provider.dart';
import 'package:frontend/services/auth_service.dart';
import 'package:frontend/services/api_service.dart';
import 'package:frontend/services/secure_storage_service.dart';
import 'package:frontend/services/article_service.dart';
import 'package:mocktail/mocktail.dart';

class MockSecureStorageService extends Mock implements SecureStorageService {}
class MockApiService extends Mock implements ApiService {}

void main() {
  testWidgets('App loads cleanly', (WidgetTester tester) async {
    final storageService = MockSecureStorageService();
    when(() => storageService.getAccessToken()).thenAnswer((_) async => null);
    
    final apiService = MockApiService();
    final authService = AuthService(apiService, storageService);
    final articleService = ArticleService(apiService);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider.value(value: articleService),
          ChangeNotifierProvider(create: (_) => AuthProvider(authService, storageService)),
          ChangeNotifierProvider(create: (_) => ArticleProvider(articleService)),
        ],
        child: const SocialBlogApp(),
      ),
    );

    await tester.pump();
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });
}
