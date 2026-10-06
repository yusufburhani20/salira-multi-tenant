import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'main.dart';

class HistoryScreen extends StatefulWidget {
  final VoidCallback? onBack;
  const HistoryScreen({super.key, this.onBack});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<dynamic> _activities = [];
  bool _isLoading = true;
  int _page = 1;
  bool _isLoadingMore = false;
  bool _hasMoreData = true;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchActivities();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 &&
          !_isLoadingMore && _hasMoreData) {
        _loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchActivities({bool refresh = false}) async {
    if (refresh) setState(() { _page = 1; _activities = []; _isLoading = true; _hasMoreData = true; });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;

      // Fetch Attendances
      final urlAttendances = Uri.parse('${getBaseUrl()}/attendance?page=$_page');
      final resAttendances = await http.get(urlAttendances, headers: {
        'Authorization': 'Bearer $token', 'Accept': 'application/json',
      });

      // Fetch Leaves
      final urlLeaves = Uri.parse('${getBaseUrl()}/leaves?page=$_page');
      final resLeaves = await http.get(urlLeaves, headers: {
        'Authorization': 'Bearer $token', 'Accept': 'application/json',
      });

      List<dynamic> newActivities = [];
      bool fetchedAny = false;

      if (resAttendances.statusCode == 200) {
        final data = jsonDecode(resAttendances.body)['data'] ?? [];
        for (var item in data) {
          item['activity_type'] = 'attendance';
          item['sort_date'] = item['date'] ?? '';
          newActivities.add(item);
        }
        if (data.isNotEmpty) fetchedAny = true;
      }

      if (resLeaves.statusCode == 200) {
        final data = jsonDecode(resLeaves.body)['data'] ?? [];
        for (var item in data) {
          item['activity_type'] = 'leave';
          item['sort_date'] = item['start_date'] ?? item['created_at'] ?? '';
          newActivities.add(item);
        }
        if (data.isNotEmpty) fetchedAny = true;
      }

      // Sort combined activities descending by sort_date
      newActivities.sort((a, b) {
        final dateA = DateTime.tryParse(a['sort_date'] ?? '') ?? DateTime(2000);
        final dateB = DateTime.tryParse(b['sort_date'] ?? '') ?? DateTime(2000);
        return dateB.compareTo(dateA); // Descending
      });

      if (mounted) {
        setState(() {
          if (refresh) {
            _activities = newActivities;
          } else {
            _activities.addAll(newActivities);
            // Re-sort the whole list just in case pages overlap
            _activities.sort((a, b) {
              final dateA = DateTime.tryParse(a['sort_date'] ?? '') ?? DateTime(2000);
              final dateB = DateTime.tryParse(b['sort_date'] ?? '') ?? DateTime(2000);
              return dateB.compareTo(dateA);
            });
          }
          if (!fetchedAny) {
            _hasMoreData = false;
          }
        });
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally { 
      if (mounted) {
        setState(() => _isLoading = false); 
      }
    }
  }

  Future<void> _loadMore() async {
    setState(() { _isLoadingMore = true; _page++; });
    await _fetchActivities();
    setState(() => _isLoadingMore = false);
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('d MMM yyyy').format(dt);
    } catch (e) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: Column(
        children: [
          _buildHeader(),
          Expanded(child: _buildList()),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.only(top: 50, left: 24, right: 24, bottom: 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0037B0), Color(0xFF0056D2)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              if (widget.onBack != null) {
                widget.onBack!();
              } else {
                Navigator.pop(context);
              }
            },
            child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 12),
          const Icon(Icons.history, color: Colors.white, size: 24),
          const SizedBox(width: 8),
          const Expanded(
            child: Text('Riwayat Absensi', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
          ),
        ],
      ),
    );
  }

  Widget _buildList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_activities.isEmpty) {
      return const Center(child: Text('Belum ada riwayat aktivitas.'));
    }
    return RefreshIndicator(
      onRefresh: () => _fetchActivities(refresh: true),
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(24),
        itemCount: _activities.length + 1,
        itemBuilder: (context, index) {
          if (index == _activities.length) {
            return _isLoadingMore ? const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator())) : const SizedBox();
          }
          final item = _activities[index];
          if (item['activity_type'] == 'attendance') {
            return _buildAttendanceCard(item);
          } else {
            return _buildLeaveCard(item);
          }
        },
      ),
    );
  }

  Widget _buildAttendanceCard(dynamic item) {
    final date = item['date'] ?? '';
    final status = item['status'] ?? 'Hadir';
    final checkIn = item['check_in'] ?? '-';
    final checkOut = item['check_out'] ?? '-';
    final lat = item['latitude'];
    final lng = item['longitude'];
    
    String? processPhotoUrl(String? url) {
      if (url == null || url.isEmpty) return null;
      
      String base = getBaseUrl();
      if (base.endsWith('/api/v1')) base = base.substring(0, base.length - 7);
      else if (base.endsWith('/api')) base = base.substring(0, base.length - 4);
      if (base.endsWith('/')) base = base.substring(0, base.length - 1);

      // If backend returns absolute URL (e.g. 127.0.0.1) but we are on Emulator (10.0.2.2),
      // we must strip the host and force use the app's base url.
      if (url.startsWith('http')) {
        try {
          url = Uri.parse(url).path;
        } catch (_) {}
      }
      
      if (!url!.startsWith('/')) url = '/$url';
      return '$base$url';
    }

    String? photoIn = processPhotoUrl(item['photo_url']);
    String? photoOut = processPhotoUrl(item['checkout_photo_url']);
    
    Color statusColor = Colors.green;
    if (status.toLowerCase().contains('terlambat')) statusColor = Colors.orange;
    if (status.toLowerCase().contains('alpha')) statusColor = Colors.red;

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFF0037B0).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: const Text('ABSENSI', style: TextStyle(color: Color(0xFF0037B0), fontSize: 12, fontWeight: FontWeight.bold)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.date_range, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(_formatDate(date), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              ],
            ),
            if (lat != null && lng != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 16, color: Colors.blue),
                  const SizedBox(width: 8),
                  Text('$lat, $lng', style: const TextStyle(fontSize: 12, color: Colors.blue)),
                ],
              ),
            ],
            const Divider(height: 24),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Masuk', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.login, size: 16, color: Colors.green),
                          const SizedBox(width: 6),
                          Text(checkIn, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        ],
                      ),
                      if (photoIn != null) ...[
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: SafeImage(url: photoIn),
                        ),
                      ],
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Pulang', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.logout, size: 16, color: Colors.orange),
                          const SizedBox(width: 6),
                          Text(checkOut, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        ],
                      ),
                      if (photoOut != null) ...[
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: SafeImage(url: photoOut),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeaveCard(dynamic leave) {
    final startDate = _formatDate(leave['start_date'] ?? '');
    final endDate = _formatDate(leave['end_date'] ?? '');
    final reason = leave['reason'] ?? '';
    final type = leave['type'] ?? 'Izin';
    final status = leave['status'] ?? 'pending';

    Color statusColor;
    IconData statusIcon;
    if (status == 'approved') { statusColor = Colors.green; statusIcon = Icons.check_circle; }
    else if (status == 'rejected') { statusColor = Colors.red; statusIcon = Icons.cancel; }
    else { statusColor = Colors.orange; statusIcon = Icons.pending; }

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFF0037B0).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(type.toString().replaceAll('_', ' ').toUpperCase(), style: const TextStyle(color: Color(0xFF0037B0), fontSize: 12, fontWeight: FontWeight.bold)),
                ),
                Row(
                  children: [
                    Icon(statusIcon, color: statusColor, size: 16),
                    const SizedBox(width: 4),
                    Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.date_range, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text('$startDate - $endDate', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              ],
            ),
            const SizedBox(height: 8),
            Text(reason, style: const TextStyle(color: Colors.black54, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

class SafeImage extends StatefulWidget {
  final String url;
  const SafeImage({super.key, required this.url});

  @override
  State<SafeImage> createState() => _SafeImageState();
}

class _SafeImageState extends State<SafeImage> {
  Uint8List? _imageBytes;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchImage();
  }

  Future<void> _fetchImage() async {
    try {
      final response = await http.get(Uri.parse(widget.url)).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        if (mounted) setState(() => _imageBytes = response.bodyBytes);
      } else {
        if (mounted) setState(() => _error = 'HTTP ${response.statusCode}');
      }
    } catch (e) {
      if (mounted) setState(() => _error = 'Fetch error');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Container(
        width: 60, height: 80, color: Colors.grey.shade200,
        alignment: Alignment.center,
        child: Text(_error!, style: const TextStyle(fontSize: 8, color: Colors.red)),
      );
    }
    if (_imageBytes == null) {
      return Container(
        width: 60, height: 80, color: Colors.grey.shade200,
        alignment: Alignment.center,
        child: const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }
    return Image.memory(_imageBytes!, width: 60, height: 80, fit: BoxFit.cover);
  }
}
