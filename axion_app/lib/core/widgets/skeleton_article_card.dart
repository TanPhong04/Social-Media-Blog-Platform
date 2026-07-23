import 'package:flutter/material.dart';

class SkeletonArticleCard extends StatefulWidget {
  const SkeletonArticleCard({super.key});

  @override
  State<SkeletonArticleCard> createState() => _SkeletonArticleCardState();
}

class _SkeletonArticleCardState extends State<SkeletonArticleCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Color?> _colorTween;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    
    _colorTween = ColorTween(
      begin: Colors.grey.shade900,
      end: Colors.grey.shade800,
    ).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _colorTween,
      builder: (context, child) {
        final color = _colorTween.value;
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          color: const Color(0xFF1F2937),
          elevation: 0,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(radius: 20, backgroundColor: color),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(width: 120, height: 16, color: color),
                        const SizedBox(height: 8),
                        Container(width: 80, height: 12, color: color),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(width: double.infinity, height: 16, color: color),
                const SizedBox(height: 8),
                Container(width: 200, height: 16, color: color),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  height: 200,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
