import 'package:flutter/material.dart';

class StatCardEmployee extends StatelessWidget {
  final IconData? icon;
  final String label;
  final VoidCallback? onTap; // Callback sự kiện nhấn

  const StatCardEmployee({
    super.key,
    required this.label,
    this.icon, // Khởi tạo icon
    this.onTap, // Khởi tạo callback
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12), // Bo góc
        border: Border.all(
          color: Colors.blueAccent.withOpacity(0.2),
          width: 1.5,
        ), // Viền
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap, // Gọi callback khi nhấn
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                if (icon != null) ...[
                  Icon(
                    icon,
                    color: Colors.blueAccent,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 14, // Giảm nhẹ font size để không bị vỡ giao diện trong ô Grid
                      color: Colors.black87,
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}