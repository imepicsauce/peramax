import 'package:flutter_test/flutter_test.dart';
import 'package:peramax/ledger.dart';

void main() {
  test('amounts are exact centavos and reject invalid inputs', () {
    expect(parseAmount('123.45'), 12345);
    expect(parseAmount('0.01'), 1);
    expect(parseAmount('0', zero: true), 0);
    for (final input in [
      '0',
      '-1',
      '1.234',
      '1e3',
      '99,000',
      '100000000',
      '',
    ]) {
      expect(() => parseAmount(input), throwsFormatException);
    }
  });
  test('Manila date rolls over independently of device timezone', () {
    expect(
      dateKey(manilaToday(DateTime.parse('2026-11-14T16:00:00Z'))),
      '2026-11-15',
    );
    expect(() => readDate('2026-02-30'), throwsFormatException);
  });
  test('weeks start Monday and months handle leap years', () {
    final (start, end) = range(DateTime.utc(2026, 11, 15), Period.week);
    expect(dateKey(start), '2026-11-09');
    expect(dateKey(end), '2026-11-15');
    expect(range(DateTime.utc(2024, 2, 15), Period.month).$2.day, 29);
  });
  test('monthly allowance prorates a week across month boundaries', () {
    final ledger = Ledger(
      plan: const Plan(allowance: 310000, frequency: Period.month),
    );
    expect(
      ledger.weekAllowance(DateTime.utc(2026, 6, 29)),
      (310000 * (2 / 30 + 5 / 31)).round(),
    );
  });
  test('ledger round trips empty records and savings stay separate', () {
    final day = DateTime.utc(2026, 11, 14);
    final ledger = Ledger(
      expenses: [
        Expense(
          id: '1',
          amount: 1500,
          category: 'Pamasahe',
          payment: 'Cash',
          date: day,
          note: 'Jeep',
        ),
      ],
      savings: const Savings('Laptop', 100000, 50000, null),
    );
    final restored = Ledger.decode(ledger.encode());
    expect(restored.spent(day, Period.week), 1500);
    expect(restored.savings!.saved, 50000);
    expect(Ledger.decode(const Ledger().encode()).expenses, isEmpty);
    expect(() => Ledger.decode('{"version":2}'), throwsFormatException);
  });
}
