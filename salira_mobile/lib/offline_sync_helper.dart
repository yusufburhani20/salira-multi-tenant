import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'main.dart'; // untuk getBaseUrl()

class OfflineSyncHelper {
  static const String _key = 'pending_attendances';

  /// Menyimpan data absensi ke local storage jika gagal dikirim
  static Future<void> savePendingAttendance({
    required String sessionId,
    required String status,
    required String latitude,
    required String longitude,
    required List<int> photoBytes,
    required String date,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    
    // Ambil data yang sudah ada
    List<String> pendingList = prefs.getStringList(_key) ?? [];
    
    // Buat object baru
    final String base64Photo = base64Encode(photoBytes);
    final Map<String, dynamic> newData = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'attendance_session_id': sessionId,
      'status': status,
      'latitude': latitude,
      'longitude': longitude,
      'photo_base64': base64Photo,
      'date': date,
    };
    
    // Tambahkan ke list dan simpan
    pendingList.add(jsonEncode(newData));
    await prefs.setStringList(_key, pendingList);
    
    debugPrint('Absensi offline disimpan. Total antrean: ${pendingList.length}');
  }

  /// Mengambil jumlah absensi yang masih pending
  static Future<int> getPendingCount() async {
    final prefs = await SharedPreferences.getInstance();
    List<String> pendingList = prefs.getStringList(_key) ?? [];
    return pendingList.length;
  }

  /// Melakukan sinkronisasi data absensi yang pending ke server
  static Future<bool> syncPendingAttendances() async {
    final prefs = await SharedPreferences.getInstance();
    List<String> pendingList = prefs.getStringList(_key) ?? [];
    
    if (pendingList.isEmpty) return false;
    
    final token = prefs.getString('auth_token');
    if (token == null) return false;

    bool hasSynced = false;
    List<String> remainingList = [];

    for (String itemStr in pendingList) {
      try {
        final item = jsonDecode(itemStr);
        final photoBytes = base64Decode(item['photo_base64']);

        var request = http.MultipartRequest('POST', Uri.parse('${getBaseUrl()}/attendance/log'));
        request.headers.addAll({'Authorization': 'Bearer $token', 'Accept': 'application/json'});

        request.fields['attendance_session_id'] = item['attendance_session_id'];
        request.fields['status'] = item['status'];
        request.fields['latitude'] = item['latitude'];
        request.fields['longitude'] = item['longitude'];
        // Menggunakan tanggal dari saat absen offline (jika API mendukungnya, 
        // tapi API standar Salira sepertinya menggunakan waktu server saat request masuk.
        // Sebaiknya kita tambahkan parameter 'offline_date' jika ada, atau cukup log biasa).

        request.files.add(http.MultipartFile.fromBytes(
          'photo',
          photoBytes,
          filename: 'offline_photo_${item['id']}.jpg',
        ));

        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        if (response.statusCode == 200 || response.statusCode == 201) {
          debugPrint('Absensi offline ID ${item['id']} berhasil disinkronkan!');
          hasSynced = true;
        } else {
          debugPrint('Gagal sync ID ${item['id']}: ${response.body}');
          remainingList.add(itemStr); // Gagal, kembalikan ke antrean
        }
      } catch (e) {
        debugPrint('Koneksi error saat sync: $e');
        remainingList.add(itemStr); // Masih offline, kembalikan ke antrean
      }
    }

    // Update daftar pending
    await prefs.setStringList(_key, remainingList);
    
    return hasSynced;
  }
}
