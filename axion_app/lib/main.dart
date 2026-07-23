import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/main_layout.dart';
import 'core/theme/theme_provider.dart';
import 'features/auth/presentation/providers/auth_provider.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/call/presentation/widgets/global_call_overlay.dart';

void main() {
  runApp(
    const ProviderScope(
      child: AxionApp(),
    ),
  );
}

class AxionApp extends ConsumerWidget {
  const AxionApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp(
      title: 'Axion',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      builder: (context, child) {
        return GlobalCallOverlay(
          child: child ?? const SizedBox.shrink(),
        );
      },
      home: authState.when(
        data: (user) {
          if (user != null) {
            return const MainLayout();
          }
          return const LoginScreen();
        },
        loading: () => const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
        error: (error, _) {
          return const LoginScreen();
        },
      ),
    );
  }
}
