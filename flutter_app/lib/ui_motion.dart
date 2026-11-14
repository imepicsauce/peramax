import 'package:flutter/material.dart';

Duration motionDuration(BuildContext context, [int milliseconds = 280]) =>
    MediaQuery.disableAnimationsOf(context)
    ? Duration.zero
    : Duration(milliseconds: milliseconds);

/// Keep navigation responsive, including when a second tab is tapped mid-flight.
class PageMotion extends StatelessWidget {
  final Widget child;
  const PageMotion({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final reduce = MediaQuery.disableAnimationsOf(context);
    return ClipRect(
      child: AnimatedSwitcher(
        duration: motionDuration(context),
        reverseDuration: motionDuration(context, 160),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        layoutBuilder: (current, previous) => Stack(
          fit: StackFit.expand,
          children: [
            for (final child in previous)
              ExcludeSemantics(
                child: IgnorePointer(
                  child: TickerMode(enabled: false, child: child),
                ),
              ),
            ?current,
          ],
        ),
        transitionBuilder: (child, animation) => FadeTransition(
          opacity: animation,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: reduce ? Offset.zero : const Offset(0, .025),
              end: Offset.zero,
            ).animate(animation),
            child: child,
          ),
        ),
        child: child,
      ),
    );
  }
}

/// Material menus animate from the field and stay within its measured width.
class AnchoredDropdown<T> extends StatelessWidget {
  final String label;
  final T value;
  final List<T> values;
  final String Function(T) labelFor;
  final ValueChanged<T> onChanged;
  const AnchoredDropdown({
    super.key,
    required this.label,
    required this.value,
    required this.values,
    required this.labelFor,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) => DropdownMenu<T>(
      width: constraints.maxWidth,
      label: Text(label),
      initialSelection: value,
      selectOnly: true,
      enableSearch: false,
      requestFocusOnTap: false,
      menuStyle: MenuStyle(
        maximumSize: WidgetStatePropertyAll(Size(constraints.maxWidth, 320)),
        alignment: AlignmentDirectional.bottomStart,
        shape: WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      dropdownMenuEntries: [
        for (final item in values)
          DropdownMenuEntry(value: item, label: labelFor(item)),
      ],
      onSelected: (item) {
        if (item != null) onChanged(item);
      },
    ),
  );
}

class SmoothProgress extends StatelessWidget {
  final double value;
  final double minHeight;
  final Color? color, backgroundColor;
  const SmoothProgress({
    super.key,
    required this.value,
    this.minHeight = 6,
    this.color,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: value.clamp(0, 1)),
    duration: motionDuration(context, 320),
    curve: Curves.easeOutCubic,
    builder: (context, value, _) => LinearProgressIndicator(
      value: value,
      minHeight: minHeight,
      color: color,
      backgroundColor: backgroundColor,
      borderRadius: BorderRadius.circular(minHeight / 2),
    ),
  );
}

class LedgerSkeleton extends StatefulWidget {
  final int screen;
  const LedgerSkeleton({super.key, required this.screen});
  @override
  State<LedgerSkeleton> createState() => _LedgerSkeletonState();
}

class _LedgerSkeletonState extends State<LedgerSkeleton>
    with SingleTickerProviderStateMixin {
  late final controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  );
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      controller.stop();
      controller.value = .5;
    } else if (!controller.isAnimating) {
      controller.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Widget block(double height, {double? width}) => Container(
    height: height,
    width: width,
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(height > 60 ? 24 : 6),
    ),
  );

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Loading your records',
    liveRegion: true,
    child: ExcludeSemantics(
      child: RepaintBoundary(
        child: FadeTransition(
          opacity: Tween<double>(
            begin: .45,
            end: .9,
          ).chain(CurveTween(curve: Curves.easeInOut)).animate(controller),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 110),
            physics: const NeverScrollableScrollPhysics(),
            children: [
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: block(28, width: 220),
              ),
              const SizedBox(height: 12),
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: block(14, width: 160),
              ),
              const SizedBox(height: 28),
              block(widget.screen == 1 ? 56 : 210),
              const SizedBox(height: 28),
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: block(20, width: 150),
              ),
              for (var i = 0; i < 4; i++) ...[
                const SizedBox(height: 24),
                Row(
                  children: [
                    block(44, width: 44),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          block(16),
                          const SizedBox(height: 10),
                          block(12, width: 110),
                        ],
                      ),
                    ),
                    const SizedBox(width: 24),
                    block(16, width: 64),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    ),
  );
}
