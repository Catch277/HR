import 'package:flutter/material.dart';
import '../../routes/app_routers.dart';


class HrServicesGrid extends StatelessWidget {
  const HrServicesGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Dịch Vụ Nhân Sự',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              GestureDetector(
                onTap: () {},
                child: Row(
                  children: const [
                    Text(
                      'Tất cả (12)',
                      style: TextStyle(
                        color: Color(0xFF2563EB),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Icon(Icons.chevron_right, size: 18, color: Color(0xFF2563EB)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.9,
            children: [
              _buildServiceCard(
                title: 'Lịch làm việc',
                subtitle: 'Ca & Tuần',
                icon: Icons.calendar_month_outlined,
                iconColor: const Color(0xFF3B82F6),
                bgColor: const Color(0xFFEFF6FF),
                onTap: () {
                  Navigator.pushNamed(context, AppRoutes.work_schedule_employee);
                },
              ),
              _buildServiceCard(
                title: 'Xin nghỉ phép',
                subtitle: 'Tạo yêu cầu',
                icon: Icons.note_alt_outlined,
                iconColor: const Color(0xFF10B981),
                bgColor: const Color(0xFFECFDF5),
                onTap: () {
                  Navigator.pushNamed(context, AppRoutes.leave_request_employee);
                },
              ),
              _buildServiceCard(
                title: 'Phiếu lương',
                subtitle: 'Bảo mật PIN',
                icon: Icons.account_balance_wallet_outlined,
                iconColor: const Color(0xFFF59E0B),
                bgColor: const Color(0xFFFEF3C7),
                onTap: () {},
              ),
              _buildServiceCard(
                title: 'Bảng công',
                subtitle: 'Lịch sử check',
                icon: Icons.assignment_outlined,
                iconColor: const Color(0xFF6366F1),
                bgColor: const Color(0xFFEEF2FF),
                onTap: () {},
              ),
              _buildServiceCard(
                title: 'Đăng ký OT',
                subtitle: 'Tăng ca 1.5x',
                icon: Icons.language,
                iconColor: const Color(0xFFA855F7),
                bgColor: const Color(0xFFF3E8FF),
                onTap: () {},
              ),
              _buildServiceCard(
                title: 'Phúc lợi',
                subtitle: 'Bảo hiểm 24/7',
                icon: Icons.favorite_border,
                iconColor: const Color(0xFFEC4899),
                bgColor: const Color(0xFFFCE7F3),
                onTap: () {},
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildServiceCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
                  child: Icon(icon, color: iconColor, size: 22),
                ),
                const SizedBox(height: 10),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}