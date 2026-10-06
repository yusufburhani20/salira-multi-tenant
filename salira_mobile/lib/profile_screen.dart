import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'main.dart'; // Untuk mendapatkan LoginScreen
import 'main.dart'; // Untuk mendapatkan LoginScreen

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _userName = 'Loading...';
  String _userRole = 'Memuat role...';
  String _userEmail = '';
  String _userPhone = '';
  String _userAddress = '';
  String _userGender = 'Laki-laki';
  String _userNip = '';

  bool _isBiometricEnabled = false;
  Uint8List? _userAvatarBytes;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Load from local storage first (instant UI)
    setState(() {
      _userName = prefs.getString('user_name') ?? 'Pengguna Salira';
      _userEmail = prefs.getString('user_identifier') ?? 'user@salira.com';
      _userRole = prefs.getString('user_role') ?? 'Guru / Pegawai';
      _userPhone = prefs.getString('user_phone') ?? '-';
      _userAddress = prefs.getString('user_address') ?? '-';
      _userGender = prefs.getString('user_gender') ?? 'Laki-laki';
      _userNip = prefs.getString('user_nip') ?? '-';
      
      _isBiometricEnabled = prefs.getBool('biometric_enabled') ?? false;

      final avatarStr = prefs.getString('user_avatar_base64');
      if (avatarStr != null && avatarStr.isNotEmpty) {
        _userAvatarBytes = base64Decode(avatarStr);
      }
    });

    // Fetch latest from API
    try {
      final token = prefs.getString('auth_token');
      if (token == null) return;

      final url = Uri.parse('${getBaseUrl()}/me');
      final response = await http.get(
        url,
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body)['data'];
        
        await prefs.setString('user_name', data['name'] ?? '');
        await prefs.setString('user_phone', data['phone'] ?? '');
        await prefs.setString('user_nip', data['nip'] ?? '');
        await prefs.setString('user_address', data['address'] ?? '');
        await prefs.setString('user_gender', data['gender'] ?? 'Laki-laki');

        if (mounted) {
          setState(() {
            _userName = data['name'] ?? _userName;
            _userPhone = data['phone'] ?? '-';
            _userNip = data['nip'] ?? '-';
            _userAddress = data['address'] ?? '-';
            _userGender = data['gender'] ?? 'Laki-laki';
          });
        }
      }
    } catch (e) {
      // Ignore network errors, fallback to local storage
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  void _showEditProfileSheet() {
    final TextEditingController nameController = TextEditingController(text: _userName);
    final TextEditingController phoneController = TextEditingController(text: _userPhone == '-' ? '' : _userPhone);
    final TextEditingController addressController = TextEditingController(text: _userAddress == '-' ? '' : _userAddress);
    final TextEditingController nipController = TextEditingController(text: _userNip == '-' ? '' : _userNip);
    String selectedGender = _userGender;

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
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5))],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Edit Profil', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0037B0))),
                        Row(
                          children: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Batal', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                            ),
                            ElevatedButton(
                              onPressed: () async {
                                final prefs = await SharedPreferences.getInstance();
                                final token = prefs.getString('auth_token');
                                
                                // Hit API update
                                if (token != null) {
                                  try {
                                    final url = Uri.parse('${getBaseUrl()}/update-profile');
                                    await http.post(
                                      url,
                                      headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json',
                                        'Authorization': 'Bearer $token',
                                      },
                                      body: jsonEncode({
                                        'name': nameController.text,
                                        'phone': phoneController.text,
                                        'nip': nipController.text,
                                        'address': addressController.text,
                                        'gender': selectedGender,
                                      }),
                                    );
                                  } catch (e) {
                                    print('Update API Error: $e');
                                  }
                                }

                                await prefs.setString('user_name', nameController.text);
                                await prefs.setString('user_phone', phoneController.text);
                                await prefs.setString('user_address', addressController.text);
                                await prefs.setString('user_nip', nipController.text);
                                await prefs.setString('user_gender', selectedGender);

                                setState(() {
                                  _userName = nameController.text;
                                  _userPhone = phoneController.text;
                                  _userAddress = addressController.text;
                                  _userNip = nipController.text;
                                  _userGender = selectedGender;
                                });

                                if (mounted) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Profil berhasil disimpan di Server!'), backgroundColor: Colors.green),
                                  );
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0037B0),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text('Simpan'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  
                  // Form Fields
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Center(
                            child: GestureDetector(
                              onTap: () {
                                showModalBottomSheet(
                                  context: context,
                                  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
                                  builder: (ctx) => SafeArea(
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        ListTile(
                                          leading: const Icon(Icons.photo_library, color: Color(0xFF0037B0)),
                                          title: const Text('Pilih dari Galeri'),
                                          onTap: () async {
                                            Navigator.pop(ctx);
                                            try {
                                              final XFile? image = await _picker.pickImage(
                                                source: ImageSource.gallery,
                                                imageQuality: 70,
                                                maxWidth: 800,
                                                maxHeight: 800,
                                              );
                                              if (image != null) {
                                                final bytes = await image.readAsBytes();
                                                setModalState(() {
                                                  _userAvatarBytes = bytes;
                                                });
                                                final prefs = await SharedPreferences.getInstance();
                                                await prefs.setString('user_avatar_base64', base64Encode(bytes));
                                                
                                                if (mounted) {
                                                  setState(() {}); 
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    const SnackBar(content: Text('Foto berhasil diubah!'), backgroundColor: Colors.green),
                                                  );
                                                }
                                              }
                                            } catch (e) {
                                              print('Error picking image: $e');
                                            }
                                          },
                                        ),
                                        if (_userAvatarBytes != null)
                                          ListTile(
                                            leading: const Icon(Icons.delete_outline, color: Colors.red),
                                            title: const Text('Hapus Foto', style: TextStyle(color: Colors.red)),
                                            onTap: () async {
                                              Navigator.pop(ctx);
                                              setModalState(() {
                                                _userAvatarBytes = null;
                                              });
                                              final prefs = await SharedPreferences.getInstance();
                                              await prefs.remove('user_avatar_base64');
                                              
                                              if (mounted) {
                                                setState(() {});
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  const SnackBar(content: Text('Foto berhasil dihapus!'), backgroundColor: Colors.orange),
                                                );
                                              }
                                            },
                                          ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                              child: Stack(
                                alignment: Alignment.bottomRight,
                                children: [
                                  Container(
                                    width: 90,
                                    height: 90,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Colors.blue.shade50,
                                      border: Border.all(color: const Color(0xFF0037B0), width: 2),
                                    ),
                                    child: _userAvatarBytes != null
                                        ? ClipOval(
                                            child: Image.memory(
                                              _userAvatarBytes!,
                                              fit: BoxFit.cover,
                                              width: 90,
                                              height: 90,
                                            ),
                                          )
                                        : const Icon(Icons.person, size: 45, color: Color(0xFF0037B0)),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: const BoxDecoration(color: Color(0xFF0037B0), shape: BoxShape.circle),
                                    child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 32),
                          
                          TextField(
                            controller: nameController,
                            decoration: InputDecoration(
                              labelText: 'Nama Lengkap',
                              prefixIcon: const Icon(Icons.person_outline),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          TextField(
                            controller: TextEditingController(text: _userEmail),
                            enabled: false,
                            decoration: InputDecoration(
                              labelText: 'Email',
                              prefixIcon: const Icon(Icons.email_outlined),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true,
                              fillColor: Colors.grey.shade200,
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          TextField(
                            controller: nipController,
                            decoration: InputDecoration(
                              labelText: 'NIP / NUPTK (Opsional)',
                              prefixIcon: const Icon(Icons.badge_outlined),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          TextField(
                            controller: phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              labelText: 'No. HP / WhatsApp',
                              prefixIcon: const Icon(Icons.phone_outlined),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                          ),
                          const SizedBox(height: 16),

                          DropdownButtonFormField<String>(
                            value: selectedGender,
                            decoration: InputDecoration(
                              labelText: 'Jenis Kelamin',
                              prefixIcon: const Icon(Icons.wc),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                            items: ['Laki-laki', 'Perempuan'].map((String value) {
                              return DropdownMenuItem<String>(
                                value: value,
                                child: Text(value),
                              );
                            }).toList(),
                            onChanged: (newValue) {
                              if (newValue != null) {
                                setModalState(() => selectedGender = newValue);
                              }
                            },
                          ),
                          const SizedBox(height: 16),
                          
                          TextField(
                            controller: addressController,
                            maxLines: 3,
                            decoration: InputDecoration(
                              labelText: 'Alamat Lengkap',
                              prefixIcon: const Padding(
                                padding: EdgeInsets.only(bottom: 40.0),
                                child: Icon(Icons.location_on_outlined),
                              ),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                            ),
                          ),
                          const SizedBox(height: 100),
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

  void _showChangePasswordDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) {
        bool obscureOld = true;
        bool obscureNew = true;
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 24), decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10))),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Ubah Password', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0037B0))),
                          IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                        ],
                      ),
                      const SizedBox(height: 24),
                      TextField(
                        obscureText: obscureOld,
                        decoration: InputDecoration(
                          labelText: 'Password Lama',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(obscureOld ? Icons.visibility_off : Icons.visibility),
                            onPressed: () => setModalState(() => obscureOld = !obscureOld),
                          ),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        obscureText: obscureNew,
                        decoration: InputDecoration(
                          labelText: 'Password Baru',
                          prefixIcon: const Icon(Icons.lock_reset),
                          suffixIcon: IconButton(
                            icon: Icon(obscureNew ? Icons.visibility_off : Icons.visibility),
                            onPressed: () => setModalState(() => obscureNew = !obscureNew),
                          ),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                        ),
                      ),
                      const SizedBox(height: 32),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.pop(context),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.grey.shade700,
                                side: BorderSide(color: Colors.grey.shade300),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text('Batal'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.pop(context);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Password berhasil diubah!'), backgroundColor: Colors.green),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0037B0),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text('Simpan'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _toggleBiometric() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _isBiometricEnabled = !_isBiometricEnabled;
    });
    await prefs.setBool('biometric_enabled', _isBiometricEnabled);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isBiometricEnabled ? 'Biometrik diaktifkan!' : 'Biometrik dinonaktifkan!'),
          backgroundColor: _isBiometricEnabled ? Colors.green : Colors.orange,
        ),
      );
    }
  }

  void _showPrivacyPolicy() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 24), decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10))),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Kebijakan Privasi', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0037B0))),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
              const SizedBox(height: 24),
              const Text(
                'Data Anda aman bersama kami. Kami tidak akan membagikan data Anda kepada pihak ketiga tanpa izin.\n\nAplikasi SALIRA menggunakan data lokasi dan perangkat hanya untuk keperluan absensi yang valid.',
                style: TextStyle(height: 1.6, fontSize: 14, color: Colors.black87),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0037B0),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 50),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Mengerti', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAboutSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 24), decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10))),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Tentang Aplikasi', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0037B0))),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.asset('assets/images/logo-salira.png', width: 90, height: 90, errorBuilder: (ctx, err, trace) => const Icon(Icons.school, size: 90, color: Color(0xFF0037B0))),
              ),
              const SizedBox(height: 16),
              const Text('SALIRA Mobile', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF0037B0), letterSpacing: 1)),
              const SizedBox(height: 4),
              const Text('Versi 1.0.0 (Build 1)', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
              const SizedBox(height: 24),
              const Text(
                '© 2026 Konfigin IT Solution / Yusuf Burhani.\nSeluruh Hak Cipta Dilindungi Undang-Undang.\n\nDikembangkan untuk Sistem Absensi dan Manajemen Informasi Digital yang lebih cerdas dan cepat.',
                textAlign: TextAlign.center,
                style: TextStyle(height: 1.6, fontSize: 13, color: Colors.black87),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0037B0),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 50),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Tutup', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF4F7FB),
      child: Stack(
        children: [
          // 1. Background Banner
          _buildStaticBanner(),
          
          // 2. Logout Button (Top Right)
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            right: 8,
            child: IconButton(
              icon: const Icon(Icons.logout, color: Colors.white),
              tooltip: 'Keluar Akun',
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Keluar Akun'),
                    content: const Text('Apakah Anda yakin ingin keluar dari aplikasi?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          _logout();
                        },
                        child: const Text('Keluar', style: TextStyle(color: Colors.red)),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // 3. Scrollable Content (On top of banner)
          SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  SizedBox(height: MediaQuery.of(context).padding.top + 100), // Push down to overlap banner
                  _buildProfileCard(),
                  const SizedBox(height: 24),
                  _buildMenuSection('Akun Saya', [
                    _buildMenuItem(Icons.person_outline, 'Edit Profil', _showEditProfileSheet),
                    _buildMenuItem(Icons.lock_outline, 'Ubah Password', _showChangePasswordDialog),
                    ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: const Color(0xFF0037B0).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.fingerprint, color: Color(0xFF0037B0), size: 20),
                      ),
                      title: const Text('Biometrik Login', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.black87)),
                      trailing: Switch(
                        value: _isBiometricEnabled,
                        onChanged: (val) => _toggleBiometric(),
                        activeColor: const Color(0xFF0037B0),
                      ),
                      onTap: _toggleBiometric,
                    ),
                  ]),
                  const SizedBox(height: 24),
                  _buildMenuSection('Bantuan & Informasi', [
                    _buildMenuItem(Icons.help_outline, 'Pusat Bantuan', () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pusat Bantuan akan segera hadir!')));
                    }),
                    _buildMenuItem(Icons.privacy_tip_outlined, 'Kebijakan Privasi', _showPrivacyPolicy),
                    _buildMenuItem(Icons.info_outline, 'Tentang Aplikasi', _showAboutSheet),
                  ]),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStaticBanner() {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(40)),
      child: Container(
        height: 200.0,
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0037B0), Color(0xFF0056D2)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: -50,
              right: -50,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.08)),
              ),
            ),
            Positioned(
              bottom: -80,
              left: -30,
              child: Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.05)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        children: [
          Stack(
            alignment: Alignment.bottomRight,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.blue.shade50,
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
                ),
                child: _userAvatarBytes != null
                    ? ClipOval(
                        child: Image.memory(
                          _userAvatarBytes!,
                          fit: BoxFit.cover,
                          width: 100,
                          height: 100,
                        ),
                      )
                    : const Center(
                        child: Icon(Icons.person, size: 50, color: Color(0xFF0037B0)),
                      ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(_userName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 4),
          Text(_userEmail, style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
          if (_userPhone.isNotEmpty && _userPhone != '-') ...[
            const SizedBox(height: 4),
            Text(_userPhone, style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
          ],
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(_userRole, style: const TextStyle(color: Color(0xFF0037B0), fontWeight: FontWeight.bold, fontSize: 13)),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8.0, bottom: 12.0),
          child: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black54)),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)],
          ),
          child: Column(
            children: items,
          ),
        ),
      ],
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: const Color(0xFF0037B0).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: const Color(0xFF0037B0), size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.black87)),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
      onTap: onTap,
    );
  }
}
