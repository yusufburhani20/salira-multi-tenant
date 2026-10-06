import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'main.dart';
import 'leave_form_screen.dart';

class LeaveScreen extends StatefulWidget {
  final VoidCallback? onBack;
  const LeaveScreen({super.key, this.onBack});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  List<dynamic> _leaves = [];
  bool _isLoading = true;
  int _page = 1;
  int _lastPage = 1;
  bool _isLoadingMore = false;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchLeaves();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 &&
          !_isLoadingMore && _page < _lastPage) {
        _loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchLeaves({bool refresh = false}) async {
    if (refresh) setState(() { _page = 1; _leaves = []; _isLoading = true; });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;
      final url = Uri.parse('${getBaseUrl()}/leaves?page=$_page');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token', 'Accept': 'application/json',
      });
      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _leaves = refresh ? List.from(res['data']) : [..._leaves, ...res['data']];
            _lastPage = res['meta']['last_page'] ?? 1;
          });
        }
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
    await _fetchLeaves();
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
          Expanded(child: _buildLeaveList()),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF0037B0),
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const LeaveFormScreen()),
          );
          if (result == true) {
            _fetchLeaves(refresh: true);
          }
        },
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Ajukan Izin', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
          const Icon(Icons.event_busy, color: Colors.white, size: 24),
          const SizedBox(width: 8),
          const Expanded(
            child: Text('Perizinan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
          ),
        ],
      ),
    );
  }

  Widget _buildLeaveList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_leaves.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(color: const Color(0xFF0037B0).withValues(alpha: 0.05), shape: BoxShape.circle),
              child: Icon(Icons.event_available_outlined, size: 64, color: const Color(0xFF0037B0).withValues(alpha: 0.4)),
            ),
            const SizedBox(height: 24),
            const Text('Belum ada riwayat izin', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
            const SizedBox(height: 8),
            Text('Tekan tombol "Ajukan Izin"\nuntuk membuat permintaan izin baru.',
              textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.grey.shade600, height: 1.5)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _fetchLeaves(refresh: true),
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(24),
        itemCount: _leaves.length + 1,
        itemBuilder: (context, index) {
          if (index == _leaves.length) {
            return _isLoadingMore ? const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator())) : const SizedBox();
          }
          final leave = _leaves[index];
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
        },
      ),
    );
  }
}
