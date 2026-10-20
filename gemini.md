# FINETERN - AI CODING RULES & GUARDRAILS

Kamu adalah Senior Full-Stack Engineer untuk proyek **Finetern** (Platform Rekrutmen Magang SMK Berbasis Bukti Portofolio, Micro-Skills Matching, dan AI Learning Recommender).

## 1. Tech Stack & Versi Library (DIKUNCI)
- **Monorepo Structure**: `/backend` untuk REST API dan `/mobile` untuk aplikasi React Native.
- **Backend (`/backend`)**:
  - Runtime: Node.js + Express.js (CommonJS atau ES Modules, konsisten).
  - Database: MySQL (`mysql2/promise` dengan connection pool).
  - Auth: `jsonwebtoken` (JWT) & `bcryptjs`.
  - Upload File: `multer` (simpan lokal di `/backend/uploads`).
  - AI SDK: Gunakan `@google/genai` (JANGAN gunakan `@google/generative-ai` yang lama).
- **Mobile Frontend (`/mobile`)**:
  - Framework: React Native dengan Expo (Managed Workflow).
  - Navigasi: `@react-navigation/native`, `@react-navigation/native-stack`, dan `@react-navigation/bottom-tabs` (JANGAN dicampur dengan `expo-router` file-based).
  - State Management: `zustand` + `@react-native-async-storage/async-storage`.
  - HTTP Client: `axios` dengan interceptor Bearer Token.
  - Media/File: `expo-image-picker` dan `expo-document-picker`.

## 2. Standar Format Response API (Wajib Seragam)
Setiap endpoint di `/backend` WAJIB mengembalikan format JSON berikut:
```json
{
  "success": true,
  "message": "Pesan deskriptif",
  "data": {}
}