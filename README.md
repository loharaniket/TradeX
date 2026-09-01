# TradeX - Virtual Stock Paper Trading Platform 📈

TradeX is a full-stack paper trading web application and stock market simulator. It empowers users to practice trading top US equities (Apple, NVIDIA, Tesla, Microsoft, Amazon, Meta, and more) with **$100,000 in virtual funds** in a 100% risk-free educational environment.

---

## 🌟 Key Features

- **Virtual Paper Trading ($100k Balance)**:
  - Every newly registered trader starts with $100,000.00 in virtual trading capital.
  - Zero financial risk: no real money, credit cards, bank accounts, or deposits required.
  - Instant one-click wallet reset back to $100,000.00 anytime for iterative practice.
- **Open Stock Market Data & Real-Time Charts**:
  - Live US stock quotes powered by public Yahoo Finance chart API with smart in-memory caching and resilient offline fallback quotes.
  - Interactive, responsive pure SVG candlestick/line price charts with price crosshairs, tooltips, and 52-week metrics.
- **Buy & Sell Order Execution Engine**:
  - Instant paper order processing validating buying power and available share quantity.
  - Prevents negative cash balances and short-selling without stock inventory.
- **Real-Time Portfolio Management**:
  - Live calculation of total net worth, invested capital, active share holdings, weighted average cost basis, and unrealized profit & loss ($ and %).
- **Permanent & Immutable Transaction Ledger**:
  - Brokerage-grade audit log of all completed buy and sell transactions, strictly immutable with no delete or edit permissions.
- **Personalized User Dashboard**:
  - Account net worth cards, top equity holdings, recent order activity, and top market movers in one unified view.
- **Trader Profile & Statistics**:
  - Track total trades executed, long buy orders, liquidation sell orders, cumulative dollar turnover, and most active stock ticker.
- **Administrator Surveillance & Control Panel**:
  - Role-based authorization (`protect` + `admin` middleware).
  - Platform-wide surveillance: total registered users, completed trades, cumulative volume, and most active stocks.
  - User management with virtual balance adjustment tool for testing.
  - Live stock trading control switches to enable or suspend paper trading on any equity ticker.
- **Protected Routing & Responsive Design**:
  - Strict authentication route guards preserving attempted destination paths.
  - Fully responsive layout optimized for mobile screens, tablets, and desktops.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | High-performance single page application |
| **Routing** | React Router v7 | Client-side routing with route guards |
| **Styling** | Vanilla CSS3 | Custom design system, dark gradients & animations |
| **Backend** | Node.js + Express.js | RESTful API server |
| **Database** | MongoDB (Atlas Cloud / Local) | Schema models via Mongoose |
| **Auth** | JSON Web Tokens (JWT) + bcrypt | Secure password hashing & role verification |
| **Market Data** | Yahoo Finance Public Chart API | Real-time US equity market metrics |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local installation or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud cluster)

---

### 1. Server Configuration & Setup

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file (refer to `.env.example`):
   ```env
   PORT=8000
   MONGO_URI=mongodb://localhost:27017/tradex
   # For MongoDB Atlas cloud database:
   # MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/tradex?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here
   ```
4. Start the backend server:
   ```bash
   node index.js
   # Or with automatic reloading:
   npm run dev
   ```
   *The server will start on `http://localhost:8000`.*

---

### 2. Client Setup

1. Open a second terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The web application will open on `http://localhost:5173`.*

---

## 🔑 Default & Demo Credentials

For testing and demonstration, use the pre-configured accounts below:

### Default Administrator Account
- **Portal URL**: `/admin/login`
- **Email**: `admin@tradex.com`
- **Password**: `Admin@12345`
- **Role**: `admin`
- **Features**: User management, all platform trades audit, virtual balance adjustment tool, and stock market trading suspension switches.

### Regular Trader Account
- You can register any new account on `/register` — it will immediately receive `$100,000.00` in virtual funds.

---

## 📡 REST API Reference

### Authentication & User Endpoints (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | Public | Register new user with $100k virtual balance |
| `POST` | `/api/users/login` | Public | Authenticate user & issue JWT |
| `POST` | `/api/users/admin/login` | Public | Authenticate administrator credentials |
| `GET` | `/api/users/profile` | Protected | Get user profile & trading statistics |
| `PUT` | `/api/users/profile` | Protected | Update user display name and contact |
| `GET` | `/api/users/wallet` | Protected | Get virtual wallet balance & portfolio value |
| `POST` | `/api/users/wallet/reset` | Protected | Reset virtual balance back to $100,000 |

### Stock Market Endpoints (`/api/stocks`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stocks` | Public | Get all listed US stocks with quotes |
| `GET` | `/api/stocks/:symbol` | Public | Get real-time price & chart data |

### Trading & Orders (`/api/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Protected | Execute simulated paper order (`BUY` or `SELL`) |
| `GET` | `/api/orders` | Protected | Get user's active orders |
| `GET` | `/api/orders/holding/:symbol`| Protected | Get user's holding quantity for a ticker |

### Portfolio & History (`/api/portfolio`, `/api/transactions`, `/api/dashboard`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/portfolio` | Protected | Get aggregate portfolio valuations & holdings |
| `GET` | `/api/transactions` | Protected | Get user's permanent immutable transaction history |
| `GET` | `/api/dashboard` | Protected | Get personalized user dashboard data |

### Administration Endpoints (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Admin Only | Platform surveillance analytics & volume |
| `GET` | `/api/admin/users` | Admin Only | List all registered users |
| `GET` | `/api/admin/trades` | Admin Only | Audit log of all trades across all users |
| `PUT` | `/api/admin/users/:id/balance` | Admin Only | Adjust a user's virtual balance for testing |
| `GET` | `/api/admin/stocks` | Admin Only | Get all listed stocks with trading status |
| `PUT` | `/api/admin/stocks/:symbol/toggle` | Admin Only | Toggle stock trading state (Active / Suspended) |

---

## ⚠️ Educational Disclaimer

TradeX is strictly a simulation software application designed for educational and practice purposes. No real monetary transactions, deposits, or withdrawals are supported. All trades, stock holdings, and balances are entirely simulated.

---

## 📄 License

This project is licensed under the MIT License.
