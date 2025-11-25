import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class earnings_tracker extends StatefulWidget {
  const earnings_tracker({super.key});

  @override
  State<earnings_tracker> createState() => _EarningsTrackerState();
}

class _EarningsTrackerState extends State<earnings_tracker> {
  bool _isLoading = true;
  Map<String, dynamic>? _earningsData;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchEarnings();
  }

  Future<void> _fetchEarnings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      if (token == null) {
        setState(() {
          _errorMessage = 'Not logged in';
          _isLoading = false;
        });
        return;
      }

      final response = await http.get(
        Uri.parse('http://10.0.2.2:8080/api/delivery/earnings'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        setState(() {
          _earningsData = json.decode(response.body);
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to load earnings: ${response.statusCode}';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Earnings Tracker'),
        backgroundColor: Colors.teal,
        elevation: 0,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red),
                      SizedBox(height: 16),
                      Text(_errorMessage!, style: TextStyle(color: Colors.red)),
                      SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _fetchEarnings,
                        child: Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchEarnings,
                  child: SingleChildScrollView(
                    physics: AlwaysScrollableScrollPhysics(),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Total Earnings Card
                          _buildEarningsCard(
                            'Total Earnings',
                            'LKR ${_earningsData!['totalEarnings'] ?? '0.00'}',
                            Icons.account_balance_wallet,
                            Colors.green,
                          ),
                          SizedBox(height: 16),
                          
                          // Monthly and Daily Earnings Row
                          Row(
                            children: [
                              Expanded(
                                child: _buildSmallCard(
                                  'Monthly',
                                  'LKR ${_earningsData!['monthlyEarnings'] ?? '0.00'}',
                                  Icons.calendar_month,
                                  Colors.blue,
                                ),
                              ),
                              SizedBox(width: 16),
                              Expanded(
                                child: _buildSmallCard(
                                  'Today',
                                  'LKR ${_earningsData!['dailyEarnings'] ?? '0.00'}',
                                  Icons.today,
                                  Colors.orange,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 16),
                          
                          // Deliveries Stats Row
                          Row(
                            children: [
                              Expanded(
                                child: _buildSmallCard(
                                  'Total Deliveries',
                                  '${_earningsData!['totalDeliveries'] ?? '0'}',
                                  Icons.local_shipping,
                                  Colors.purple,
                                ),
                              ),
                              SizedBox(width: 16),
                              Expanded(
                                child: _buildSmallCard(
                                  'Monthly Deliveries',
                                  '${_earningsData!['monthlyDeliveries'] ?? '0'}',
                                  Icons.today,
                                  Colors.teal,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 24),
                          
                          // Info Text
                          Card(
                            color: Colors.blue.shade50,
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Row(
                                children: [
                                  Icon(Icons.info_outline, color: Colors.blue),
                                  SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      'Earnings are calculated from accepted delivery quotes for completed deliveries.',
                                      style: TextStyle(color: Colors.blue.shade900),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
    );
  }

  Widget _buildEarningsCard(String title, String amount, IconData icon, Color color) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color, color.withOpacity(0.7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 40, color: Colors.white),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    amount,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSmallCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
