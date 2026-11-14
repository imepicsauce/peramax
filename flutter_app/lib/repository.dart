import 'package:shared_preferences/shared_preferences.dart';
import 'ledger.dart';

abstract class LedgerRepository {
  Future<Ledger> load();
  Future<void> save(Ledger ledger);
}

class LocalLedgerRepository implements LedgerRepository {
  final SharedPreferencesAsync preferences = SharedPreferencesAsync();
  static const key = 'peramax-flutter-v1';
  @override
  Future<Ledger> load() async {
    final raw = await preferences.getString(key);
    return raw == null ? const Ledger() : Ledger.decode(raw);
  }

  @override
  Future<void> save(Ledger ledger) =>
      preferences.setString(key, ledger.encode());
}
