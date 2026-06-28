# 📈 Stocker: Cloud-Native Trading Platform

Welcome to **Stocker**! This is a modern, lightweight, cloud-native web application that simulates a real-world stock market trading platform. Built with Python, Flask, and Amazon Web Services (AWS), Stocker allows users to buy and sell stocks while keeping track of their portfolio in real-time.

---

## ✨ Key Features

* **Beautiful UI:** A premium "Dark Finance" themed interface featuring glassmorphism, smooth CSS animations, and FontAwesome iconography.
* **AWS Serverless Database:** Uses **Amazon DynamoDB** for lightning-fast, highly scalable data storage.
* **Instant Email Alerts:** Integrates with **Amazon SNS** to automatically send personalized email notifications whenever a trade (Buy/Sell) is executed.
* **Role-Based Access:** 
  * **Traders:** Can view the live market, execute trades, and monitor their personal portfolio's profit/loss.
  * **Admins:** Have access to an Admin Panel to add new stocks to the market catalog and monitor all registered users.
* **Dynamic Calculations:** Automatically calculates portfolio averages, current values, and percentage returns.

---

## 🛠️ Technology Stack

* **Backend:** Python 3, Flask
* **Frontend:** HTML5, CSS3 (Vanilla), Jinja2 Templating
* **Cloud Infrastructure (AWS):** 
  * DynamoDB (NoSQL Database)
  * SNS (Simple Notification Service)
  * Boto3 (AWS SDK for Python)
* **Local Server:** Waitress (Production-quality WSGI server for Windows)

---

## 🚀 Getting Started

Follow these simple steps to get Stocker running on your local machine.

### 1. Prerequisites
You will need the following installed on your computer:
* Python 3.8+
* An AWS Account (with IAM Access Keys)

### 2. AWS Setup
Before running the app, you need to create three tables in **Amazon DynamoDB**:
1. `Users` (Partition key: `id` - String)
2. `Stocks` (Partition key: `id` - String)
3. `Portfolios` (Partition key: `id` - String)

### 3. Installation
Clone this repository and set up your virtual environment:

```bash
# Clone the repo
git clone https://github.com/aniketlohar/Stocker.git
cd Stocker

# Create a virtual environment
python -m venv venv

# Activate the virtual environment (Windows)
venv\Scripts\activate

# Install the required packages
pip install -r requirements.txt
```

### 4. Environment Variables
Create a file named `.env` in the root folder of the project. You can copy the provided `.env.example` file and fill in your details:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DEFAULT_REGION=us-east-1
FLASK_SECRET_KEY=super_secret_flask_key_change_in_production
```

### 5. Run the Application
Start the server using Waitress (optimized for Windows):

```bash
waitress-serve --port=5000 app:app
```
*Note: The app will now be running at `http://localhost:5000`*

---

## 📖 How to Use

1. **Sign Up:** Go to `http://localhost:5000/signup` and create an account. Make sure to use a real email address!
2. **Confirm Subscription:** Check your email inbox. AWS SNS will send you a "Subscription Confirmation" link. **You must click this link to receive your trade receipts!**
3. **Become an Admin (Optional):** By default, all new users are "traders". To make yourself an admin, go to your AWS DynamoDB Console, find your user in the `Users` table, and change your `role` attribute from `trader` to `admin`.
4. **Add Stocks:** If you are an Admin, log in and use the Admin Panel to add stocks (like AAPL, TSLA) to the market.
5. **Trade:** Log in as a trader, go to the Live Market, and start buying! Check your email for instant trade receipts.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is for educational and portfolio purposes. 
