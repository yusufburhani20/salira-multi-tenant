import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

import 'dashboard_screen.dart';

void main() {
  runApp(const SaliraApp());
}

class SaliraApp extends StatelessWidget {
  const SaliraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Salira Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0037B0), // Salira Primary Blue
          primary: const Color(0xFF0037B0),
          secondary: const Color(0xFF006195),
        ),
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      home: const AuthCheck(),
    );
  }
}

class AuthCheck extends StatefulWidget {
  const AuthCheck({super.key});

  @override
  State<AuthCheck> createState() => _AuthCheckState();
}

class _AuthCheckState extends State<AuthCheck> {
  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    
    // Memberikan waktu agar sistem memuat dan transisi terlihat halus
    await Future.delayed(const Duration(milliseconds: 300));

    if (mounted) {
      if (token != null && token.isNotEmpty) {
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) => const DashboardScreen(),
            transitionDuration: Duration.zero,
            reverseTransitionDuration: Duration.zero,
          ),
        );
      } else {
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) => const LoginScreen(),
            transitionDuration: Duration.zero,
            reverseTransitionDuration: Duration.zero,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF0037B0),
      body: Center(
        child: CircularProgressIndicator(color: Colors.white),
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  // Mendapatkan Base URL yang sesuai (Web vs Emulator vs Device)
  String getBaseUrl() {
    if (kIsWeb) {
      return 'http://127.0.0.1:8001/api/v1';
    } else if (Platform.isAndroid) {
      // 10.0.2.2 is localhost for Android Emulators
      return 'http://10.0.2.2:8001/api/v1';
    } else {
      return 'http://127.0.0.1:8001/api/v1';
    }
  }

  Future<void> _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final url = Uri.parse('${getBaseUrl()}/login');
      final response = await http.post(
        url,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'identifier': _emailController.text,
          'password': _passwordController.text,
          'device_name': 'flutter_mobile',
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['access_token'];
        final user = data['user'];

        // Simpan token dan data user
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        
        if (user != null) {
          await prefs.setString('user_name', user['name'] ?? '');
          await prefs.setString('user_role', user['role'] ?? (user['nisn'] != null ? 'siswa' : 'guru'));
          await prefs.setString('user_identifier', user['nisn'] ?? user['email'] ?? '');
        }

        // Pindah ke Dashboard
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const DashboardScreen()),
          );
        }
      } else {
        setState(() {
          try {
            final errorData = jsonDecode(response.body);
            if (errorData['errors'] != null && errorData['errors']['identifier'] != null) {
              _errorMessage = errorData['errors']['identifier'][0];
            } else {
              _errorMessage = errorData['message'] ?? 'Login gagal. Periksa kembali kredensial Anda.';
            }
          } catch (e) {
            _errorMessage = 'Login gagal. Periksa kembali kredensial Anda.';
          }
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Tidak dapat terhubung ke server: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showRegistrationSheet() {
    String selectedSchool = 'Sekolah A';
    final List<String> schools = ['Sekolah A', 'Sekolah B', 'Sekolah C'];
    
    // State for password check
    double passwordStrength = 0;
    Color strengthColor = Colors.red;
    String strengthText = 'Sangat Lemah';
    
    bool passwordsMatch = true;
    String passwordValue = '';
    String confirmPasswordValue = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
            child: Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              ),
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(child: Container(width: 50, height: 5, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)))),
                  const SizedBox(height: 24),
                  const Text('Registrasi', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0037B0)), textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  const Text('Pendaftaran ini khusus untuk akun dengan Role Guru atau Pegawai. Siswa didaftarkan oleh admin.', style: TextStyle(color: Colors.grey, fontSize: 13), textAlign: TextAlign.center),
                  const SizedBox(height: 32),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextField(decoration: InputDecoration(labelText: 'NIP / NUPTK (Opsional)', prefixIcon: const Icon(Icons.badge), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
                          const SizedBox(height: 16),
                          TextField(decoration: InputDecoration(labelText: 'Nama Lengkap', prefixIcon: const Icon(Icons.person), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
                          const SizedBox(height: 16),
                          TextField(
                            decoration: InputDecoration(labelText: 'No HP Aktif (Wajib)', prefixIcon: const Icon(Icons.phone), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                            keyboardType: TextInputType.phone,
                          ),
                          const SizedBox(height: 16),
                          TextField(decoration: InputDecoration(labelText: 'Email', prefixIcon: const Icon(Icons.email), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            value: selectedSchool,
                            decoration: InputDecoration(
                              labelText: 'Pilih Sekolah',
                              prefixIcon: const Icon(Icons.school),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            items: schools.map((String value) {
                              return DropdownMenuItem<String>(
                                value: value,
                                child: Text(value),
                              );
                            }).toList(),
                            onChanged: (newValue) {
                              setModalState(() {
                                selectedSchool = newValue!;
                              });
                            },
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            obscureText: true,
                            decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                            onChanged: (value) {
                              setModalState(() {
                                passwordValue = value;
                                // Simple strength check
                                if (value.isEmpty) {
                                  passwordStrength = 0;
                                  strengthText = 'Kosong';
                                } else if (value.length < 6) {
                                  passwordStrength = 0.3;
                                  strengthColor = Colors.red;
                                  strengthText = 'Lemah';
                                } else if (value.length < 10 || !value.contains(RegExp(r'[0-9]'))) {
                                  passwordStrength = 0.6;
                                  strengthColor = Colors.orange;
                                  strengthText = 'Sedang';
                                } else {
                                  passwordStrength = 1.0;
                                  strengthColor = Colors.green;
                                  strengthText = 'Kuat';
                                }
                                
                                passwordsMatch = confirmPasswordValue.isEmpty || passwordValue == confirmPasswordValue;
                              });
                            },
                          ),
                          const SizedBox(height: 8),
                          if (passwordValue.isNotEmpty)
                            Row(
                              children: [
                                Expanded(
                                  child: LinearProgressIndicator(
                                    value: passwordStrength,
                                    backgroundColor: Colors.grey.shade300,
                                    color: strengthColor,
                                    minHeight: 6,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                SizedBox(
                                  width: 50,
                                  child: Text(strengthText, style: TextStyle(color: strengthColor, fontSize: 12, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          const SizedBox(height: 16),
                          TextField(
                            obscureText: true,
                            decoration: InputDecoration(
                              labelText: 'Konfirmasi Password', 
                              prefixIcon: const Icon(Icons.lock_clock), 
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              errorText: !passwordsMatch && confirmPasswordValue.isNotEmpty ? 'Password tidak sama' : null,
                            ),
                            onChanged: (value) {
                              setModalState(() {
                                confirmPasswordValue = value;
                                passwordsMatch = passwordValue == confirmPasswordValue;
                              });
                            },
                          ),
                          const SizedBox(height: 32),
                          ElevatedButton(
                            onPressed: passwordsMatch && passwordValue.isNotEmpty && confirmPasswordValue.isNotEmpty ? () { Navigator.pop(context); } : null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0037B0), // Biru Salira
                              foregroundColor: Colors.white, 
                              disabledBackgroundColor: Colors.grey.shade300,
                              disabledForegroundColor: Colors.grey.shade500,
                              minimumSize: const Size(double.infinity, 50), 
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                            ),
                            child: const Text('Daftar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showForgotPasswordSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          height: MediaQuery.of(context).size.height * 0.5,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(child: Container(width: 50, height: 5, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)))),
              const SizedBox(height: 24),
              const Text('Lupa Password', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0037B0)), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              const Text('Masukkan email Anda untuk menerima link reset password', style: TextStyle(color: Colors.grey, fontSize: 13), textAlign: TextAlign.center),
              const SizedBox(height: 32),
              TextField(decoration: InputDecoration(labelText: 'Email Anda', prefixIcon: const Icon(Icons.email), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () { Navigator.pop(context); },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0037B0), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: const Text('Kirim Link Reset', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0037B0),
      body: Column(
        children: [
          SizedBox(height: MediaQuery.of(context).padding.top + 24),
          Expanded(
            child: Container(
              clipBehavior: Clip.antiAlias,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
              ),
              child: Stack(
                children: [
          // Blue Accents
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF0037B0).withOpacity(0.03),
              ),
            ),
          ),
          Positioned(
            bottom: -150,
            right: -100,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF2563EB).withOpacity(0.04),
              ),
            ),
          ),
          
          // Background Knowledge Accents
          Positioned(
            right: -60,
            top: 40,
            child: Transform.rotate(
              angle: 0.2,
              child: Icon(
                Icons.school_outlined,
                size: 280,
                color: const Color(0xFF0037B0).withOpacity(0.03),
              ),
            ),
          ),
          Positioned(
            left: -40,
            bottom: 120,
            child: Transform.rotate(
              angle: -0.15,
              child: Icon(
                Icons.auto_stories_outlined, // Buku terbuka
                size: 220,
                color: const Color(0xFF0037B0).withOpacity(0.03),
              ),
            ),
          ),
          
          // Main Form Content
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo & Branding
                    Center(
                      child: Image.asset(
                        'assets/images/logo-salira.png',
                        height: 80,
                        color: const Color(0xFF0037B0), // Salira Primary Blue
                        errorBuilder: (context, error, stackTrace) =>
                            const Icon(Icons.domain, color: Color(0xFF0037B0), size: 80),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'SALIRA',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0037B0),
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Silakan masuk ke akun Anda',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 48),

                    // Error Message
                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 24),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: Colors.red, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: TextStyle(color: Colors.red.shade700, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Form Inputs
                    const Text('Email atau NIP', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0037B0))),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _emailController,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.person_outline, color: Colors.grey),
                        hintText: 'contoh: nama@sekolah.com',
                        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        contentPadding: const EdgeInsets.symmetric(vertical: 16),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF0037B0), width: 1.5),
                        ),
                      ),
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 20),
                    
                    const Text('Password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0037B0))),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.lock_outline, color: Colors.grey),
                        hintText: 'Masukkan password Anda',
                        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        contentPadding: const EdgeInsets.symmetric(vertical: 16),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF0037B0), width: 1.5),
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: _showForgotPasswordSheet,
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFF0037B0),
                          padding: EdgeInsets.zero,
                          minimumSize: const Size(50, 30),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Lupa Password?', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      ),
                    ),

                    const SizedBox(height: 32),
                    
                    // Submit Button
                    ElevatedButton(
                      onPressed: _isLoading ? null : _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0037B0),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 20), // Perbesar ukuran tombol
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Login', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1)),
                    ),

                    const SizedBox(height: 32),
                    
                    // Fingerprint / Biometric Option
                    Column(
                      children: [
                        const Text('Atau masuk cepat dengan', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        const SizedBox(height: 16),
                        InkWell(
                          onTap: () {
                            // TODO: Panggil fungsi local_auth di sini jika fitur diaktifkan
                          },
                          borderRadius: BorderRadius.circular(50),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFF0037B0).withOpacity(0.05),
                              border: Border.all(color: const Color(0xFF0037B0).withOpacity(0.2)),
                            ),
                            child: const Icon(Icons.fingerprint, size: 40, color: Color(0xFF0037B0)),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 100), // Ruang ekstra untuk kotak pull-up
                  ],
                ),
              ),
            ),
          ),
          
          // Registration Pull-up Box
          Align(
            alignment: Alignment.bottomCenter,
            child: GestureDetector(
              onTap: _showRegistrationSheet,
              onVerticalDragUpdate: (details) {
                if (details.primaryDelta! < -5) {
                  // Swiped up
                  _showRegistrationSheet();
                }
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.only(top: 12, bottom: 24),
                decoration: const BoxDecoration(
                  color: Color(0xFF0037B0),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, -2))],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.keyboard_arrow_up, color: Colors.white),
                    const SizedBox(height: 4),
                    const Text('Registrasi Guru Baru', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
          ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
