import 'dart:async';
import 'package:flutter/material.dart';
<<<<<<< HEAD

import '../routes/app_routers.dart'; // Import AppRoutes
import '../widgets/bottom_nav_bar.dart';
import '../widgets/stat_card_employee.dart';
=======
import 'package:intl/intl.dart';

import '../widgets/bottom_nav_bar.dart';
import '../widgets/employee_home/home_header.dart';
import '../widgets/employee_home/checkin_card.dart';
import '../widgets/employee_home/performance_card.dart';
import '../widgets/employee_home/hr_services_grid.dart';
import '../widgets/employee_home/internal_news_card.dart';
import 'camera_checkin.dart'; // Import màn hình camera
>>>>>>> a084c334e8c7cf84edd2d67dc131a8c94b2212a9

class HomeEmployeeScreen extends StatefulWidget {
  const HomeEmployeeScreen({super.key});

  @override
  State<HomeEmployeeScreen> createState() => _HomeEmployeeScreenState();
}

class _HomeEmployeeScreenState extends State<HomeEmployeeScreen> {
  int _selectedIndex = 0;
  bool _isSalaryVisible = true;

  Timer? _timer;
  DateTime _currentTime = DateTime.now();

  // Quản lý trạng thái Check-in
  bool _isCheckedIn = false;
  String _checkInTime = '--:--';

  final TimeOfDay _shiftStart = const TimeOfDay(hour: 8, minute: 30);

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _currentTime = DateTime.now();
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _getCountdownToShiftStart() {
    final now = _currentTime;
    final startDateTime = DateTime(
      now.year,
      now.month,
      now.day,
      _shiftStart.hour,
      _shiftStart.minute,
    );

    final difference = startDateTime.difference(now);

    if (difference.isNegative) {
      return 'Quá giờ vào ca';
    }

    final hours = difference.inHours;
    final minutes = difference.inMinutes.remainder(60);
    final seconds = difference.inSeconds.remainder(60);

    return 'Còn ${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  // Điều hướng mở Camera Chụp ảnh
  Future<void> _handleCheckIn() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CameraCheckInScreen(isCheckingIn: !_isCheckedIn),
      ),
    );

    // Xử lý khi chụp ảnh thành công và quay về Home
    if (result != null && result is Map<String, String>) {
      final String time = result['time'] ?? '';
      final String ip = result['ip'] ?? '';

      setState(() {
        if (!_isCheckedIn) {
          _isCheckedIn = true;
          _checkInTime = time;
        } else {
          _isCheckedIn = false;
        }
      });

      if (!mounted) return;

      final now = DateTime.now();
      final startDateTime = DateTime(
        now.year,
        now.month,
        now.day,
        _shiftStart.hour,
        _shiftStart.minute,
      );
      final isLate = now.isAfter(startDateTime);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(
                _isCheckedIn
                    ? (isLate ? Icons.warning_amber_rounded : Icons.check_circle_outline)
                    : Icons.exit_to_app,
                color: Colors.white,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _isCheckedIn
                      ? (isLate
                          ? 'Vào ca thành công lúc $time (Trễ) - IP: $ip'
                          : 'Vào ca thành công lúc $time (Đúng giờ) - IP: $ip')
                      : 'Ra ca thành công lúc $time! - IP: $ip',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ],
          ),
          backgroundColor: _isCheckedIn
              ? (isLate ? Colors.deepOrange : const Color(0xFF10B981))
              : Colors.blueAccent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  String _getFormattedDate() {
    final now = DateTime.now();
    final daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    return '${daysOfWeek[now.weekday - 1]}, ${DateFormat('dd/MM/yyyy').format(now)}';
  }

  @override
  Widget build(BuildContext context) {
    final timeFormat = DateFormat('hh:mm:ss').format(_currentTime);
    final period = DateFormat('a').format(_currentTime) == 'AM' ? 'SA' : 'CH';

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FC),
      body: SingleChildScrollView(
        child: Column(
          children: [
<<<<<<< HEAD
            // 1. HEADER + BACKGROUND
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  height: 210,
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 50, 20, 0),
                  decoration: const BoxDecoration(color: Color(0xFF3860F4)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getGreeting(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const CircleAvatar(
                            radius: 24,
                            backgroundImage: AssetImage('assets/images/bg.png'),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Họ tên nhân viên',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.25),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text(
                                  'Chức vụ nhân viên',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // 2 Nút thao tác nhanh
                Positioned(
                  bottom: -25,
                  left: 16,
                  right: 16,
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 52,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [
                                Color(0xFF6B11FF),
                                Color(0xFFB524FF),
                                Color(0xFF00E5FF),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: const [
                              BoxShadow(
                                color: Colors.black26,
                                blurRadius: 8,
                                offset: Offset(0, 4),
                              ),
                            ],
                          ),
                          child: InkWell(
                            onTap: () {},
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.touch_app, color: Colors.white),
                                SizedBox(width: 8),
                                Text(
                                  'Chấm công',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          height: 52,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: const [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 6,
                                offset: Offset(0, 3),
                              ),
                            ],
                          ),
                          child: InkWell(
                            onTap: () {},
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.attach_money, color: Colors.black),
                                SizedBox(width: 8),
                                Text(
                                  'Lương: số tiền',
                                  style: TextStyle(
                                    color: Colors.blue,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 40),

            // 2. KHỐI NỘI DUNG CHÍNH
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Tiện ích',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {},
                          child: const Row(
                            children: [
                              Text(
                                'Xem chi tiết',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 14,
                                ),
                              ),
                              Icon(
                                Icons.chevron_right,
                                size: 20,
                                color: Colors.grey,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Grid ô tiện ích
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      childAspectRatio: 2.5,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      children: [
                        // Chuyển trang khi nhấn Lịch làm việc
                        StatCardEmployee(
                          icon: Icons.calendar_today_outlined,
                          label: 'Lịch làm việc',
                          onTap: () {
                            Navigator.pushNamed(
                              context,
                              AppRoutes.work_schedule_employee,
                            );
                          },
                        ),
                        StatCardEmployee(
                          icon: Icons.attach_money_outlined,
                          label: 'Phiếu lương',
                          onTap: () {},
                        ),
                        StatCardEmployee(
                          icon: Icons.table_chart_outlined,
                          label: 'Bảng công',
                          onTap: () {},
                        ),
                        StatCardEmployee(
                          icon: Icons.newspaper_outlined,
                          label: 'Bản tin',
                          onTap: () {},
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                  ],
                ),
              ),
=======
            HomeHeader(
              formattedDate: _getFormattedDate(),
              greeting: _getGreeting(),
            ),
            const SizedBox(height: 16),
            CheckInCard(
              timeFormat: timeFormat,
              period: period,
              countdownText: _getCountdownToShiftStart(),
              onCheckIn: _handleCheckIn,
              isCheckedIn: _isCheckedIn,
              checkInTime: _checkInTime,
>>>>>>> a084c334e8c7cf84edd2d67dc131a8c94b2212a9
            ),
            const SizedBox(height: 20),
            PerformanceCard(
              isSalaryVisible: _isSalaryVisible,
              onToggleSalary: () {
                setState(() {
                  _isSalaryVisible = !_isSalaryVisible;
                });
              },
            ),
            const SizedBox(height: 20),
            const HrServicesGrid(),
            const SizedBox(height: 20),
            const InternalNewsCard(),
            const SizedBox(height: 30),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: 0,
      ),
    );
  }
}
