import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'main.dart'; // for getBaseUrl()
import 'offline_sync_helper.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen>
    with TickerProviderStateMixin {
  XFile? _image;
  Position? _currentPosition;
  bool _isLoading = false;
  bool _isLocating = false;
  String _locationStatus = 'Belum ada lokasi';
  bool _isInsideGeofence = false;
  double _distanceToGeofence = -1;

  List<dynamic> _sessions = [];
  List<dynamic> _todayLogs = [];
  List<dynamic> _geofences = [];
  Map<String, dynamic>? _activeSession;

  int? _selectedSessionId;
  String _selectedStatus = 'hadir';

  final MapController _mapController = MapController();
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseAnimation =
        Tween<double>(begin: 0.8, end: 1.2).animate(_pulseController);
    _fetchSessions();
    _startAutoLocation();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _fetchSessions() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;

      final url = Uri.parse('${getBaseUrl()}/attendance/sessions');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      });

      if (response.statusCode == 200) {
        final resData = jsonDecode(response.body);
        final data = resData['data'];
        if (mounted) {
          setState(() {
            _sessions = data['sessions'] ?? [];
            _todayLogs = data['todayLogs'] ?? [];
            _geofences = data['geofences'] ?? [];
            _activeSession = data['activeSession'];

            if (_activeSession != null) {
              _selectedSessionId = _activeSession!['id'];
            } else if (_sessions.isNotEmpty) {
              _selectedSessionId = _sessions.first['id'];
            }
          });
        }
      }
    } catch (e) {
      debugPrint("Error: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _startAutoLocation() async {
    await Future.delayed(const Duration(milliseconds: 500));
    await _getCurrentLocation();
  }

  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const R = 6371000.0;
    final dLat = (lat2 - lat1) * pi / 180;
    final dLon = (lon2 - lon1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180) * cos(lat2 * pi / 180) * sin(dLon / 2) * sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return R * c;
  }

  void _checkGeofence(double lat, double lng) {
    if (_geofences.isEmpty) {
      setState(() {
        _isInsideGeofence = true;
        _distanceToGeofence = 0;
        _locationStatus = 'Lokasi terdeteksi';
      });
      return;
    }

    double minDist = double.infinity;
    bool inside = false;

    for (final gf in _geofences) {
      final gfLat = double.tryParse(gf['latitude'].toString()) ?? 0;
      final gfLng = double.tryParse(gf['longitude'].toString()) ?? 0;
      final radius = double.tryParse(gf['radius'].toString()) ?? 100;
      final dist = _calculateDistance(lat, lng, gfLat, gfLng);

      if (dist < minDist) {
        minDist = dist;
        inside = dist <= radius;
      }
    }

    setState(() {
      _isInsideGeofence = inside;
      _distanceToGeofence = minDist;
      _locationStatus = inside
          ? '✓ Di dalam area (${minDist.round()}m dari pusat)'
          : '✗ Di luar area (${minDist.round()}m dari batas)';
    });
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLocating = true);

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('GPS belum diaktifkan')));
        }
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Izin GPS ditolak')));
          }
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: Text('Izin GPS diblokir secara permanen')));
        }
        return;
      }

      final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);

      if (mounted) {
        setState(() => _currentPosition = position);
        _checkGeofence(position.latitude, position.longitude);
        try {
          _mapController.move(
            LatLng(position.latitude, position.longitude),
            16.0,
          );
        } catch (_) {}
      }
    } catch (e) {
      debugPrint("Location error: $e");
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      imageQuality: 70,
      maxWidth: 1024,
    );
    if (pickedFile != null) {
      setState(() => _image = pickedFile);
    }
  }

  bool _hasLoggedSelectedSession() {
    if (_selectedSessionId == null) return false;
    return _todayLogs
        .any((log) => log['attendance_session_id'] == _selectedSessionId);
  }

  Map<String, dynamic>? _getSelectedSessionInfo() {
    if (_selectedSessionId == null) return null;
    try {
      return _sessions.firstWhere((s) => s['id'] == _selectedSessionId);
    } catch (_) {
      return null;
    }
  }

  Future<void> _submitAttendance() async {
    if (_selectedSessionId == null ||
        _currentPosition == null ||
        _image == null) {
      return;
    }

    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      var request = http.MultipartRequest(
          'POST', Uri.parse('${getBaseUrl()}/attendance/log'));
      request.headers
          .addAll({'Authorization': 'Bearer $token', 'Accept': 'application/json'});

      request.fields['attendance_session_id'] = _selectedSessionId.toString();
      request.fields['status'] = _selectedStatus;
      request.fields['latitude'] = _currentPosition!.latitude.toString();
      request.fields['longitude'] = _currentPosition!.longitude.toString();

      if (kIsWeb) {
        request.files.add(http.MultipartFile.fromBytes(
          'photo',
          await _image!.readAsBytes(),
          filename: 'photo.jpg',
        ));
      } else {
        request.files
            .add(await http.MultipartFile.fromPath('photo', _image!.path));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (mounted) {
        if (response.statusCode == 200 || response.statusCode == 201) {
          Navigator.of(context).pop(); // Close bottom sheet
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: Text('Presensi berhasil disimpan!',
                  style: TextStyle(color: Colors.white)),
              backgroundColor: Colors.green));
          _fetchSessions();
        } else if (response.statusCode >= 500) {
          // Jika server merespon dengan error 500+ (Server Down/Error), lempar exception
          // agar ditangkap oleh catch block dan disimpan offline
          throw Exception('Server Error: ${response.statusCode}');
        } else {
          final err = jsonDecode(response.body);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(err['message'] ?? 'Gagal melakukan absensi',
                  style: const TextStyle(color: Colors.white)),
              backgroundColor: Colors.red));
        }
      }
    } catch (e) {
      debugPrint('Koneksi terputus: $e');
      
      try {
        final photoBytes = await _image!.readAsBytes();
        await OfflineSyncHelper.savePendingAttendance(
          sessionId: _selectedSessionId.toString(),
          status: _selectedStatus,
          latitude: _currentPosition!.latitude.toString(),
          longitude: _currentPosition!.longitude.toString(),
          photoBytes: photoBytes,
          date: DateTime.now().toIso8601String(),
        );

        if (mounted) {
          Navigator.of(context).pop(); // Close bottom sheet
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Koneksi terputus! Presensi disimpan offline dan akan dikirim otomatis saat internet kembali.',
                style: TextStyle(color: Colors.white)),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 4),
          ));
        }
      } catch (innerE) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Gagal menyimpan presensi offline.',
                style: TextStyle(color: Colors.white)),
            backgroundColor: Colors.red,
          ));
        }
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showAttendanceBottomSheet() {
    final selectedInfo = _getSelectedSessionInfo();
    final isGtk = selectedInfo?['type'] == 'gtk';
    final hasLogged = _hasLoggedSelectedSession();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.85,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              children: [
                // Handle bar
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // Header
                Container(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0037B0).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.fingerprint,
                            color: Color(0xFF0037B0), size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Konfirmasi Presensi',
                                style: TextStyle(
                                    fontSize: 18, fontWeight: FontWeight.bold)),
                            Text(
                              selectedInfo != null
                                  ? '${selectedInfo['name']} • ${selectedInfo['start_time']} - ${selectedInfo['end_time']}'
                                  : 'Pilih sesi terlebih dahulu',
                              style: TextStyle(
                                  color: Colors.grey.shade600, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (hasLogged) ...[
                          // Already logged
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.green.shade200),
                            ),
                            child: Column(
                              children: [
                                const Icon(Icons.check_circle,
                                    color: Colors.green, size: 64),
                                const SizedBox(height: 12),
                                const Text('Presensi Tercatat!',
                                    style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.green)),
                                const SizedBox(height: 8),
                                Text(
                                    'Anda sudah melakukan presensi untuk sesi ini.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                        color: Colors.green.shade700)),
                              ],
                            ),
                          ),
                        ] else ...[
                          // Sesi dropdown
                          if (_sessions.isNotEmpty) ...[
                            const Text('Pilih Jadwal Sesi',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 13)),
                            const SizedBox(height: 8),
                            Container(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              decoration: BoxDecoration(
                                border:
                                    Border.all(color: Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<int>(
                                  value: _selectedSessionId,
                                  isExpanded: true,
                                  items: _sessions
                                      .map<DropdownMenuItem<int>>((s) {
                                    return DropdownMenuItem<int>(
                                      value: s['id'],
                                      child: Text(
                                          '${s['name']} (${s['start_time']} - ${s['end_time']})'),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    setState(() => _selectedSessionId = val);
                                    setSheetState(() {});
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],

                          // Status dropdown (GTK only)
                          if (isGtk) ...[
                            const Text('Status Kehadiran',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 13)),
                            const SizedBox(height: 8),
                            Container(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              decoration: BoxDecoration(
                                border:
                                    Border.all(color: Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _selectedStatus,
                                  isExpanded: true,
                                  items: const [
                                    DropdownMenuItem(
                                        value: 'hadir', child: Text('Hadir')),
                                    DropdownMenuItem(
                                        value: 'tawasul',
                                        child: Text('Hadir & Tawasul Bersama')),
                                  ],
                                  onChanged: (val) {
                                    setState(
                                        () => _selectedStatus = val ?? 'hadir');
                                    setSheetState(() {});
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],

                          // Location status
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: _currentPosition != null
                                  ? (_isInsideGeofence
                                      ? Colors.green.shade50
                                      : Colors.red.shade50)
                                  : Colors.orange.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _currentPosition != null
                                    ? (_isInsideGeofence
                                        ? Colors.green.shade200
                                        : Colors.red.shade200)
                                    : Colors.orange.shade200,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  _currentPosition != null
                                      ? (_isInsideGeofence
                                          ? Icons.location_on
                                          : Icons.location_off)
                                      : Icons.location_searching,
                                  color: _currentPosition != null
                                      ? (_isInsideGeofence
                                          ? Colors.green
                                          : Colors.red)
                                      : Colors.orange,
                                  size: 22,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _currentPosition != null
                                            ? _locationStatus
                                            : 'Mendapatkan lokasi...',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          color: _currentPosition != null
                                              ? (_isInsideGeofence
                                                  ? Colors.green.shade800
                                                  : Colors.red.shade800)
                                              : Colors.orange.shade800,
                                        ),
                                      ),
                                      if (_currentPosition != null)
                                        Text(
                                          '${_currentPosition!.latitude.toStringAsFixed(6)}, ${_currentPosition!.longitude.toStringAsFixed(6)}',
                                          style: TextStyle(
                                              fontSize: 11,
                                              color: Colors.grey.shade600),
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Selfie section
                          const Text('Foto Selfie',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: () async {
                              await _takePhoto();
                              setSheetState(() {});
                            },
                            child: Container(
                              width: double.infinity,
                              height: 160,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: _image != null
                                        ? Colors.green.shade300
                                        : Colors.grey.shade300,
                                    width: 2),
                              ),
                              child: _image != null
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(14),
                                      child: kIsWeb
                                          ? Image.network(_image!.path,
                                              fit: BoxFit.cover)
                                          : Image.file(File(_image!.path),
                                              fit: BoxFit.cover),
                                    )
                                  : Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.camera_alt_outlined,
                                            size: 40,
                                            color: Colors.grey.shade400),
                                        const SizedBox(height: 8),
                                        Text('Tap untuk buka kamera depan',
                                            style: TextStyle(
                                                color: Colors.grey.shade500,
                                                fontSize: 13)),
                                      ],
                                    ),
                            ),
                          ),
                          if (_image != null)
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton.icon(
                                onPressed: () async {
                                  await _takePhoto();
                                  setSheetState(() {});
                                },
                                icon: const Icon(Icons.refresh, size: 16),
                                label: const Text('Ulangi Foto'),
                                style: TextButton.styleFrom(
                                    foregroundColor: Colors.grey.shade600),
                              ),
                            ),

                          const SizedBox(height: 24),

                          // Submit
                          SizedBox(
                            width: double.infinity,
                            height: 54,
                            child: _isLoading
                                ? const Center(
                                    child: CircularProgressIndicator())
                                : ElevatedButton(
                                    onPressed: (_currentPosition != null &&
                                            _image != null &&
                                            _selectedSessionId != null)
                                        ? _submitAttendance
                                        : null,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0037B0),
                                      foregroundColor: Colors.white,
                                      disabledBackgroundColor:
                                          Colors.grey.shade300,
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(16)),
                                      elevation: 3,
                                    ),
                                    child: const Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.check_circle_outline,
                                            size: 20),
                                        SizedBox(width: 8),
                                        Text('KIRIM PRESENSI',
                                            style: TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                          ),
                          const SizedBox(height: 12),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasLogged = _hasLoggedSelectedSession();
    final selectedInfo = _getSelectedSessionInfo();

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // ─── FULL SCREEN MAP ─────────────────────────────
          _currentPosition != null
              ? FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: LatLng(
                      _currentPosition!.latitude,
                      _currentPosition!.longitude,
                    ),
                    initialZoom: 16.5,
                    interactionOptions: const InteractionOptions(
                      flags: InteractiveFlag.all,
                    ),
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.konfigin.salira',
                    ),
                    // Geofence circles
                    CircleLayer(
                      circles: _geofences.map((gf) {
                        final lat = double.tryParse(gf['latitude'].toString()) ?? 0;
                        final lng = double.tryParse(gf['longitude'].toString()) ?? 0;
                        final radius = double.tryParse(gf['radius'].toString()) ?? 100;
                        return CircleMarker(
                          point: LatLng(lat, lng),
                          radius: radius,
                          useRadiusInMeter: true,
                          color: _isInsideGeofence
                              ? Colors.green.withOpacity(0.15)
                              : Colors.red.withOpacity(0.12),
                          borderColor: _isInsideGeofence
                              ? Colors.green.withOpacity(0.8)
                              : Colors.red.withOpacity(0.6),
                          borderStrokeWidth: 2.5,
                        );
                      }).toList(),
                    ),
                    // User location marker
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: LatLng(
                            _currentPosition!.latitude,
                            _currentPosition!.longitude,
                          ),
                          width: 60,
                          height: 60,
                          child: AnimatedBuilder(
                            animation: _pulseAnimation,
                            builder: (_, __) => Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  width: 50 * _pulseAnimation.value,
                                  height: 50 * _pulseAnimation.value,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: (_isInsideGeofence
                                            ? Colors.green
                                            : Colors.red)
                                        .withOpacity(0.2),
                                  ),
                                ),
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: _isInsideGeofence
                                        ? Colors.green
                                        : Colors.red,
                                    border: Border.all(
                                        color: Colors.white, width: 3),
                                    boxShadow: [
                                      BoxShadow(
                                        color: (_isInsideGeofence
                                                ? Colors.green
                                                : Colors.red)
                                            .withOpacity(0.5),
                                        blurRadius: 8,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                )
              : Container(
                  color: Colors.grey.shade200,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.location_searching,
                            size: 64, color: Colors.grey.shade400),
                        const SizedBox(height: 16),
                        Text('Mendeteksi Lokasi...',
                            style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 16,
                                fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),

          // ─── APP BAR OVERLAY ─────────────────────────────
          SafeArea(
            child: Column(
              children: [
                // Top bar
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 8)
                          ],
                        ),
                        child: const Text('Presensi Pegawai',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 15)),
                      ),
                      const Spacer(),
                      // Refresh location button
                      GestureDetector(
                        onTap: _isLocating ? null : _getCurrentLocation,
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 8)
                            ],
                          ),
                          child: _isLocating
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Color(0xFF0037B0)))
                              : const Icon(Icons.my_location,
                                  color: Color(0xFF0037B0), size: 20),
                        ),
                      ),
                    ],
                  ),
                ),

                const Spacer(),
              ],
            ),
          ),

          // ─── BOTTOM INFO PANEL ───────────────────────────
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 20,
                      offset: const Offset(0, -5))
                ],
              ),
              child: _isLoading
                  ? const Padding(
                      padding: EdgeInsets.all(32),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  : Padding(
                      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Handle bar
                          Container(
                            width: 40,
                            height: 4,
                            margin: const EdgeInsets.only(bottom: 20),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),

                          // Session chip & status
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (selectedInfo != null)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF0037B0)
                                              .withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(20),
                                        ),
                                        child: Text(
                                          '${selectedInfo['name']} • ${selectedInfo['start_time']}',
                                          style: const TextStyle(
                                              color: Color(0xFF0037B0),
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12),
                                        ),
                                      ),
                                    const SizedBox(height: 6),
                                    Text(
                                      _sessions.isEmpty
                                          ? 'Tidak ada sesi aktif hari ini'
                                          : hasLogged
                                              ? 'Presensi sudah tercatat'
                                              : 'Tap tombol absen di bawah',
                                      style: TextStyle(
                                          color: Colors.grey.shade600,
                                          fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              // Status badge
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: _currentPosition == null
                                      ? Colors.orange.shade50
                                      : _isInsideGeofence
                                          ? Colors.green.shade50
                                          : Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _currentPosition == null
                                        ? Colors.orange.shade200
                                        : _isInsideGeofence
                                            ? Colors.green.shade200
                                            : Colors.red.shade200,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      _currentPosition == null
                                          ? Icons.location_searching
                                          : _isInsideGeofence
                                              ? Icons.check_circle
                                              : Icons.cancel,
                                      size: 14,
                                      color: _currentPosition == null
                                          ? Colors.orange
                                          : _isInsideGeofence
                                              ? Colors.green
                                              : Colors.red,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      _currentPosition == null
                                          ? 'Locating...'
                                          : _isInsideGeofence
                                              ? 'Dalam Area'
                                              : 'Luar Area',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: _currentPosition == null
                                            ? Colors.orange
                                            : _isInsideGeofence
                                                ? Colors.green
                                                : Colors.red,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 16),

                          // Already logged logs
                          if (_todayLogs.isNotEmpty) ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Riwayat Presensi Hari Ini',
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12)),
                                  const SizedBox(height: 8),
                                  ..._todayLogs.map((log) => Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.check_circle,
                                                color: Colors.green, size: 14),
                                            const SizedBox(width: 6),
                                            Text(
                                              log['session']?['name'] ?? '-',
                                              style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600),
                                            ),
                                            const SizedBox(width: 6),
                                            Text(log['time'] ?? '',
                                                style: TextStyle(
                                                    fontSize: 11,
                                                    color:
                                                        Colors.grey.shade500)),
                                          ],
                                        ),
                                      )),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],

                          // Absen button
                          if (_sessions.isNotEmpty)
                            SizedBox(
                              width: double.infinity,
                              height: 54,
                              child: ElevatedButton(
                                onPressed: _showAttendanceBottomSheet,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: hasLogged
                                      ? Colors.green
                                      : const Color(0xFF0037B0),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(16)),
                                  elevation: 4,
                                ),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                        hasLogged
                                            ? Icons.check_circle
                                            : Icons.fingerprint,
                                        size: 22),
                                    const SizedBox(width: 10),
                                    Text(
                                      hasLogged
                                          ? 'SUDAH ABSEN — Lihat Detail'
                                          : 'MULAI ABSENSI',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          else
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.event_busy,
                                      color: Colors.grey, size: 20),
                                  SizedBox(width: 8),
                                  Text('Tidak ada jadwal absensi hari ini',
                                      style: TextStyle(
                                          color: Colors.grey,
                                          fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
