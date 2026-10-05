import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'main.dart'; // Untuk mendapatkan LoginScreen

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedTab = 0; // 0: Feed Terkini, 1: Top Terawal

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
      backgroundColor: const Color(0xFFF7F9FB),
      appBar: _buildAppBar(),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeroBanner(),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  _buildDonutChartCard(),
                  const SizedBox(height: 16),
                  _buildMetricsGrid(),
                  const SizedBox(height: 16),
                  _buildInteractiveTabs(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: Theme.of(context).colorScheme.primary,
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Beranda'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner), label: 'Scan'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Izin'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white.withOpacity(0.9),
      elevation: 0,
      scrolledUnderElevation: 1,
      title: Row(
        children: [
          Image.asset(
            'assets/images/logo-salira.png',
            height: 24,
            color: Theme.of(context).colorScheme.primary,
            errorBuilder: (context, error, stackTrace) => Icon(Icons.domain, color: Theme.of(context).colorScheme.primary),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('SALIRA', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 16)),
              const Text('Presensi Pegawai', style: TextStyle(color: Colors.grey, fontSize: 11)),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_none, color: Colors.black54),
          onPressed: () {},
        ),
        IconButton(
          icon: const Icon(Icons.logout, color: Colors.redAccent),
          onPressed: _logout,
        ),
      ],
    );
  }

  Widget _buildHeroBanner() {
    return Container(
      width: double.infinity,
      color: const Color(0xFF1D4ED8), // primary-container
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.circle, color: Colors.greenAccent, size: 10),
                SizedBox(width: 6),
                Text('SISTEM AKTIF • LIVE REAL-TIME', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Text('Kehadiran Pegawai', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
          const Text('Monitoring presensi dan status GTK hari ini secara real-time.', style: TextStyle(color: Colors.white70, fontSize: 13)),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildBadgeIcon(Icons.schedule, '08:15 WIB'),
              const SizedBox(width: 8),
              _buildBadgeIcon(Icons.verified_user, 'Geofence 100m Aktif'),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.photo_camera, size: 18),
                  label: const Text('Kamera Absen'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF1D4ED8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.description, size: 18),
                  label: const Text('Izin / Rekap'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white.withOpacity(0.15),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildBadgeIcon(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 14),
          const SizedBox(width: 4),
          Text(text, style: const TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildDonutChartCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.pie_chart, color: Color(0xFF0037B0)),
                  SizedBox(width: 8),
                  Text('Partisipasi Presensi', style: TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)),
                child: Text('77.8% TERCAPAI', style: TextStyle(color: Colors.blue.shade700, fontSize: 10, fontWeight: FontWeight.bold)),
              )
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 80,
                height: 80,
                child: Stack(
                  children: [
                    const Center(child: CircularProgressIndicator(value: 0.77, strokeWidth: 8, color: Color(0xFF0037B0), backgroundColor: Color(0xFFEEEEEE))),
                    Center(child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Text('77%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('Hadir', style: TextStyle(fontSize: 9, color: Colors.grey)),
                      ],
                    )),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(text: const TextSpan(
                      text: '28 ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Colors.black),
                      children: [TextSpan(text: '/ 36 Personel', style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.normal))]
                    )),
                    const Text('Target kehadiran 95% • Toleransi batas terlambat s/d pukul 07:15 WIB.', style: TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              )
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsGrid() {
    final metrics = [
      {'title': 'Total Personel', 'val': '36', 'icon': Icons.groups, 'color': Colors.grey.shade100, 'textColor': Colors.black},
      {'title': 'Tepat Waktu', 'val': '28', 'icon': Icons.check_circle, 'color': Colors.green.shade50, 'textColor': Colors.green.shade900},
      {'title': 'Izin Pribadi', 'val': '1', 'icon': Icons.mail, 'color': Colors.amber.shade50, 'textColor': Colors.amber.shade900},
      {'title': 'Alfa / Belum', 'val': '4', 'icon': Icons.warning, 'color': Colors.red.shade50, 'textColor': Colors.red.shade900},
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.8,
      children: metrics.map((m) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: m['color'] as Color, borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(m['title'] as String, style: TextStyle(fontSize: 11, color: Colors.grey.shade700, fontWeight: FontWeight.bold)),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(m['val'] as String, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: m['textColor'] as Color)),
                Icon(m['icon'] as IconData, color: (m['textColor'] as Color).withOpacity(0.5)),
              ],
            )
          ],
        ),
      )).toList(),
    );
  }

  Widget _buildInteractiveTabs() {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: const BorderRadius.vertical(top: Radius.circular(12))),
            child: Row(
              children: [
                Expanded(child: _buildTabButton('Feed Terkini', 0)),
                Expanded(child: _buildTabButton('Top Terawal 🏆', 1)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: _selectedTab == 0 ? _buildFeedList() : _buildTopList(),
          )
        ],
      ),
    );
  }

  Widget _buildTabButton(String text, int index) {
    bool isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: isSelected ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)] : [],
        ),
        alignment: Alignment.center,
        child: Text(text, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? const Color(0xFF0037B0) : Colors.grey)),
      ),
    );
  }

  Widget _buildFeedList() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
          child: const TextField(decoration: InputDecoration(icon: Icon(Icons.search, size: 18), hintText: 'Cari nama pegawai...', border: InputBorder.none, hintStyle: TextStyle(fontSize: 13))),
        ),
        const SizedBox(height: 12),
        _buildEmployeeItem('HB', 'Hasan Basri, S.Pd', 'Guru Matematika • 06:42 WIB', 'Tepat Waktu', Colors.green),
        _buildEmployeeItem('NH', 'Nurul Huda, M.Pd', 'Guru IPA • 06:45 WIB', 'Tepat Waktu', Colors.green),
      ],
    );
  }

  Widget _buildTopList() {
    return Column(
      children: [
        _buildEmployeeItem('1', 'Ahmad Rizal', '06:10 WIB', 'Juara 1', Colors.amber),
        _buildEmployeeItem('2', 'Siti Aminah', '06:15 WIB', 'Juara 2', Colors.grey.shade400),
      ],
    );
  }

  Widget _buildEmployeeItem(String initial, String name, String sub, String badge, Color badgeColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
        tileColor: Colors.grey.shade50,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        leading: CircleAvatar(backgroundColor: badgeColor.withOpacity(0.2), child: Text(initial, style: TextStyle(color: badgeColor, fontWeight: FontWeight.bold))),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text(sub, style: const TextStyle(fontSize: 11)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(color: badgeColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
          child: Text(badge, style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }
}
