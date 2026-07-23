import 'package:flutter_riverpod/flutter_riverpod.dart';

class SelectedReelNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void setId(String? id) {
    state = id;
  }
}

final selectedReelIdProvider = NotifierProvider<SelectedReelNotifier, String?>(() => SelectedReelNotifier());
