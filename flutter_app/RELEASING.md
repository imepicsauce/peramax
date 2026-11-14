# Package an Android installer for GitHub

The Android installer is an APK. Commit the Flutter source and lockfile to Git; attach compiled installers to **GitHub Releases**.

## Build and package

From the repository root, in PowerShell:

```powershell
cd flutter_app
flutter pub get
powershell -NoProfile -ExecutionPolicy Bypass -File tooling/package-android.ps1
```

The execution-policy option applies only to that PowerShell process; it does not change the machine's policy.

The script builds the current source, reads the app version from `pubspec.yaml`, copies the release APK to `releases/vVERSION-preview/`, and generates:

- `Peramax-VERSION-preview-android.apk` — the installer people download.
- `SHA256SUMS.txt` — a SHA-256 checksum for that APK.
- `INSTALL.md` — installation and update instructions.

Generated installers are ignored by Git. Runtime records, browser profiles, screenshots, SDK paths and signing credentials are also excluded. Keep `pubspec.lock` committed.

## Create the GitHub release

1. Push the source changes to your repository.
2. Open **Releases → Draft a new release**.
3. Create the tag printed by the packaging script, for example `v1.0.0-preview`, targeting the commit you built.
4. Use a title such as **Peramax 1.0.0 Android Preview** and describe the changes.
5. Attach the three generated files from `releases/v1.0.0-preview/`.
6. Mark **This is a pre-release**, then publish when ready.

Follow [GitHub's release instructions](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository). Do not upload keystores, `key.properties`, browser profiles, or your entire build directory.

## Stable release signing

The current Gradle configuration signs release builds with the local development key. The packaged installer is therefore explicitly labeled as a preview. Rebuilding on a different machine may use a different development key and produce an APK that cannot update an existing installation.

Before publishing a stable release, configure a permanent private signing key following [Flutter's Android signing guide](https://docs.flutter.dev/deployment/android#sign-the-app). Store its credentials outside Git and back up the key securely. A future GitHub Actions build must use that same key through repository secrets, rather than generating a new signing key on each run. Increment the build number in `pubspec.yaml` for updates.
