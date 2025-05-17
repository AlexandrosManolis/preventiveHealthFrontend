# Preventive Health Frontend

A comprehensive application designed to help users track and manage their health history and preventive care measures and make appointments with one tap.

# Overview

Preventive Health is a platform focused on empowering users to take a proactive approach to their health. The application provides reminders for preventive screenings and check-ups, and offers personalized health recommendations based on user profiles.

# Features

Preventive Care Calendar: Schedule and receive reminders for preventive examinations
Personalized Recommendations: Get health reminder advice tailored to your age, gender, and health profile
Medical Records Management: Store and access your medical history securely. Share your medical history with other doctors(readOnly)
Find specialists: Find specialists in different cities and their ratings. Make an appointment fast and easy.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16.0.0 or later)
- npm (v8.0.0 or later)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/preventiveHealthFrontend.git
cd preventiveHealthFrontend
npm install
```

## 💻 Development

### Start Development Server

Run the development server with hot-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/` by default.

### Build for Production

Compile and minify for production deployment:

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🧪 Testing

### Run Unit Tests

Execute unit tests with [Vitest](https://vitest.dev/):

```bash
npm run test:unit
```

### Linting

Lint your code with [ESLint](https://eslint.org/):

```bash
npm run lint
```

## 👥 Test Users

The database comes pre-configured with the following test accounts for development and testing:

| Username | Role    
|----------|---------
| `user1`  | Patient 
| `user2`  | Doctor  
| `admin`  | Admin   

These accounts can be used for testing different access levels and features without needing to create new accounts.