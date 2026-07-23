import 'package:flutter_riverpod/flutter_riverpod.dart';

class ActiveVideoNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void setActive(String url) {
    state = url;
  }

  void clear() {
    state = null;
  }
}

final activeVideoProvider = NotifierProvider<ActiveVideoNotifier, String?>(() => ActiveVideoNotifier());
