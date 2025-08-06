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
    try {
      const payload = { ...formData, submitted_by_user_id: user.id };
      const res = await childHealthAPI.createRecord(payload);
      if (res.data.success) {
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
      }
    } catch (err) {
      alert('Failed to add child record.');
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
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="dashboard-sidebar-header">
          <img src="login-bg.png" alt="Logo" className="dashboard-logo" />
          <h2 className="dashboard-title">Anganwadi Worker</h2>
          <p className="dashboard-subtitle">Dashboard</p>
        </div>
        <nav>
          <ul className="dashboard-nav">
            <li>
              <button className={activePage === 'records' ? 'dashboard-nav-btn active' : 'dashboard-nav-btn'} onClick={() => setActivePage('records')}>Child Records</button>
            </li>
            <li>
              <button className={activePage === 'add' ? 'dashboard-nav-btn active' : 'dashboard-nav-btn'} onClick={() => setActivePage('add')}>Add New Child</button>
            </li>
            <li>
              <button className={activePage === 'profile' ? 'dashboard-nav-btn active' : 'dashboard-nav-btn'} onClick={() => setActivePage('profile')}>Profile</button>
            </li>
            <li>
              <button className="dashboard-nav-btn" onClick={onLogout}>Logout</button>
            </li>
          </ul>
        </nav>
      </div>
      {/* Main Content */}
      {activePage === 'records' && (
        <div className="dashboard-main">
          {/* Dashboard header */}
          <div style={{ marginBottom: '2rem', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
            <h1 style={{ color: '#1e3a8a', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Child Health Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Welcome, <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{user?.username || ''}</span>!</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h4 style={{ color: '#374151', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Total Children Screened</h4>
                <div style={{ color: '#1e3a8a', fontSize: '2.2rem', fontWeight: 'bold' }}>{stats.totalChildrenScreened}</div>
              </div>
              <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h4 style={{ color: '#374151', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Suspected Cases</h4>
                <div style={{ color: '#dc2626', fontSize: '2.2rem', fontWeight: 'bold' }}>{stats.positiveCases}</div>
              </div>
              <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h4 style={{ color: '#374151', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Today's Screenings</h4>
                <div style={{ color: '#059669', fontSize: '2.2rem', fontWeight: 'bold' }}>{stats.todayScreenings}</div>
              </div>
            </div>
          </div>
          {/* Search bar */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, school, or kendra..."
              style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '1rem', width: '100%', maxWidth: '350px', marginLeft: '2%' }}
              aria-label="Search child records"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: '500', cursor: 'pointer' }}
              >Clear</button>
            )}
          </div>
          {/* Child Records Table and Modal */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
            <h2 style={{ color: '#374151', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Child Records</h2>
            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px', borderRadius: '8px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', fontSize: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', fontSize: '1rem' }}>Age</th>
                    <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', fontSize: '1rem' }}>Gender</th>
                    <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', fontSize: '1rem' }}>Weight (kg)</th>
                    <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', fontSize: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', fontSize: '1rem' }}>School Name & Anganwadi Kendra</th>
                    <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', fontSize: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', fontSize: '1rem' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChildren.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem', fontSize: '1.1rem' }}>No records found.</td>
                    </tr>
                  ) : (
                    filteredChildren.map(child => (
                      <tr key={child.id} style={{ borderBottom: '1px solid #f3f4f6', background: selectedChild && selectedChild.id === child.id ? '#f3f4f6' : 'white', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>{child.child_name}</td>
                        <td style={{ padding: '1rem', color: '#6b7280' }}>{child.age}</td>
                        <td style={{ padding: '1rem', color: '#6b7280' }}>{child.gender}</td>
                        <td style={{ padding: '1rem', color: '#6b7280' }}>{child.weight}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.95rem', fontWeight: '500', backgroundColor: child.health_status === 'Checked' ? '#d1fae5' : child.health_status === 'Pending' ? '#fef3c7' : child.health_status === 'Referred' ? '#fee2e2' : '#f3f4f6', color: child.health_status === 'Checked' ? '#065f46' : child.health_status === 'Pending' ? '#92400e' : child.health_status === 'Referred' ? '#991b1b' : '#6b7280' }}>{child.health_status}</span>
                        </td>
                        <td style={{ padding: '1rem', color: '#6b7280' }}>
                          <div><strong>School:</strong> {child.school_name || 'N/A'}</div>
                          <div><strong>Kendra:</strong> {child.anganwadi_kendra || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.95rem', fontFamily: 'monospace' }}>{child.created_at ? new Date(child.created_at).toLocaleDateString('en-IN') : 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            style={{ background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedChild(child);
                              setShowModal(true);
                            }}
                          >View</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* ChildDetails modal popup */}
            {showModal && selectedChild && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  padding: '2rem',
                  minWidth: '350px',
                  maxWidth: '90vw',
                  position: 'relative'
                }}>
                  <button
                    style={{
                      position: 'absolute',
                      top: '18px',
                      right: '18px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(239,68,68,0.12)'
                    }}
                    onClick={() => {
                      setShowModal(false);
                      setSelectedChild(null);
                      setEditStatus('');
                    }}
                  >Exit</button>
                  <ChildDetails child={selectedChild} />
                  {/* Health status change popup */}
                  <form onSubmit={handleStatusChange} style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ fontWeight: 500 }}>Change Health Status:</label>
                    <select
                      value={editStatus || selectedChild.health_status}
                      onChange={e => setEditStatus(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                      required
                    >
                      <option value="Checked">Checked</option>
                      <option value="Pending">Pending</option>
                      <option value="Referred">Referred</option>
                      <option value="Treated">Treated</option>
                    </select>
                    <button type="submit" disabled={statusLoading || (!editStatus || editStatus === selectedChild.health_status)} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1.5rem', fontWeight: '600', fontSize: '1rem', cursor: statusLoading ? 'not-allowed' : 'pointer' }}>
                      {statusLoading ? 'Updating...' : 'Update'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {activePage === 'profile' && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e9ecef', maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ color: '#374151', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Profile Details</h2>
          <div style={{ fontSize: '1.1rem', color: '#374151', lineHeight: '2.2' }}>
            <div><strong>User ID:</strong> {user?.id || 'N/A'}</div>
            <div><strong>Username:</strong> {user?.username || 'N/A'}</div>
            <div><strong>Role:</strong> {user?.role || 'N/A'}</div>
            <div><strong>Created At:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString('en-IN') : 'N/A'}</div>
            {/* Add more user details here if available */}
          </div>
        </div>
      )}
      {activePage === 'add' && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e9ecef', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#374151', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Add New Child</h2>
          <form onSubmit={handleFormSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ fontWeight: 500 }}>Name</label>
                <input type="text" name="child_name" value={formData.child_name} onChange={handleFormChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginTop: '0.5rem' }} />
              </div>
              <div>
                <label style={{ fontWeight: 500 }}>Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleFormChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginTop: '0.5rem' }} />
              </div>
              <div>
                <label style={{ fontWeight: 500 }}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleFormChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginTop: '0.5rem' }}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 500 }}>Weight (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleFormChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginTop: '0.5rem' }} />
              </div>
              <div>
                <label style={{ fontWeight: 500 }}>Health Status</label>
                <select name="health_status" value={formData.health_status} onChange={handleFormChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginTop: '0.5rem' }}>
                  <option value="">Select</option>
                  <option value="Checked">Checked</option>
                  <option value="Pending">Pending</option>
                  <option value="Referred">Referred</option>
                  <option value="Treated">Treated</option>
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 500 }}>School Name</label>
                <input type="text" name="school_name" value={formData.school_name} onChange={handleFormChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginTop: '0.5rem' }} />
              </div>
              <div>
                <label style={{ fontWeight: 500 }}>Anganwadi Kendra</label>
                <input type="text" name="anganwadi_kendra" value={formData.anganwadi_kendra} onChange={handleFormChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginTop: '0.5rem' }} />
              </div>
              <div style={{ gridColumn: '1 / span 2' }}>
                <label style={{ fontWeight: 500 }}>Symptoms</label>
                <textarea name="symptoms" value={formData.symptoms} onChange={handleFormChange} rows={2} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginTop: '0.5rem' }} />
              </div>
            </div>
            <button type="submit" style={{ marginTop: '2rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem 2rem', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer' }}>Add Child</button>
          </form>
        </div>
      )}

    </div>
  );
};

export default AnganwadiDashboard;
