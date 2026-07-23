import 'package:flutter_test/flutter_test.dart';

import 'package:axion_app/main.dart';

void main() {
  testWidgets('App renders without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const AxionApp());
    expect(find.byType(AxionApp), findsOneWidget);
  });
}
