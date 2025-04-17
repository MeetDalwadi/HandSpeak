# HandSpeak - Sign Language Communication System

HandSpeak is a comprehensive platform designed to bridge the communication gap between the deaf/mute community and others through Sign Language. The system uses advanced Computer Vision and Deep Learning techniques to facilitate seamless communication.

## 👨‍💻 Team Members

This project was collaboratively developed by the following team members as part of CVMU Hackathon 3.0:

- Meet Dalwadi
- Harsh Jingar  
- Raj Patel 

All members contributed equally to the planning, development, and execution of the project.

## Problem 
Millions of deaf and mute individuals face **significant barriers** in daily communication due to the lack of widespread understanding of Sign Language. These challenges impact **education, employment, social interactions, and access to essential services**. Traditional methods like interpreters and written communication are not always accessible, creating **a gap in seamless communication** between the deaf/mute community and others.

## Our Solution
HandSpeak Innovators leverages **advanced Computer Vision and Deep Learning techniques** to **interpret sign language gestures in real-time** and convert them into **text and speech**. Our system ensures that deaf/mute individuals can effectively communicate without requiring an interpreter. Additionally, the platform translates spoken language into **sign language animations**, fostering **two-way communication**. By combining **AI-driven sign recognition, text-to-sign conversion, and an interactive learning hub**, HandSpeak **breaks communication barriers and enhances inclusivity**.

## Outcome & Impact
- **Increased Growth Opportunities**: Deaf and mute individuals can participate more effectively in **education, professional careers, and social interactions**.
- **Eliminates Communication Gaps**: Ensures **seamless interaction** between the deaf/mute community and non-signers.
- **Empowerment & Inclusivity**: Creates a world where **there is no difference between deaf/mute individuals and others** in terms of communication and opportunities.
- **AI for Accessibility**: Leverages cutting-edge technology to make **sign language universally accessible**.

## Features

1. **Sign to Text Conversion**
   - Real-time hand gesture recognition
   - Converts Sign Language signs to text
   - Text-to-speech output for verbal communication

2. **Text to Sign Conversion**
   - Converts text/Speech input to Sign Language signs
   - Visual representation of signs
   - Helps in learning Sign Language

3. **Learning Sign Language**
   - Interactive learning modules
   - Video tutorials

4. **HandSpeak Community**
   - Global community platform for deaf and mute people
   - Share sign language related posts
   - Connect with others
   - Discussion forums
   - Resource sharing

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm/yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/HandSpeak.git
cd HandSpeak
```

2. Create and activate virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Install Node.js dependencies for community and learning platforms:
```bash
cd "Handspeak Community"
npm install
cd ../HandSpeak_Innovators_LMS-main
npm install
```

### Running the Application

Open three separate terminals and run:

1. Main Application (Terminal 1):
```bash
python run.py
```

2. HandSpeak Community (Terminal 2):
```bash
cd "Handspeak Community"
npm run dev
```

3. Learning Platform (Terminal 3):
```bash
cd HandSpeak_Innovators_LMS-main
npm run dev
```

## Project Structure

- `/app` - Main Flask application for Sign Language processing
- `/Handspeak Community` - Community platform frontend and backend
- `/HandSpeak_Innovators_LMS-main` - Learning Management System
- `requirements.txt` - Python dependencies
- `run.py` - Main application entry point

## Technologies Used

### Sign Language Processing (/app)
- Python Flask for backend
- TensorFlow for CNN model implementation
- OpenCV for image processing and hand gesture recognition
- pyttsx3 for text-to-speech conversion

### Community Platform (/Handspeak Community)
- Next.js for frontend and backend
- PostgreSQL for database
- Node.js runtime environment

### Learning Platform (/HandSpeak_Innovators_LMS-main)
- React.js for frontend
- Features:
  - Interactive lessons and modules
  - Video tutorials

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
