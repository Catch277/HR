import 'package:flutter/material.dart';

class CreateLeaveRequestScreen extends StatefulWidget {
  const CreateLeaveRequestScreen({super.key});

  @override
  State<CreateLeaveRequestScreen> createState() =>
      _CreateLeaveRequestScreenState();
}

class _CreateLeaveRequestScreenState extends State<CreateLeaveRequestScreen> {
  // State quản lý loại nghỉ & ca làm việc
  int _selectedLeaveType = 0; // 0: Nghỉ phép năm, 1: Nghỉ ốm, 2: Việc riêng, 3: Không lương
  int _selectedShift = 0; // 0: Cả ngày, 1: Buổi sáng, 2: Buổi chiều

  final TextEditingController _reasonController = TextEditingController();

  final List<String> _quickSuggestions = [
    'Việc gia đình',
    'Đi khám sức khỏe',
    'Nghỉ ngơi tái tạo',
    'Việc cá nhân đột xuất'
  ];

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  // Hàm xử lý khi gửi đơn
  void _submitRequest() {
    final reason = _reasonController.text.trim();
    if (reason.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Vui lòng nhập lý do xin nghỉ!'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    // Tạo Map dữ liệu đơn nghỉ phép mới
    final newLeaveRequest = {
      'id': '#NP-2026-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      'timeStr': '• Vừa xong',
      'status': 'Chờ duyệt',
      'leaveType': _getLeaveTypeName(_selectedLeaveType),
      'leaveSubtitle': _getLeaveTypeSubtitle(_selectedLeaveType),
      'daysCount': '2.0 ngày công',
      'dateRange': '28/10/2026 - 29/10/2026',
      'shiftType': _selectedShift == 0 ? 'Cả ngày' : (_selectedShift == 1 ? 'Buổi sáng' : 'Buổi chiều'),
      'reason': reason,
      'stepIndex': 1,
      'totalSteps': 3,
    };

    // Quay lại màn hình danh sách và trả về đơn mới
    Navigator.pop(context, newLeaveRequest);
  }

  String _getLeaveTypeName(int index) {
    switch (index) {
      case 0:
        return 'Nghỉ phép năm';
      case 1:
        return 'Nghỉ ốm / Khám bệnh';
      case 2:
        return 'Việc riêng / Tang chế';
      case 3:
        return 'Nghỉ không lương';
      default:
        return 'Nghỉ phép năm';
    }
  }

  String _getLeaveTypeSubtitle(int index) {
    switch (index) {
      case 0:
        return 'Hưởng nguyên lương theo quy định';
      case 1:
        return 'Hưởng chế độ BHXH theo chỉ định';
      case 2:
        return 'Theo luật lao động';
      case 3:
        return 'Thỏa thuận quản lý';
      default:
        return 'Hưởng nguyên lương theo quy định';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FC),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Header (Nút back, Tiêu đề)
            _buildHeader(context),

            // 2. Nội dung Form nhập liệu
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  // Quỹ phép năm 2026
                  _buildQuotaCard(),
                  const SizedBox(height: 16),

                  // Loại hình nghỉ phép
                  _buildLeaveTypeSection(),
                  const SizedBox(height: 16),

                  // Ca làm việc & Chọn ngày
                  _buildShiftAndDateSection(),
                  const SizedBox(height: 16),

                  // Lý do xin nghỉ
                  _buildReasonSection(),
                  const SizedBox(height: 16),

                  // Người phê duyệt & Bàn giao
                  _buildApprovalAndHandoverSection(),
                  const SizedBox(height: 16),

                  // Tệp đính kèm
                  _buildAttachmentSection(),
                  const SizedBox(height: 24),

                  // Nút Gửi đơn & Lưu bản nháp
                  _buildSubmitButtons(),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Header
  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            decoration: const BoxDecoration(
              color: Color(0xFFEFF6FF),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new,
                  size: 18, color: Colors.black87),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          Column(
            children: const [
              Text(
                'Tạo đơn xin nghỉ phép',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Quy trình nhân sự tự động • 2026',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
          Container(
            decoration: const BoxDecoration(
              color: Color(0xFFEFF6FF),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(Icons.menu_book_outlined,
                  size: 20, color: Color(0xFF2563EB)),
              onPressed: () {},
            ),
          ),
        ],
      ),
    );
  }

  // Card Quỹ phép
  Widget _buildQuotaCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2563EB).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.umbrella_outlined,
                        size: 14, color: Colors.white),
                    SizedBox(width: 6),
                    Text(
                      'Quỹ phép năm 2026',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.25),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.circle, size: 8, color: Color(0xFF34D399)),
                    SizedBox(width: 4),
                    Text(
                      'Hợp lệ',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Số ngày phép khả dụng',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  SizedBox(height: 4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        '9.5',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        ' / 12 ngày',
                        style: TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                    ],
                  ),
                ],
              ),
              const Text(
                'Đã dùng: 2.5 ngày',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: const LinearProgressIndicator(
              value: 0.79,
              backgroundColor: Color(0xFF1E40AF),
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF34D399)),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('Còn lại 79% hạn mức',
                  style: TextStyle(color: Colors.white70, fontSize: 11)),
              Text('Hết hạn vào 31/12/2026',
                  style: TextStyle(color: Colors.white70, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }

  // Khối Loại hình nghỉ phép
  Widget _buildLeaveTypeSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              RichText(
                text: const TextSpan(
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87),
                  children: [
                    TextSpan(text: 'Loại hình nghỉ phép '),
                    TextSpan(text: '*', style: TextStyle(color: Colors.redAccent)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Có hưởng lương',
                  style: TextStyle(color: Color(0xFF2563EB), fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 2.1,
            children: [
              _buildLeaveTypeCard(0, 'Nghỉ phép năm', 'Khấu trừ vào quỹ',
                  Icons.sunny, const Color(0xFF2563EB)),
              _buildLeaveTypeCard(1, 'Nghỉ ốm / Khám', 'Hưởng chế độ BHXH',
                  Icons.local_hospital_outlined, const Color(0xFF10B981)),
              _buildLeaveTypeCard(2, 'Việc riêng / Ta...', 'Theo luật lao động',
                  Icons.favorite_border, const Color(0xFFEC4899)),
              _buildLeaveTypeCard(3, 'Không lương', 'Thỏa thuận quản lý',
                  Icons.event_busy_outlined, const Color(0xFF6B7280)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLeaveTypeCard(int index, String title, String subtitle,
      IconData icon, Color iconColor) {
    final isSelected = _selectedLeaveType == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedLeaveType = index),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade200,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected
                    ? const Color(0xFF2563EB)
                    : iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon,
                  size: 18, color: isSelected ? Colors.white : iconColor),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isSelected
                          ? const Color(0xFF2563EB)
                          : Colors.black87,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle,
                  size: 16, color: Color(0xFF2563EB)),
          ],
        ),
      ),
    );
  }

  // Khối Ca làm việc & Chọn ngày
  Widget _buildShiftAndDateSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: const TextSpan(
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87),
              children: [
                TextSpan(text: 'Ca làm việc áp dụng '),
                TextSpan(text: '*', style: TextStyle(color: Colors.redAccent)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                _buildShiftOption(0, Icons.sunny, 'Cả ngày'),
                _buildShiftOption(1, Icons.wb_twighlight, 'Buổi sáng'),
                _buildShiftOption(2, Icons.nightlight_round, 'Buổi chiều'),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Chọn từ ngày - đến ngày
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Từ ngày',
                        style: TextStyle(fontSize: 11, color: Colors.grey)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Icon(Icons.calendar_today_outlined,
                              size: 16, color: Color(0xFF2563EB)),
                          Text('10/28/2024',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13)),
                          Icon(Icons.calendar_month,
                              size: 16, color: Colors.grey),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Đến ngày',
                        style: TextStyle(fontSize: 11, color: Colors.grey)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Icon(Icons.calendar_today_outlined,
                              size: 16, color: Color(0xFF2563EB)),
                          Text('10/29/2024',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13)),
                          Icon(Icons.calendar_month,
                              size: 16, color: Colors.grey),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Tính toán số ngày
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.access_time,
                        size: 16, color: Color(0xFF2563EB)),
                    SizedBox(width: 8),
                    Text(
                      'Thời gian nghỉ tính toán:',
                      style: TextStyle(fontSize: 13, color: Colors.black87),
                    ),
                  ],
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    '2.0 ngày công',
                    style: TextStyle(
                      color: Color(0xFF2563EB),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShiftOption(int index, IconData icon, String label) {
    final isSelected = _selectedShift == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedShift = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                        color: Colors.black.withOpacity(0.05), blurRadius: 4)
                  ]
                : [],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  size: 14,
                  color: isSelected ? const Color(0xFF2563EB) : Colors.grey),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? const Color(0xFF2563EB) : Colors.grey,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Khối Lý do xin nghỉ
  Widget _buildReasonSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              RichText(
                text: const TextSpan(
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87),
                  children: [
                    TextSpan(text: 'Lý do xin nghỉ '),
                    TextSpan(text: '*', style: TextStyle(color: Colors.redAccent)),
                  ],
                ),
              ),
              const Text('Tối thiểu 10 ký tự',
                  style: TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _reasonController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Nhập lý do cụ thể hoặc chọn gợi ý bên dưới...',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey),
              filled: true,
              fillColor: const Color(0xFFF9FAFB),
              contentPadding: const EdgeInsets.all(12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Text('Gợi ý nhanh:',
              style: TextStyle(fontSize: 11, color: Colors.grey)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _quickSuggestions.map((text) {
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _reasonController.text = text;
                  });
                },
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(text,
                      style: const TextStyle(
                          fontSize: 11, color: Colors.black87)),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // Khối Người phê duyệt & Bàn giao công việc
  Widget _buildApprovalAndHandoverSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Người phê duyệt trực tiếp',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.circle, size: 6, color: Color(0xFF10B981)),
                    SizedBox(width: 4),
                    Text('Tự động điều phối',
                        style:
                            TextStyle(color: Color(0xFF10B981), fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Thẻ Quản lý trực tiếp
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Stack(
                  children: [
                    const CircleAvatar(
                      radius: 18,
                      backgroundImage: AssetImage('assets/images/avt.png'),
                    ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Color(0xFF10B981),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('Trần Đình Quân',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 13)),
                      Text('Head of Engineering (Quản lý trực tiếp)',
                          style: TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                ),
                const Icon(Icons.verified, size: 18, color: Color(0xFF2563EB)),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Bàn giao công việc
          RichText(
            text: const TextSpan(
              style: TextStyle(fontSize: 13, color: Colors.black87),
              children: [
                TextSpan(
                    text: 'Bàn giao công việc ',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                TextSpan(
                    text: '(Tùy chọn)',
                    style: TextStyle(color: Colors.grey, fontSize: 11)),
              ],
            ),
          ),
          const SizedBox(height: 8),

          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: const [
                Icon(Icons.person_search_outlined,
                    size: 18, color: Colors.grey),
                SizedBox(width: 8),
                Text('Tìm đồng nghiệp theo tên hoặc mã nhân viên...',
                    style: TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Nhân viên được chọn bàn giao
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 14,
                  backgroundImage: AssetImage('assets/images/avt.png'),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('Lê Phương Thảo',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 12)),
                      Text('Product Designer • #NV-2104',
                          style: TextStyle(fontSize: 10, color: Colors.grey)),
                    ],
                  ),
                ),
                const Icon(Icons.close, size: 16, color: Colors.grey),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Khối Tệp đính kèm
  Widget _buildAttachmentSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: const TextSpan(
              style: TextStyle(fontSize: 13, color: Colors.black87),
              children: [
                TextSpan(
                    text: 'Tệp đính kèm / Giấy tờ y tế ',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                TextSpan(
                    text: '(Tùy chọn)',
                    style: TextStyle(color: Colors.grey, fontSize: 11)),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: const Color(0xFF2563EB).withOpacity(0.3),
                  style: BorderStyle.solid),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Color(0xFFEFF6FF),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.cloud_upload_outlined,
                      color: Color(0xFF2563EB), size: 24),
                ),
                const SizedBox(height: 8),
                const Text('Chạm để chọn tệp hoặc chụp ảnh',
                    style:
                        TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 2),
                const Text('PNG, JPG, PDF (Dung lượng tối đa 10MB)',
                    style: TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 2 Nút Gửi đơn & Lưu bản nháp
  Widget _buildSubmitButtons() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton.icon(
            onPressed: _submitRequest,
            icon: const Icon(Icons.send_rounded, size: 18, color: Colors.white),
            label: const Text(
              'Gửi đơn phê duyệt',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          height: 44,
          child: TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.bookmark_border_rounded,
                size: 18, color: Colors.black54),
            label: const Text(
              'Lưu bản nháp',
              style: TextStyle(color: Colors.black54, fontSize: 14),
            ),
          ),
        ),
      ],
    );
  }
}