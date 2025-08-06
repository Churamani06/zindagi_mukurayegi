import React from 'react';

const ChildDetails = ({ child }) => {
  if (!child) {
    return (
      <div style={{
        background: '#f9fafb',
        padding: '48px',
        borderRadius: '12px',
        border: '2px dashed #d1d5db',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '18px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: '#9ca3af' }}>👶</div>
        <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '20px', fontWeight: '600' }}>
          No child selected
        </h4>
        <p style={{ margin: '0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
          Please select a child to view details.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      padding: '32px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb',
      maxWidth: '600px',
      margin: '0 auto',
      marginTop: '40px'
    }}>
      <h2 style={{ color: '#374151', fontSize: '28px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
        Child Details
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <strong>Name:</strong>
          <div style={{ color: '#111827', fontSize: '18px', marginTop: '6px' }}>{child.child_name || 'N/A'}</div>
        </div>
        <div>
          <strong>Age:</strong>
          <div style={{ color: '#111827', fontSize: '18px', marginTop: '6px' }}>{child.age || 'N/A'}</div>
        </div>
        <div>
          <strong>Gender:</strong>
          <div style={{ color: '#111827', fontSize: '18px', marginTop: '6px' }}>{child.gender || 'N/A'}</div>
        </div>
        <div>
          <strong>Weight (kg):</strong>
          <div style={{ color: '#111827', fontSize: '18px', marginTop: '6px' }}>{child.weight || 'N/A'}</div>
        </div>
        <div>
          <strong>Status:</strong>
          <div style={{ color: '#111827', fontSize: '18px', marginTop: '6px' }}>{child.health_status || 'N/A'}</div>
        </div>
        <div>
          <strong>Anganwadi Kendra:</strong>
          <div style={{ color: '#111827', fontSize: '18px', marginTop: '6px' }}>{child.anganwadi_kendra || 'N/A'}</div>
        </div>
        <div>
          <strong>Date:</strong>
          <div style={{ color: '#111827', fontSize: '18px', marginTop: '6px' }}>{child.created_at ? new Date(child.created_at).toLocaleDateString('en-IN') : 'N/A'}</div>
        </div>
        <div style={{ gridColumn: '1/3' }}>
          <strong>Symptoms / Observations:</strong>
          <div style={{ color: '#6b7280', fontSize: '16px', marginTop: '6px' }}>{child.symptoms || 'None reported'}</div>
        </div>
      </div>
    </div>
  );
};

export default ChildDetails;
