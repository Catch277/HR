import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Khởi tạo kết nối với Supabase
  await Supabase.initialize(
    url: 'https://fnirmgvwsdvbcwevhhfx.supabase.co', // URL dự án của bạn
    publishableKey: 'sb_publishable_G8C8TTehw-_sYzP4kSXixQ_2atfw3Igi',
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Human Resource App',
      home: const Scaffold(body: Center(child: Text('Supabase Connected!'))),
    );
  }
}
