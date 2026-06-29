import boto3
import time
from botocore.exceptions import ClientError
from config import Config

def get_dynamodb_client():
    return boto3.client(
        'dynamodb',
        region_name=Config.AWS_DEFAULT_REGION,
        aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY
    )

def get_sns_client():
    return boto3.client(
        'sns',
        region_name=Config.AWS_DEFAULT_REGION,
        aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY
    )

def create_table(client, table_name, key_schema, attribute_definitions, global_secondary_indexes=None):
    try:
        kwargs = {
            'TableName': table_name,
            'KeySchema': key_schema,
            'AttributeDefinitions': attribute_definitions,
            'BillingMode': 'PAY_PER_REQUEST'
        }
        if global_secondary_indexes:
            kwargs['GlobalSecondaryIndexes'] = global_secondary_indexes
            
        client.create_table(**kwargs)
        print(f"Creating table {table_name}...")
        waiter = client.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        print(f"Table {table_name} created successfully.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"Table {table_name} already exists.")
        else:
            print(f"Error creating table {table_name}: {e}")

def setup_dynamodb():
    client = get_dynamodb_client()
    
    # 1. Users Table
    create_table(
        client,
        'Users',
        [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        [{'AttributeName': 'id', 'AttributeType': 'S'}]
    )
    
    # 2. Stocks Table
    create_table(
        client,
        'Stocks',
        [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        [{'AttributeName': 'id', 'AttributeType': 'S'}]
    )
    
    # 3. Portfolios Table
    create_table(
        client,
        'Portfolios',
        [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'user_id', 'AttributeType': 'S'}
        ],
        global_secondary_indexes=[
            {
                'IndexName': 'user_id-index',
                'KeySchema': [{'AttributeName': 'user_id', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    )
    
    # 4. Transactions Table
    create_table(
        client,
        'Transactions',
        [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'user_id', 'AttributeType': 'S'}
        ],
        global_secondary_indexes=[
            {
                'IndexName': 'user_id-index',
                'KeySchema': [{'AttributeName': 'user_id', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    )

def setup_sns():
    client = get_sns_client()
    
    topics = ['StockerWelcomeAlerts', 'StockerTradeAlerts']
    for topic_name in topics:
        try:
            response = client.create_topic(Name=topic_name)
            print(f"SNS Topic '{topic_name}' created/exists with ARN: {response['TopicArn']}")
        except ClientError as e:
            print(f"Error creating SNS topic {topic_name}: {e}")

if __name__ == '__main__':
    print("Starting AWS Infrastructure Setup...")
    setup_dynamodb()
    setup_sns()
    print("AWS Infrastructure Setup Complete.")
