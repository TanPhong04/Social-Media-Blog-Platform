import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/secure_storage_service.dart';

void main() {
  final storageService = SecureStorageService();
  final apiService = ApiService(storageService);
  final authService = AuthService(apiService, storageService);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(authService, storageService)),
      ],
      child: const SocialBlogApp(),
    ),
  );
}

class SocialBlogApp extends StatefulWidget {
  const SocialBlogApp({Key? key}) : super(key: key);

  @override
  State<SocialBlogApp> createState() => _SocialBlogAppState();
}

class _SocialBlogAppState extends State<SocialBlogApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = GoRouter(
      initialLocation: '/login',
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/home',
          builder: (context, state) => const HomeScreen(),
        ),
      ],
      redirect: (context, state) {
        final authProvider = context.read<AuthProvider>();
        final isAuth = authProvider.isAuthenticated;
        final isGoingToLogin = state.matchedLocation == '/login' || state.matchedLocation == '/register';

        if (authProvider.isLoading) return null;

        if (!isAuth && !isGoingToLogin) return '/login';
        if (isAuth && isGoingToLogin) return '/home';

        return null;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (auth.isLoading) {
          return const MaterialApp(
            home: Scaffold(
              body: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        return MaterialApp.router(
          title: 'Social Blog',
          theme: AppTheme.darkTheme,
          routerConfig: _router,
          debugShowCheckedModeBanner: false,
        );
      },
    );
  }
}
