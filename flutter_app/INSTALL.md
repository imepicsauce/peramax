# Install Peramax on Android

1. Open this repository's **Releases** page and select the Peramax Android preview.
2. Download the file named `Peramax-…-preview-android.apk` under **Assets**. The source-code ZIP is for developers and does not install the app.
3. Open the downloaded APK on your Android phone.
4. If Android requests permission to install from that browser or file manager, allow that source for this installation.
5. Tap **Install**, then **Open**. You can turn that source permission off again afterward.

The APK is the installer; Flutter, Android Studio, a computer, and USB debugging are not required to install it on a phone.

## Updates and records

Install newer APKs over the existing app. Keep the same application ID and signing key when building updates. If Android reports a signing mismatch, obtain a matching update rather than uninstalling the existing app: uninstalling can remove locally stored records.

Peramax stores expenses and savings on the device, without account-based synchronization. This preview should not be the sole copy of important financial records.

## Verify the download

The release includes `SHA256SUMS.txt`. On Windows, calculate the APK's checksum:

```powershell
Get-FileHash -Algorithm SHA256 .\Peramax-1.0.0-preview-android.apk
```

Use the filename of the APK you downloaded and compare the result with the checksum file.

## Preview signing

This preview is an optimized Flutter release build signed with the development key used for local testing. It is not configured for Google Play distribution. The maintainer must configure a permanent private release key before a stable public release, and retain that key for future updates. Signing keys and passwords must never be committed to the repository or uploaded as release assets.
