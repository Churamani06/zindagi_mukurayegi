# Zindagi Muskurayegi - Child Health Management System

A comprehensive web application for managing child health checkup data in Anganwadi centers. This system enables Anganwadi workers to efficiently record child health information and allows administrators to monitor and analyze the data.

## 🌟 Features

### For Anganwadi Workers (Users)
- **Secure Login**: Role-based authentication system
- **Data Entry**: Easy-to-use forms for recording child health information
- **Health Tracking**: Record comprehensive health data including symptoms, weight, and status
- **User-Friendly Interface**: Clean, intuitive design optimized for field workers

### For Administrators
- **Admin Dashboard**: Comprehensive overview of all health records
- **Data Analytics**: Statistics and insights on health checkup trends
- **Record Management**: View, filter, and analyze all submitted data
- **Status Monitoring**: Track health checkup status across all centers

## 🏗️ Tech Stack

### Frontend
- **React 19**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **React Router DOM**: Client-side routing and navigation
- **Axios**: HTTP client for API communications
- **CSS3**: Modern styling with responsive design

### Planned Backend (Next Phase)
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **MySQL**: Relational database with mysql2 driver
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing and security

## 📋 Health Data Fields

The system captures comprehensive child health information:

- **Personal Information**: Child name, age, gender
- **Physical Metrics**: Weight measurements
- **Health Status**: Symptoms and health observations
- **Location Details**: School/Anganwadi name, Anganwadi Kendra
- **Checkup Status**: Pending, Checked, Referred, Treated
- **Metadata**: Created by user, timestamp

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jindagimuskuraygi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 User Interface

### Pages Included

1. **User Login Page** (`/`)
   - Authentication for Anganwadi workers
   - Clean login form with validation
   - Link to admin login

2. **Admin Login Page** (`/admin/login`)
   - Dedicated admin authentication
   - Administrative portal access
   - Role-based redirections

3. **Data Entry Page** (`/user/data-entry`)
   - Comprehensive health data form
   - Real-time validation
   - Success/error feedback
   - Organized sections for different data types

4. **Admin Dashboard** (`/admin/dashboard`)
   - Statistics overview cards
   - Data filtering and search
   - Paginated records table
   - Export capabilities (planned)

## 🔧 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx      # Main navigation header
│   └── LoadingSpinner.jsx
├── pages/              # Main application pages
│   ├── UserLogin.jsx   # User authentication
│   ├── AdminLogin.jsx  # Admin authentication
│   ├── DataEntry.jsx   # Health data form
│   └── AdminDashboard.jsx
├── context/            # React Context providers
│   └── AuthContext.jsx # Authentication state
├── services/           # API communication
│   └── api.js         # HTTP client and endpoints
├── styles/            # CSS stylesheets
│   ├── index.css      # Global styles
│   └── App.css        # App-specific styles
├── utils/             # Utility functions
│   └── helpers.js     # Common helper functions
└── App.jsx            # Main application component
```

## 🎨 Design Features

- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Modern UI**: Clean, professional interface with intuitive user experience
- **Loading States**: Proper feedback during API calls and data processing
- **Error Handling**: Comprehensive error messages and validation feedback

## 🔐 Security Features

- **Authentication**: JWT-based authentication system
- **Authorization**: Role-based access control (User/Admin)
- **Protected Routes**: Route guards based on authentication status
- **Input Validation**: Client-side and server-side validation
- **Secure Storage**: Proper token management in localStorage

## 📊 Data Management

- **Form Validation**: Real-time validation with helpful error messages
- **Data Persistence**: Reliable data storage with error handling
- **Search & Filter**: Advanced filtering capabilities for administrators
- **Pagination**: Efficient data loading for large datasets
- **Export Options**: Data export functionality (planned)

## 🌐 API Integration

The frontend is prepared for backend integration with structured API endpoints:

- `/api/auth/*` - Authentication endpoints
- `/api/child-health-records/*` - Health record management
- `/api/dashboard/*` - Dashboard statistics and analytics

## 🔧 Development Guidelines

### Code Standards
- Functional components with React hooks
- Consistent naming conventions
- Proper error handling and loading states
- Responsive design principles
- Accessibility best practices

### Component Architecture
- Reusable components in `/components`
- Page-specific components in `/pages`
- Global state management with Context API
- Service layer for API communications

## 🚀 Next Steps

### Backend Development (Phase 2)
1. Set up Node.js/Express server
2. Implement MySQL database schema
3. Create authentication middleware
4. Develop REST API endpoints
5. Integrate with frontend

### Planned Enhancements
- Data export to Excel/PDF
- Advanced analytics and reporting
- Email notifications for critical cases
- Mobile app version
- Offline data entry capabilities

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Zindagi Muskurayegi** - Making child healthcare management efficient and accessible for Anganwadi workers across India.
