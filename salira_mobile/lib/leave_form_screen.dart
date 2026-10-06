import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'main.dart';

class LeaveFormScreen extends StatefulWidget {
  const LeaveFormScreen();
  @override
  State<LeaveFormScreen> createState() => LeaveFormScreenState();
}

class LeaveFormScreenState extends State<LeaveFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoadingData = true;
  bool _isSaving = false;

  List<dynamic> _approvers = [];
  List<dynamic> _types = [];

  String? _selectedType;
  String? _selectedApproverId;
  DateTime? _startDate;
  DateTime? _endDate;
  final _reasonController    = TextEditingController();
  final _taskDescController  = TextEditingController();

  XFile? _attachmentFile;
  XFile? _taskFile;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadFormData();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _taskDescController.dispose();
    super.dispose();
  }

  Future<void> _loadFormData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;
      final url = Uri.parse('${getBaseUrl()}/leaves/form-data');
      final response = await http.get(url, headers: {'Authorization': 'Bearer $token', 'Accept': 'application/json'});
      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _approvers = res['approvers'] ?? [];
            _types = res['types'] ?? [];
          });
        }
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally { 
      if (mounted) {
        setState(() => _isLoadingData = false); 
      }
    }
  }

  Future<void> _pickDate({required bool isStart}) async {
    final now = DateTime.now();
    final initial = isStart ? (_startDate ?? now) : (_endDate ?? _startDate ?? now);
    final firstDate = isStart ? DateTime(now.year - 1) : (_startDate ?? DateTime(now.year - 1));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: firstDate,
      lastDate: DateTime(now.year + 2),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(colorScheme: const ColorScheme.light(primary: Color(0xFF0037B0), onPrimary: Colors.white)),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        if (isStart) { 
          _startDate = picked; 
          if (_endDate != null && _endDate!.isBefore(picked)) {
            _endDate = picked; 
          }
        } else {
          _endDate = picked;
        }
      });
    }
  }

  String _formatDate(DateTime? dt) {
    if (dt == null) return 'Pilih Tanggal';
    const m = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
    return '${dt.day} ${m[dt.month]} ${dt.year}';
  }

  Future<void> _pickAttachment() async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file != null) setState(() => _attachmentFile = file);
  }

  Future<void> _pickTaskFile() async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file != null) setState(() => _taskFile = file);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih jenis izin.'), backgroundColor: Colors.orange));
      return;
    }
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tanggal wajib diisi.'), backgroundColor: Colors.orange));
      return;
    }
    if (_selectedApproverId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih penerima permohonan izin.'), backgroundColor: Colors.orange));
      return;
    }

    setState(() => _isSaving = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;

      String pad2(int n) => n.toString().padLeft(2, '0');
      String fmt(DateTime d) => '${d.year}-${pad2(d.month)}-${pad2(d.day)}';

      var request = http.MultipartRequest('POST', Uri.parse('${getBaseUrl()}/leaves'));
      request.headers.addAll({'Authorization': 'Bearer $token', 'Accept': 'application/json'});
      request.fields['type']         = _selectedType!;
      request.fields['start_date']   = fmt(_startDate!);
      request.fields['end_date']     = fmt(_endDate!);
      request.fields['reason']       = _reasonController.text;
      request.fields['addressed_to'] = _selectedApproverId!;
      if (_taskDescController.text.isNotEmpty) {
        request.fields['task_description'] = _taskDescController.text;
      }

      if (_attachmentFile != null) {
        if (kIsWeb) {
          request.files.add(http.MultipartFile.fromBytes('attachment', await _attachmentFile!.readAsBytes(), filename: 'surat.jpg'));
        } else {
          request.files.add(await http.MultipartFile.fromPath('attachment', _attachmentFile!.path));
        }
      }
      if (_taskFile != null) {
        if (kIsWeb) {
          request.files.add(http.MultipartFile.fromBytes('task_file', await _taskFile!.readAsBytes(), filename: 'tugas.jpg'));
        } else {
          request.files.add(await http.MultipartFile.fromPath('task_file', _taskFile!.path));
        }
      }

      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);

      if (response.statusCode == 201) {
        if (mounted) { 
          Navigator.pop(context, true); 
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Permohonan izin berhasil diajukan!'), backgroundColor: Colors.green)); 
        }
      } else {
        final res = jsonDecode(response.body);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal: ${res['message'] ?? 'Terjadi kesalahan'}'), backgroundColor: Colors.red));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Koneksi bermasalah.'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      appBar: AppBar(
        title: const Text('Ajukan Izin', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
        backgroundColor: const Color(0xFF0037B0),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: Column(
          children: [

          // Body
          Flexible(
            child: _isLoadingData
                ? const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator(color: Color(0xFF0037B0))))
                : Form(
                    key: _formKey,
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Jenis Izin
                          _sectionTitle('Jenis Izin'),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8, runSpacing: 8,
                            children: _types.map((t) {
                              final isSelected = _selectedType == t['value'];
                              return GestureDetector(
                                onTap: () => setState(() => _selectedType = t['value']),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 180),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFF0037B0) : Colors.white,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: isSelected ? const Color(0xFF0037B0) : Colors.grey.shade300),
                                    boxShadow: isSelected ? [const BoxShadow(color: Color(0x330037B0), blurRadius: 8, offset: Offset(0, 3))] : [],
                                  ),
                                  child: Text(t['label'], style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : Colors.grey.shade700)),
                                ),
                              );
                            }).toList(),
                          ),

                          const SizedBox(height: 20),
                          _sectionTitle('Ditujukan Kepada'),
                          const SizedBox(height: 8),
                          _buildDropdown('Pilih Kepala Sekolah', _selectedApproverId, _approvers, (val) => setState(() => _selectedApproverId = val)),

                          const SizedBox(height: 20),
                          _sectionTitle('Tanggal'),
                          const SizedBox(height: 8),
                          Row(children: [
                            Expanded(child: _buildDatePicker('Mulai', _startDate, () => _pickDate(isStart: true))),
                            Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: Text('→', style: TextStyle(fontSize: 18, color: Colors.grey.shade400, fontWeight: FontWeight.bold))),
                            Expanded(child: _buildDatePicker('Selesai', _endDate, () => _pickDate(isStart: false))),
                          ]),

                          const SizedBox(height: 20),
                          _sectionTitle('Alasan / Keterangan'),
                          const SizedBox(height: 8),
                          _buildTextField(_reasonController, 'Jelaskan alasan permohonan izin Anda...', maxLines: 3, isRequired: true),

                          const SizedBox(height: 20),
                          _sectionTitle('Lampiran Surat (Opsional)'),
                          const SizedBox(height: 8),
                          _buildFilePicker(_attachmentFile, 'Unggah Surat Keterangan (JPG/PNG/PDF)', _pickAttachment),

                          const SizedBox(height: 20),
                          _sectionTitle('Tugas Pengganti (Opsional)'),
                          const SizedBox(height: 8),
                          _buildTextField(_taskDescController, 'Deskripsi tugas yang ditinggalkan...', maxLines: 2),
                          const SizedBox(height: 8),
                          _buildFilePicker(_taskFile, 'Unggah File Tugas (JPG/PNG/PDF)', _pickTaskFile),

                          const SizedBox(height: 28),
                          SizedBox(
                            width: double.infinity, height: 52,
                            child: ElevatedButton(
                              onPressed: _isSaving ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0037B0),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                elevation: 3,
                              ),
                              child: _isSaving ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Kirim Permohonan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),
        ],
      ),
    ));
  }

  Widget _sectionTitle(String title) => Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87));

  Widget _buildDropdown(String hint, String? value, List<dynamic> items, Function(String?) onChange) {
    return DropdownButtonFormField<String>(
      value: value,
      hint: Text(hint, style: TextStyle(color: Colors.grey.shade500)),
      items: items.map((i) => DropdownMenuItem<String>(value: i['id'].toString(), child: Text(i['name'].toString()))).toList(),
      onChanged: onChange,
      decoration: _inputDecoration(),
      validator: (v) => v == null ? 'Wajib dipilih' : null,
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String hint, {int maxLines = 1, bool isRequired = false}) {
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      validator: isRequired ? (v) => (v == null || v.isEmpty) ? 'Wajib diisi' : null : null,
      decoration: _inputDecoration(hint: hint),
    );
  }

  Widget _buildDatePicker(String label, DateTime? value, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade300)),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(child: Text(value == null ? label : _formatDate(value), style: TextStyle(fontSize: 12, color: value == null ? Colors.grey.shade500 : Colors.black87))),
            Icon(Icons.calendar_today, size: 14, color: Colors.grey.shade500),
          ],
        ),
      ),
    );
  }

  Widget _buildFilePicker(XFile? file, String hint, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(
          color: file != null ? const Color(0xFF0037B0).withValues(alpha: 0.05) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: file != null ? const Color(0xFF0037B0).withValues(alpha: 0.4) : Colors.grey.shade300, style: BorderStyle.solid),
        ),
        child: Row(
          children: [
            Icon(file != null ? Icons.attach_file : Icons.cloud_upload_outlined, size: 20, color: file != null ? const Color(0xFF0037B0) : Colors.grey.shade500),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                file != null ? file.name : hint,
                style: TextStyle(fontSize: 12, color: file != null ? const Color(0xFF0037B0) : Colors.grey.shade500),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (file != null) GestureDetector(
              onTap: () {
                if (hint.contains('Surat')) {
                  setState(() => _attachmentFile = null);
                } else {
                  setState(() => _taskFile = null);
                }
              },
              child: const Icon(Icons.close, size: 16, color: Colors.red),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({String? hint}) => InputDecoration(
    hintText: hint,
    hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0037B0), width: 1.5)),
  );
}


