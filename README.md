# Document Manager

A secure document management system that allows users to store, manage, and access their files with end-to-end encryption. Built with MERN stack (MongoDB, Express.js, React.js, Node.js) and IPFS for decentralized storage.


## ✨ Features

- 🔒 End-to-end file encryption using AES-GCM 256-bit encryption
- ☁️ Decentralized file storage with IPFS via Pinata API
- 🔄 Secure file upload and download with client-side encryption/decryption
- 📋 File management interface with CoreUI components
- 🔍 File tracking and management with MongoDB
- 🔑 JWT-based authentication system
- 📱 Responsive design for all devices
- ⚡ Real-time file encryption/decryption in the browser
- 🔄 Drag and drop file upload interface
- 📊 File metadata and management dashboard

## 🚀 Tech Stack

### Frontend
- React.js
- React Router for navigation
- Axios for API calls
- CoreUI for UI components
- React Drag and Drop for file uploads

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- IPFS via Pinata API
- CORS for cross-origin requests
- Multer for file handling

## 📦 Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB (local or Atlas)
- Pinata API credentials (for IPFS storage)

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/GAUTAMMANU/doc-manager.git
   cd doc-manager
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/docmanager
   JWT_SECRET=your_jwt_secret_here
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_API_KEY=your_pinata_secret_api_key
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure

```
doc-manager/
├── backend/               # Backend server code
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── server.js         # Express server setup
│   └── package.json      # Backend dependencies
├── frontend/             # Frontend React application
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components(AppDoc.js)
│   │   ├── App.js       # Main App component
│   │   └── index.js     # Entry point
│   └── package.json     # Frontend dependencies
└── README.md            # Project documentation
```

## 🔑 Environment Variables

### Backend
- `PORT` - Port on which the server will run (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `PINATA_API_KEY` - API key for Pinata IPFS service
- `PINATA_SECRET_API_KEY` - Secret API key for Pinata

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👏 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [MongoDB](https://www.mongodb.com/) - For the database
- [Express.js](https://expressjs.com/) - For the backend server
- [React](https://reactjs.org/) - For the frontend framework
- [IPFS](https://ipfs.io/) - For decentralized storage
- [Pinata](https://pinata.cloud/) - For IPFS pinning service
- [CoreUI](https://coreui.io/) - For UI components
