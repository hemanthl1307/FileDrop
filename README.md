# FileDrop

### Share files directly between devices.

FileDrop is a peer-to-peer file sharing web application that lets you send files using a simple **4-digit room code or QR code**.

Files stay on the sender's device and are transferred directly to the receiver through a **WebRTC data connection** — no accounts, no file uploads, and no database.

> **No uploads. No storage. Just direct file sharing.**

---

## ✨ Features

* 🔢 **4-digit room codes** — easy to share and remember
* 📱 **QR code sharing** — scan and join instantly
* 🔗 **Shareable room links**
* 📁 **Multiple file transfers**
* ⚡ **Peer-to-peer WebRTC transfer**
* 🔒 **Files are not stored on a server**
* 👤 **No account or signup required**
* ⏱️ **Optional room expiration** — 5 minutes, 15 minutes, or 1 hour
* 📊 **Transfer progress**
* 🌙 **Light and dark mode**
* 🧩 **Chunked file transfer with backpressure**
* 👥 **Multiple receivers can join the same room**

---

## 🎥 How It Works

### Sender

```text
Create Room
     ↓
Get 4-digit Code + QR
     ↓
Select Files
     ↓
Share Code / Link / QR
     ↓
Receiver Connects
     ↓
Files Transfer Directly
```

### Receiver

```text
Enter Code / Scan QR
          ↓
     Join Room
          ↓
   Receive File List
          ↓
   Download Files
```

The sender's browser acts as the source of the files. The files are **not uploaded to FileDrop's server**.

---

## 🔐 How FileDrop Transfers Files

FileDrop uses **WebRTC DataChannels** for peer-to-peer communication.

A lightweight PeerJS broker is used only to help browsers discover and establish a connection.

Once the connection is established:

```text
        Signaling
   ┌─────────────────┐
   │  PeerJS Broker  │
   └────────┬────────┘
            │
       Connection Setup
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
  Sender  ═══════  Receiver
           WebRTC
        DataChannel
```

The actual file data travels between the connected browsers rather than being uploaded to a FileDrop storage server.

---

## 📦 File Transfer

Large files are transferred in **64 KB chunks**.

The application also monitors the WebRTC data channel buffer to avoid sending data faster than the receiver can process it.

```text
File
 ↓
64 KB chunks
 ↓
WebRTC DataChannel
 ↓
Receiver
 ↓
Reassemble
 ↓
Download
```

This helps prevent the browser's data channel from becoming overloaded during larger transfers.

---

## ⚠️ Important

Because files remain on the sender's device:

> **The sender must keep the FileDrop tab open while receivers are downloading.**

Closing the sender's tab ends the room and makes the files unavailable.

FileDrop is intentionally designed this way to avoid storing users' files on a server.

---

## 🛠️ Tech Stack

| Technology       | Purpose                    |
| ---------------- | -------------------------- |
| **Next.js 14**   | React framework            |
| **React**        | User interface             |
| **JavaScript**   | Application logic          |
| **Tailwind CSS** | Styling                    |
| **PeerJS**       | WebRTC connection handling |
| **WebRTC**       | Peer-to-peer file transfer |
| **QRCode**       | QR code generation         |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/filedrop.git
cd filedrop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

### 4. Open the application

```text
http://localhost:3000
```

---

## 📁 Project Structure

```text
filedrop/
│
├── app/
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
│
├── components/
│   ├── FileDropApp.jsx
│   ├── RoomQR.jsx
│   └── ThemeToggle.jsx
│
├── lib/
│   ├── useFileDropLink.js
│   └── utils.js
│
├── public/
│
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

---

## 🌐 Deployment

FileDrop can be deployed as a Next.js application.

### Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Vercel automatically detects Next.js.
4. Deploy.

No database or environment variables are required for the current implementation.

---

## 🔧 Signaling

FileDrop currently uses the public PeerJS signaling infrastructure to establish peer connections.

The signaling service helps peers discover each other and exchange the information required to establish the WebRTC connection.

It does **not** act as the file storage layer.

For production deployments requiring independent signaling infrastructure, a self-hosted PeerServer can be used instead.

---

## 🔮 Future Improvements

Some planned possibilities:

* [ ] Better transfer recovery after temporary connection loss
* [ ] Pause / resume transfers
* [ ] Transfer history
* [ ] Improved mobile experience
* [ ] Custom room names
* [ ] Self-hosted signaling configuration
* [ ] Better handling of very large files
* [ ] File preview support
* [ ] Transfer speed and ETA indicators

---

## 🧠 What I Learned

Building FileDrop involved working with concepts beyond a traditional CRUD application:

* WebRTC peer-to-peer communication
* Peer discovery and signaling
* Browser DataChannels
* Chunked binary data transfer
* Backpressure handling
* File APIs and ArrayBuffers
* React state management
* Connection lifecycle management
* QR-based room joining
* Client-side file handling

---

## 📌 Limitations

FileDrop is designed around direct browser-to-browser transfer, so it has some inherent limitations:

* The sender must keep the browser tab open.
* Connection quality depends on the network conditions of both peers.
* Some network configurations may prevent a direct peer connection.
* There is no server-side file backup or recovery.
* Closing the sender's room makes its files unavailable.

---

## 👨‍💻 Author

**Hemanth L.**

Computer Science & Engineering — Data Science

Built as a project exploring **peer-to-peer networking, WebRTC, and modern web development**.

---

## 📄 License

This project is open source and available under the MIT License.
