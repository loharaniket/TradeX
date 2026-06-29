import uuid
import boto3
from werkzeug.security import generate_password_hash
from botocore.exceptions import ClientError
from config import Config

def get_dynamodb_resource():
    return boto3.resource(
        'dynamodb',
        region_name=Config.AWS_DEFAULT_REGION,
        aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY
    )

def seed_admin():
    dynamodb = get_dynamodb_resource()
    table = dynamodb.Table('Users')
    
    # Check if admin already exists by scanning for role="admin"
    try:
        response = table.scan(
            FilterExpression='#r = :role_val',
            ExpressionAttributeNames={'#r': 'role'},
            ExpressionAttributeValues={':role_val': 'admin'}
        )
        
        if response.get('Items'):
            print("An admin user already exists. Skipping seeding.")
            return
            
    except ClientError as e:
        print(f"Error scanning for admin: {e}")
        return

    # Create admin
    admin_id = str(uuid.uuid4())
    hashed_password = generate_password_hash("AdminPassword123!")
    
    try:
        table.put_item(
            Item={
                'id': admin_id,
                'username': 'admin',
                'email': 'admin@stocker.com',
                'password': hashed_password,
                'role': 'admin',
                'is_active': True
            }
        )
        print(f"Admin user seeded successfully with ID: {admin_id}")
        print("Username: admin")
        print("Password: AdminPassword123!")
    except ClientError as e:
        print(f"Error seeding admin user: {e}")

if __name__ == '__main__':
    seed_admin()
