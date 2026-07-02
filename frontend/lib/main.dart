import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/article_provider.dart';
import 'screens/main_layout.dart';
import 'screens/feed_screen.dart';
import 'screens/my_articles_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/editor_screen.dart';
import 'screens/notification_screen.dart';
import 'screens/article_detail_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/article_service.dart';
import 'services/comment_service.dart';
import 'services/interaction_service.dart';
import 'services/follow_service.dart';
import 'services/notification_service.dart';
import 'services/secure_storage_service.dart';

void main() {
  final storageService = SecureStorageService();
  final apiService = ApiService(storageService);
  final authService = AuthService(apiService, storageService);
  final articleService = ArticleService(apiService);
  final commentService = CommentService(apiService);
  final interactionService = InteractionService(apiService);
  final followService = FollowService(apiService);
  final notificationService = NotificationService(apiService);

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: articleService),
        Provider.value(value: commentService),
        Provider.value(value: interactionService),
        Provider.value(value: followService),
        Provider.value(value: notificationService),
        ChangeNotifierProvider(create: (_) => AuthProvider(authService, storageService)),
        ChangeNotifierProvider(create: (_) => ArticleProvider(articleService)),
      ],
      child: const SocialBlogApp(),
    ),
  );
}

class SocialBlogApp extends StatefulWidget {
  const SocialBlogApp({super.key});

  @override
  State<SocialBlogApp> createState() => _SocialBlogAppState();
}

class _SocialBlogAppState extends State<SocialBlogApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = GoRouter(
      initialLocation: '/home/feed',
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),
        ShellRoute(
          builder: (context, state, child) => MainLayout(child: child),
          routes: [
            GoRoute(
              path: '/home/feed',
              builder: (context, state) => const FeedScreen(),
            ),
            GoRoute(
              path: '/home/mine',
              builder: (context, state) => const MyArticlesScreen(),
            ),
            GoRoute(
              path: '/home/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
        GoRoute(
          path: '/editor',
          builder: (context, state) => const EditorScreen(),
        ),
        GoRoute(
          path: '/article/:slug',
          builder: (context, state) => ArticleDetailScreen(slug: state.pathParameters['slug']!),
        ),
        GoRoute(
          path: '/notifications',
          builder: (context, state) => const NotificationScreen(),
        ),
      ],
      redirect: (context, state) {
        final authProvider = context.read<AuthProvider>();
        final isAuth = authProvider.isAuthenticated;
        final isGoingToLogin = state.matchedLocation == '/login' || state.matchedLocation == '/register';

        if (authProvider.isLoading) return null;

        if (!isAuth && !isGoingToLogin) return '/login';
        if (isAuth && isGoingToLogin) return '/home/feed';

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
