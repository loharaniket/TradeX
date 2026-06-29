import boto3
from botocore.exceptions import ClientError
from config import Config
import uuid
import datetime

class AWSService:
    def __init__(self):
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=Config.AWS_DEFAULT_REGION,
            aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY
        )
        self.sns = boto3.client(
            'sns',
            region_name=Config.AWS_DEFAULT_REGION,
            aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY
        )
        self.users_table = self.dynamodb.Table('Users')
        self.stocks_table = self.dynamodb.Table('Stocks')
        self.portfolios_table = self.dynamodb.Table('Portfolios')
        self.transactions_table = self.dynamodb.Table('Transactions')

    # --- SNS Methods ---
    def subscribe_user_to_sns(self, username, email):
        """Creates a unique topic for the user and subscribes their email."""
        # Sanitize username (SNS only allows alphanumeric, hyphens, and underscores)
        import re
        safe_username = re.sub(r'[^a-zA-Z0-9_-]', '', username)
        if not safe_username:
            safe_username = "user"
            
        topic_name = f"StockerUserAlerts_{safe_username}_{str(uuid.uuid4())[:8]}"
        try:
            # 1. Create the topic
            response = self.sns.create_topic(Name=topic_name)
            topic_arn = response['TopicArn']
            
            # 2. Subscribe the email to this topic
            self.sns.subscribe(
                TopicArn=topic_arn,
                Protocol='email',
                Endpoint=email
            )
            print(f"Created SNS Topic and subscribed {email}: {topic_arn}")
            return topic_arn
        except ClientError as e:
            print(f"Error subscribing user to SNS: {e}")
            return None

    def publish_trade_alert(self, user_id, action, symbol, quantity, price):
        try:
            # Fetch user to get their specific Topic ARN
            user = self.get_user_by_id(user_id)
            if not user or 'topic_arn' not in user:
                print("User or Topic ARN not found for trade alert.")
                return

            message = f"Trade Executed: {action} {quantity} shares of {symbol} at ₹{price} per share."
            self.sns.publish(
                TopicArn=user['topic_arn'],
                Message=message,
                Subject="Stocker Trade Alert"
            )
        except ClientError as e:
            print(f"Error publishing trade alert: {e}")

    # --- DynamoDB Methods ---
    def create_user(self, username, email, password_hash, role='trader'):
        user_id = str(uuid.uuid4())
        
        # Setup SNS for this specific user
        topic_arn = self.subscribe_user_to_sns(username, email)
        
        try:
            item = {
                'id': user_id,
                'username': username,
                'email': email,
                'password': password_hash,
                'role': role,
                'is_active': True
            }
            if topic_arn:
                item['topic_arn'] = topic_arn
                
            self.users_table.put_item(Item=item)
            return user_id
        except ClientError as e:
            print(f"Error creating user: {e}")
            return None

    def get_user_by_email(self, email):
        try:
            response = self.users_table.scan(
                FilterExpression='email = :e',
                ExpressionAttributeValues={':e': email}
            )
            items = response.get('Items', [])
            return items[0] if items else None
        except ClientError as e:
            print(f"Error fetching user: {e}")
            return None

    def get_user_by_id(self, user_id):
        try:
            response = self.users_table.get_item(Key={'id': user_id})
            return response.get('Item')
        except ClientError as e:
            print(f"Error fetching user by id: {e}")
            return None

    def get_all_users(self):
        try:
            response = self.users_table.scan()
            return response.get('Items', [])
        except ClientError as e:
            print(f"Error fetching all users: {e}")
            return []

    def create_stock(self, symbol, name, price, market_cap, sector, industry):
        stock_id = str(uuid.uuid4())
        try:
            self.stocks_table.put_item(
                Item={
                    'id': stock_id,
                    'symbol': symbol,
                    'name': name,
                    'price': str(price), # DynamoDB doesn't like float natively unless configured, using Decimal or String is better, String is safer for simple apps
                    'market_cap': market_cap,
                    'sector': sector,
                    'industry': industry,
                    'date_added': datetime.datetime.now().isoformat()
                }
            )
            return stock_id
        except ClientError as e:
            print(f"Error creating stock: {e}")
            return None

    def get_all_stocks(self):
        try:
            response = self.stocks_table.scan()
            return response.get('Items', [])
        except ClientError as e:
            print(f"Error fetching stocks: {e}")
            return []

    def get_stock_by_id(self, stock_id):
        try:
            response = self.stocks_table.get_item(Key={'id': stock_id})
            return response.get('Item')
        except ClientError as e:
            print(f"Error fetching stock by id: {e}")
            return None
            
    def get_user_portfolio(self, user_id):
        try:
            response = self.portfolios_table.query(
                IndexName='user_id-index',
                KeyConditionExpression='user_id = :uid',
                ExpressionAttributeValues={':uid': user_id}
            )
            return response.get('Items', [])
        except ClientError as e:
            print(f"Error fetching portfolio: {e}")
            return []

    def execute_trade(self, user_id, stock_id, action, quantity, price):
        # 1. Create Transaction
        transaction_id = str(uuid.uuid4())
        try:
            self.transactions_table.put_item(
                Item={
                    'id': transaction_id,
                    'user_id': user_id,
                    'stock_id': stock_id,
                    'action': action,
                    'price': str(price),
                    'quantity': quantity,
                    'status': 'COMPLETED',
                    'transaction_date': datetime.datetime.now().isoformat()
                }
            )
        except ClientError as e:
            print(f"Error creating transaction: {e}")
            return False

        # 2. Update Portfolio
        try:
            portfolio_items = self.get_user_portfolio(user_id)
            portfolio_item = next((item for item in portfolio_items if item['stock_id'] == stock_id), None)

            if action == 'BUY':
                if portfolio_item:
                    # Update existing portfolio item
                    current_qty = int(portfolio_item['quantity'])
                    new_qty = current_qty + quantity
                    old_total = float(portfolio_item['average_price']) * current_qty
                    new_total = float(price) * quantity
                    new_avg = (old_total + new_total) / new_qty
                    
                    self.portfolios_table.update_item(
                        Key={'id': portfolio_item['id']},
                        UpdateExpression="set quantity = :q, average_price = :p",
                        ExpressionAttributeValues={
                            ':q': new_qty,
                            ':p': str(round(new_avg, 2))
                        }
                    )
                else:
                    # Create new portfolio item
                    self.portfolios_table.put_item(
                        Item={
                            'id': str(uuid.uuid4()),
                            'user_id': user_id,
                            'stock_id': stock_id,
                            'quantity': quantity,
                            'average_price': str(price)
                        }
                    )
            elif action == 'SELL':
                if portfolio_item:
                    current_qty = int(portfolio_item['quantity'])
                    new_qty = current_qty - quantity
                    if new_qty <= 0:
                        # Delete portfolio item
                        self.portfolios_table.delete_item(
                            Key={'id': portfolio_item['id']}
                        )
                    else:
                        # Update quantity
                        self.portfolios_table.update_item(
                            Key={'id': portfolio_item['id']},
                            UpdateExpression="set quantity = :q",
                            ExpressionAttributeValues={
                                ':q': new_qty
                            }
                        )
                else:
                    print("Error: Attempting to sell unowned stock")
                    return False
            return True
        except ClientError as e:
            print(f"Error updating portfolio: {e}")
            return False
