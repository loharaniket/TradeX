from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from config import Config
from services.aws_service import AWSService
import os

app = Flask(__name__)
app.config.from_object(Config)

# Initialize AWS Service
aws_service = AWSService()

# --- Decorators for RBAC ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            flash('Admin privileges required.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# --- Routes ---

@app.route('/')
def index():
    if 'user_id' in session:
        if session.get('role') == 'admin':
            return redirect(url_for('admin_dashboard'))
        return redirect(url_for('trader_dashboard'))
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Check if user already exists
        if aws_service.get_user_by_email(email):
            flash('Email already registered.', 'error')
            return redirect(url_for('signup'))
            
        hashed_password = generate_password_hash(password)
        user_id = aws_service.create_user(username, email, hashed_password)
        
        if user_id:
            flash('Account created successfully! Please check your email to confirm your AWS Alert Subscription before trading.', 'success')
            return redirect(url_for('login'))
        else:
            flash('Error creating account.', 'error')
            
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = aws_service.get_user_by_email(email)
        
        if user and check_password_hash(user['password'], password):
            if not user.get('is_active', True):
                flash('Account is inactive.', 'error')
                return redirect(url_for('login'))
                
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user.get('role', 'trader')
            session['email'] = user['email']
            
            if session['role'] == 'admin':
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('trader_dashboard'))
        else:
            flash('Invalid email or password.', 'error')
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('index'))

@app.route('/admin/dashboard', methods=['GET', 'POST'])
@admin_required
def admin_dashboard():
    if request.method == 'POST':
        # Add new stock
        symbol = request.form.get('symbol').upper()
        name = request.form.get('name')
        price = request.form.get('price')
        market_cap = request.form.get('market_cap')
        sector = request.form.get('sector')
        industry = request.form.get('industry')
        
        stock_id = aws_service.create_stock(symbol, name, price, market_cap, sector, industry)
        if stock_id:
            flash(f'Stock {symbol} added successfully.', 'success')
        else:
            flash('Error adding stock.', 'error')
        return redirect(url_for('admin_dashboard'))
        
    users = aws_service.get_all_users()
    stocks = aws_service.get_all_stocks()
    return render_template('admin_dash.html', users=users, stocks=stocks)

@app.route('/trader/dashboard')
@login_required
def trader_dashboard():
    stocks = aws_service.get_all_stocks()
    return render_template('trader_dash.html', stocks=stocks)

@app.route('/portfolio')
@login_required
def portfolio():
    portfolio_items = aws_service.get_user_portfolio(session['user_id'])
    
    # Hydrate portfolio with stock data
    enriched_portfolio = []
    total_value = 0.0
    for item in portfolio_items:
        stock = aws_service.get_stock_by_id(item['stock_id'])
        if stock:
            current_price = float(stock['price'])
            qty = int(item['quantity'])
            avg_price = float(item['average_price'])
            current_value = current_price * qty
            total_value += current_value
            
            profit_loss = (current_price - avg_price) * qty
            pl_percent = ((current_price - avg_price) / avg_price) * 100 if avg_price > 0 else 0
            
            enriched_portfolio.append({
                'symbol': stock['symbol'],
                'name': stock['name'],
                'quantity': qty,
                'average_price': avg_price,
                'current_price': current_price,
                'current_value': current_value,
                'profit_loss': profit_loss,
                'pl_percent': pl_percent,
                'stock_id': item['stock_id']
            })
            
    return render_template('portfolio.html', portfolio=enriched_portfolio, total_value=total_value)

@app.route('/trade', methods=['GET', 'POST'])
@login_required
def trade():
    stock_id = request.args.get('stock_id') or request.form.get('stock_id')
    action = request.args.get('action') or request.form.get('action')
    
    if not stock_id:
        flash('No stock specified for trading.', 'error')
        return redirect(url_for('trader_dashboard'))
        
    stock = aws_service.get_stock_by_id(stock_id)
    if not stock:
        flash('Stock not found.', 'error')
        return redirect(url_for('trader_dashboard'))
        
    if request.method == 'POST':
        action = request.form.get('action')
        quantity = int(request.form.get('quantity', 0))
        price = float(stock['price'])
        
        if quantity <= 0:
            flash('Quantity must be greater than zero.', 'error')
            return redirect(url_for('trade', stock_id=stock_id, action=action))
            
        if action == 'SELL':
            # Verify ownership
            portfolio_items = aws_service.get_user_portfolio(session['user_id'])
            item = next((i for i in portfolio_items if i['stock_id'] == stock_id), None)
            if not item or int(item['quantity']) < quantity:
                flash(f'Insufficient shares to sell. You own {item["quantity"] if item else 0}.', 'error')
                return redirect(url_for('trade', stock_id=stock_id, action=action))

        # Execute
        success = aws_service.execute_trade(session['user_id'], stock_id, action, quantity, price)
        if success:
            aws_service.publish_trade_alert(session['user_id'], action, stock['symbol'], quantity, price)
            flash(f'Successfully {action}ed {quantity} shares of {stock["symbol"]}.', 'success')
            return redirect(url_for('portfolio'))
        else:
            flash('Trade execution failed.', 'error')
            
    return render_template('trade.html', stock=stock, action=action)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
