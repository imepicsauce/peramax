import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:peramax/ledger.dart';
import 'package:peramax/main.dart';
import 'package:peramax/repository.dart';

class MemoryRepository implements LedgerRepository {
  Ledger ledger = const Ledger();
  bool fail = false;
  @override
  Future<Ledger> load() async => ledger;
  @override
  Future<void> save(Ledger next) async {
    if (fail) throw StateError('disk unavailable');
    ledger = next;
  }
}

void main() {
  testWidgets('expense validates, persists, edits and reports totals', (
    tester,
  ) async {
    final repository = MemoryRepository();
    await tester.pumpWidget(PeramaxApp(repository: repository));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add expense'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Save expense'));
    await tester.pumpAndSettle();
    expect(
      find.text('Use an amount with up to two decimal places.'),
      findsOneWidget,
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Amount'),
      '123.45',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Note (optional)'),
      'Lunch',
    );
    await tester.tap(find.text('Save expense'));
    await tester.pumpAndSettle();
    expect(repository.ledger.expenses.single.amount, 12345);
    await tester.tap(find.text('Activity'));
    await tester.pumpAndSettle();
    expect(find.text('Lunch'), findsOneWidget);
    await tester.ensureVisible(find.text('Lunch'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Lunch'));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextFormField, 'Amount'), '95');
    await tester.tap(find.text('Save expense'));
    await tester.pumpAndSettle();
    expect(repository.ledger.expenses.single.amount, 9500);
    await tester.pumpWidget(const SizedBox());
  });
  testWidgets('failed save keeps the draft available to retry', (tester) async {
    final repository = MemoryRepository()..fail = true;
    await tester.pumpWidget(PeramaxApp(repository: repository));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add expense'));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextFormField, 'Amount'), '50');
    await tester.tap(find.text('Save expense'));
    await tester.pumpAndSettle();
    expect(
      find.text(
        'Could not save. Your entries are still here. Please try again.',
      ),
      findsOneWidget,
    );
    expect(find.text('50'), findsOneWidget);
    repository.fail = false;
    await tester.tap(find.text('Save expense'));
    await tester.pumpAndSettle();
    expect(repository.ledger.expenses.single.amount, 5000);
    await tester.pumpWidget(const SizedBox());
  });
  testWidgets('compact and wide layouts work with large text', (tester) async {
    for (final width in [360.0, 1280.0]) {
      tester.view.physicalSize = Size(width, 900);
      tester.view.devicePixelRatio = 1;
      await tester.pumpWidget(PeramaxApp(repository: MemoryRepository()));
      await tester.pumpAndSettle();
      final element = tester.element(find.byType(LedgerScreen));
      final data = MediaQuery.of(element);
      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: data.copyWith(textScaler: TextScaler.linear(1.3)),
            child: LedgerScreen(repository: MemoryRepository()),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(
        find.byType(NavigationRail),
        width >= 840 ? findsOneWidget : findsNothing,
      );
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    }
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}
