import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:peramax/ledger.dart';
import 'package:peramax/main.dart';
import 'package:peramax/repository.dart';
import 'package:peramax/ui_motion.dart';

class DelayedRepository implements LedgerRepository {
  final result = Completer<Ledger>();
  @override
  Future<Ledger> load() => result.future;
  @override
  Future<void> save(Ledger ledger) async {}
}

Widget withMotionPreference(Widget child, {bool reduce = false}) => MaterialApp(
  home: MediaQuery(
    data: MediaQueryData(disableAnimations: reduce),
    child: child,
  ),
);

void main() {
  testWidgets('slow data shows a skeleton and resolves into usable content', (
    tester,
  ) async {
    final repository = DelayedRepository();
    await tester.pumpWidget(PeramaxApp(repository: repository));
    expect(find.byType(LedgerSkeleton), findsNothing);
    await tester.pump(const Duration(milliseconds: 200));
    expect(find.byType(LedgerSkeleton), findsOneWidget);
    expect(
      tester
          .widget<FloatingActionButton>(find.byType(FloatingActionButton))
          .onPressed,
      isNull,
    );
    await tester.pump(const Duration(milliseconds: 600));
    expect(tester.takeException(), isNull);
    repository.result.complete(const Ledger());
    await tester.pumpAndSettle();
    expect(find.byType(LedgerSkeleton), findsNothing);
    expect(find.text('Your money, at a glance'), findsOneWidget);
    expect(
      tester
          .widget<FloatingActionButton>(find.byType(FloatingActionButton))
          .onPressed,
      isNotNull,
    );
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('load failures replace the skeleton with recovery actions', (
    tester,
  ) async {
    final repository = DelayedRepository();
    await tester.pumpWidget(PeramaxApp(repository: repository));
    await tester.pump(const Duration(milliseconds: 200));
    repository.result.completeError(const FormatException('Invalid records'));
    await tester.pumpAndSettle();
    expect(find.byType(LedgerSkeleton), findsNothing);
    expect(find.text('Retry'), findsOneWidget);
    expect(
      tester
          .widget<FloatingActionButton>(find.byType(FloatingActionButton))
          .onPressed,
      isNull,
    );
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('rapid tab changes settle and preserve the activity search', (
    tester,
  ) async {
    final repository = DelayedRepository()..result.complete(const Ledger());
    await tester.pumpWidget(PeramaxApp(repository: repository));
    await tester.pumpAndSettle();
    for (final label in [
      'Activity',
      'Insights',
      'Savings',
      'Home',
      'Activity',
    ]) {
      await tester.tap(find.text(label).last);
      await tester.pump(const Duration(milliseconds: 70));
    }
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.enterText(
      find.widgetWithText(TextField, 'Search expenses'),
      'Cash',
    );
    await tester.tap(find.text('Home').last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Activity').last);
    await tester.pumpAndSettle();
    expect(find.text('Cash'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('menus stay inside their field at phone and desktop widths', (
    tester,
  ) async {
    for (final width in [360.0, 1280.0]) {
      tester.view.physicalSize = Size(width, 900);
      tester.view.devicePixelRatio = 1;
      String selected = 'Food';
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: AnchoredDropdown<String>(
                    label: 'Category',
                    value: selected,
                    values: categories,
                    labelFor: (value) => value,
                    onChanged: (value) => selected = value,
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      final field = find.byType(AnchoredDropdown<String>);
      final bounds = tester.getRect(field);
      await tester.tap(field);
      await tester.pumpAndSettle();
      final items = find.byType(MenuItemButton).hitTestable();
      expect(items, findsWidgets);
      for (final item in items.evaluate()) {
        final menuBounds = tester.getRect(find.byWidget(item.widget));
        expect(menuBounds.left, greaterThanOrEqualTo(bounds.left - 1));
        expect(menuBounds.right, lessThanOrEqualTo(bounds.right + 1));
      }
      await tester.tap(
        find.widgetWithText(MenuItemButton, 'Pamasahe').hitTestable(),
      );
      await tester.pumpAndSettle();
      expect(selected, 'Pamasahe');
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    }
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });

  testWidgets('reduced motion stops the skeleton pulse and page movement', (
    tester,
  ) async {
    await tester.pumpWidget(
      withMotionPreference(const LedgerSkeleton(screen: 0), reduce: true),
    );
    await tester.pumpAndSettle();
    final fade = tester.widget<FadeTransition>(
      find.byType(FadeTransition).last,
    );
    final opacity = fade.opacity.value;
    await tester.pump(const Duration(seconds: 2));
    expect(fade.opacity.value, opacity);
    expect(tester.binding.hasScheduledFrame, isFalse);
    await tester.pumpWidget(
      withMotionPreference(
        const PageMotion(child: SizedBox(key: ValueKey('a'))),
        reduce: true,
      ),
    );
    await tester.pumpWidget(
      withMotionPreference(
        const PageMotion(child: SizedBox(key: ValueKey('b'))),
        reduce: true,
      ),
    );
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<SlideTransition>(find.byType(SlideTransition).last)
          .position
          .value,
      Offset.zero,
    );
    await tester.pumpWidget(const SizedBox());
  });
}
