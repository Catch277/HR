import 'package:flutter/material.dart';
import '../widgets/bottom_nav_bar.dart';
import '../widgets/widget_work_schedule.dart';
import 'package:flutter/gestures.dart';

class AppScrollBehavior extends MaterialScrollBehavior {
  @override
  Set<PointerDeviceKind> get dragDevices => {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse, // Cho phép kéo cuộn bằng chuột
        PointerDeviceKind.trackpad, // Cho phép lướt trackpad
      };
}

class WorkScheduleScreen extends StatelessWidget {
  const WorkScheduleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FC),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header Thông tin cá nhân
              const ScheduleHeaderCard(),
              const SizedBox(height: 12),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: const [
                    // Banner Đăng ký ca mở
                    OpenShiftBanner(),
                    SizedBox(height: 12),

                    // Chọn tuần
                    WeekSelectorCard(),
                    SizedBox(height: 12),

                    // Card trạng thái chốt lịch
                    ScheduleStatusCard(),
                    SizedBox(height: 16),

                    // Bảng Lịch tuần cuộn ngang
                    WeeklyScheduleTable(),
                    SizedBox(height: 16),

                    // Chú thích ca làm việc
                    ShiftLegend(),
                    SizedBox(height: 20),

                    // Nút thao tác dưới cùng
                    ScheduleFooterButtons(),
                    SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      
      
    );
  }
}