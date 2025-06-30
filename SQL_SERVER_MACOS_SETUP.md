# SQL Server Connection Setup for macOS

## Overview
Connecting to SQL Server from macOS can be challenging due to driver compatibility issues. This guide provides multiple approaches to establish a connection.

## Option 1: Using pymssql (Recommended for macOS)

### Step 1: Install Dependencies
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install FreeTDS (required for pymssql)
brew install freetds

# Install Python dependencies
pip install pymssql
```

### Step 2: Configure FreeTDS
Create/edit `/usr/local/etc/freetds.conf`:
```ini
[global]
    tds version = 7.4
    client charset = UTF-8

[SQLSERVER]
    host = your_sql_server_ip
    port = 1433
    tds version = 7.4
```

### Step 3: Test Connection
```bash
# Test with tsql
tsql -S SQLSERVER -U your_username -P your_password
```

## Option 2: Using Docker (Alternative)

### Step 1: Install Docker Desktop for Mac
Download from: https://www.docker.com/products/docker-desktop

### Step 2: Run SQL Server in Docker
```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" \
   -p 1433:1433 --name sql1 --hostname sql1 \
   -d mcr.microsoft.com/mssql/server:2019-latest
```

### Step 3: Connect from Python
```python
import pymssql

conn = pymssql.connect(
    server='localhost',
    user='sa',
    password='YourStrong@Passw0rd',
    database='master'
)
```

## Option 3: Using Azure Data Studio (GUI Tool)

### Step 1: Install Azure Data Studio
Download from: https://docs.microsoft.com/en-us/sql/azure-data-studio/download

### Step 2: Configure Connection
- Server: `your_sql_server_ip,1433`
- Authentication Type: SQL Login
- User name: `your_username`
- Password: `your_password`

## Option 4: Using pyodbc with ODBC Driver 18

### Step 1: Install Microsoft ODBC Driver 18
```bash
# Download and install from Microsoft
curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list > /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql18
```

### Step 2: Install unixODBC
```bash
brew install unixodbc
```

### Step 3: Python Connection
```python
import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 18 for SQL Server};'
    'SERVER=your_server;'
    'DATABASE=your_database;'
    'UID=your_username;'
    'PWD=your_password;'
    'TrustServerCertificate=yes;'
)
```

## Environment Configuration

### Create .env file
```bash
# backend/.env
SQL_SERVER_HOST=your_sql_server_ip
SQL_SERVER_PORT=1433
SQL_SERVER_DATABASE=your_database
SQL_SERVER_USERNAME=your_username
SQL_SERVER_PASSWORD=your_password
```

### Update app.py Connection
```python
import os
from dotenv import load_dotenv
import pymssql

load_dotenv()

def get_sql_server_connection():
    return pymssql.connect(
        server=os.getenv('SQL_SERVER_HOST'),
        port=int(os.getenv('SQL_SERVER_PORT', 1433)),
        user=os.getenv('SQL_SERVER_USERNAME'),
        password=os.getenv('SQL_SERVER_PASSWORD'),
        database=os.getenv('SQL_SERVER_DATABASE')
    )
```

## Troubleshooting

### Common Issues:

1. **"No module named 'pymssql'"**
   ```bash
   pip install pymssql
   ```

2. **"FreeTDS not found"**
   ```bash
   brew install freetds
   ```

3. **"Connection timeout"**
   - Check firewall settings
   - Verify SQL Server is configured for remote connections
   - Ensure SQL Server Browser service is running

4. **"Authentication failed"**
   - Verify username/password
   - Check if SQL Server is configured for SQL Authentication
   - Ensure user has appropriate permissions

### Testing Connection:
```python
import pymssql

try:
    conn = pymssql.connect(
        server='your_server',
        user='your_username',
        password='your_password',
        database='your_database'
    )
    print("Connection successful!")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
```

## Recommended Approach for This Project

For this bonus calculation system, I recommend using **Option 1 (pymssql)** as it's the most reliable for macOS and doesn't require additional drivers.

### Quick Setup:
```bash
# Install dependencies
brew install freetds
pip install pymssql

# Test connection
python -c "
import pymssql
conn = pymssql.connect(server='your_server', user='your_username', password='your_password', database='your_database')
print('Connected successfully!')
conn.close()
"
```

## Next Steps

1. Choose your preferred connection method
2. Install the required dependencies
3. Configure your connection parameters
4. Test the connection
5. Update the backend code to use the working connection method

Let me know which approach you'd like to try, and I'll help you set it up! 