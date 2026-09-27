import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  bool _rememberMe = false;

  @override
  void initState() {
    super.initState();
    // Cấu hình Controller cho hiệu ứng trượt (Slide-up animation)
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 1), // Bắt đầu ở vị trí khuất bên dưới
      end: Offset.zero,          // Trượt lên vị trí gốc
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));

    // Kích hoạt hiệu ứng trượt ngay khi vào màn hình
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.blue[200], // Màu nền xanh nhạt cho toàn bộ màn hình
      body: Stack(
        children: [
          // 1. Ảnh background phía trên (Asset Image)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: size.height * 0.45,
            child: Stack(
              children: [
                Container(
                  decoration: const BoxDecoration(
                    image: DecorationImage(
                      image: AssetImage('assets/images/bg.png'), // Đổi tên file ảnh của bạn tại đây
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                // Lớp phủ đen mờ nhẹ giúp chữ Welcome nổi bật
                Container(
                  color: Colors.black.withOpacity(0.2),
                ),
                // Text Welcome Back
                Positioned(
  top: size.height * 0.12,
  left: 28,
  child: Text(
    'Welcome\nHuman Resources!',
    style: TextStyle(
      color: Colors.white,
      fontSize: 34,
      fontWeight: FontWeight.bold,
      height: 1.2,
      // Thêm danh sách các bóng ở đây
      shadows: [
        Shadow(
          offset: const Offset(2.0, 2.0), // Độ lệch x, y của bóng
          blurRadius: 6.0,                  // Độ mờ nhòe của bóng
          color: Colors.black.withOpacity(0.7), // Màu sắc và độ trong suốt của bóng
        ),
      ],
    ),
  ),
),
              ],
            ),
          ),

          // 2. Thẻ Login màu đen tự động trượt lên
          Align(
            alignment: Alignment.bottomCenter,
            child: SlideTransition(
              position: _slideAnimation,
              child: Container(
                height: size.height * 0.62,
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Color.fromARGB(255, 253, 252, 252), // Tone đen xám hiện đại
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(36),
                    topRight: Radius.circular(36),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black54,
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // Nút bấm hình tròn trượt nổi ở mép thẻ
                    Positioned(
                      top: -28,
                      right: 32,
                      child: FloatingActionButton(
                        onPressed: () {
                          // Thao tác đăng nhập
                        },
                        elevation: 6,
                        backgroundColor: Colors.white,
                        shape: const CircleBorder(),
                        child: const Icon(
                          Icons.arrow_forward,
                          color: Colors.black,
                        ),
                      ),
                    ),

                    // Nội dung form Login
                    Padding(
                      padding: const EdgeInsets.fromLTRB(28, 40, 28, 20),
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Login',
                              style: TextStyle(
                                color: Color.fromARGB(255, 0, 0, 0),
                                fontSize: 26,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 30),

                            // Input Email
                            TextField(
                              style: const TextStyle(color: Color.fromARGB(255, 0, 0, 0)),
                              decoration: InputDecoration(
                                hintText: 'Email address',
                                hintStyle: TextStyle(color: const Color.fromARGB(255, 11, 11, 11)),
                                enabledBorder: UnderlineInputBorder(
                                  borderSide: BorderSide(color: Colors.grey[800]!),
                                ),
                                focusedBorder: const UnderlineInputBorder(
                                  borderSide: BorderSide(color: Color.fromARGB(255, 0, 0, 0)),
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Input Password
                            TextField(
                              obscureText: true,
                              style: const TextStyle(color: Colors.black),
                              decoration: InputDecoration(
                                hintText: 'Password',
                                hintStyle: TextStyle(color: const Color.fromARGB(255, 11, 11, 11)),
                                suffixIcon: Icon(Icons.visibility_off_outlined, color: Colors.grey[500]),
                                enabledBorder: UnderlineInputBorder(
                                  borderSide: BorderSide(color: Colors.grey[800]!),
                                ),
                                focusedBorder: const UnderlineInputBorder(
                                  borderSide: BorderSide(color: Colors.white),
                                ),
                              ),
                            ),

                            // Quên mật khẩu
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () {},
                                child: Text(
                                  'Forgot password?',
                                  style: TextStyle(color: Colors.grey[400], fontSize: 13),
                                ),
                              ),
                            ),

                            // Option Remember me
                            Row(
                              children: [
                                SizedBox(
                                  height: 24,
                                  width: 24,
                                  child: Checkbox(
                                    value: _rememberMe,
                                    activeColor: Colors.white,
                                    checkColor: Colors.black,
                                    side: BorderSide(color: const Color.fromARGB(255, 10, 10, 10)!),
                                    onChanged: (value) {
                                      setState(() {
                                        _rememberMe = value ?? false;
                                      });
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Remember me',
                                  style: TextStyle(color: const Color.fromARGB(255, 9, 9, 9), fontSize: 14),
                                ),
                              ],
                            ),
                            const SizedBox(height: 35),

                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}