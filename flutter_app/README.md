# Peramax for Flutter

Android-first Flutter application based on the Peramax React app in the parent directory. Includes expense creation/editing/deletion with undo, category and payment search, daily/weekly/monthly insights, repeating allowances, spending warnings, weekly unspent goals, and a separate savings balance.

For phone installation, see [INSTALL.md](INSTALL.md). To create a versioned APK installer and upload it to GitHub Releases, see [RELEASING.md](RELEASING.md).

## Run

```powershell
cd flutter_app
flutter pub get
flutter run
```

For the Brave preview:

```powershell
flutter build web --no-web-resources-cdn
node tooling/serve.cjs
```

Open http://127.0.0.1:5454 in Brave. The web preview uses the same Flutter interface and domain code; Android system behavior must still be checked on an Android device.

## Android build

```powershell
flutter doctor -v
flutter build apk --debug
flutter build apk --release
```

The test APK is written to `build/app/outputs/flutter-apk/app-debug.apk`. Connect a phone with USB debugging enabled and use `flutter run` to install and test. A store release needs your own signing configuration; the generated release configuration currently uses the development key.

The optimized APK is written to `build/app/outputs/flutter-apk/app-release.apk`. Android launches show the Peramax logo on a forest-green background while Flutter starts, with launch themes for Android 12+ and older supported releases. The browser preview shows the same branding until Flutter's first frame, with a Retry action if startup fails. Neither launch screen adds a minimum waiting time.

### Current verification status

Static analysis and all 13 Flutter tests pass. Checks cover expense flows, exact financial calculations, slow-loading skeletons, rapid page switching, field-bounded dropdown menus, responsive layouts and reduced-motion preferences.

Tab changes use a short fade and slide. Progress indicators animate between values, and save buttons show animated saving feedback. Skeleton placeholders appear only if loading takes longer than 180 ms. Android's Remove animations preference disables spatial transitions and the skeleton pulse. Dropdown menus use Material's anchored open/close animation and match their field width.

The Android debug APK builds successfully at `build/app/outputs/flutter-apk/app-debug.apk`. NDK 28.2.13676358, CMake 3.22.1 and Android SDK Platforms 35/36 are installed on the development machine. The first build required substantial dependency downloads; later builds reuse that cache. See `build/android-build-ndk-retry.log` for the successful build result. Full Android device interaction testing remains outstanding.

## Verify

```powershell
flutter analyze --no-pub
flutter test --no-pub
```

Optional Brave visual checks use Playwright with the installed Brave executable:

```powershell
npm.cmd ci --prefix tooling --ignore-scripts
node tooling/check-preview.cjs
```

## Data

Amounts use integer centavos. Dates use Philippine calendar days, and weeks run Monday–Sunday. Savings contributions record money already set aside and do not subtract from the allowance. Monthly allowances are prorated by calendar day for weekly saving goals.

This first version stores a JSON snapshot using `SharedPreferencesAsync`. Storage is local, unencrypted and unsuitable as the sole copy of important financial records. Unreadable data disables writes instead of replacing the stored payload. Failed saves preserve form input for retry. Browser and Android records are separate; importing the React app's records and cross-device synchronization are not implemented. The generated iOS project is unverified and needs macOS/Xcode.

## Structure

- `lib/ledger.dart`: data validation, exact amount parsing, date ranges and totals.
- `lib/repository.dart`: local persistence boundary.
- `lib/main.dart`: Material interface, responsive navigation and forms.
- `lib/ui_motion.dart`: page transitions, loading skeletons, anchored dropdowns and animated progress.
- `test/`: financial boundaries, expense flows, save failure recovery and responsive layouts.
