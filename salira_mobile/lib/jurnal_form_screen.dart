import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'main.dart';

class JurnalFormScreen extends StatefulWidget {
  final Map<String, dynamic>? agendaData;

  const JurnalFormScreen({super.key, this.agendaData});

  @override
  State<JurnalFormScreen> createState() => _JurnalFormScreenState();
}

class _JurnalFormScreenState extends State<JurnalFormScreen> {
  final _formKey = GlobalKey<FormState>();
  
  bool _isLoading = true;
  bool _isSubmitting = false;

  List<dynamic> _classes = [];
  List<dynamic> _subjects = [];
  List<dynamic> _allSubjects = []; // Simpan semua mapel
  List<dynamic> _students = [];

  int? _selectedClassId;
  int? _selectedSubjectId;
  DateTime _selectedDate = DateTime.now();
  int _lessonStart = 1;
  int _lessonEnd = 1;
  int _maxLessonHours = 12; // Default, akan ditimpa dari API
  Map<String, dynamic>? _lessonHoursSchedule;
  final TextEditingController _topicController = TextEditingController(); // Maps to Tujuan Pembelajaran
  final TextEditingController _learningModelController = TextEditingController();
  final TextEditingController _activitiesController = TextEditingController();

  Map<int, String> _studentAttendances = {}; // student_id -> status
  List<int> _bookedSlots = [];
  Map<int, String> _bookedSlotTeachers = {};

  @override
  void initState() {
    super.initState();
    _fetchFormData().then((_) {
      if (widget.agendaData != null) {
        _populateEditData();
      }
    });
  }

  @override
  void dispose() {
    _topicController.dispose();
    _learningModelController.dispose();
    _activitiesController.dispose();
    super.dispose();
  }

  Future<void> _fetchFormData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      
      final url = Uri.parse('${getBaseUrl()}/agendas/form-data');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _classes = data['classes'] ?? [];
            _allSubjects = data['subjects'] ?? [];
            _maxLessonHours = data['max_lesson_hours'] ?? 12; // Get max hours from API
            _lessonHoursSchedule = data['lesson_hours'];
            if (widget.agendaData != null) {
              _subjects = _allSubjects; // Edit mode: tampilkan semua atau biarkan karena tidak bisa ganti kelas
            } else {
              _subjects = []; // New mode: kosong sampai kelas dipilih
            }
            _isLoading = false;
          });
          if (_selectedClassId != null) {
            _fetchBookedPeriods();
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal memuat data formulir')));
        setState(() => _isLoading = false);
      }
    }
  }

  void _populateEditData() {
    final a = widget.agendaData!;
    setState(() {
      _selectedClassId = a['academic_class_id'];
      _selectedSubjectId = a['subject_id'];
      _selectedDate = DateTime.tryParse(a['date'].toString()) ?? DateTime.now();
      _lessonStart = a['lesson_hour_start'] ?? 1;
      _lessonEnd = a['lesson_hour_end'] ?? 1;
      
      // Prevent Dropdown crash if saved lesson hours exceed maxLessonHours from settings
      if (_lessonStart > _maxLessonHours) _maxLessonHours = _lessonStart;
      if (_lessonEnd > _maxLessonHours) _maxLessonHours = _lessonEnd;

      _topicController.text = a['topic'] ?? '';
      _learningModelController.text = a['learning_model'] ?? '';
      _activitiesController.text = a['activities'] ?? '';
    });
    if (_selectedClassId != null) {
      _fetchBookedPeriods();
      _fetchStudentsForEdit(a['id']);
    }
  }

  String _getDayKey(int weekday) {
    switch (weekday) {
      case 1: return 'monday';
      case 2: return 'tuesday';
      case 3: return 'wednesday';
      case 4: return 'thursday';
      case 5: return 'friday';
      case 6: return 'saturday';
      case 7: return 'sunday';
      default: return 'monday';
    }
  }

  String _getLessonLabel(int hourIndex) {
    final defaultLabel = '$hourIndex';
    String label = defaultLabel;
    
    if (_lessonHoursSchedule != null) {
      final dayKey = _getDayKey(_selectedDate.weekday);
      final daySchedule = _lessonHoursSchedule![dayKey] as List<dynamic>?;
      
      if (daySchedule != null && daySchedule.isNotEmpty) {
        final schedule = daySchedule.firstWhere(
          (s) => s['label'].toString() == hourIndex.toString(), 
          orElse: () => null
        );
        
        if (schedule != null) {
          final start = schedule['start'] ?? '';
          final end = schedule['end'] ?? '';
          if (start.toString().isNotEmpty && end.toString().isNotEmpty) {
            label = '$hourIndex ($start - $end)';
          }
        }
      }
    }
    
    if (_bookedSlots.contains(hourIndex)) {
      final teacher = _bookedSlotTeachers[hourIndex] ?? 'Guru Lain';
      label += ' [Diisi: $teacher]';
    }
    
    return label;
  }

  Future<void> _fetchBookedPeriods() async {
    if (_selectedClassId == null) {
      if (mounted) setState(() { _bookedSlots = []; _bookedSlotTeachers = {}; });
      return;
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final dateStr = "${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}";
      final agendaId = widget.agendaData != null ? widget.agendaData!['id'] : null;
      
      var urlStr = '${getBaseUrl()}/agendas/booked-periods?academic_class_id=$_selectedClassId&date=$dateStr';
      if (agendaId != null) {
        urlStr += '&exclude_agenda_id=$agendaId';
      }
      
      final response = await http.get(Uri.parse(urlStr), headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      });

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final List<int> booked = [];
        final Map<int, String> teachers = {};
        
        for (var item in data) {
          final String periodStr = item['lesson_period'] ?? '';
          final teacherName = item['teacher']?['name'] ?? 'Guru Lain';
          
          final slotsStr = periodStr.split('(')[0].trim();
          if (slotsStr.contains(',')) {
            for (var s in slotsStr.split(',')) {
               final val = int.tryParse(s.trim());
               if (val != null) {
                 booked.add(val);
                 teachers[val] = teacherName;
               }
            }
          } else if (slotsStr.contains('-')) {
             final parts = slotsStr.split('-');
             final start = int.tryParse(parts[0].trim()) ?? 0;
             final end = int.tryParse(parts.length > 1 ? parts[1].trim() : '') ?? start;
             for (var i = start; i <= end; i++) {
               booked.add(i);
               teachers[i] = teacherName;
             }
          } else {
             final val = int.tryParse(slotsStr);
             if (val != null) {
               booked.add(val);
               teachers[val] = teacherName;
             }
          }
        }
        
        if (mounted) {
          setState(() {
            _bookedSlots = booked;
            _bookedSlotTeachers = teachers;
          });
        }
      }
    } catch (e) {
      debugPrint("Error fetching booked periods: $e");
    }
  }

  Future<void> _fetchStudentsByClass(int classId) async {
    setState(() {
      _students = [];
      _studentAttendances.clear();
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      // Menggunakan endpoint dari assessment yang mengembalikan daftar siswa per kelas
      final url = Uri.parse('${getBaseUrl()}/assessments/students/$classId');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _students = data['data'] ?? [];
          for (var s in _students) {
            _studentAttendances[s['id']] = 'hadir'; // default hadir
          }
        });
      }
    } catch (e) {
      debugPrint("Error fetching students: $e");
    }
  }

  Future<void> _fetchStudentsForEdit(int agendaId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      // Endpoint khusus agenda untuk edit, yang mengembalikan status absensi sebelumnya
      final url = Uri.parse('${getBaseUrl()}/agendas/$agendaId/students');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _students = data['data'] ?? [];
          for (var s in _students) {
            _studentAttendances[s['id']] = s['status'] ?? 'hadir';
          }
        });
      }
    } catch (e) {
      debugPrint("Error fetching edit students: $e");
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF0037B0),
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
      _fetchBookedPeriods();
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedClassId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih Kelas terlebih dahulu')));
      return;
    }
    if (_selectedSubjectId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih Mata Pelajaran terlebih dahulu')));
      return;
    }
    if (_lessonEnd < _lessonStart) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Jam pelajaran selesai tidak boleh lebih kecil dari mulai')));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      
      final url = widget.agendaData == null 
          ? Uri.parse('${getBaseUrl()}/agendas')
          : Uri.parse('${getBaseUrl()}/agendas/${widget.agendaData!['id']}');
          
      final dateStr = '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';
      
      final Map<String, dynamic> bodyData = {
        'academic_class_id': _selectedClassId,
        'subject_id': _selectedSubjectId,
        'date': dateStr,
        'lesson_hour_start': _lessonStart,
        'lesson_hour_end': _lessonEnd,
        'topic': _topicController.text,
        'learning_model': _learningModelController.text,
        'activities': _activitiesController.text,
      };

      // Always submit attendances on create AND edit
      final attendances = _studentAttendances.entries.map((e) => {
        'student_id': e.key,
        'status': e.value
      }).toList();
      bodyData['attendances'] = attendances;

      final request = http.Request(widget.agendaData == null ? 'POST' : 'PUT', url);
      request.headers.addAll({
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      });
      request.body = jsonEncode(bodyData);

      final response = await http.Client().send(request);
      final responseBody = await response.stream.bytesToString();
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(widget.agendaData == null ? 'Jurnal berhasil ditambahkan' : 'Jurnal berhasil diperbarui', style: const TextStyle(color: Colors.white)),
            backgroundColor: Colors.green,
          ));
          Navigator.pop(context, true); // true indicates refresh is needed
        }
      } else {
        final err = jsonDecode(responseBody);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(err['message'] ?? 'Terjadi kesalahan saat menyimpan', style: const TextStyle(color: Colors.white)),
            backgroundColor: Colors.red,
          ));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Terjadi kesalahan jaringan', style: TextStyle(color: Colors.white)),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      appBar: AppBar(
        title: Text(widget.agendaData == null ? 'Tambah Jurnal' : 'Edit Jurnal', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: const Color(0xFF0037B0),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Informasi Dasar
                    const Text('Informasi Jurnal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 12),
                    
                    // Class Dropdown
                    _buildDropdown(
                      label: 'Kelas',
                      value: _selectedClassId,
                      items: _classes.map((c) => DropdownMenuItem<int>(value: c['id'], child: Text(c['name']))).toList(),
                      onChanged: widget.agendaData != null ? null : (val) {
                        setState(() {
                          _selectedClassId = val as int?;
                          _selectedSubjectId = null; // Reset mapel
                          
                          if (_selectedClassId != null) {
                            _fetchStudentsByClass(_selectedClassId!);
                            
                            // Cari kelas yang dipilih
                            final cls = _classes.firstWhere((c) => c['id'] == _selectedClassId, orElse: () => null);
                            if (cls != null && cls['subjects'] != null && (cls['subjects'] as List).isNotEmpty) {
                              _subjects = cls['subjects'];
                            } else {
                              _subjects = []; // Jika tidak ada mapel di kelas ini
                            }
                            _fetchBookedPeriods();
                          } else {
                            _subjects = [];
                            _fetchBookedPeriods();
                          }
                        });
                      },
                      hint: 'Pilih Kelas',
                    ),
                    const SizedBox(height: 16),

                    // Subject Dropdown
                    _buildDropdown(
                      label: 'Mata Pelajaran',
                      value: _selectedSubjectId,
                      items: _subjects.map((s) => DropdownMenuItem<int>(value: s['id'], child: Text(s['name']))).toList(),
                      onChanged: (val) {
                        setState(() => _selectedSubjectId = val as int?);
                      },
                      hint: 'Pilih Mata Pelajaran',
                    ),
                    const SizedBox(height: 16),

                    // Tanggal
                    const Text('Tanggal', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: _selectDate,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}', style: const TextStyle(fontSize: 15)),
                            const Icon(Icons.calendar_today, color: Colors.grey, size: 20),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Jam Pelajaran
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Jam Ke (Mulai)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
                              const SizedBox(height: 8),
                              _buildDropdown(
                                label: '',
                                value: _lessonStart,
                                items: List.generate(_maxLessonHours, (index) => DropdownMenuItem<int>(
                                  value: index + 1, 
                                  enabled: !_bookedSlots.contains(index + 1),
                                  child: Text(_getLessonLabel(index + 1), style: TextStyle(fontSize: 12, color: _bookedSlots.contains(index + 1) ? Colors.grey : Colors.black87))
                                )),
                                onChanged: (val) {
                                  setState(() {
                                    _lessonStart = val as int;
                                    if (_lessonEnd < _lessonStart) _lessonEnd = _lessonStart;
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Jam Ke (Selesai)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
                              const SizedBox(height: 8),
                              _buildDropdown(
                                label: '',
                                value: _lessonEnd,
                                items: List.generate(_maxLessonHours, (index) => DropdownMenuItem<int>(
                                  value: index + 1, 
                                  enabled: !_bookedSlots.contains(index + 1),
                                  child: Text(_getLessonLabel(index + 1), style: TextStyle(fontSize: 12, color: _bookedSlots.contains(index + 1) ? Colors.grey : Colors.black87))
                                )),
                                onChanged: (val) {
                                  setState(() {
                                    _lessonEnd = val as int;
                                    if (_lessonStart > _lessonEnd) _lessonStart = _lessonEnd;
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Tujuan Pembelajaran
                    const Text('Tujuan Pembelajaran', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _topicController,
                      validator: (val) => val == null || val.isEmpty ? 'Tujuan Pembelajaran tidak boleh kosong' : null,
                      maxLines: 2,
                      decoration: InputDecoration(
                        hintText: 'Misal: Siswa mampu...',
                        hintStyle: TextStyle(color: Colors.grey.shade400),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0037B0))),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Model & Media Pembelajaran
                    const Text('Model & Media Pembelajaran', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _learningModelController,
                      maxLines: 2,
                      decoration: InputDecoration(
                        hintText: 'Tuliskan model dan media...',
                        hintStyle: TextStyle(color: Colors.grey.shade400),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0037B0))),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Laporan Perkembangan Siswa
                    const Text('Laporan Perkembangan Siswa', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _activitiesController,
                      validator: (val) => val == null || val.isEmpty ? 'Laporan Perkembangan Siswa tidak boleh kosong' : null,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: 'Tuliskan laporan perkembangan...',
                        hintStyle: TextStyle(color: Colors.grey.shade400),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0037B0))),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Absensi Siswa
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Absensi Siswa', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('(Otomatis H jika kosong)', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    if (_selectedClassId == null)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.orange.shade200)),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline, color: Colors.orange.shade700, size: 20),
                            const SizedBox(width: 8),
                            Expanded(child: Text('Pilih kelas terlebih dahulu untuk melihat daftar siswa.', style: TextStyle(color: Colors.orange.shade800))),
                          ],
                        ),
                      )
                    else if (_students.isEmpty)
                      const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _students.length,
                        itemBuilder: (ctx, i) {
                          final student = _students[i];
                          return _buildStudentAttendanceItem(student['id'], student['name']);
                        },
                      ),
                    const SizedBox(height: 32),

                    // Tombol Simpan
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0037B0),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 2,
                        ),
                        child: _isSubmitting
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('SIMPAN JURNAL', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildDropdown({required String label, required dynamic value, required List<DropdownMenuItem<dynamic>> items, required void Function(dynamic)? onChanged, String? hint}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty) ...[
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
          const SizedBox(height: 8),
        ],
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<dynamic>(
              value: value,
              isExpanded: true,
              hint: hint != null ? Text(hint, style: TextStyle(color: Colors.grey.shade400)) : null,
              items: items,
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStudentAttendanceItem(int studentId, String studentName) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(studentName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              _statusChip(studentId, 'hadir', 'H', Colors.green),
              const SizedBox(width: 8),
              _statusChip(studentId, 'sakit', 'S', Colors.blue),
              const SizedBox(width: 8),
              _statusChip(studentId, 'izin', 'I', Colors.orange),
              const SizedBox(width: 8),
              _statusChip(studentId, 'alpha', 'A', Colors.red),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statusChip(int studentId, String statusValue, String label, MaterialColor color) {
    final isSelected = _studentAttendances[studentId] == statusValue;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _studentAttendances[studentId] = statusValue;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? color : Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? color : Colors.grey.shade300),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: isSelected ? Colors.white : Colors.grey.shade600,
            ),
          ),
        ),
      ),
    );
  }
}
