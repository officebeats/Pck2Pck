# PCK2PCK

> **Transform Financial Survival into Strategic Execution.**

PCK2PCK is a modern, premium financial management application designed to help users break free from the "paycheck to paycheck" cycle. By shifting focus from monthly budgeting to **paycheck-cycle planning**, it provides clarity, reduces anxiety, and turns bill execution into a satisfying routine.

## ✨ Key Features

### 🎨 Premium Neumorphic Design
- **Soft UI** aesthetic with high-contrast borders for accessibility.
- Interactive elements with realistic shadows and pressed states.
- **Nunito** typography for a professional yet approachable feel.
- Mobile-first, responsive PWA design with offline support.

### 🗓️ Strategic Planner
- Visualize expenses across specific paycheck cycles (e.g., "Jan #1", "Jan #2").
- **Safe to Spend** calculation showing projected income minus upcoming bills.
- Drag-and-drop bill allocation to specific pay periods.
- Conditional "Assigned To" logic that adapts if you are in "Solo" or "Household" mode.

### 🧾 Bills Hub (Formerly Payments)
- Dedicated workspace for tracking and executing bill payments.
- **Smart Brand Logos**: Automatically fetches official company logos for your bills using advanced name-to-domain mapping.
- **Variance Tracking**: Compare expected vs. actual payment amounts.
- **Payday Routine**: A satisfying workflow to "clear the board" when your income arrives.
- Real-time countdown timers for overdue and due-soon bills.

### 👥 Household & Group Management
- **Invite Members**: Seamlessly add partners or housemates via text or email codes.
- **Role Mastery**: Original administrators handle member management (add, edit, remove).
- **Collaborative Bills**: Assign bills to specific members or mark them as "Joint".
- **Real-time Sync**: Changes made by one member reflect instantly for the entire household.

### ☁️ Cloud Architecture & Security
- **Firebase Core**: Real-time Firestore synchronization and secure Google Authentication.
- **Firebase Storage**: Robust handling for user profile pictures and household assets.
- **GitHub Actions**: Fully automated CI/CD pipeline for "push-to-deploy" efficiency.
- **PWA Ready**: Installable on iOS and Android for a native app experience.

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + Vite |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Custom Neumorphic System |
| **Backend** | Firebase (Auth + Firestore + Storage) |
| **Automation** | GitHub Actions |
| **Design** | Google Material Symbols |

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Firebase project with Auth, Firestore, and Storage enabled.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pck2pck.git
   cd pck2pck
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file (see `.env.example`) with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

## 📄 License

Distributed under the [MIT License](LICENSE).
