import 'dart:convert';
import 'package:universal_io/io.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'main.dart';
import 'jurnal_form_screen.dart';

class JurnalScreen extends StatefulWidget {
  const JurnalScreen({super.key});

  @override
  State<JurnalScreen> createState() => _JurnalScreenState();
}

class _JurnalScreenState extends State<JurnalScreen> {
  bool _isLoading = true;
  List<dynamic> _agendas = [];
  int _currentPage = 1;
  int _lastPage = 1;
  bool _isLoadingMore = false;
  final ScrollController _scrollController = ScrollController();
  DateTime? _selectedMonth;

  @override
  void initState() {
    super.initState();
    _fetchAgendas();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
              _scrollController.position.maxScrollExtent - 200 &&
          !_isLoadingMore &&
          _currentPage < _lastPage) {
        _loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchAgendas({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _agendas = [];
        _isLoading = true;
      });
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;

      var urlStr = '${getBaseUrl()}/agendas?page=$_currentPage';
      if (_selectedMonth != null) {
        final start = DateTime(_selectedMonth!.year, _selectedMonth!.month, 1);
        final end = DateTime(_selectedMonth!.year, _selectedMonth!.month + 1, 0);
        final startStr = '${start.year}-${start.month.toString().padLeft(2, '0')}-01';
        final endStr = '${end.year}-${end.month.toString().padLeft(2, '0')}-${end.day.toString().padLeft(2, '0')}';
        urlStr += '&start_date=$startStr&end_date=$endStr';
      }

      final url = Uri.parse(urlStr);
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
            _agendas = refresh ? data : [..._agendas, ...data];
            _lastPage = meta['last_page'] ?? 1;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching agendas: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMore() async {
    setState(() {
      _isLoadingMore = true;
      _currentPage++;
    });
    await _fetchAgendas();
    setState(() => _isLoadingMore = false);
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final dt = DateTime.parse(dateStr);
      final months = [
        '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      final days = ['', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      return '${days[dt.weekday]}, ${dt.day} ${months[dt.month]} ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }

  Color _subjectColor(String? subject) {
    if (subject == null) return Colors.blue;
    final colors = [
      const Color(0xFF0037B0),
      Colors.purple,
      Colors.teal,
      Colors.orange,
      Colors.indigo,
      Colors.pink,
      Colors.green.shade700,
    ];
    return colors[subject.length % colors.length];
  }

  Future<void> _export(String type) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;
      
      showDialog(
        context: context, 
        barrierDismissible: false,
        builder: (c) => const Center(child: CircularProgressIndicator())
      );

      var urlStr = '${getBaseUrl()}/agendas/export/$type';
      if (_selectedMonth != null) {
        final start = DateTime(_selectedMonth!.year, _selectedMonth!.month, 1);
        final end = DateTime(_selectedMonth!.year, _selectedMonth!.month + 1, 0);
        final startStr = '${start.year}-${start.month.toString().padLeft(2, '0')}-01';
        final endStr = '${end.year}-${end.month.toString().padLeft(2, '0')}-${end.day.toString().padLeft(2, '0')}';
        urlStr += '?start_date=$startStr&end_date=$endStr';
      }
      
      final response = await http.get(Uri.parse(urlStr), headers: {
        'Authorization': 'Bearer $token',
      });
      
      Navigator.pop(context); // close loading

      if (response.statusCode == 200) {
        if (kIsWeb) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: Text('Fitur unduh (download) file saat ini hanya tersedia di Android/iOS.', style: TextStyle(color: Colors.white)),
              backgroundColor: Colors.orange,
            ));
          }
          return;
        }

        final dir = await getApplicationDocumentsDirectory();
        final ext = type == 'pdf' ? 'pdf' : 'xlsx';
        final fileName = 'Jurnal_Mengajar_${DateTime.now().millisecondsSinceEpoch}.$ext';
        final file = File('${dir.path}/$fileName');
        await file.writeAsBytes(response.bodyBytes);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Berhasil mengunduh $fileName', style: const TextStyle(color: Colors.white)),
            backgroundColor: Colors.green,
            action: SnackBarAction(label: 'Buka', textColor: Colors.white, onPressed: () {
              OpenFilex.open(file.path);
            }),
          ));
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Gagal mengekspor data'), backgroundColor: Colors.red
          ));
        }
      }
    } catch (e) {
      Navigator.pop(context); // close loading if error
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Error: $e'), backgroundColor: Colors.red
        ));
      }
    }
  }

  void _selectMonth() async {
    final DateTime now = DateTime.now();
    int selectedYear = _selectedMonth?.year ?? now.year;
    
    final DateTime? picked = await showDialog<DateTime>(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              title: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios, size: 16),
                    onPressed: () => setStateDialog(() => selectedYear--),
                  ),
                  Text(
                    selectedYear.toString(),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.arrow_forward_ios, size: 16),
                    onPressed: () => setStateDialog(() => selectedYear++),
                  ),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: GridView.builder(
                  shrinkWrap: true,
                  itemCount: 12,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    childAspectRatio: 1.5,
                  ),
                  itemBuilder: (context, index) {
                    final monthName = [
                      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                      'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
                    ][index];
                    
                    bool isSelected = _selectedMonth != null && 
                                      _selectedMonth!.month == index + 1 && 
                                      _selectedMonth!.year == selectedYear;
                    
                    return InkWell(
                      onTap: () {
                        Navigator.pop(context, DateTime(selectedYear, index + 1));
                      },
                      child: Container(
                        margin: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF0037B0) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: isSelected ? const Color(0xFF0037B0) : Colors.grey.shade300),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          monthName,
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.black87,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Batal', style: TextStyle(color: Colors.grey)),
                ),
              ],
            );
          },
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedMonth = picked;
      });
      _fetchAgendas(refresh: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0037B0), Color(0xFF0055FF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.menu_book, color: Colors.white, size: 22),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Jurnal Mengajar',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const JurnalFormScreen()),
                          );
                          if (result == true) {
                            _fetchAgendas(refresh: true);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.add, color: Colors.white, size: 18),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => _export('pdf'),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.8),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.picture_as_pdf, color: Colors.white, size: 18),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => _export('excel'),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.8),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.table_view, color: Colors.white, size: 18),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => _fetchAgendas(refresh: true),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.refresh, color: Colors.white, size: 18),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      GestureDetector(
                        onTap: _selectMonth,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.calendar_month, color: Colors.white, size: 16),
                              const SizedBox(width: 6),
                              Text(
                                _selectedMonth == null ? 'Semua Bulan' : '${_selectedMonth!.month}/${_selectedMonth!.year}',
                                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_drop_down, color: Colors.white, size: 16),
                            ],
                          ),
                        ),
                      ),
                      if (_selectedMonth != null) ...[
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedMonth = null;
                            });
                            _fetchAgendas(refresh: true);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close, color: Colors.white, size: 14),
                          ),
                        ),
                      ]
                    ],
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _agendas.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          onRefresh: () => _fetchAgendas(refresh: true),
                          child: ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                            itemCount:
                                _agendas.length + (_isLoadingMore ? 1 : 0),
                            itemBuilder: (ctx, i) {
                              if (i == _agendas.length) {
                                return const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Center(
                                      child: CircularProgressIndicator()),
                                );
                              }
                              return _buildAgendaCard(_agendas[i]);
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.menu_book_outlined,
                  size: 56, color: Colors.blue.shade300),
            ),
            const SizedBox(height: 20),
            const Text(
              'Belum Ada Jurnal',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87),
            ),
            const SizedBox(height: 8),
            Text(
              'Jurnal mengajar Anda akan muncul di sini.\nTekan tombol + untuk menambahkan.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }


  void _showPreview(Map<String, dynamic> agenda) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),
              const Text('Detail Jurnal', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              _buildPreviewRow('Mata Pelajaran', agenda['subject']?['name'] ?? '-'),
              _buildPreviewRow('Kelas', agenda['academic_class']?['name'] ?? '-'),
              _buildPreviewRow('Tanggal', agenda['date'] ?? '-'),
              _buildPreviewRow('Jam Ke', '${agenda['lesson_hour_start']} - ${agenda['lesson_hour_end']}'),
              _buildPreviewRow('Tujuan Pembelajaran', agenda['topic'] ?? '-'),
              _buildPreviewRow('Model & Media', agenda['learning_model'] ?? '-'),
              _buildPreviewRow('Laporan Perkembangan', agenda['activities'] ?? '-'),
              _buildPreviewRow('Absensi', _formatAttendanceSummary(agenda['attendance_summary'])),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0037B0), padding: const EdgeInsets.symmetric(vertical: 14)),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Tutup', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              )
            ],
          ),
        );
      }
    );
  }

  Widget _buildPreviewRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text(label, style: const TextStyle(color: Colors.grey))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87))),
        ],
      ),
    );
  }

  String _formatAttendanceSummary(dynamic summary) {
    if (summary == null || summary is! Map) return 'Belum ada data';
    final hadir = summary['hadir'] ?? 0;
    final sakit = summary['sakit'] ?? 0;
    final izin = summary['izin'] ?? 0;
    final alfa = summary['alpha'] ?? 0;
    
    return 'Hadir: $hadir, Sakit: $sakit, Izin: $izin, Alfa: $alfa';
  }

  Widget _buildAgendaCard(Map<String, dynamic> agenda) {
    final subject = agenda['subject']?['name'] ?? 'Mata Pelajaran';
    final className = agenda['academic_class']?['name'] ?? '-';
    final date = _formatDate(agenda['date']);
    final topic = agenda['topic'] ?? '-';
    final notes = agenda['notes'];
    final jamStart = agenda['lesson_hour_start'] ?? '-';
    final jamEnd = agenda['lesson_hour_end'] ?? '-';
    final totalStudents = agenda['total_students'] ?? 0;
    final color = _subjectColor(subject);

    return Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: IntrinsicHeight(
          child: Row(
            children: [
              // Left color bar
              Container(
                width: 5,
                color: color,
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Subject chip + class
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              subject,
                              style: TextStyle(
                                color: color,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              className,
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const Spacer(),
                          // Jam pelajaran badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.indigo.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'JP $jamStart–$jamEnd',
                              style: TextStyle(
                                  color: Colors.indigo.shade700,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Topic
                      Text(
                        topic,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: Colors.black87,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                      if (notes != null && notes.toString().isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          notes,
                          style: TextStyle(
                              color: Colors.grey.shade500, fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],

                      const SizedBox(height: 10),

                      // Footer
                      Row(
                        children: [
                          Icon(Icons.calendar_today,
                              size: 13, color: Colors.grey.shade400),
                          const SizedBox(width: 4),
                          Text(date,
                              style: TextStyle(
                                  fontSize: 12, color: Colors.grey.shade500)),
                          const Spacer(),
                          if (totalStudents > 0) ...[
                            Icon(Icons.people_outline,
                                size: 13, color: Colors.grey.shade400),
                            const SizedBox(width: 4),
                            Text('$totalStudents Siswa',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey.shade500)),
                          ],
                        ],
                      ),
                      
                      const SizedBox(height: 12),
                      const Divider(height: 1),
                      const SizedBox(height: 10),
                      
                      // Action Buttons
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.remove_red_eye, size: 16),
                              label: const Text('Preview', style: TextStyle(fontSize: 12)),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.blue.shade700,
                                side: BorderSide(color: Colors.blue.shade200),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () => _showPreview(agenda),
                            ),
                          ),
                          const SizedBox(width: 12),
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
                                final result = await Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (context) => JurnalFormScreen(agendaData: agenda)),
                                );
                                if (result == true) {
                                  _fetchAgendas(refresh: true);
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
            ],
          ),
        ),
      ),
    );
  }
}

