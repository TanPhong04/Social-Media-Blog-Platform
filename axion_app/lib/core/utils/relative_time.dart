import 'dart:async';

const _vietnameseMonths = ['', 'Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
const _vietnameseMonthsFull = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

String formatFeedTimestamp(String createdAt) {
  try {
    final created = DateTime.parse(createdAt);
    final now = DateTime.now();
    final diff = now.difference(created);
    if (diff.inSeconds < 60) return 'Vừa xong';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    return '${created.day} ${_vietnameseMonths[created.month]}';
  } catch (_) {
    return 'Vừa xong';
  }
}

String formatFullTimestamp(String createdAt) {
  try {
    final created = DateTime.parse(createdAt);
    return '${created.day} ${_vietnameseMonthsFull[created.month]}, ${created.year}';
  } catch (_) {
    return '';
  }
}

String computeRelativeTime(String createdAt) {
  try {
    final created = DateTime.parse(createdAt);
    final now = DateTime.now();
    final diff = now.difference(created);
    if (diff.inSeconds < 60) return 'Vừa xong';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    return '${created.day} ${_vietnameseMonths[created.month]}';
  } catch (_) {
    return '';
  }
}

class RelativeTimeUpdater {
  String? _lastValue;
  Timer? _timer;

  void start(String createdAt, void Function(String) onUpdate) {
    _update(createdAt, onUpdate);
    _timer = Timer.periodic(const Duration(minutes: 1), (_) {
      _update(createdAt, onUpdate);
    });
  }

  void _update(String createdAt, void Function(String) onUpdate) {
    final result = formatFeedTimestamp(createdAt);
    if (result != _lastValue) {
      _lastValue = result;
      onUpdate(result);
    }
  }

  void cancel() {
    _timer?.cancel();
    _timer = null;
  }
}
