import React, { useState, useEffect } from 'react';
import { childHealthAPI } from './services/api';
import ChildDetails from './ChildDetails.jsx';

// Accept onLogout as a prop
const AnganwadiDashboard = ({ user, onLogout }) => {
  // Stats and children list from backend
  const [stats, setStats] = useState({
    todayScreenings: 0,
    totalChildrenScreened: 0,
    positiveCases: 0
  });
  const [childrenList, setChildrenList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChildren, setFilteredChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [activePage, setActivePage] = useState('records'); // 'records', 'add', or 'profile'
  const [recordType, setRecordType] = useState('health'); // 'health' or 'worker'
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding new child
  const [formData, setFormData] = useState({
    child_name: '',
    age: '',
    gender: '',
    weight: '',
    health_status: '',
    anganwadi_kendra: '',
    school_name: '',
    symptoms: ''
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Fetch child records for the logged-in user
  useEffect(() => {
    if (user && user.id) {
      // Fetch data from backend using submitted_by_user_id
      childHealthAPI.getRecordsByUserId(user.id)
        .then(res => {
          let data = res.data.data || [];
          // Sort by newest date first
          data = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setChildrenList(data);
          setStats({
            todayScreenings: data.filter(child => new Date(child.created_at).toDateString() === new Date().toDateString()).length,
            totalChildrenScreened: data.length,
            positiveCases: data.filter(child => child.health_status === 'Referred').length
          });
        })
        .catch(() => {
          setChildrenList([]);
        });
    }
  }, [user]);

  // Filter childrenList based on searchTerm
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredChildren(childrenList);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredChildren(
        childrenList.filter(child =>
          (child.child_name && child.child_name.toLowerCase().includes(term)) ||
          (child.school_name && child.school_name.toLowerCase().includes(term)) ||
          (child.anganwadi_kendra && child.anganwadi_kendra.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, childrenList]);

  // Add new child record
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) return;
    
    setIsSubmitting(true);
    setSuccessMessage(''); // Clear any previous messages
    
    try {
      const payload = { ...formData, submitted_by_user_id: user.id };
      const res = await childHealthAPI.createRecord(payload);
      if (res.data.success) {
        // Show success message
        setSuccessMessage(`✅ Child record for "${formData.child_name}" has been successfully added!`);
        
        // Refetch all records for this user to ensure data is up-to-date after add
        childHealthAPI.getRecordsByUserId(user.id)
          .then(res2 => {
            let data = res2.data.data || [];
            data = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setChildrenList(data);
            setStats({
              todayScreenings: data.filter(child => new Date(child.created_at).toDateString() === new Date().toDateString()).length,
              totalChildrenScreened: data.length,
              positiveCases: data.filter(child => child.health_status === 'Referred').length
            });
          });
        
        // Clear form
        setFormData({
          child_name: '',
          age: '',
          gender: '',
          weight: '',
          health_status: '',
          anganwadi_kendra: '',
          school_name: '',
          symptoms: ''
        });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    } catch (err) {
      alert('Failed to add child record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update health status for a child
  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!selectedChild || !editStatus) return;
    setStatusLoading(true);
    try {
      // Call backend API to update health status
      const res = await childHealthAPI.updateHealthStatus(selectedChild.id, editStatus);
      if (res.data.success) {
        // Refetch all records for this user to ensure data is up-to-date after update
        childHealthAPI.getRecordsByUserId(user.id)
          .then(res2 => {
            let data = res2.data.data || [];
            data = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setChildrenList(data);
            setStats({
              todayScreenings: data.filter(child => new Date(child.created_at).toDateString() === new Date().toDateString()).length,
              totalChildrenScreened: data.length,
              positiveCases: data.filter(child => child.health_status === 'Referred').length
            });
            // Update selectedChild with new status
            const updated = data.find(c => c.id === selectedChild.id);
            setSelectedChild(updated || selectedChild);
          });
      }
    } catch (err) {
      alert('Failed to update health status.');
    }
    setStatusLoading(false);
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', 
      minHeight: '100vh' 
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #374151 0%, #434D5C 100%)',
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
                  Anganwadi Dashboard
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '14px', fontWeight: '400' }}>
                  Welcome back, {user?.username || 'Worker'}
                </p>
              </div>
            </div>
            <button onClick={onLogout} style={{
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

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: '#ffffff',
          padding: '8px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActivePage('records')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              background: activePage === 'records' ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' : 'transparent',
              color: activePage === 'records' ? 'white' : '#6b7280',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📋 Child Records
          </button>
          <button
            onClick={() => setActivePage('add')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              background: activePage === 'add' ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' : 'transparent',
              color: activePage === 'add' ? 'white' : '#6b7280',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ➕ Add New Child
          </button>
          <button
            onClick={() => setActivePage('profile')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              background: activePage === 'profile' ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' : 'transparent',
              color: activePage === 'profile' ? 'white' : '#6b7280',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            👤 Profile
          </button>
        </div>
        {/* Main Content */}
        {activePage === 'records' && (
          <div>
            {/* Statistics Cards */}
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
                  {stats.totalChildrenScreened}
                </h3>
                <p style={{ 
                  margin: '8px 0 0 0', 
                  color: '#6b7280', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Total Screened</p>
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
                  {stats.positiveCases}
                </h3>
                <p style={{ 
                  margin: '8px 0 0 0', 
                  color: '#6b7280', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Suspected Cases</p>
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
                <div style={{ fontSize: '32px', marginBottom: '12px', color: '#059669' }}>📅</div>
                <h3 style={{ 
                  margin: '0', 
                  fontSize: '32px', 
                  color: '#111827',
                  fontWeight: '700'
                }}>
                  {stats.todayScreenings}
                </h3>
                <p style={{ 
                  margin: '8px 0 0 0', 
                  color: '#6b7280', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Today's Screenings</p>
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
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ 
                    background: '#ef4444', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    padding: '8px 16px', 
                    fontWeight: '500', 
                    cursor: 'pointer',
                    marginLeft: '12px',
                    fontSize: '14px'
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Records Section */}
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
                  Child Records
                </h3>
              </div>
              
              {filteredChildren.length === 0 ? (
                <div style={{
                  background: '#f9fafb',
                  padding: '48px',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', color: '#9ca3af' }}>📋</div>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#374151',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>No records found</h4>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    maxWidth: '400px',
                    margin: '0 auto'
                  }}>No child records match your search criteria or no records have been added yet.</p>
                </div>
              ) : (
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
                        }}>School & Anganwadi</th>
                        <th style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Date</th>
                        <th style={{ 
                          padding: '16px', 
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredChildren.map((child, index) => (
                        <tr key={child.id} style={{ 
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
                          }}>{child.child_name || 'N/A'}</td>
                          <td style={{ 
                            padding: '16px',
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>{child.age || 'N/A'}</td>
                          <td style={{ 
                            padding: '16px',
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>{child.gender || 'N/A'}</td>
                          <td style={{ 
                            padding: '16px',
                            color: '#6b7280',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>{child.weight || 'N/A'}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: 
                                child.health_status === 'Checked' ? '#d1fae5' :
                                child.health_status === 'Pending' ? '#fef3c7' :
                                child.health_status === 'Referred' ? '#fee2e2' : '#f3f4f6',
                              color:
                                child.health_status === 'Checked' ? '#065f46' :
                                child.health_status === 'Pending' ? '#92400e' :
                                child.health_status === 'Referred' ? '#991b1b' : '#6b7280'
                            }}>
                              {child.health_status || 'Unknown'}
                            </span>
                          </td>
                          <td style={{ 
                            padding: '16px',
                            color: '#6b7280',
                            fontSize: '13px'
                          }}>
                            <div><strong>School:</strong> {child.school_name || 'N/A'}</div>
                            <div><strong>Kendra:</strong> {child.anganwadi_kendra || 'N/A'}</div>
                          </td>
                          <td style={{ 
                            padding: '16px',
                            color: '#9ca3af',
                            fontSize: '13px',
                            fontFamily: 'monospace'
                          }}>
                            {child.created_at ? new Date(child.created_at).toLocaleDateString('en-IN') : 'N/A'}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <button
                              style={{ 
                                background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '8px', 
                                padding: '8px 16px', 
                                fontWeight: '500', 
                                cursor: 'pointer',
                                fontSize: '12px',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => {
                                setSelectedChild(child);
                                setShowModal(true);
                              }}
                              onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(55, 65, 81, 0.3)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal for child details */}
            {showModal && selectedChild && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  padding: '32px',
                  minWidth: '400px',
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  position: 'relative'
                }}>
                  <button
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(239,68,68,0.3)'
                    }}
                    onClick={() => {
                      setShowModal(false);
                      setSelectedChild(null);
                      setEditStatus('');
                    }}
                  >
                    ✕ Close
                  </button>
                  <ChildDetails child={selectedChild} />
                  {/* Health status change form */}
                  <form onSubmit={handleStatusChange} style={{ 
                    marginTop: '24px', 
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 16px 0', 
                      color: '#374151',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>Update Health Status</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <label style={{ fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                        Status:
                      </label>
                      <select
                        value={editStatus || selectedChild.health_status}
                        onChange={e => setEditStatus(e.target.value)}
                        style={{ 
                          padding: '8px 12px', 
                          borderRadius: '6px', 
                          border: '1px solid #e5e7eb',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                        required
                      >
                        <option value="Checked">Checked</option>
                        <option value="Pending">Pending</option>
                        <option value="Referred">Referred</option>
                        <option value="Treated">Treated</option>
                      </select>
                      <button 
                        type="submit" 
                        disabled={statusLoading || (!editStatus || editStatus === selectedChild.health_status)} 
                        style={{ 
                          background: statusLoading || (!editStatus || editStatus === selectedChild.health_status) 
                            ? '#d1d5db' 
                            : 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          padding: '8px 20px', 
                          fontWeight: '600', 
                          fontSize: '14px', 
                          cursor: statusLoading || (!editStatus || editStatus === selectedChild.health_status) 
                            ? 'not-allowed' 
                            : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {statusLoading ? 'Updating...' : 'Update Status'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {activePage === 'add' && (
          <div style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            maxWidth: '800px',
            margin: '0 auto'
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
                <span style={{ fontSize: '18px' }}>➕</span>
              </div>
              <h3 style={{ 
                margin: '0 0 0 12px', 
                fontSize: '24px', 
                color: '#111827',
                fontWeight: '600'
              }}>
                Add New Child Record
              </h3>
            </div>
            
            {/* Success Message */}
            {successMessage && (
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                marginBottom: '24px',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.1)',
                  opacity: 0.3
                }}></div>
                <span style={{ position: 'relative', zIndex: 2 }}>{successMessage}</span>
                <button
                  onClick={() => setSuccessMessage('')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    position: 'relative',
                    zIndex: 2,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            
            <form onSubmit={handleFormSubmit}>
              {/* Child Basic Information */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  color: '#374151', 
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  Child Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Child Name *
                    </label>
                    <input 
                      type="text" 
                      name="child_name" 
                      value={formData.child_name} 
                      onChange={handleFormChange} 
                      required 
                      style={{
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      placeholder="Enter child's full name"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6b7280';
                        e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Age (years) *
                    </label>
                    <input 
                      type="number" 
                      name="age" 
                      value={formData.age} 
                      onChange={handleFormChange} 
                      required 
                      min="0" 
                      max="18"
                      style={{
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      placeholder="Age in years"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6b7280';
                        e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Gender *
                    </label>
                    <select 
                      name="gender" 
                      value={formData.gender} 
                      onChange={handleFormChange} 
                      required 
                      style={{
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6b7280';
                        e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
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
                      marginBottom: '8px', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Weight (kg) *
                    </label>
                    <input 
                      type="number" 
                      name="weight" 
                      value={formData.weight} 
                      onChange={handleFormChange} 
                      required 
                      step="0.1"
                      min="0"
                      style={{
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      placeholder="Weight in kg"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6b7280';
                        e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Health Information */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  color: '#374151', 
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  Health Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Health Status *
                    </label>
                    <select 
                      name="health_status" 
                      value={formData.health_status} 
                      onChange={handleFormChange} 
                      required 
                      style={{
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6b7280';
                        e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">Select Health Status</option>
                      <option value="Checked">Checked</option>
                      <option value="Pending">Pending</option>
                      <option value="Referred">Referred</option>
                      <option value="Treated">Treated</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Symptoms / Health Observations
                    </label>
                    <textarea 
                      name="symptoms" 
                      value={formData.symptoms} 
                      onChange={handleFormChange} 
                      rows={4}
                      style={{
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                        fontWeight: '500',
                        lineHeight: '1.5'
                      }}
                      placeholder="Describe any symptoms, health issues, or observations..."
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6b7280';
                        e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* School/Anganwadi Information */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  color: '#374151', 
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  School/Anganwadi Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      School Name *
                    </label>
                    <input 
                      type="text" 
                      name="school_name" 
                      value={formData.school_name} 
                      onChange={handleFormChange} 
                      required 
                      style={{
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      placeholder="Enter school name"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6b7280';
                        e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Anganwadi Kendra *
                    </label>
                    <input 
                      type="text" 
                      name="anganwadi_kendra" 
                      value={formData.anganwadi_kendra} 
                      onChange={handleFormChange} 
                      required 
                      style={{
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      placeholder="Enter anganwadi kendra name"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6b7280';
                        e.target.style.boxShadow = '0 0 0 3px rgba(107, 114, 128, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{
                  width: '100%', 
                  padding: '16px', 
                  background: isSubmitting 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #374151 0%, #4b5563 100%)', 
                  color: 'white',
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '16px', 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: isSubmitting 
                    ? 'none' 
                    : '0 4px 12px rgba(55, 65, 81, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(55, 65, 81, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(55, 65, 81, 0.2)';
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Adding Child Record...
                  </>
                ) : (
                  'Add Child Record'
                )}
              </button>
            </form>
          </div>
        )}

        {activePage === 'profile' && (
          <div style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            maxWidth: '600px',
            margin: '0 auto'
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
                <span style={{ fontSize: '18px' }}>👤</span>
              </div>
              <h3 style={{ 
                margin: '0 0 0 12px', 
                fontSize: '24px', 
                color: '#111827',
                fontWeight: '600'
              }}>
                Profile Details
              </h3>
            </div>
            
            <div style={{ 
              display: 'grid',
              gap: '20px',
              fontSize: '16px',
              color: '#374151'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#6b7280' }}>User ID:</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>{user?.id || 'N/A'}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#6b7280' }}>Username:</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>{user?.username || 'N/A'}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#6b7280' }}>Role:</span>
                <span style={{ 
                  fontWeight: '500', 
                  color: '#111827',
                  padding: '4px 12px',
                  background: '#dbeafe',
                  borderRadius: '16px',
                  fontSize: '14px'
                }}>{user?.role || 'N/A'}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '600', color: '#6b7280' }}>Account Created:</span>
                <span style={{ fontWeight: '500', color: '#111827', fontSize: '14px', fontFamily: 'monospace' }}>
                  {user?.created_at ? new Date(user.created_at).toLocaleString('en-IN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnganwadiDashboard;
