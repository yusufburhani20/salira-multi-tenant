import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'main.dart';

class AssessmentFormScreen extends StatefulWidget {
  final dynamic assessmentData;
  final bool isFinal;

  const AssessmentFormScreen({
    super.key,
    this.assessmentData,
    this.isFinal = false,
  });

  @override
  State<AssessmentFormScreen> createState() => _AssessmentFormScreenState();
}

class _AssessmentFormScreenState extends State<AssessmentFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoadingData = true;
  bool _isSaving = false;
  bool _isLoadingStudents = false;

  List<dynamic> _classes = [];
  List<dynamic> _subjects = [];
  List<dynamic> _types = [];
  List<dynamic> _students = [];
  
  // Form Values
  String? _selectedClassId;
  String? _selectedSubjectId;
  String? _selectedType;
  DateTime _selectedDate = DateTime.now();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _kkmController = TextEditingController();
  
  // Student Scores
  // Key: student_id, Value: Map with 'score' and 'notes'
  final Map<int, Map<String, dynamic>> _scores = {};

  @override
  void initState() {
    super.initState();
    _fetchFormData();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _kkmController.dispose();
    super.dispose();
  }

  Future<void> _fetchFormData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;

      final prefix = widget.isFinal ? '/final-assessments' : '/assessments';
      final url = Uri.parse('${getBaseUrl()}$prefix/form-data');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      });

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _classes = res['classes'] ?? [];
            _subjects = res['subjects'] ?? [];
            _types = res['types'] ?? [];
            
            if (widget.assessmentData != null) {
              _selectedClassId = widget.assessmentData['academic_class_id']?.toString();
              _selectedSubjectId = widget.assessmentData['subject_id']?.toString();
              _selectedType = widget.assessmentData['type'];
              _titleController.text = widget.assessmentData['title'] ?? '';
              _kkmController.text = widget.assessmentData['kkm']?.toString() ?? '';
              
              if (widget.assessmentData['date'] != null) {
                _selectedDate = DateTime.tryParse(widget.assessmentData['date']) ?? DateTime.now();
              }
              
              if (widget.assessmentData['scores'] != null) {
                final scoresList = widget.assessmentData['scores'] as List;
                for (var s in scoresList) {
                  if (s['student_id'] != null) {
                    _scores[s['student_id']] = {
                      'score': s['score']?.toString() ?? '',
                      'notes': s['notes'] ?? '',
                    };
                  }
                }
              }
            }
          });
          
          if (_selectedClassId != null) {
            _fetchStudents(_selectedClassId!);
          } else {
            setState(() => _isLoadingData = false);
          }
        }
      }
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => _isLoadingData = false);
    }
  }

  Future<void> _fetchStudents(String classId) async {
    setState(() => _isLoadingStudents = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;

      final prefix = widget.isFinal ? '/final-assessments' : '/assessments';
      final url = Uri.parse('${getBaseUrl()}$prefix/students/$classId');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      });

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _students = res['data'] ?? [];
            
            // Initialize empty scores for new students
            for (var student in _students) {
              final sid = student['id'];
              if (!_scores.containsKey(sid)) {
                _scores[sid] = {'score': '', 'notes': ''};
              }
            }
          });
        }
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      if (mounted) setState(() {
        _isLoadingStudents = false;
        _isLoadingData = false;
      });
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
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
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _saveAssessment() async {
    if (!_formKey.currentState!.validate()) return;
    
    // Validate scores
    List<Map<String, dynamic>> scoresArray = [];
    for (var student in _students) {
      final sid = student['id'];
      final scoreStr = _scores[sid]?['score'] ?? '';
      
      // If editing existing, we might submit all. If new, we submit those who have scores
      // For simplicity, we require all students to have a score, or default to 0.
      double parsedScore = double.tryParse(scoreStr) ?? 0.0;
      
      scoresArray.add({
        'student_id': sid,
        'score': parsedScore,
        'notes': _scores[sid]?['notes'] ?? '',
      });
    }

    if (scoresArray.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Siswa tidak ditemukan atau belum dipilih.'), backgroundColor: Colors.orange)
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;

      final isEdit = widget.assessmentData != null;
      final id = isEdit ? widget.assessmentData['id'] : '';
      
      final prefix = widget.isFinal ? '/final-assessments' : '/assessments';
      final url = Uri.parse('${getBaseUrl()}$prefix${isEdit ? '/$id' : ''}');
      
      final body = {
        'academic_class_id': _selectedClassId,
        'subject_id': _selectedSubjectId,
        if (widget.isFinal) 'type': _selectedType,
        'date': '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
        'title': _titleController.text,
        'kkm': _kkmController.text,
        'scores': scoresArray,
      };

      final response = isEdit
          ? await http.put(url, headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }, body: jsonEncode(body))
          : await http.post(url, headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }, body: jsonEncode(body));

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          Navigator.pop(context, true);
        }
      } else {
        final res = jsonDecode(response.body);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal menyimpan: ${res['message'] ?? 'Error'}'), backgroundColor: Colors.red)
          );
        }
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      appBar: AppBar(
        title: Text(widget.assessmentData == null ? 'Tambah Nilai' : 'Edit Nilai', 
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: const Color(0xFF0037B0),
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoadingData
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0037B0)))
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  _buildDropdownField('Kelas', 'Pilih Kelas', _selectedClassId, _classes, (val) {
                    setState(() {
                      _selectedClassId = val;
                      _students = [];
                      _scores.clear();
                    });
                    if (val != null) _fetchStudents(val);
                  }, enabled: widget.assessmentData == null),
                  
                  const SizedBox(height: 16),
                  _buildDropdownField('Mata Pelajaran', 'Pilih Mapel', _selectedSubjectId, _subjects, (val) {
                    setState(() => _selectedSubjectId = val);
                  }),

                  if (widget.isFinal) ...[
                    const SizedBox(height: 16),
                    _buildDropdownField('Jenis Asesmen', 'Pilih Jenis', _selectedType, _types.map((e) => {'id': e, 'name': e}).toList(), (val) {
                      setState(() => _selectedType = val);
                    }),
                  ],
                  
                  const SizedBox(height: 16),
                  _buildTextField('Judul Asesmen / Materi', 'Cth: Ulangan Harian Bab 1', _titleController),
                  
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField('KKM', 'Cth: 75', _kkmController, isNumber: true),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Tanggal', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
                            const SizedBox(height: 8),
                            InkWell(
                              onTap: () => _selectDate(context),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey.shade300),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}'),
                                    const Icon(Icons.calendar_today, size: 18, color: Colors.grey),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 32),
                  Text('Daftar Nilai Siswa', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey.shade800)),
                  const SizedBox(height: 16),
                  
                  if (_isLoadingStudents)
                    const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator())),
                  
                  if (!_isLoadingStudents && _students.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                      child: const Center(child: Text('Pilih kelas terlebih dahulu atau kelas ini belum memiliki siswa.')),
                    ),
                  
                  if (!_isLoadingStudents && _students.isNotEmpty)
                    ..._students.map((student) => _buildStudentScoreRow(student)),
                    
                  const SizedBox(height: 40),
                  SizedBox(
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _saveAssessment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0037B0),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSaving 
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Simpan Nilai', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStudentScoreRow(dynamic student) {
    final sid = student['id'];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            student['name'] ?? 'Unknown',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              SizedBox(
                width: 80,
                child: TextFormField(
                  initialValue: _scores[sid]?['score'],
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Nilai',
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onChanged: (val) {
                    _scores[sid] ??= {};
                    _scores[sid]!['score'] = val;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  initialValue: _scores[sid]?['notes'],
                  decoration: InputDecoration(
                    labelText: 'Catatan (Opsional)',
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onChanged: (val) {
                    _scores[sid] ??= {};
                    _scores[sid]!['notes'] = val;
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, String hint, TextEditingController controller, {bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          validator: (value) => value == null || value.isEmpty ? 'Wajib diisi' : null,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField(String label, String hint, String? value, List<dynamic> items, Function(String?) onChanged, {bool enabled = true}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: value,
          hint: Text(hint),
          items: items.map((item) {
            return DropdownMenuItem<String>(
              value: item['id'].toString(),
              child: Text(item['name'].toString()),
            );
          }).toList(),
          onChanged: enabled ? onChanged : null,
          validator: (val) => val == null ? 'Wajib dipilih' : null,
          decoration: InputDecoration(
            filled: true,
            fillColor: enabled ? Colors.white : Colors.grey.shade100,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
          ),
        ),
      ],
    );
  }
}
