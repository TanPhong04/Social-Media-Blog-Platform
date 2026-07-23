import 'package:flutter_riverpod/flutter_riverpod.dart';

class MainNavNotifier extends Notifier<int> {
  @override
  int build() => 0;

  void setIndex(int index) {
    state = index;
  }
}

final mainNavProvider = NotifierProvider<MainNavNotifier, int>(() => MainNavNotifier());
