import 'package:flutter/material.dart';
import '../widgets/work_schedule_item_card.dart';

class WorkScheduleEmployeeScreen extends StatefulWidget {
  const WorkScheduleEmployeeScreen({super.key});

  @override
  State<WorkScheduleEmployeeScreen> createState() =>
      _WorkScheduleEmployeeScreenState();
}

class _WorkScheduleEmployeeScreenState
    extends State<WorkScheduleEmployeeScreen> {
 

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: SingleChildScrollView(
        child: Column(
          children: [

            // 1. HEADER + THÔNG TIN NHÂN VIÊN
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(10, 50, 20, 24),
              decoration: const BoxDecoration(
                color: Color(0xFF3860F4),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                  bottomRight: Radius.circular(24),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  //hàng chứa nút back và tiêu đề
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_outlined, 
                        color: Colors.white,
                        size: 22
                      ),
                        
                      onPressed: () {
                         if (Navigator.canPop(context)) {
                          Navigator.pop(context); //quay lại màn hình trước đó
                         }
                        },
                      ),
                      const SizedBox(width: 4),
                      const Text(
                        'Lịch làm việc',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 26,
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

            const SizedBox(height: 20),

            // 2. DANH SÁCH CÁC BOX CHỨC NĂNG (DẠNG CỘT DỌC)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Danh mục quản lý',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Box 1: Lịch sử chấm công (Màu cam/vàng)
                  WorkScheduleItemCard(
                    title: 'Lịch sử chấm công',
                    subtitle: 'Xem lại thời gian check-in, check-out hàng ngày',
                    icon: Icons.history,
                    iconBgColor: const Color(0xFFFF9800),
                    onTap: () {
                      // Chuyển sang màn hình Lịch sử chấm công
                    },
                  ),

                  // Box 2: Đăng ký ca làm (Màu Xanh lá)
                  WorkScheduleItemCard(
                    title: 'Đăng ký ca làm',
                    subtitle: 'Đăng ký các ca làm việc mong muốn trong tuần/tháng',
                    icon: Icons.edit_calendar,
                    iconBgColor: const Color(0xFF4CAF50),
                    onTap: () {
                      // Chuyển sang màn hình Đăng ký ca làm
                    },
                  ),

                  // Box 3: Lịch phân ca (Màu Tím)
                  WorkScheduleItemCard(
                    title: 'Lịch phân ca',
                    subtitle: 'Theo dõi ca làm chính thức do quản lý xếp',
                    icon: Icons.calendar_month,
                    iconBgColor: const Color(0xFF9C27B0),
                    onTap: () {
                      // Chuyển sang màn hình Lịch phân ca
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),

      
    );
  }
}