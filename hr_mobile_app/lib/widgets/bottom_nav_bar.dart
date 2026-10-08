import 'package:flutter/material.dart';
import '../routes/app_routers.dart'; // Import AppRoutes

class BottomNavBar extends StatelessWidget {
  final int currentIndex;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
  });

  void _onItemTapped(BuildContext context, int index) {
    if (index == currentIndex) return;

    switch (index) {
      case 0: // Tab Trang chủ
        Navigator.pushReplacementNamed(context, AppRoutes.home_employee);
        break;
      case 1: // Tab Bản tin 
        break;
      case 2: // Tab Tin nhắn 
        break;
      case 3: // Tab Tài khoản
        Navigator.pushReplacementNamed(context, AppRoutes.account_employee);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      selectedItemColor: const Color(0xFF3860F4),
      unselectedItemColor: Colors.grey,
      selectedFontSize: 14,
      unselectedFontSize: 13,
      type: BottomNavigationBarType.fixed,
      onTap: (index) => _onItemTapped(context, index),
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined, size: 26),
          label: 'Trang chủ',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.newspaper_outlined, size: 26),
          label: 'Bản tin',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.chat_bubble_outline, size: 26),
          label: 'Tin nhắn',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline, size: 26),
          label: 'Tài khoản',
        ),
      ],
    );
  }
}