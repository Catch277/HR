import 'package:flutter/material.dart';
import '../widgets/stat_card_employee.dart';
import '../widgets/dropdown_filter_employee.dart';

class HomeEmployeeScreen extends StatefulWidget {
  const HomeEmployeeScreen({super.key});

  @override
  State<HomeEmployeeScreen> createState() => _HomeEmployeeScreenState();
}

class _HomeEmployeeScreenState extends State<HomeEmployeeScreen> {
  int _selectedIndex = 0;

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) {
      return 'Chào buổi sáng!';
    } else if (hour >= 12 && hour < 18) {
      return 'Chào buổi chiều!';
    } else {
      return 'Chào buổi tối!';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 1. HEADER + BACKGROUND
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  height: 240,
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 50, 20, 0),
                  decoration: const BoxDecoration(
                    color: Color(0xFF3860F4),
                  ),
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
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.25),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text(
                                  'Chức vụ nhân viên',
                                  style: TextStyle(color: Colors.white, fontSize: 12),
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
                              BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 4)),
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
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
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
                              BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 3)),
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
                                  style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 15),
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

            // 2. KHỐI NỘI DUNG CHÍNH (TỔNG QUAN THÁNG)
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
                    // Filter Bộ lọc (Gọi từ Widget)
                    const Row(
                      children: [
                        Expanded(
                          child: DropdownFilterEmployee(
                            icon: Icons.store,
                            title: 'Tất cả chi nhánh',
                          ),
                        ),
                        SizedBox(width: 10),
                        Expanded(
                          child: DropdownFilterEmployee(
                            icon: Icons.calendar_today,
                            title: 'Hôm nay',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Tiêu đề
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Tổng quan tháng',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        GestureDetector(
                          onTap: () {},
                          child: const Row(
                            children: [
                              Text('Xem chi tiết', style: TextStyle(color: Colors.grey, fontSize: 14)),
                              Icon(Icons.chevron_right, size: 20, color: Colors.grey),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Grid ô thống kê (Gọi từ StatCard Widget)
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      childAspectRatio: 2.5,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      children: const [
                        StatCardEmployee(count: '0', label: 'Đi muộn'),
                        StatCardEmployee(count: '0', label: 'Về sớm'),
                        StatCardEmployee(count: '0', label: 'Quên check-in'),
                        StatCardEmployee(count: '0', label: 'Quên check-out'),
                        StatCardEmployee(count: '0', label: 'Nghỉ phép'),
                        StatCardEmployee(count: '0', label: 'Nghỉ không phép'),
                      ],
                    ),
                    const SizedBox(height: 10),

                    const StatCardEmployee(count: '0', label: 'Tổng số giờ công trong tháng'),
                    const SizedBox(height: 10),
                    const StatCardEmployee(count: '0', label: 'Tổng lương trong tháng'),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),

      // 3. BOTTOM NAVIGATION BAR
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        selectedItemColor: const Color(0xFF3860F4),
        unselectedItemColor: Colors.grey,
        selectedFontSize: 14,
        unselectedFontSize: 13,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined, size: 26), label: 'Trang chủ'),
          BottomNavigationBarItem(icon: Icon(Icons.list_alt_rounded, size: 26), label: 'Công việc'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline, size: 26), label: 'Tin nhắn'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline, size: 26), label: 'Tài khoản'),
        ],
      ),
    );
  }
}