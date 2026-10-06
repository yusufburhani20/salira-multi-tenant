import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'main.dart'; // Untuk mendapatkan getBaseUrl()
import 'assessment_form_screen.dart';

class AssessmentScreen extends StatefulWidget {
  const AssessmentScreen({super.key});

  @override
  State<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Data State untuk Tab Harian
  List<dynamic> _dailyAssessments = [];
  bool _isLoadingDaily = true;
  int _dailyPage = 1;
  int _dailyLastPage = 1;
  bool _isLoadingMoreDaily = false;

  // Data State untuk Tab Akhir Semester
  List<dynamic> _finalAssessments = [];
  bool _isLoadingFinal = true;
  int _finalPage = 1;
  int _finalLastPage = 1;
  bool _isLoadingMoreFinal = false;

  final ScrollController _dailyScrollController = ScrollController();
  final ScrollController _finalScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    _fetchDailyAssessments();
    _fetchFinalAssessments();

    // Setup Pagination Listeners
    _dailyScrollController.addListener(() {
      if (_dailyScrollController.position.pixels >= _dailyScrollController.position.maxScrollExtent - 200 &&
          !_isLoadingMoreDaily && _dailyPage < _dailyLastPage) {
        _loadMoreDaily();
      }
    });

    _finalScrollController.addListener(() {
      if (_finalScrollController.position.pixels >= _finalScrollController.position.maxScrollExtent - 200 &&
          !_isLoadingMoreFinal && _finalPage < _finalLastPage) {
        _loadMoreFinal();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _dailyScrollController.dispose();
    _finalScrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchDailyAssessments({bool refresh = false}) async {
    if (refresh) {
      if (mounted) setState(() { _dailyPage = 1; _dailyAssessments = []; _isLoadingDaily = true; });
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;

      final url = Uri.parse('${getBaseUrl()}/assessments?page=$_dailyPage');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      });

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        final data = res['data'] as List;
        final meta = res['meta'];
        if (mounted) {
          setState(() {
            _dailyAssessments = refresh ? data : [..._dailyAssessments, ...data];
            _dailyLastPage = meta['last_page'] ?? 1;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching daily assessments: $e');
    } finally {
      if (mounted) setState(() => _isLoadingDaily = false);
    }
  }

  Future<void> _loadMoreDaily() async {
    setState(() { _isLoadingMoreDaily = true; _dailyPage++; });
    await _fetchDailyAssessments();
    setState(() => _isLoadingMoreDaily = false);
  }

  Future<void> _fetchFinalAssessments({bool refresh = false}) async {
    if (refresh) {
      if (mounted) setState(() { _finalPage = 1; _finalAssessments = []; _isLoadingFinal = true; });
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;

      final url = Uri.parse('${getBaseUrl()}/final-assessments?page=$_finalPage');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      });

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        final data = res['data'] as List;
        final meta = res['meta'];
        if (mounted) {
          setState(() {
            _finalAssessments = refresh ? data : [..._finalAssessments, ...data];
            _finalLastPage = meta['last_page'] ?? 1;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching final assessments: $e');
    } finally {
      if (mounted) setState(() => _isLoadingFinal = false);
    }
  }

  Future<void> _loadMoreFinal() async {
    setState(() { _isLoadingMoreFinal = true; _finalPage++; });
    await _fetchFinalAssessments();
    setState(() => _isLoadingMoreFinal = false);
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final dt = DateTime.parse(dateStr);
      final months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      return '${dt.day} ${months[dt.month]} ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: SafeArea(
        child: Column(
          children: [
            // Custom Header with Gradient and Tabs
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0037B0), Color(0xFF0055FF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.assignment, color: Colors.white, size: 24),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Modul Asesmen',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                          ),
                        ),
                      ),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.add, color: Colors.white),
                          onPressed: () async {
                            final isFinal = _tabController.index == 1;
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => AssessmentFormScreen(isFinal: isFinal)),
                            );
                            if (result == true) {
                              if (isFinal) {
                                _fetchFinalAssessments(refresh: true);
                              } else {
                                _fetchDailyAssessments(refresh: true);
                              }
                            }
                          },
                          tooltip: 'Tambah Asesmen',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // TabBar
                  TabBar(
                    controller: _tabController,
                    indicatorColor: Colors.white,
                    indicatorWeight: 3,
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white.withValues(alpha: 0.6),
                    labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
                    tabs: const [
                      Tab(text: 'Harian'),
                      Tab(text: 'Akhir Semester'),
                    ],
                  ),
                ],
              ),
            ),

            // Tab Content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Tab 1: Asesmen Harian
                  _buildTabContent(
                    items: _dailyAssessments,
                    isLoading: _isLoadingDaily,
                    isLoadingMore: _isLoadingMoreDaily,
                    scrollController: _dailyScrollController,
                    onRefresh: () => _fetchDailyAssessments(refresh: true),
                    emptyTitle: 'Belum ada nilai harian',
                    emptySubtitle: 'Mulai catat nilai tugas, kuis, atau ulangan\nharian siswa di sini.',
                    emptyIcon: Icons.assignment_turned_in_outlined,
                  ),
                  
                  // Tab 2: Asesmen Akhir
                  _buildTabContent(
                    items: _finalAssessments,
                    isLoading: _isLoadingFinal,
                    isLoadingMore: _isLoadingMoreFinal,
                    scrollController: _finalScrollController,
                    onRefresh: () => _fetchFinalAssessments(refresh: true),
                    emptyTitle: 'Belum ada nilai semester',
                    emptySubtitle: 'Nilai ASAS/ASAT untuk semester ini\nmasih kosong.',
                    emptyIcon: Icons.school_outlined,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabContent({
    required List<dynamic> items,
    required bool isLoading,
    required bool isLoadingMore,
    required ScrollController scrollController,
    required Future<void> Function() onRefresh,
    required String emptyTitle,
    required String emptySubtitle,
    required IconData emptyIcon,
  }) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF0037B0)));
    }

    if (items.isEmpty) {
      return _buildEmptyState(emptyTitle, emptySubtitle, emptyIcon);
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: const Color(0xFF0037B0),
      child: ListView.builder(
        controller: scrollController,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        itemCount: items.length + (isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == items.length) {
            return const Padding(
              padding: EdgeInsets.all(16.0),
              child: Center(child: CircularProgressIndicator(color: Color(0xFF0037B0))),
            );
          }
          final item = items[index];
          return _buildAssessmentCard(item);
        },
      ),
    );
  }

  Widget _buildAssessmentCard(dynamic item) {
    final title = item['title'] ?? '-';
    final type = item['type'] ?? 'Tugas';
    final subject = item['subject_name'] ?? '-';
    final className = item['class_name'] ?? '-';
    final date = _formatDate(item['date']);
    final average = item['average_score'] ?? 0;
    final totalStudents = item['scores_count'] ?? 0;
    final kkm = item['kkm'] ?? '-';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () async {
              final isFinal = _tabController.index == 1;
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => AssessmentFormScreen(assessmentData: item, isFinal: isFinal)),
              );
              if (result == true) {
                if (isFinal) {
                  _fetchFinalAssessments(refresh: true);
                } else {
                  _fetchDailyAssessments(refresh: true);
                }
              }
            },
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
                        decoration: BoxDecoration(
                          color: const Color(0xFF0037B0).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          type,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0037B0),
                          ),
                        ),
                      ),
                      Text(
                        date,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.subject, size: 14, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Text(
                        subject,
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                      ),
                      const SizedBox(width: 12),
                      Icon(Icons.class_outlined, size: 14, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Text(
                        className,
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildMetricColumn('Siswa', totalStudents.toString(), Icons.people_outline),
                      _buildMetricColumn('KKM', kkm.toString(), Icons.flag_outlined),
                      _buildMetricColumn('Rata-rata', average.toString(), Icons.analytics_outlined, isHighlight: true),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.edit, size: 16),
                          label: const Text('Edit', style: TextStyle(fontSize: 12)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0037B0),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () async {
                            final isFinal = _tabController.index == 1;
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => AssessmentFormScreen(assessmentData: item, isFinal: isFinal)),
                            );
                            if (result == true) {
                              if (isFinal) {
                                _fetchFinalAssessments(refresh: true);
                              } else {
                                _fetchDailyAssessments(refresh: true);
                              }
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricColumn(String label, String value, IconData icon, {bool isHighlight = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: isHighlight ? const Color(0xFF0037B0) : Colors.grey.shade500),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: isHighlight ? const Color(0xFF0037B0) : Colors.grey.shade500,
                fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isHighlight ? const Color(0xFF0037B0) : Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(String title, String subtitle, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF0037B0).withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 64, color: const Color(0xFF0037B0).withValues(alpha: 0.5)),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
