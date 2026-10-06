import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:typed_data';
import 'main.dart'; // Untuk mendapatkan LoginScreen dan getBaseUrl()
import 'profile_screen.dart'; // Import halaman profil
import 'attendance_screen.dart'; // Import halaman absensi
import 'jurnal_screen.dart'; // Import halaman jurnal
import 'assessment_screen.dart';
import 'offline_sync_helper.dart';
import 'leave_screen.dart';
import 'history_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedTab = 0; // 0: Feed, 1: Top
  int _selectedRankingTab = 0; // 0: Kehadiran, 1: Penilaian
  int _bottomNavIndex = 0;
  
  String _userName = 'Loading...';
  String _userRole = 'Memuat role...';
  Uint8List? _userAvatarBytes;
  
  bool _isLoadingData = true;
  Map<String, dynamic> _todaySummary = {};
  List<dynamic> _attendanceRanking = [];
  List<dynamic> _assessmentRanking = [];
  Map<String, dynamic> _leaveSummary = {};
  List<dynamic> _attendanceChart = [];

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _fetchDashboardData();
    _checkOfflineSync();
  }

  Future<void> _checkOfflineSync() async {
    final hasSynced = await OfflineSyncHelper.syncPendingAttendances();
    if (hasSynced && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Absensi offline berhasil disinkronkan ke server!', style: TextStyle(color: Colors.white)),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _fetchDashboardData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;

      final url = Uri.parse('${getBaseUrl()}/dashboard/stats');
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _todaySummary = data['today_summary'] ?? {};
            _attendanceRanking = data['attendance_ranking'] ?? [];
            _assessmentRanking = data['assessment_ranking'] ?? [];
            _leaveSummary = data['leave_summary'] ?? {};
            _attendanceChart = data['attendance_chart'] ?? [];
            _isLoadingData = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoadingData = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingData = false);
    }
  }

  String _getCurrentDate() {
    final now = DateTime.now();
    final months = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    final days = [
      '', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
    ];
    return '${days[now.weekday]}, ${now.day} ${months[now.month]} ${now.year}';
  }

  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userName = prefs.getString('user_name') ?? 'Pengguna Salira';
      _userRole = prefs.getString('user_role') ?? 'Guru / Pegawai';
      
      final avatarBase64 = prefs.getString('avatar_bytes');
      if (avatarBase64 != null) {
        _userAvatarBytes = base64Decode(avatarBase64);
      }
    });
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: IndexedStack(
        index: _bottomNavIndex,
        children: [
          _buildHomeContent(),
          const AttendanceScreen(), // Index 1: Absensi
          const AssessmentScreen(), // Index 2: Asesmen
          const JurnalScreen(),     // Index 3: Jurnal
          const ProfileScreen(),    // Index 4: Profil
          HistoryScreen(onBack: () => setState(() => _bottomNavIndex = 0)), // Index 5: History
          LeaveScreen(onBack: () => setState(() => _bottomNavIndex = 0)),   // Index 6: Leave
        ],
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildHomeContent() {
    return Stack(
      children: [
        // Background Header with Premium Blue Gradient & Circles
        _buildBackgroundHeader(),
        
        // Main Scrollable Content
        SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildTopBar(),
                const SizedBox(height: 12),
                _buildGreeting(),
                const SizedBox(height: 12),
                
                // Main Metrics Card overlapping the header
                _buildMainCard(),
                
                const SizedBox(height: 24),
                _buildActionButtons(),
                
                const SizedBox(height: 32),
                _buildInteractiveTabs(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBackgroundHeader() {
    return Stack(
      children: [
        Container(
          height: 220,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0037B0), Color(0xFF0056D2)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(40)),
          ),
        ),
        // Decorative circles
        Positioned(
          top: -50,
          left: -50,
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.05),
            ),
          ),
        ),
        Positioned(
          top: 100,
          right: -80,
          child: Container(
            width: 250,
            height: 250,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.05),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Image.asset(
                'assets/images/logo-salira.png',
                height: 32,
                color: Colors.white,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.domain, color: Colors.white, size: 32),
              ),
              const SizedBox(width: 12),
              const Text(
                'SALIRA',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 20,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(Icons.notifications_none, color: Colors.white),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Tidak ada notifikasi baru.')),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGreeting() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _userName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          const Text(
            'Selamat Datang di Salira,',
            style: TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.badge, color: Colors.white, size: 14),
                const SizedBox(width: 6),
                Text(_userRole, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0037B0).withValues(alpha: 0.15),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Status Hari Ini', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87)),
                Text(_getCurrentDate(), style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatusCircle('Hadir', _isLoadingData ? '-' : '${_todaySummary['hadir'] ?? 0}', Colors.green),
                _buildStatusCircle('Izin', _isLoadingData ? '-' : '${_todaySummary['izin'] ?? 0}', Colors.blue),
                _buildStatusCircle('Sakit', _isLoadingData ? '-' : '${_todaySummary['sakit'] ?? 0}', Colors.orange),
                _buildStatusCircle('Alpha', _isLoadingData ? '-' : '${_todaySummary['alpha'] ?? 0}', Colors.red),
              ],
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.shade100),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                    child: const Icon(Icons.close, color: Colors.white, size: 16),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Anda belum melakukan presensi hari ini.', style: TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.bold)),
                        Text('Silakan ketuk tombol Scan QR di bawah.', style: TextStyle(fontSize: 11, color: Colors.black54)),
                      ],
                    ),
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCircle(String title, String time, Color color) {
    return Column(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
            border: Border.all(color: color.withValues(alpha: 0.3), width: 2),
          ),
          child: Center(
            child: Text(
              time,
              style: TextStyle(
                color: color == Colors.grey ? Colors.grey.shade700 : color,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.black87)),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildActionButton(Icons.location_on, 'Absensi', const Color(0xFF0037B0), onTap: () {
            setState(() => _bottomNavIndex = 1);
          }),
          _buildActionButton(Icons.event_busy, 'Izin', Colors.orange, onTap: () {
            setState(() => _bottomNavIndex = 6);
          }),
          _buildActionButton(Icons.assignment, 'Asesmen', Colors.teal, onTap: () {
            setState(() => _bottomNavIndex = 2);
          }),
          _buildActionButton(Icons.menu_book, 'Jurnal', Colors.purple, onTap: () {
            setState(() => _bottomNavIndex = 3);
          }),
          _buildActionButton(Icons.history, 'Riwayat', Colors.grey.shade700, onTap: () {
            setState(() => _bottomNavIndex = 5);
          }),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label, Color color, {VoidCallback? onTap}) {
    return Column(
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          child: IconButton(
            icon: Icon(icon, color: color, size: 24),
            onPressed: onTap ?? () {},
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black87)),
      ],
    );
  }

  Widget _buildInteractiveTabs() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Analisis & Aktivitas', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                  child: Row(
                    children: [
                      Expanded(child: _buildTabButton('Tren Hadir', 0)),
                      Expanded(child: _buildTabButton('Top Siswa', 1)),
                      Expanded(child: _buildTabButton('Izin Saya', 2)),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: _isLoadingData 
                    ? const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
                    : _buildTabContent(),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabButton(String text, int index) {
    bool isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          boxShadow: isSelected ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)] : [],
        ),
        alignment: Alignment.center,
        child: Text(text, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.w600, color: isSelected ? const Color(0xFF0037B0) : Colors.grey.shade500)),
      ),
    );
  }

  Widget _buildTabContent() {
    if (_selectedTab == 0) return _buildAttendanceChart();
    if (_selectedTab == 1) return _buildTopStudentsList();
    return _buildMyLeaveList();
  }

  Widget _buildAttendanceChart() {
    if (_attendanceChart.isEmpty) {
      return const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('Belum ada data kehadiran', style: TextStyle(color: Colors.grey))));
    }
    
    // Find max value to scale the chart
    int maxHadir = 1;
    for (var item in _attendanceChart) {
      if (item['hadir'] > maxHadir) maxHadir = item['hadir'];
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('Tren Kehadiran (7 Hari Terakhir)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
        const SizedBox(height: 16),
        SizedBox(
          height: 150,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: _attendanceChart.map((data) {
              final double heightPct = (data['hadir'] / maxHadir).clamp(0.0, 1.0);
              return Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text('${data['hadir']}', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blue.shade700)),
                  const SizedBox(height: 4),
                  Container(
                    width: 24,
                    height: (heightPct * 100).clamp(4.0, 100.0),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [const Color(0xFF0037B0), Colors.blue.shade300], begin: Alignment.bottomCenter, end: Alignment.topCenter),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(data['label'], style: const TextStyle(fontSize: 10, color: Colors.grey)),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildTopStudentsList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Toggle options
        Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedRankingTab = 0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: _selectedRankingTab == 0 ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: _selectedRankingTab == 0 ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)] : [],
                    ),
                    alignment: Alignment.center,
                    child: Text('Kehadiran', style: TextStyle(fontWeight: _selectedRankingTab == 0 ? FontWeight.bold : FontWeight.w600, color: _selectedRankingTab == 0 ? const Color(0xFF0037B0) : Colors.grey.shade600, fontSize: 13)),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedRankingTab = 1),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: _selectedRankingTab == 1 ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: _selectedRankingTab == 1 ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)] : [],
                    ),
                    alignment: Alignment.center,
                    child: Text('Penilaian', style: TextStyle(fontWeight: _selectedRankingTab == 1 ? FontWeight.bold : FontWeight.w600, color: _selectedRankingTab == 1 ? const Color(0xFF0037B0) : Colors.grey.shade600, fontSize: 13)),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // List Content
        if (_selectedRankingTab == 0) ...[
          if (_attendanceRanking.isNotEmpty)
            ..._buildRankingList(_attendanceRanking, 'HARI')
          else
            const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('Belum ada data kehadiran', style: TextStyle(color: Colors.grey)))),
        ] else ...[
          if (_assessmentRanking.isNotEmpty)
            ..._buildRankingList(_assessmentRanking, 'AVG')
          else
            const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('Belum ada data penilaian', style: TextStyle(color: Colors.grey)))),
        ],
      ],
    );
  }

  List<Widget> _buildRankingList(List<dynamic> ranking, String suffix) {
    return ranking.asMap().entries.map((entry) {
      int index = entry.key;
      var student = entry.value;
      
      String medal = '${index + 1}';
      if (index == 0) medal = '🥇';
      if (index == 1) medal = '🥈';
      if (index == 2) medal = '🥉';

      String initial = student['name'].toString().isNotEmpty ? student['name'].toString()[0].toUpperCase() : '?';

      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: Colors.grey.shade100),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: index == 0 ? Colors.amber.withValues(alpha: 0.2) : (index == 1 ? Colors.grey.shade300 : (index == 2 ? Colors.brown.withValues(alpha: 0.2) : Colors.blue.shade50)),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(medal, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: index == 0 ? Colors.amber.shade700 : (index == 1 ? Colors.grey.shade700 : (index == 2 ? Colors.brown.shade600 : Colors.blue.shade700)))),
              ),
            ),
            const SizedBox(width: 12),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.blue.shade100,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(initial, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0037B0))),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(student['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                  if (student['class_name'] != null && student['class_name'].toString().isNotEmpty)
                    Text(student['class_name'], style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(color: suffix == 'HARI' ? Colors.green.shade50 : Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
              child: Column(
                children: [
                  Text('${student['value']}', style: TextStyle(fontWeight: FontWeight.bold, color: suffix == 'HARI' ? Colors.green.shade700 : Colors.blue.shade700, fontSize: 14)),
                  Text(suffix, style: TextStyle(fontWeight: FontWeight.bold, color: suffix == 'HARI' ? Colors.green.shade700 : Colors.blue.shade700, fontSize: 9)),
                ],
              ),
            )
          ],
        ),
      );
    }).toList();
  }

  Widget _buildMyLeaveList() {
    return Column(
      children: [
        _buildActivityItem(Icons.pending_actions, 'Menunggu Persetujuan', '${_leaveSummary['pending'] ?? 0} Pengajuan', Colors.orange),
        const Divider(height: 24, color: Color(0xFFF0F0F0)),
        _buildActivityItem(Icons.check_circle_outline, 'Izin Disetujui', '${_leaveSummary['approved'] ?? 0} Pengajuan', Colors.green),
        const Divider(height: 24, color: Color(0xFFF0F0F0)),
        _buildActivityItem(Icons.cancel_outlined, 'Izin Ditolak', '${_leaveSummary['rejected'] ?? 0} Pengajuan', Colors.red),
      ],
    );
  }

  Widget _buildActivityItem(IconData icon, String title, String subtitle, Color color) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 4),
              Text(subtitle, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: BoxDecoration(
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, -5))],
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        child: BottomNavigationBar(
          backgroundColor: Colors.white,
          currentIndex: _bottomNavIndex > 4 ? 0 : _bottomNavIndex,
          onTap: (index) {
            setState(() {
              _bottomNavIndex = index;
            });
          },
          selectedItemColor: const Color(0xFF0037B0),
          unselectedItemColor: Colors.grey.shade400,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: 'Beranda'),
            BottomNavigationBarItem(icon: Icon(Icons.location_on), label: 'Absensi'),
            BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Asesmen'),
            BottomNavigationBarItem(icon: Icon(Icons.menu_book), label: 'Jurnal'),
            BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profil'),
          ],
        ),
      ),
    );
  }
}
