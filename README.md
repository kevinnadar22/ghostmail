# GhostMail 👻

**Untraceable communication tailored for anonymity.**

GhostMail is a privacy-focused web application that allows users to send anonymous emails with file attachments securely. Built with modern web technologies, it ensures a seamless and secure user experience.

![GhostMail Screenshot](public/screenshot.png) *(Add a screenshot here if available)*

## ✨ Features

*   **Anonymous Email Sending**: Send emails without revealing your identity.
*   **Rich Text Editor**: Compose formatted messages with ease.
*   **Secure File Attachments**:
    *   Attach up to **10 files** at a time.
    *   Maximum total size limit of **25MB**.
    *   Files are securely uploaded to AWS S3 via presigned URLs.
    *   Specific error feedback for file limits.
*   **User-Friendly Interface**:
    *   Modern, dark-themed UI.
    *   Real-time upload progress indicators.
    *   Confirmation dialogs for failed uploads.
    *   "Send Anyway" capability for partial successes.
    *   Loading states and toast notifications.
*   **History**: locally stores recent recipient emails for convenience.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **State Management**: React Query (TanStack Query)
*   **Email Service**: [Resend](https://resend.com/)
*   **Storage**: AWS S3
*   **UI Components**: Lucide Icons, Sonner (Toasts)

## Getting Started

### Prerequisites

*   Node.js (v18+ recommended)
*   npm or yarn
*   AWS S3 Bucket credentials
*   Resend API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kevinnadar22/ghostmail.git
    cd ghostmail
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add the following keys:

    ```env
    # AWS S3 Configuration (for file uploads)
    AWS_ACCESS_KEY_ID=your_access_key
    AWS_SECRET_ACCESS_KEY=your_secret_key
    AWS_REGION=your_region
    S3_BUCKET=your_bucket_name

    # Resend Configuration (for sending emails)
    RESEND_API_KEY=re_123456789
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📝 Usage

1.  Enter the **Recipient's Email**.
2.  (Optional) Enter a **From Name** (Alias).
3.  Enter a **Subject**.
4.  Compose your message in the **Rich Text Editor**.
5.  Attach files by clicking the paperclip icon or dragging and dropping.
    *   *Note: Files exceeding the size limit will typically trigger an error toast.*
6.  Click **"Send Anonymously"**.
    *   *If uploads fail, you will be prompted to either Retry/Cancel or Send Anyway.*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

*   **Website**: [mariakevin.in](https://mariakevin.in)
