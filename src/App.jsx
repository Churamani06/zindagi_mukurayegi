import React, { useState, useEffect } from 'react';
import { authAPI, childHealthAPI, dashboardAPI } from './services/api';
import AnganwadiDashboard from './AnganwadiDashboard.jsx';

const SimpleApp = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({
    userType: 'anganwadi',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Admin Dashboard States
  const [adminStats, setAdminStats] = useState({
    totalRecords: 0,
    pendingRecords: 0,
    checkedRecords: 0,
    referredRecords: 0,
    treatedRecords: 0
  });
  const [adminRecords, setAdminRecords] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  // Admin Dashboard search state (must be at top level)
  const [searchTerm, setSearchTerm] = useState("");

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        try {
          // Use getProfile instead of verifyToken (which doesn't exist)
          await authAPI.getProfile();
          const user = JSON.parse(userData);
          setUser(user);
          
          // Redirect to appropriate page
          if (user.role === 'admin') {
            setCurrentPage('admin-dashboard');
          } else if (user.role === 'anganwadi') {
            setCurrentPage('anganwadi-dashboard');
          } else {
            setCurrentPage('data-entry');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Clear invalid auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
      }
    };
    
    checkAuth();
  }, []);

  // Fetch Admin Dashboard Data
  const fetchAdminDashboardData = async () => {
    if (!user || user.role !== 'admin') return;
    
    setAdminLoading(true);
    setAdminError('');
    
    try {
      console.log(`🔄 Fetching admin dashboard data for health records...`);
      
      // Fetch dashboard stats from backend
      const response = await dashboardAPI.getStats();
      console.log('📊 Dashboard stats response:', response.data);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        
        // Update stats from backend response
        const newStats = {
          totalRecords: data.total_records || 0,
          pendingRecords: 0,
          checkedRecords: 0,
          referredRecords: 0,
          treatedRecords: 0
        };
        
        // Process status breakdown if available
        if (data.status_breakdown && Array.isArray(data.status_breakdown)) {
          data.status_breakdown.forEach(status => {
            switch (status.health_status) {
              case 'Pending':
                newStats.pendingRecords = status.count || 0;
                break;
              case 'Checked':
                newStats.checkedRecords = status.count || 0;
                break;
              case 'Referred':
              case 'Referred to Doctor':
                newStats.referredRecords = status.count || 0;
                break;
              case 'Treated':
              case 'Follow-up Required':
                newStats.treatedRecords += status.count || 0;
                break;
            }
          });
        }
        
        setAdminStats(newStats);
        console.log('✅ Admin stats updated:', newStats);
      }
      
      // Try to fetch records list  
      try {
        console.log('🔄 Fetching records with childHealthAPI.getAllRecords(1, 10000)...');
        const recordsResponse = await childHealthAPI.getAllRecords(1, 10000); // Increased for government use
        console.log('📋 Raw Records response:', recordsResponse);
        console.log('📋 Records response data:', recordsResponse.data);
        
        if (recordsResponse.data && recordsResponse.data.success) {
          // Handle the correct backend response structure
          console.log('📋 Response data structure:', recordsResponse.data.data);
          const records = recordsResponse.data.data?.records || recordsResponse.data.data || [];
          console.log('📋 Extracted records:', records);
          console.log('📋 Records is array?', Array.isArray(records));
          console.log('📋 Records length:', records?.length || 0);
          
          if (Array.isArray(records) && records.length > 0) {
            setAdminRecords(records);
            console.log('✅ Records set in state:', records.length, 'records');
          } else {
            console.log('⚠️ No records found in response');
            setAdminRecords([]);
          }
        } else {
          console.error('❌ Records response failed:', recordsResponse.data);
          setAdminRecords([]);
        }
      } catch (recordsError) {
        console.error('❌ Records fetch failed:', recordsError.message);
        setAdminRecords([]);
      }
      
    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      setAdminError('Failed to load dashboard data');
    } finally {
      setAdminLoading(false);
    }
  };

  // Fetch admin data when user logs in as admin or when record type changes
  useEffect(() => {
    if (user && user.role === 'admin' && currentPage === 'admin-dashboard') {
      fetchAdminDashboardData();
    }
  }, [user, currentPage]);

  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    gender: '',
    weight: '',
    symptoms: '',
    schoolName: '',
    anganwadiKendra: '',
    status: 'Pending'
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await authAPI.login({
        username: loginData.username,
        password: loginData.password
      }, loginData.userType);
      const { token, user } = response.data.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      setUser(user);
      // Redirect based on role
      if (user.role === 'admin') {
        setCurrentPage('admin-dashboard');
      } else if (user.role === 'anganwadi') {
        setCurrentPage('anganwadi-dashboard');
      } else {
        setCurrentPage('data-entry');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.response?.data?.message || 
        'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    // Simply clear local storage - no need to call backend logout API
    // since we're using JWT tokens (stateless)
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setCurrentPage('login');
    setLoginData({ userType: 'anganwadi', username: '', password: '' });
    setError('');
  };

  // Show AnganwadiDashboard after login for Anganwadi worker
  if (currentPage === 'anganwadi-dashboard') {
    return <AnganwadiDashboard user={user} onLogout={handleLogout} />;
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Submitting child health data:', formData);

      const response = await childHealthAPI.createRecord({
        child_name: formData.childName,
        age: parseInt(formData.age),
        gender: formData.gender,
        weight: parseFloat(formData.weight),
        symptoms: formData.symptoms,
        school_name: formData.schoolName,
        anganwadi_kendra: formData.anganwadiKendra,
        health_status: formData.status
      });

      console.log('Form submission response:', response.data);

      if (response.data.success) {
        alert('Health record saved successfully!');
        setFormData({
          childName: '',
          age: '',
          gender: '',
          weight: '',
          symptoms: '',
          schoolName: '',
          anganwadiKendra: '',
          status: 'Pending'
        });
      } else {
        setError('Failed to save record: ' + response.data.message);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save health record. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Login Page with Professional Design
  if (currentPage === 'login') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative'
      }}>
        {/* Top Logo and Title - only on small screens */}
        <div className="mobile-logo-title" style={{
          width: '100%',
          display: 'none', // hidden by default, shown via media query
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          marginTop: '10px',
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            backgroundImage: 'url("/login-bg.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '16px',
            border: '2px solid #e5e7eb',
            marginBottom: '12px',
            boxShadow: '0 4px 16px rgba(30,58,138,0.10)'
          }}></div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1e3a8a',
            margin: 0,
            textAlign: 'center',
            letterSpacing: '0.5px',
            lineHeight: '1.2',
          }}>
            Zindagi Muskurayegi
          </h1>
        </div>
        {/* Responsive styles */}
        <style>{`
          @media (max-width: 900px) {
            .login-container {
              grid-template-columns: 1fr !important;
              min-height: 0 !important;
              max-width: 98vw !important;
            }
            .login-left, .login-right {
              padding: 32px !important;
            }
            .login-left {
              display: none !important;
            }
            .mobile-logo-title {
              display: flex !important;
            }
          }
          @media (max-width: 600px) {
            .login-container {
              border-radius: 10px !important;
              box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important;
              padding: 0 !important;
              max-width: 600px !important;
            }
            .login-left, .login-right {
              padding: 18px !important;
            }
            .login-left h1 {
              font-size: 22px !important;
            }
            .login-left h2 {
              font-size: 16px !important;
            }
            .login-right h2 {
              font-size: 20px !important;
            }
            .login-right button[type="submit"] {
              display: block !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }
          }
        `}</style>
        <div className="login-container" style={{
          maxWidth: '900px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: '600px'
        }}>
          {/* Left Side - Welcome Section */}
          <div className="login-left" style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #6b7280 100%)',
            color: 'white',
            padding: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              opacity: 0.7
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              opacity: 0.8
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                width: '70px',
                height: '70px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '25px',
                backdropFilter: 'blur(10px)',
                backgroundImage: 'url("/login-bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '2px solid rgba(255,255,255,0.3)'
              }}>
              </div>
              
              <h1 style={{ 
                margin: '0 0 10px 0', 
                fontSize: '32px', 
                fontWeight: '700',
                lineHeight: '1.2'
              }}>
                Zindagi Muskurayegi
              </h1>
              <p style={{ 
                margin: '0 0 30px 0', 
                opacity: 0.9, 
                fontSize: '16px',
                fontWeight: '400'
              }}>
                Child Health Screening & Support System
              </p>

              <h2 style={{ 
                fontSize: '24px', 
                marginBottom: '20px',
                fontWeight: '600',
                opacity: 0.95
              }}>
                Empowering Child Healthcare
              </h2>
              
              <p style={{ 
                lineHeight: '1.6', 
                marginBottom: '35px', 
                opacity: 0.85,
                fontSize: '15px'
              }}>
                Comprehensive health monitoring platform for early detection and timely intervention in child healthcare across Anganwadi centers.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.8)',
                    marginRight: '15px'
                  }}>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '500' }}>Digital Health Record Management</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.8)',
                    marginRight: '15px'
                  }}>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '500' }}>Secure Role-Based Access</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.8)',
                    marginRight: '15px'
                  }}>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '500' }}>Real-time Health Monitoring</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="login-right" style={{
            alignItems: 'center',
            padding: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'white',
            minWidth: 0
          }}>
            <div style={{ width: '80%' }}>
              <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                <h2 style={{ 
                  fontSize: '28px', 
                  marginBottom: '8px', 
                  color: '#2c3e50',
                  fontWeight: '700'
                }}>
                  Welcome Back
                </h2>
                <p style={{ 
                  color: '#7f8c8d', 
                  fontSize: '15px',
                  fontWeight: '400'
                }}>
                  Sign in to access your dashboard
                </p>
              </div>

              {/* User Type Toggle */}
              <div style={{ marginBottom: '30px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: '600', 
                  color: '#2c3e50', 
                  fontSize: '14px' 
                }}>
                  Select Your Role
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px',
                  padding: '4px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px'
                }}>
                  <button
                    type="button"
                    onClick={() => setLoginData({...loginData, userType: 'anganwadi'})}
                    style={{
                      padding: '14px 16px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: loginData.userType === 'anganwadi' ? 'white' : 'transparent',
                      color: loginData.userType === 'anganwadi' ? '#6b7280' : '#7f8c8d',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: loginData.userType === 'anganwadi' ? '0 2px 8px rgba(107, 114, 128, 0.15)' : 'none'
                    }}
                  >
                    Anganwadi Worker
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginData({...loginData, userType: 'admin'})}
                    style={{
                      padding: '14px 16px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: loginData.userType === 'admin' ? 'white' : 'transparent',
                      color: loginData.userType === 'admin' ? '#6b7280' : '#7f8c8d',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: loginData.userType === 'admin' ? '0 2px 8px rgba(107, 114, 128, 0.15)' : 'none'
                    }}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin}>
                {error && (
                  <div style={{
                    backgroundColor: '#fee',
                    color: '#c53030',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    border: '1px solid #fed7d7',
                    fontWeight: '500'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    {loginData.userType === 'anganwadi' ? 'Worker ID' : 'Admin Username'}
                  </label>
                  <input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                    placeholder={loginData.userType === 'admin' ? 'admin1' : 'worker1'}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#fafbfc',
                      fontWeight: '500'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6b7280';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#fafbfc',
                      fontWeight: '500'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6b7280';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: isLoading 
                      ? 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)'
                      : 'linear-gradient(135deg, #1e3a8a 0%, #6b7280 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isLoading ? 'none' : '0 4px 20px rgba(107, 114, 128, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 30px rgba(107, 114, 128, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 20px rgba(107, 114, 128, 0.3)';
                    }
                  }}
                >
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite' 
                      }}></span>
                      Signing In...
                    </span>
                  ) : (
                    `Sign In as ${loginData.userType === 'anganwadi' ? 'Worker' : 'Admin'}`
                  )}
                </button>
              </form>

              {/* Powered by SSIPMT */}
              <div style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#9ca3af',
                fontWeight: '500'
              }}>
                Powered by <strong style={{ color: '#6b7280' }}>SSIPMT Raipur</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Data Entry Page with All Required Fields
  if (currentPage === 'data-entry') {
    return (
      <div style={{ 
        padding: '20px', 
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', 
        minHeight: '100vh' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            marginBottom: '24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              opacity: 0.6
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-15px',
              left: '-15px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              opacity: 0.7
            }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <span style={{ fontSize: '20px' }}>👩‍⚕️</span>
                </div>
                <div>
                  <h1 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '28px', fontWeight: '600' }}>
                    Child Health Data Entry
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '14px', fontWeight: '400' }}>
                    Enter comprehensive child health checkup information
                  </p>
                </div>
              </div>
              <button onClick={handleLogout} style={{
                padding: '12px 24px',
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 1)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.9)';
              }}>
                Logout
              </button>
            </div>
          </div>
          
          <form onSubmit={handleFormSubmit} style={{ display: 'grid', gap: '30px' }}>
            {/* Child Basic Information */}
            <div style={{
              background: '#ffffff',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                margin: '0 0 24px 0', 
                color: '#374151', 
                fontSize: '20px',
                fontWeight: '600'
              }}>
                Child Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', position: 'relative', zIndex: 2 }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    fontSize: '15px',
                    letterSpacing: '0.3px'
                  }}>
                    Child Name *
                  </label>
                  <input 
                    type="text" 
                    value={formData.childName}
                    onChange={(e) => setFormData({...formData, childName: e.target.value})}
                    required 
                    style={{
                      width: '100%', 
                      padding: '18px 20px', 
                      border: '2px solid #e2e8f0', 
                      borderRadius: '12px', 
                      boxSizing: 'border-box',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#fafbfc',
                      fontWeight: '500'
                    }} 
                    placeholder="Enter child's full name"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6b7280';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    fontSize: '15px',
                    letterSpacing: '0.3px'
                  }}>
                    Age (years) *
                  </label>
                  <input 
                    type="number" 
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    required 
                    min="0" 
                    max="18"
                    style={{
                      width: '100%', 
                      padding: '18px 20px', 
                      border: '2px solid #e2e8f0', 
                      borderRadius: '12px', 
                      boxSizing: 'border-box',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#fafbfc',
                      fontWeight: '500'
                    }}
                    placeholder="Age in years"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6b7280';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px', position: 'relative', zIndex: 2 }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    fontSize: '15px',
                    letterSpacing: '0.3px'
                  }}>
                    Gender *
                  </label>
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    required 
                    style={{
                      width: '100%', 
                      padding: '18px 20px', 
                      border: '2px solid #e2e8f0', 
                      borderRadius: '12px', 
                      boxSizing: 'border-box',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#fafbfc',
                      fontWeight: '500'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6b7280';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    fontSize: '15px',
                    letterSpacing: '0.3px'
                  }}>
                    Weight (kg) *
                  </label>
                  <input 
                    type="number" 
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    step="0.1" 
                    required 
                    min="0"
                    style={{
                      width: '100%', 
                      padding: '18px 20px', 
                      border: '2px solid #e2e8f0', 
                      borderRadius: '12px', 
                      boxSizing: 'border-box',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#fafbfc',
                      fontWeight: '500'
                    }}
                    placeholder="Weight in kg"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6b7280';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div style={{
              background: '#ffffff',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                margin: '0 0 24px 0', 
                color: '#374151', 
                fontSize: '20px',
                fontWeight: '600'
              }}>
                Health Information
              </h3>
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: '600', 
                  color: '#2c3e50',
                  fontSize: '15px',
                  letterSpacing: '0.3px'
                }}>
                  Symptoms / Health Observations
                </label>
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                  rows="5"
                  placeholder="Describe any symptoms, health issues, or observations about the child..."
                  style={{
                    width: '100%',
                    padding: '20px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#fafbfc',
                    fontWeight: '500',
                    lineHeight: '1.6'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6b7280';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.backgroundColor = '#fafbfc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div style={{ marginTop: '30px', position: 'relative', zIndex: 2 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: '600', 
                  color: '#2c3e50',
                  fontSize: '15px',
                  letterSpacing: '0.3px'
                }}>
                  Health Checkup Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#fafbfc',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6b7280';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.backgroundColor = '#fafbfc';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Checked">Checked</option>
                  <option value="Referred">Referred to Doctor</option>
                  <option value="Treated">Treated</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                </select>
              </div>
            </div>

            {/* School/Anganwadi Information */}
            <div style={{
              background: '#ffffff',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                margin: '0 0 24px 0', 
                color: '#374151', 
                fontSize: '20px',
                fontWeight: '600'
              }}>
                School/Anganwadi Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', position: 'relative', zIndex: 2 }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    fontSize: '15px',
                    letterSpacing: '0.3px'
                  }}>
                    School/Anganwadi Name *
                  </label>
                  <input
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#fafbfc',
                      fontWeight: '500'
                    }}
                    placeholder="Enter school or anganwadi name"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6b7280';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    fontSize: '15px',
                    letterSpacing: '0.3px'
                  }}>
                    Anganwadi Kendra *
                  </label>
                  <input
                    type="text"
                    value={formData.anganwadiKendra}
                    onChange={(e) => setFormData({...formData, anganwadiKendra: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#fafbfc',
                      fontWeight: '500'
                    }}
                    placeholder="Enter anganwadi kendra name"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6b7280';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
            
            <button type="submit" disabled={isLoading} style={{
              width: '100%', 
              padding: '16px', 
              background: isLoading 
                ? '#d1d5db'
                : '#374151', 
              color: 'white',
              border: 'none', 
              borderRadius: '10px', 
              fontSize: '16px', 
              cursor: isLoading ? 'not-allowed' : 'pointer', 
              fontWeight: '600',
              marginTop: '20px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.target.style.background = '#1f2937';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.target.style.background = '#374151';
              }
            }}>
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite' 
                  }}></span>
                  Saving Record...
                </span>
              ) : (
                'Save Health Record'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard with Simple, Classy Design
  if (currentPage === 'admin-dashboard') {
    // Filter records by child name, school, or anganwadi kendra
    const filteredRecords = adminRecords.filter((rec) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        (rec.child_name && rec.child_name.toLowerCase().includes(q)) ||
        (rec.school_name && rec.school_name.toLowerCase().includes(q)) ||
        (rec.anganwadi_kendra && rec.anganwadi_kendra.toLowerCase().includes(q)) ||
        (rec.health_status && rec.health_status.toLowerCase().includes(q))
      );
    });
    return (
      <div style={{ 
        padding: '20px', 
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', 
        minHeight: '100vh' 
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            marginBottom: '24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              opacity: 0.6
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-15px',
              left: '-15px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              opacity: 0.7
            }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <span style={{ fontSize: '20px' }}>👨‍💼</span>
                </div>
                <div>
                  <h1 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '28px', fontWeight: '600' }}>
                    Admin Dashboard
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '14px', fontWeight: '400' }}>
                    Welcome back, {user?.username || 'Administrator'}
                  </p>
                </div>
              </div>
              <button onClick={handleLogout} style={{
                padding: '12px 24px',
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 1)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.9)';
              }}>
                Logout
              </button>
            </div>
          </div>

          {/* Error Display */}
          {adminError && (
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #fecaca',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <strong>Error:</strong> {adminError}
            </div>
          )}

          {/* Simple Statistics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', color: '#6b7280' }}>📊</div>
              <h3 style={{ 
                margin: '0', 
                fontSize: '32px', 
                color: '#111827',
                fontWeight: '700'
              }}>
                {adminLoading ? '...' : adminStats.totalRecords}
              </h3>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: '#6b7280', 
                fontSize: '14px', 
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Total Records</p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', color: '#d97706' }}>⏳</div>
              <h3 style={{ 
                margin: '0', 
                fontSize: '32px', 
                color: '#111827',
                fontWeight: '700'
              }}>
                {adminLoading ? '...' : adminStats.pendingRecords}
              </h3>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: '#6b7280', 
                fontSize: '14px', 
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Pending</p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', color: '#059669' }}>✅</div>
              <h3 style={{ 
                margin: '0', 
                fontSize: '32px', 
                color: '#111827',
                fontWeight: '700'
              }}>
                {adminLoading ? '...' : adminStats.checkedRecords}
              </h3>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: '#6b7280', 
                fontSize: '14px', 
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Checked</p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', color: '#dc2626' }}>🏥</div>
              <h3 style={{ 
                margin: '0', 
                fontSize: '32px', 
                color: '#111827',
                fontWeight: '700'
              }}>
                {adminLoading ? '...' : adminStats.referredRecords}
              </h3>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: '#6b7280', 
                fontSize: '14px', 
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Referred</p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', color: '#7c3aed' }}>💊</div>
              <h3 style={{ 
                margin: '0', 
                fontSize: '32px', 
                color: '#111827',
                fontWeight: '700'
              }}>
                {adminLoading ? '...' : adminStats.treatedRecords}
              </h3>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: '#6b7280', 
                fontSize: '14px', 
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Treated</p>
            </div>
          </div>

          {/* Search bar above records section */}
          <div style={{ 
            margin: '0 0 18px 0', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center' 
          }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by child, school, anganwadi..."
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1.5px solid #e5e7eb',
                  fontSize: '15px',
                  minWidth: '320px',
                  background: '#ffffff',
                  color: '#374151',
                  fontWeight: 500,
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6b7280';
                  e.target.style.background = 'white';
                  e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = '#f9fafb';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                }}
              />
            </div>

          {/* Simple Records Section */}
          <div style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '24px',
              borderBottom: '2px solid #f3f4f6',
              paddingBottom: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '18px' }}>📋</span>
              </div>
              <h3 style={{ 
                margin: '0 0 0 12px', 
                fontSize: '24px', 
                color: '#111827',
                fontWeight: '600'
              }}>
                Health Records
              </h3>
            </div>
            
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6b7280',
              fontSize: '16px'
            }}>
              {/* Debug info */}
              {console.log('🐛 DEBUG: adminRecords =', adminRecords)}
              {console.log('🐛 DEBUG: adminRecords.length =', adminRecords.length)}
              
              {filteredRecords && filteredRecords.length > 0 ? (
                <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'separate',
                    borderSpacing: '0',
                    textAlign: 'left',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb'
                  }}>
                    <thead>
                      <tr style={{ 
                        background: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <th style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Child Name</th>
                        <th style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Age</th>
                        <th style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Gender</th>
                        <th style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Weight (kg)</th>
                        <th style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Status</th>
                        <th style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Anganwadi</th>
                        <th style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record, index) => (
                        <tr key={record.id || index} style={{ 
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'all 0.2s ease',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafbfc';
                        }}>
                          <td style={{ 
                            padding: '16px', 
                            fontWeight: '600',
                            color: '#111827',
                            fontSize: '14px'
                          }}>{record.child_name || 'N/A'}</td>
                          <td style={{ 
                            padding: '16px',
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>{record.age || 'N/A'}</td>
                          <td style={{ 
                            padding: '16px',
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>{record.gender || 'N/A'}</td>
                          <td style={{ 
                            padding: '16px',
                            color: '#6b7280',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>{record.weight || 'N/A'}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: 
                                record.health_status === 'Checked' ? '#d1fae5' :
                                record.health_status === 'Pending' ? '#fef3c7' :
                                record.health_status === 'Referred' ? '#fee2e2' : '#f3f4f6',
                              color:
                                record.health_status === 'Checked' ? '#065f46' :
                                record.health_status === 'Pending' ? '#92400e' :
                                record.health_status === 'Referred' ? '#991b1b' : '#6b7280'
                            }}>
                              {record.health_status || 'Unknown'}
                            </span>
                          </td>
                          <td style={{ 
                            padding: '16px',
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>{record.anganwadi_kendra || 'N/A'}</td>
                          <td style={{ 
                            padding: '16px',
                            color: '#9ca3af',
                            fontSize: '13px',
                            fontFamily: 'monospace'
                          }}>
                            {record.created_at ? new Date(record.created_at).toLocaleDateString('en-IN') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : adminLoading ? (
                <div style={{
                  background: '#f9fafb',
                  padding: '48px',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', color: '#9ca3af' }}>⏳</div>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#374151',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>Loading records...</h4>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>Please wait while we fetch the health records.</p>
                </div>
              ) : (
                <div style={{
                  background: '#f9fafb',
                  padding: '48px',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', color: '#9ca3af' }}>📋</div>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#374151',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>No health records available</h4>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    maxWidth: '400px',
                    margin: '0 auto'
                  }}>Health records submitted by Anganwadi workers will appear here for your review and management.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Loading...
  </div>;
}

export default SimpleApp;

