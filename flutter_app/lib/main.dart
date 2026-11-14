import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'ledger.dart';
import 'repository.dart';
import 'ui_motion.dart';

const forest = Color(0xff1d392b),
    paper = Color(0xfff5f4ef),
    sage = Color(0xffe5ecdc);
void main() => runApp(PeramaxApp(repository: LocalLedgerRepository()));

class PeramaxApp extends StatelessWidget {
  final LedgerRepository repository;
  const PeramaxApp({super.key, required this.repository});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Peramax',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: paper,
      colorScheme: ColorScheme.fromSeed(
        seedColor: forest,
        primary: forest,
        surface: paper,
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      ),
    ),
    home: LedgerScreen(repository: repository),
  );
}

class LedgerScreen extends StatefulWidget {
  final LedgerRepository repository;
  const LedgerScreen({super.key, required this.repository});
  @override
  State<LedgerScreen> createState() => _LedgerScreenState();
}

class _LedgerScreenState extends State<LedgerScreen>
    with WidgetsBindingObserver {
  Ledger ledger = const Ledger();
  bool loading = true, busy = false, blocked = false;
  String? error;
  int screen = 0;
  Period period = Period.week;
  DateTime today = manilaToday(), anchor = manilaToday();
  String search = '', category = 'All';
  Timer? timer, loadingTimer;
  bool showSkeleton = false;
  final searchController = TextEditingController();
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    load();
    timer = Timer.periodic(const Duration(minutes: 1), (_) => refreshDay());
  }

  void refreshDay() {
    final next = manilaToday();
    if (next != today && mounted) {
      setState(() {
        if (anchor == today) anchor = next;
        today = next;
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) refreshDay();
  }

  @override
  void dispose() {
    timer?.cancel();
    loadingTimer?.cancel();
    searchController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<void> load() async {
    loadingTimer?.cancel();
    setState(() {
      loading = true;
      showSkeleton = false;
    });
    loadingTimer = Timer(const Duration(milliseconds: 180), () {
      if (mounted && loading) setState(() => showSkeleton = true);
    });
    try {
      final value = await widget.repository.load();
      if (mounted) {
        setState(() {
          ledger = value;
          loading = false;
          blocked = false;
          error = null;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          loading = false;
          blocked = true;
          error =
              'Saved records could not be read. They have been preserved. Retry before making changes.';
        });
      }
    } finally {
      loadingTimer?.cancel();
    }
  }

  void selectScreen(int value) {
    if (value == screen) return;
    FocusScope.of(context).unfocus();
    setState(() => screen = value);
  }

  Future<bool> save(Ledger next) async {
    if (busy || blocked) return false;
    setState(() => busy = true);
    try {
      await widget.repository.save(next);
      if (!mounted) return false;
      setState(() {
        ledger = next;
        error = null;
      });
      return true;
    } catch (_) {
      if (mounted) {
        setState(
          () => error =
              'Could not save. Your change was not applied. Please try again.',
        );
      }
      return false;
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> edit(String kind, [Expense? expense]) async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => EntryEditor(
          kind: kind,
          ledger: ledger,
          expense: expense,
          today: today,
          onSave: saveResult,
        ),
      ),
    );
  }

  Future<bool> saveResult(Object result) async {
    if (result is Expense) {
      return save(
        Ledger(
          expenses: [
            ...ledger.expenses.where((e) => e.id != result.id),
            result,
          ],
          plan: ledger.plan,
          savings: ledger.savings,
        ),
      );
    }
    if (result is Plan) {
      return save(
        Ledger(
          expenses: ledger.expenses,
          plan: result,
          savings: ledger.savings,
        ),
      );
    }
    if (result is Savings) {
      return save(
        Ledger(expenses: ledger.expenses, plan: ledger.plan, savings: result),
      );
    }
    return false;
  }

  Future<bool> confirm(String title) async =>
      await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(title),
          content: const Text('This removes the selected record.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Delete'),
            ),
          ],
        ),
      ) ??
      false;
  Future<void> deleteExpense(Expense e) async {
    if (!await confirm('Delete ${e.note.isEmpty ? e.category : e.note}?')) {
      return;
    }
    if (await save(
          Ledger(
            expenses: ledger.expenses.where((v) => v.id != e.id).toList(),
            plan: ledger.plan,
            savings: ledger.savings,
          ),
        ) &&
        mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Expense deleted'),
          action: SnackBarAction(
            label: 'Undo',
            onPressed: () {
              save(
                Ledger(
                  expenses: [...ledger.expenses, e],
                  plan: ledger.plan,
                  savings: ledger.savings,
                ),
              );
            },
          ),
        ),
      );
    }
  }

  bool get editable => !loading && !busy && !blocked;
  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 840;
    final content = Scaffold(
      appBar: AppBar(
        title: const Text(
          'pera·max',
          style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -1),
        ),
        actions: [
          TextButton.icon(
            onPressed: editable ? () => edit('plan') : null,
            icon: const Icon(Icons.tune),
            label: const Text('My plan'),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 760),
            child: PageMotion(
              child: loading
                  ? showSkeleton
                        ? LedgerSkeleton(
                            key: ValueKey('loading-$screen'),
                            screen: screen,
                          )
                        : const SizedBox.expand(key: ValueKey('loading-delay'))
                  : ListView(
                      key: PageStorageKey('ledger-page-$screen'),
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 110),
                      children: [
                        if (error != null)
                          MaterialBanner(
                            content: Text(error!),
                            actions: [
                              TextButton(
                                onPressed: blocked
                                    ? load
                                    : () => setState(() => error = null),
                                child: Text(blocked ? 'Retry' : 'Dismiss'),
                              ),
                            ],
                          ),
                        if (busy) const LinearProgressIndicator(),
                        Text(
                          [
                            'Your money, at a glance',
                            'Activity',
                            'Spending insights',
                            'Your savings',
                          ][screen],
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          DateFormat('EEEE, MMMM d, y').format(today),
                          style: const TextStyle(color: Color(0xff546044)),
                        ),
                        const SizedBox(height: 24),
                        if (screen != 3) ...warnings(),
                        ...switch (screen) {
                          0 => home(),
                          1 => activity(),
                          2 => insights(),
                          _ => savings(),
                        },
                        const SizedBox(height: 32),
                        const Text(
                          'Stored on this device. No account or cloud sync. Keep a separate backup of important records.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xff546044),
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
      floatingActionButton: screen == 3
          ? null
          : FloatingActionButton.extended(
              onPressed: editable ? () => edit('expense') : null,
              backgroundColor: forest,
              foregroundColor: paper,
              icon: const Icon(Icons.add),
              label: const Text('Add expense'),
            ),
      bottomNavigationBar: wide
          ? null
          : NavigationBar(
              selectedIndex: screen,
              onDestinationSelected: selectScreen,
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.home_outlined),
                  label: 'Home',
                ),
                NavigationDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  label: 'Activity',
                ),
                NavigationDestination(
                  icon: Icon(Icons.bar_chart),
                  label: 'Insights',
                ),
                NavigationDestination(
                  icon: Icon(Icons.savings_outlined),
                  label: 'Savings',
                ),
              ],
            ),
    );
    if (!wide) return content;
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            extended: MediaQuery.sizeOf(context).width >= 1100,
            backgroundColor: sage,
            selectedIndex: screen,
            onDestinationSelected: selectScreen,
            leading: const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Icon(
                Icons.account_balance_wallet_outlined,
                color: forest,
                size: 32,
              ),
            ),
            destinations: const [
              NavigationRailDestination(
                icon: Icon(Icons.home_outlined),
                label: Text('Home'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.receipt_long_outlined),
                label: Text('Activity'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.bar_chart),
                label: Text('Insights'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.savings_outlined),
                label: Text('Savings'),
              ),
            ],
          ),
          Expanded(child: content),
        ],
      ),
    );
  }

  List<Widget> warnings() => [
    for (final (name, limit, spent) in [
      (
        'Allowance',
        ledger.plan.allowance,
        ledger.spent(today, ledger.plan.frequency),
      ),
      ('Daily limit', ledger.plan.daily, ledger.spent(today, Period.day)),
      ('Weekly limit', ledger.plan.weekly, ledger.spent(today, Period.week)),
    ])
      if (limit != null && spent * 5 >= limit * 4)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            tileColor: const Color(0xfff2e6cf),
            leading: const Icon(Icons.info_outline),
            title: Text(
              '$name ${spent > limit
                  ? 'exceeded'
                  : spent == limit
                  ? 'used up'
                  : 'is getting low'}',
            ),
            subtitle: Text(
              spent > limit
                  ? '${money(spent - limit)} over.'
                  : '${money(limit - spent)} left.',
            ),
          ),
        ),
  ];
  Widget section(String title, {Widget? action}) => Padding(
    padding: const EdgeInsets.only(top: 24, bottom: 10),
    child: Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
        ),
        ?action,
      ],
    ),
  );
  List<Widget> home() {
    final p = ledger.plan, spent = ledger.spent(today, ledger.plan.frequency);
    final left = p.allowance == null ? null : p.allowance! - spent;
    final start = p.goalStart;
    final weeklyLeft = start == null || ledger.weekAllowance(start) == null
        ? null
        : ledger.weekAllowance(start)! - ledger.spent(start, Period.week);
    return [
      Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: forest,
          borderRadius: BorderRadius.circular(24),
        ),
        child: DefaultTextStyle(
          style: const TextStyle(color: paper, fontSize: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                left == null
                    ? 'Your allowance'
                    : left < 0
                    ? 'Over your allowance'
                    : 'Allowance left',
              ),
              const SizedBox(height: 10),
              Text(
                left == null ? 'Start with a plan' : money(left.abs()),
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 20),
              Wrap(
                spacing: 32,
                runSpacing: 12,
                children: [
                  Text(
                    'Allowance\n${p.allowance == null ? 'Not set' : money(p.allowance!)}',
                  ),
                  Text('Expenses\n${money(spent)}'),
                ],
              ),
              const SizedBox(height: 20),
              SmoothProgress(
                value: p.allowance == null
                    ? 0
                    : (spent / p.allowance!).clamp(0, 1),
                color: const Color(0xffadc49a),
                backgroundColor: const Color(0xff42604c),
                minHeight: 6,
              ),
              const SizedBox(height: 12),
              Text('${periodLabel(p.frequency)} allowance · no rollover'),
              if (left == null)
                TextButton.icon(
                  onPressed: editable ? () => edit('plan') : null,
                  style: TextButton.styleFrom(foregroundColor: paper),
                  icon: const Icon(Icons.arrow_forward, size: 18),
                  label: const Text('Set your allowance'),
                ),
            ],
          ),
        ),
      ),
      section('Spending limits'),
      for (final (name, limit, total) in [
        ('Today', p.daily, ledger.spent(today, Period.day)),
        ('This week', p.weekly, ledger.spent(today, Period.week)),
      ])
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(name),
          subtitle: Text(
            limit == null
                ? 'No limit set'
                : '${money(total)} of ${money(limit)}',
          ),
          trailing: Text(
            limit == null
                ? money(total)
                : '${money((limit - total).abs())} ${total > limit ? 'over' : 'left'}',
          ),
        ),
      section(
        'Weekly saving goal',
        action: TextButton(
          onPressed: editable ? () => edit('plan') : null,
          child: const Text('Manage'),
        ),
      ),
      if (start == null)
        const Text(
          'Choose how much of your allowance to keep unspent by Sunday.',
        )
      else ...[
        Text(
          '${money(p.weeklyTarget!)} to keep unspent',
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
        ),
        Text(
          '${DateFormat.MMMd().format(start)} – ${DateFormat.yMMMd().format(start.add(const Duration(days: 6)))}',
        ),
        const SizedBox(height: 8),
        Text(
          weeklyLeft == null
              ? 'Set an allowance to track this goal.'
              : '${today.isBefore(start)
                    ? 'Upcoming'
                    : today.isAfter(start.add(const Duration(days: 6)))
                    ? weeklyLeft >= p.weeklyTarget!
                          ? 'Goal met'
                          : 'Goal missed'
                    : weeklyLeft >= p.weeklyTarget!
                    ? 'On track'
                    : 'Below target'} · ${money(weeklyLeft)} unspent',
        ),
        const Text(
          'Based on logged expenses. No automatic savings transfer.',
          style: TextStyle(fontSize: 12),
        ),
      ],
      section(
        'Recent expenses',
        action: TextButton(
          onPressed: () => selectScreen(1),
          child: const Text('View all'),
        ),
      ),
      ...rows(
        (ledger.expenses.toList()..sort((a, b) => b.date.compareTo(a.date)))
            .take(5)
            .toList(),
      ),
    ];
  }

  List<Widget> periodControls() {
    final (start, end) = range(anchor, period);
    return [
      SegmentedButton<Period>(
        segments: [
          for (final p in Period.values)
            ButtonSegment(value: p, label: Text(p.name)),
        ],
        selected: {period},
        onSelectionChanged: (v) => setState(() => period = v.first),
      ),
      const SizedBox(height: 12),
      Row(
        children: [
          IconButton(
            tooltip: 'Previous period',
            onPressed: () =>
                setState(() => anchor = movePeriod(anchor, period, -1)),
            icon: const Icon(Icons.chevron_left),
          ),
          Expanded(
            child: Text(
              '${DateFormat.yMMMd().format(start)}${period == Period.day ? '' : ' – ${DateFormat.MMMd().format(end)}'}',
              textAlign: TextAlign.center,
            ),
          ),
          IconButton(
            tooltip: 'Next period',
            onPressed: () =>
                setState(() => anchor = movePeriod(anchor, period, 1)),
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
      TextButton(
        onPressed: () => setState(() => anchor = today),
        child: const Text('Current period'),
      ),
      const SizedBox(height: 12),
    ];
  }

  List<Widget> activity() {
    final entries = ledger
        .entries(anchor, period)
        .where(
          (e) =>
              (category == 'All' || category == e.category) &&
              '${e.note} ${e.category} ${e.payment}'.toLowerCase().contains(
                search.toLowerCase(),
              ),
        )
        .toList();
    return [
      ...periodControls(),
      TextField(
        controller: searchController,
        decoration: const InputDecoration(
          labelText: 'Search expenses',
          prefixIcon: Icon(Icons.search),
        ),
        onChanged: (v) => setState(() => search = v),
      ),
      const SizedBox(height: 12),
      AnchoredDropdown<String>(
        label: 'Category',
        value: category,
        values: ['All', ...categories],
        labelFor: (value) => value,
        onChanged: (v) => setState(() => category = v),
      ),
      section(
        '${entries.length} expenses',
        action: Text(money(entries.fold(0, (s, e) => s + e.amount))),
      ),
      ...rows(entries),
    ];
  }

  List<Widget> rows(List<Expense> entries) => entries.isEmpty
      ? [
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Text(
              'No expenses here yet. Add an expense to start your record.',
            ),
          ),
        ]
      : [
          for (final e in entries)
            Column(
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: sage,
                    child: Icon(categoryIcon(e.category), color: forest),
                  ),
                  title: Text(
                    e.note.isEmpty ? e.category : e.note,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${e.category} · ${e.payment}'),
                      Text(DateFormat.yMMMd().format(e.date)),
                      const SizedBox(height: 4),
                      Text(
                        money(e.amount),
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: forest,
                        ),
                      ),
                    ],
                  ),
                  isThreeLine: true,
                  onTap: editable ? () => edit('expense', e) : null,
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      PopupMenuButton<String>(
                        enabled: editable,
                        tooltip: 'Expense actions',
                        onSelected: (v) {
                          if (v == 'edit') {
                            edit('expense', e);
                          } else {
                            deleteExpense(e);
                          }
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'edit', child: Text('Edit')),
                          PopupMenuItem(value: 'delete', child: Text('Delete')),
                        ],
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
              ],
            ),
        ];
  List<Widget> insights() {
    final entries = ledger.entries(anchor, period),
        total = ledger.spent(anchor, period);
    return [
      ...periodControls(),
      Text(
        money(total),
        style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w700),
      ),
      Text('${entries.length} expenses this ${period.name}'),
      section('Spending by category'),
      if (entries.isEmpty) const Text('Add expenses to see your breakdown.'),
      for (final c in categories)
        if (entries.any((e) => e.category == c))
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(categoryIcon(c), size: 20),
                    const SizedBox(width: 10),
                    Expanded(child: Text(c)),
                    Text(
                      money(
                        entries
                            .where((e) => e.category == c)
                            .fold(0, (s, e) => s + e.amount),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                SmoothProgress(
                  value:
                      entries
                          .where((e) => e.category == c)
                          .fold(0, (s, e) => s + e.amount) /
                      total,
                  backgroundColor: sage,
                  minHeight: 8,
                ),
              ],
            ),
          ),
      section('Payment methods'),
      for (final p in payments)
        if (entries.any((e) => e.payment == p))
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(p),
            trailing: Text(
              money(
                entries
                    .where((e) => e.payment == p)
                    .fold(0, (s, e) => s + e.amount),
              ),
            ),
          ),
    ];
  }

  List<Widget> savings() {
    final g = ledger.savings;
    if (g == null) {
      return [
        const Icon(Icons.savings_outlined, size: 72, color: forest),
        const SizedBox(height: 20),
        const Text(
          'Something worth saving for.',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        const Text(
          'Set one goal and record money already put aside. Savings stay separate from your allowance.',
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: editable ? () => edit('savings') : null,
          child: const Text('Create savings goal'),
        ),
      ];
    }
    return [
      Text(
        g.name,
        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
      ),
      const SizedBox(height: 20),
      Text(
        money(g.saved),
        style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w700),
      ),
      Text('of ${money(g.target)}'),
      const SizedBox(height: 20),
      SmoothProgress(value: (g.saved / g.target).clamp(0, 1), minHeight: 12),
      const SizedBox(height: 12),
      Text(
        g.saved >= g.target
            ? 'Goal complete. You made it!'
            : '${money(g.target - g.saved)} to go',
      ),
      if (g.deadline != null)
        Text('Target date: ${DateFormat.yMMMd().format(g.deadline!)}'),
      const SizedBox(height: 24),
      FilledButton.icon(
        onPressed: editable ? () => edit('contribution') : null,
        icon: const Icon(Icons.add),
        label: const Text('Add savings'),
      ),
      TextButton(
        onPressed: editable ? () => edit('savings') : null,
        child: const Text('Edit goal or saved balance'),
      ),
      TextButton(
        onPressed: editable
            ? () async {
                if (await confirm('Delete savings goal?')) {
                  await save(
                    Ledger(expenses: ledger.expenses, plan: ledger.plan),
                  );
                }
              }
            : null,
        child: const Text('Delete goal'),
      ),
      const Text(
        'Adding savings does not create an expense or reduce allowance. Edit the balance to record a withdrawal.',
      ),
    ];
  }
}

IconData categoryIcon(String c) => switch (c) {
  'Food' => Icons.restaurant_outlined,
  'Pamasahe' => Icons.directions_bus_outlined,
  'Groceries' => Icons.shopping_basket_outlined,
  'Load / data' => Icons.phone_android,
  'Bills' => Icons.receipt_outlined,
  _ => Icons.more_horiz,
};

class EntryEditor extends StatefulWidget {
  final String kind;
  final Ledger ledger;
  final Expense? expense;
  final DateTime today;
  final Future<bool> Function(Object) onSave;
  const EntryEditor({
    super.key,
    required this.kind,
    required this.ledger,
    this.expense,
    required this.today,
    required this.onSave,
  });
  @override
  State<EntryEditor> createState() => _EntryEditorState();
}

class _EntryEditorState extends State<EntryEditor> {
  bool saving = false;
  String? saveError;
  final form = GlobalKey<FormState>();
  final controllers = <String, TextEditingController>{};
  late String category = widget.expense?.category ?? categories.first,
      payment = widget.expense?.payment ?? payments.first;
  late Period frequency = widget.ledger.plan.frequency;
  late DateTime date = widget.expense?.date ?? widget.today,
      week =
          widget.ledger.plan.goalStart ?? range(widget.today, Period.week).$1;
  late DateTime? deadline = widget.ledger.savings?.deadline;
  TextEditingController control(String key, [String initial = '']) =>
      controllers.putIfAbsent(key, () => TextEditingController(text: initial));
  @override
  void dispose() {
    for (final c in controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Widget amount(
    String key,
    String label,
    int? initial, {
    bool optional = false,
    bool zero = false,
  }) => TextFormField(
    controller: control(key, amountText(initial)),
    keyboardType: const TextInputType.numberWithOptions(decimal: true),
    decoration: InputDecoration(labelText: label, prefixText: '₱ '),
    validator: (v) {
      if (optional && v!.trim().isEmpty) return null;
      try {
        final n = parseAmount(v ?? '', zero: zero);
        if (widget.kind == 'contribution' &&
            n + widget.ledger.savings!.saved > maxAmount) {
          return 'Saved balance would exceed ₱99,999,999.';
        }
        return null;
      } on FormatException catch (e) {
        return e.message;
      }
    },
  );
  Widget text(
    String key,
    String label,
    String initial,
    int limit, {
    bool required = false,
  }) => TextFormField(
    controller: control(key, initial),
    maxLength: limit,
    decoration: InputDecoration(labelText: label),
    validator: (v) =>
        required && (v == null || v.trim().isEmpty) ? 'Enter $label.' : null,
  );
  int? value(String key) => controllers[key]!.text.trim().isEmpty
      ? null
      : parseAmount(controllers[key]!.text, zero: key == 'saved');
  Future<DateTime?> pick(DateTime initial) async {
    final d = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1900),
      lastDate: DateTime(9999, 12, 31),
    );
    return d == null ? null : DateTime.utc(d.year, d.month, d.day);
  }

  Future<void> submit() async {
    if (saving || !form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    final g = widget.ledger.savings;
    final result = switch (widget.kind) {
      'expense' => Expense(
        id:
            widget.expense?.id ??
            DateTime.now().microsecondsSinceEpoch.toString(),
        amount: value('amount')!,
        category: category,
        payment: payment,
        date: date,
        note: controllers['note']!.text.trim(),
      ),
      'plan' => Plan(
        allowance: value('allowance'),
        daily: value('daily'),
        weekly: value('weekly'),
        frequency: frequency,
        weeklyTarget: value('target'),
        goalStart: value('target') == null ? null : week,
      ),
      'contribution' => Savings(
        g!.name,
        g.target,
        g.saved + value('amount')!,
        g.deadline,
      ),
      _ => Savings(
        controllers['name']!.text.trim(),
        value('target')!,
        value('saved')!,
        deadline,
      ),
    };
    setState(() {
      saving = true;
      saveError = null;
    });
    final ok = await widget.onSave(result);
    if (!mounted) return;
    if (ok) {
      Navigator.pop(context);
    } else {
      setState(() {
        saving = false;
        saveError =
            'Could not save. Your entries are still here. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.ledger.plan, g = widget.ledger.savings;
    final fields = <Widget>[
      if (widget.kind == 'expense') ...[
        amount('amount', 'Amount', widget.expense?.amount),
        AnchoredDropdown<String>(
          label: 'Category',
          value: category,
          values: categories,
          labelFor: (value) => value,
          onChanged: (v) => category = v,
        ),
        AnchoredDropdown<String>(
          label: 'Payment method',
          value: payment,
          values: payments,
          labelFor: (value) => value,
          onChanged: (v) => payment = v,
        ),
        text('note', 'Note (optional)', widget.expense?.note ?? '', 200),
        OutlinedButton.icon(
          onPressed: () async {
            final d = await pick(date);
            if (d != null) setState(() => date = d);
          },
          icon: const Icon(Icons.calendar_today_outlined),
          label: Text(DateFormat.yMMMd().format(date)),
        ),
      ],
      if (widget.kind == 'plan') ...[
        const Text(
          'Allowance repeats each period with no rollover. Leave an amount blank to remove it.',
        ),
        amount(
          'allowance',
          'Allowance (optional)',
          p.allowance,
          optional: true,
        ),
        AnchoredDropdown<Period>(
          label: 'Frequency',
          value: frequency,
          values: Period.values,
          labelFor: periodLabel,
          onChanged: (v) => frequency = v,
        ),
        amount('daily', 'Daily limit (optional)', p.daily, optional: true),
        amount('weekly', 'Weekly limit (optional)', p.weekly, optional: true),
        const Text(
          'Weekly saving goal',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
        ),
        const Text(
          'Keep this amount unspent by Sunday. Monthly allowance is prorated by calendar days. No automatic savings transfer.',
        ),
        amount(
          'target',
          'Keep unspent (optional)',
          p.weeklyTarget,
          optional: true,
        ),
        OutlinedButton.icon(
          onPressed: () async {
            final d = await pick(week);
            if (d != null) setState(() => week = range(d, Period.week).$1);
          },
          icon: const Icon(Icons.calendar_today_outlined),
          label: Text('Week of ${DateFormat.yMMMd().format(week)}'),
        ),
      ],
      if (widget.kind == 'savings') ...[
        text('name', 'Goal name', g?.name ?? '', 80, required: true),
        amount('target', 'Target amount', g?.target),
        amount('saved', 'Already saved', g?.saved ?? 0, zero: true),
        const Text(
          'Edit the balance to correct a contribution or record a withdrawal.',
        ),
        OutlinedButton.icon(
          onPressed: () async {
            final d = await pick(deadline ?? widget.today);
            if (d != null) setState(() => deadline = d);
          },
          icon: const Icon(Icons.calendar_today_outlined),
          label: Text(
            deadline == null
                ? 'Add target date (optional)'
                : DateFormat.yMMMd().format(deadline!),
          ),
        ),
        if (deadline != null)
          TextButton(
            onPressed: () => setState(() => deadline = null),
            child: const Text('Remove target date'),
          ),
      ],
      if (widget.kind == 'contribution') ...[
        const Text('Record money you have already set aside.'),
        amount('amount', 'Contribution', null),
      ],
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text(switch (widget.kind) {
          'expense' => widget.expense == null ? 'Add expense' : 'Edit expense',
          'plan' => 'My plan',
          'contribution' => 'Add savings',
          _ => 'Savings goal',
        }),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: AbsorbPointer(
              absorbing: saving,
              child: Form(
                key: form,
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    if (saveError != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Text(
                          saveError!,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ),
                    for (final field in fields)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: field,
                      ),
                    FilledButton(
                      onPressed: saving ? null : submit,
                      child: AnimatedSwitcher(
                        duration: motionDuration(context, 160),
                        child: saving
                            ? const Row(
                                key: ValueKey('saving'),
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  ),
                                  SizedBox(width: 10),
                                  Text('Saving…'),
                                ],
                              )
                            : Text(
                                key: const ValueKey('save-label'),
                                widget.kind == 'expense'
                                    ? 'Save expense'
                                    : widget.kind == 'plan'
                                    ? 'Save plan'
                                    : widget.kind == 'contribution'
                                    ? 'Add savings'
                                    : 'Save goal',
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
