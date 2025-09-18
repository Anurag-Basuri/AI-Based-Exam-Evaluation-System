# AI-Based Exam Evaluation System

A comprehensive MERN stack application for automated exam evaluation using AI technology. This system allows teachers to create and manage exams while providing automated evaluation capabilities for both MCQ and subjective questions.

## 🚀 Features

### For Teachers
- **Dashboard**: Complete analytics and statistics view
- **Exam Management**: Create, edit, and manage exams
- **Question Creation**: Support for MCQ and subjective questions
- **Student Management**: View and manage enrolled students
- **Automated Evaluation**: AI-powered grading for subjective answers
- **Results Analysis**: Detailed performance analytics

### For Students
- **Profile Management**: Complete student profile system
- **Exam Taking**: User-friendly exam interface
- **Results Viewing**: Detailed result analysis with feedback
- **Timetable**: Academic schedule management
- **Issue Reporting**: Raise concerns or technical issues

### System Features
- **Authentication & Authorization**: Secure JWT-based authentication
- **Role-based Access Control**: Separate interfaces for teachers and students
- **Real-time Updates**: Live exam status and results
- **Responsive Design**: Works on all devices
- **Data Validation**: Comprehensive input validation
- **Security**: Password hashing, account locking, email verification

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **React Router** - Client-side routing
- **Framer Motion** - Animations and transitions
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Validator** - Input validation

## 📁 Project Structure

```
AI-Based-Exam-Evaluation-System/
├── Backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── examController.js
│   │   └── questionController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── examModel.js
│   │   ├── questionModel.js
│   │   ├── studentModel.js
│   │   ├── submissionModel.js
│   │   └── teacherModel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── examRoutes.js
│   │   └── questionRoutes.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Login.jsx
│   │   ├── pages/
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── TeacherDashboard.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Based-Exam-Evaluation-System/Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the Backend directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/exam-evaluation
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3003
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to Frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3003`

## 📊 Database Schema

### Student Model
- **Personal Information**: Name, email, phone, address, date of birth
- **Academic Details**: Roll number, registration ID, year, semester, department
- **Authentication**: Password (hashed), email verification tokens
- **Academic Records**: GPA, courses enrolled, academic status
- **Security Features**: Login attempts, account locking, password reset

### Teacher Model
- **Professional Information**: Employee ID, academic title, department, specialization
- **Qualifications**: Highest degree, institution, graduation year
- **Contact Details**: Phone numbers, office location, office hours
- **Academic Relationships**: Courses taught, students supervised, subjects
- **Research**: Publications, projects, research interests
- **Security**: Enhanced authentication with account management

### Exam Model
- **Exam Metadata**: Title, description, subject, duration
- **Scheduling**: Start/end dates, time limits
- **Configuration**: Question types, grading settings
- **Access Control**: Creator reference, publication status

### Question Model
- **Question Types**: MCQ, subjective, true/false
- **Content**: Question text, options, correct answers
- **Evaluation**: Model answers for subjective questions
- **Metadata**: Difficulty level, marks, exam association

### Submission Model
- **Student Responses**: Answers for each question
- **Evaluation**: AI scores, teacher review status
- **Feedback**: Comments, suggestions, grade breakdown
- **Timestamps**: Submission time, evaluation time

## 🔐 API Endpoints

### Authentication
- `POST /api/v1/auth/register/student` - Student registration
- `POST /api/v1/auth/register/teacher` - Teacher registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset confirmation

### Exams
- `GET /api/exam/` - Get all exams
- `POST /api/exam/` - Create new exam (Teacher only)
- `GET /api/exam/:id` - Get specific exam
- `PUT /api/exam/:id` - Update exam (Teacher only)
- `DELETE /api/exam/:id` - Delete exam (Teacher only)

### Questions
- `GET /api/question/:examId/questions` - Get exam questions
- `POST /api/question/:examId/questions` - Add question to exam (Teacher only)
- `PUT /api/question/:questionId` - Update question (Teacher only)
- `DELETE /api/question/:questionId` - Delete question (Teacher only)

### Submissions
- `POST /api/submission/` - Submit exam answers
- `GET /api/submission/:examId` - Get submission results
- `GET /api/submission/student/:studentId` - Get student submissions

## 🎯 Key Features

### Authentication System
- JWT-based authentication with refresh tokens
- Role-based access control (Teacher/Student)
- Password hashing with bcrypt (12 salt rounds)
- Account security features:
  - Login attempt tracking
  - Account locking after failed attempts
  - Password reset with secure tokens
  - Email verification system

### Exam Management
- Create and manage exams with flexible scheduling
- Support for multiple question types (MCQ, Subjective)
- Real-time exam status monitoring
- Automated grading system for MCQ questions
- Manual review system for subjective answers

### User Interface
- Modern, responsive design using React components
- Role-specific dashboards with analytics
- Interactive charts and visualizations (Recharts)
- Smooth animations and transitions (Framer Motion)
- Intuitive navigation and user experience

### Data Security
- Comprehensive input validation using Validator library
- Password encryption and secure storage
- Protected API endpoints with middleware
- CORS configuration for secure cross-origin requests
- Environment variable management for sensitive data

## 🔧 Development

### Code Style
- ESLint configuration for code quality
- Prettier formatting for consistent code style
- Modular architecture with separation of concerns
- RESTful API design principles

### Available Scripts

#### Backend
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
```

#### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB database (Atlas or self-hosted)
2. Configure environment variables for production
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Set up SSL certificates for secure connections

### Frontend Deployment
1. Build the React application
2. Deploy to platforms like Netlify, Vercel, or AWS S3
3. Configure environment variables for API endpoints
4. Set up custom domain if needed

## 🧪 Testing

### Backend Testing
- Unit tests for models and controllers
- Integration tests for API endpoints
- Database connection testing
- Authentication flow testing

### Frontend Testing
- Component unit tests
- Integration tests for user flows
- End-to-end testing with Cypress
- Performance testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👥 Team & Contributors

- **Backend Development**: Node.js, Express.js, MongoDB integration
- **Frontend Development**: React.js, Modern UI/UX implementation
- **Database Design**: Comprehensive schema design and optimization
- **Security Implementation**: Authentication, authorization, and data protection

## 🚀 Future Enhancements

- **AI Integration**: Machine learning models for automated subjective answer evaluation
- **Advanced Analytics**: Detailed performance metrics and learning analytics
- **Mobile Application**: React Native mobile app for students and teachers
- **LMS Integration**: Integration with popular learning management systems
- **Plagiarism Detection**: AI-powered plagiarism detection for subjective answers
- **Question Bank**: Advanced question bank management with categorization
- **Real-time Collaboration**: Live collaboration features for group exams
- **Video Proctoring**: AI-powered exam monitoring and proctoring
- **Blockchain Verification**: Blockchain-based certificate verification
- **Multi-language Support**: Internationalization for global usage

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the amazing tools and libraries
- Inspiration from modern educational technology platforms

---

**Note**: This is an educational project demonstrating modern web development practices with the MERN stack. The AI evaluation feature is designed to be integrated with machine learning models for automated grading of subjective answers.

## 📊 Project Statistics

- **Total Files**: 15+ source files
- **Backend Models**: 5 comprehensive data models
- **Frontend Components**: Multiple reusable React components
- **API Endpoints**: 15+ RESTful endpoints
- **Authentication Features**: Complete auth system with security
- **Database Features**: Comprehensive data modeling for students, teachers, exams, questions, and submissions
- **Frontend Features**: Dynamic routing, state management, form handling, and API integration
- **Backend Features**: RESTful API services, JWT authentication, role-based access control, and data validation
- **Testing**: Unit tests, integration tests, and end-to-end tests for robust functionality
- **Deployment**: Configured for cloud deployment with environment variable management
- **Documentation**: Extensive documentation for setup, usage, and contribution guidelines
