# 📂 Backend Folder Structure

A well-structured backend helps maintain scalability, readability, and ease of debugging. Below is a recommended folder structure for a **Node.js/Express.js** backend application.

---

## 📁 Project Structure

```
backend/
│── src/
│   ├── config/       # Configuration files (DB, env, etc.)
│   ├── controllers/  # Business logic for each route
│   ├── models/       # Database models/schema definitions
│   ├── routes/       # Route definitions
│   ├── middlewares/  # Express middlewares
│   ├── services/     # External API calls, helpers, business logic
│   ├── utils/        # Utility functions/helpers
│   ├── validations/  # Validation schemas (Joi, express-validator)
│   ├── app.js        # Express app setup
│   └── server.js     # Entry point
│
├── .env              # Environment variables
├── .gitignore        # Files to ignore in Git
├── package.json      # Dependencies and scripts
├── README.md         # Documentation (this file)
└── nodemon.json      # Nodemon configuration (for development)
```

---

## 📜 Description of Key Folders

### **1️⃣ config/**

Contains configuration files such as database connection, environment variables, and other app-wide settings.

- `db.js` → Connects to the database (MongoDB/MySQL/PostgreSQL).
- `config.js` → App-level configurations.

### **2️⃣ controllers/**

Holds all business logic functions that process requests and interact with models.

Example:

```javascript
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};
```

### **3️⃣ models/**

Database models/schema definitions (e.g., Mongoose schemas for MongoDB or Sequelize models for SQL databases).

Example (`User.js` for MongoDB):

```javascript
const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
module.exports = mongoose.model("User", UserSchema);
```

### **4️⃣ routes/**

Defines API endpoints and links them to controllers.

Example (`userRoutes.js`):

```javascript
const express = require("express");
const router = express.Router();
const { getUsers } = require("../controllers/userController");

router.get("/users", getUsers);
module.exports = router;
```

### **5️⃣ middlewares/**

Contains middleware functions like authentication, error handling, logging, etc.

Example (`authMiddleware.js`):

```javascript
module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
```

### **6️⃣ services/**

Holds reusable service functions for external API calls, complex logic, or data processing.

Example (`emailService.js`):

```javascript
const sendEmail = async (to, subject, message) => {
  // Logic for sending email (e.g., using Nodemailer)
};
module.exports = { sendEmail };
```

### **7️⃣ utils/**

Contains helper functions like formatting dates, generating tokens, etc.

Example (`generateToken.js`):

```javascript
const jwt = require("jsonwebtoken");
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};
module.exports = generateToken;
```

### **8️⃣ validations/**

Holds request validation schemas (e.g., using Joi or express-validator).

Example (`userValidation.js`):

```javascript
const Joi = require("joi");
const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
module.exports = userSchema;
```

---

## 🚀 Getting Started

### **1️⃣ Install Dependencies**

```sh
npm install
```

### **2️⃣ Setup Environment Variables**

Create a `.env` file in the root folder:

```env
PORT=8000
MONGO_URI=mongodb+srv://your_connection_string
JWT_SECRET=your_jwt_secret
```

### **3️⃣ Run the Server**

For development (with Nodemon):

```sh
npm run dev
```

For production:

```sh
npm start
```

---

## 📌 Best Practices

- Use environment variables (`.env`) for sensitive data.
- Follow MVC (Model-View-Controller) pattern.
- Use **async/await** and proper error handling (`try/catch`).
- Keep controllers thin; move business logic to services.
- Validate API inputs using **Joi** or `express-validator`.
- Use **CORS** middleware for cross-origin requests.

---

## 🛠 Tech Stack

- **Node.js** & **Express.js** – Backend framework
- **MongoDB** (Mongoose) / **PostgreSQL** (Sequelize) – Database
- **JWT Authentication** – User authentication
- **Nodemailer** – Email services
- **dotenv** – Manage environment variables

---

Happy coding! ✨
