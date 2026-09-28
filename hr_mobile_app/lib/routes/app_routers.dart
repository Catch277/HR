import 'package:flutter/material.dart';
import '../models/login_screen.dart';
import '../models/home_employee.dart';
import '../models/work_schedule_employee.dart';

class AppRoutes {
  // 1. Định nghĩa Tên đường dẫn (Route Names)
  static const String initial = '/';
  static const String login = '/login';
  static const String home_employee = '/employee/home';
  static const String work_schedule_employee = '/employee/workschedule';
  // Ví dụ các trang sau này bạn sẽ thêm vào:
  // static const String home = '/home';
  // static const String profile = '/profile';

  // 2. Map các tên đường dẫn với Screen/Widget tương ứng
  static Map<String, WidgetBuilder> getRoutes() {
    return {
      initial: (context) => const LoginScreen(),      // Thêm route mặc định /
      login: (context) => const LoginScreen(),
      home_employee: (context) => const HomeEmployeeScreen(),
      work_schedule_employee: (context) => const WorkScheduleEmployeeScreen(),
      // home: (context) => const HomeScreen(),
      // profile: (context) => const ProfileScreen(),
    };
  }
}