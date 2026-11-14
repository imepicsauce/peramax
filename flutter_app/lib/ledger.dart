import 'dart:convert';
import 'package:intl/intl.dart';

const categories = [
  'Food',
  'Pamasahe',
  'Groceries',
  'Load / data',
  'Bills',
  'Others',
];
const payments = ['Cash', 'GCash', 'Maya', 'Bank transfer', 'Card'];
const maxAmount = 9999999900;

enum Period { day, week, month }

String periodLabel(Period period) => switch (period) {
  Period.day => 'Daily',
  Period.week => 'Weekly',
  Period.month => 'Monthly',
};

String money(int value) =>
    NumberFormat.currency(locale: 'en_PH', symbol: '₱').format(value / 100);
String amountText(int? value) =>
    value == null ? '' : (value / 100).toStringAsFixed(2);
int parseAmount(String text, {bool zero = false}) {
  final input = text.trim();
  if (!RegExp(r'^\d{1,8}(\.\d{1,2})?$').hasMatch(input)) {
    throw const FormatException('Use an amount with up to two decimal places.');
  }
  final parts = input.split('.');
  final value =
      int.parse(parts[0]) * 100 +
      int.parse(parts.length == 1 ? '0' : parts[1].padRight(2, '0'));
  if (value < (zero ? 0 : 1) || value > maxAmount) {
    throw const FormatException(
      'Amount must be positive and at most ₱99,999,999.',
    );
  }
  return value;
}

DateTime manilaToday([DateTime? now]) {
  final date = (now ?? DateTime.now()).toUtc().add(const Duration(hours: 8));
  return DateTime.utc(date.year, date.month, date.day);
}

String dateKey(DateTime date) => DateFormat('yyyy-MM-dd').format(date);
DateTime readDate(dynamic value) {
  if (value is! String || !RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(value)) {
    throw const FormatException('Invalid date');
  }
  final date = DateTime.parse('${value}T00:00:00Z');
  if (dateKey(date) != value || date.year < 1900 || date.year > 9999) {
    throw const FormatException('Invalid date');
  }
  return date;
}

(DateTime, DateTime) range(DateTime date, Period period) {
  final start = switch (period) {
    Period.day => date,
    Period.week => date.subtract(Duration(days: date.weekday - 1)),
    Period.month => DateTime.utc(date.year, date.month),
  };
  return (
    start,
    switch (period) {
      Period.day => start,
      Period.week => start.add(const Duration(days: 6)),
      Period.month => DateTime.utc(date.year, date.month + 1, 0),
    },
  );
}

DateTime movePeriod(DateTime date, Period period, int direction) =>
    period == Period.month
    ? DateTime.utc(date.year, date.month + direction)
    : date.add(Duration(days: direction * (period == Period.week ? 7 : 1)));
int readMoney(dynamic value, {bool zero = false}) {
  if (value is! int || value < (zero ? 0 : 1) || value > maxAmount) {
    throw const FormatException('Invalid amount');
  }
  return value;
}

String readText(dynamic value, int limit) {
  if (value is! String || value.length > limit) {
    throw const FormatException('Invalid text');
  }
  return value;
}

class Expense {
  final String id, category, payment, note;
  final int amount;
  final DateTime date;
  const Expense({
    required this.id,
    required this.amount,
    required this.category,
    required this.payment,
    required this.date,
    required this.note,
  });
  factory Expense.fromJson(Map<String, dynamic> json) {
    if (!categories.contains(json['category']) ||
        !payments.contains(json['payment'])) {
      throw const FormatException('Invalid expense');
    }
    return Expense(
      id: readText(json['id'], 100),
      amount: readMoney(json['amount']),
      category: json['category'],
      payment: json['payment'],
      date: readDate(json['date']),
      note: readText(json['note'], 200),
    );
  }
  Map<String, dynamic> toJson() => {
    'id': id,
    'amount': amount,
    'category': category,
    'payment': payment,
    'date': dateKey(date),
    'note': note,
  };
}

class Plan {
  final int? allowance, daily, weekly, weeklyTarget;
  final Period frequency;
  final DateTime? goalStart;
  const Plan({
    this.allowance,
    this.daily,
    this.weekly,
    this.weeklyTarget,
    this.goalStart,
    this.frequency = Period.week,
  });
  factory Plan.fromJson(Map<String, dynamic> json) => Plan(
    allowance: json['allowance'] == null ? null : readMoney(json['allowance']),
    daily: json['daily'] == null ? null : readMoney(json['daily']),
    weekly: json['weekly'] == null ? null : readMoney(json['weekly']),
    weeklyTarget: json['weeklyTarget'] == null
        ? null
        : readMoney(json['weeklyTarget']),
    goalStart: json['goalStart'] == null ? null : readDate(json['goalStart']),
    frequency: Period.values.byName(json['frequency'] as String),
  );
  Map<String, dynamic> toJson() => {
    'allowance': allowance,
    'daily': daily,
    'weekly': weekly,
    'weeklyTarget': weeklyTarget,
    'goalStart': goalStart == null ? null : dateKey(goalStart!),
    'frequency': frequency.name,
  };
}

class Savings {
  final String name;
  final int target, saved;
  final DateTime? deadline;
  const Savings(this.name, this.target, this.saved, this.deadline);
  factory Savings.fromJson(Map<String, dynamic> json) => Savings(
    readText(json['name'], 80),
    readMoney(json['target']),
    readMoney(json['saved'], zero: true),
    json['deadline'] == null ? null : readDate(json['deadline']),
  );
  Map<String, dynamic> toJson() => {
    'name': name,
    'target': target,
    'saved': saved,
    'deadline': deadline == null ? null : dateKey(deadline!),
  };
}

class Ledger {
  final List<Expense> expenses;
  final Plan plan;
  final Savings? savings;
  const Ledger({
    this.expenses = const [],
    this.plan = const Plan(),
    this.savings,
  });
  factory Ledger.decode(String raw) {
    final json = jsonDecode(raw) as Map<String, dynamic>;
    if (json['version'] != 1) {
      throw const FormatException('Unsupported data version');
    }
    final expenses = (json['expenses'] as List)
        .map((e) => Expense.fromJson(e as Map<String, dynamic>))
        .toList();
    if (expenses.map((e) => e.id).toSet().length != expenses.length) {
      throw const FormatException('Duplicate expense');
    }
    final plan = Plan.fromJson(json['plan'] as Map<String, dynamic>);
    if ((plan.weeklyTarget == null) != (plan.goalStart == null) ||
        (plan.goalStart != null && plan.goalStart!.weekday != 1)) {
      throw const FormatException('Invalid weekly goal');
    }
    return Ledger(
      expenses: expenses,
      plan: plan,
      savings: json['savings'] == null
          ? null
          : Savings.fromJson(json['savings'] as Map<String, dynamic>),
    );
  }
  String encode() => jsonEncode({
    'version': 1,
    'expenses': expenses.map((e) => e.toJson()).toList(),
    'plan': plan.toJson(),
    'savings': savings?.toJson(),
  });
  List<Expense> entries(DateTime anchor, Period period) {
    final (start, end) = range(anchor, period);
    return expenses
        .where((e) => !e.date.isBefore(start) && !e.date.isAfter(end))
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));
  }

  int spent(DateTime anchor, Period period) =>
      entries(anchor, period).fold(0, (sum, e) => sum + e.amount);
  int? weekAllowance(DateTime start) {
    final amount = plan.allowance;
    if (amount == null) return null;
    if (plan.frequency == Period.week) return amount;
    if (plan.frequency == Period.day) return amount * 7;
    var total = 0.0;
    for (var i = 0; i < 7; i++) {
      final day = start.add(Duration(days: i));
      total += amount / DateTime.utc(day.year, day.month + 1, 0).day;
    }
    return total.round();
  }
}
