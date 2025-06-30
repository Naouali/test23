# SQL Server Integration Setup

This document explains how to configure the SQL Server integration for the Performance Data component, specifically for the Legal Team and Servicing Team.

## 🔧 Configuration

### 1. Environment Variables

Copy the `backend/env.example` file to `backend/.env` and update the SQL Server credentials:

```bash
# Copy the example file
cp backend/env.example backend/.env

# Edit the .env file with your actual credentials
```

### 2. Required Environment Variables

```env
# SQL Server Configuration
SQL_SERVER_HOST=your_sql_server_host
SQL_SERVER_DATABASE=your_database_name
SQL_SERVER_USERNAME=your_username
SQL_SERVER_PASSWORD=your_password
SQL_SERVER_DRIVER={SQL Server}
SQL_SERVER_PORT=1433
```

### 3. SQL Server Driver Options

Choose the appropriate driver based on your SQL Server version:

- **SQL Server Native Client**: `{SQL Server}`
- **ODBC Driver 17**: `{ODBC Driver 17 for SQL Server}`
- **ODBC Driver 18**: `{ODBC Driver 18 for SQL Server}`

## 📊 Team Queries

### Legal Team Query

The system uses the following query for the Legal Team performance data:

```sql
SELECT DISTINCT 
    l.InternalLawyerName, 
    act.LegalStage, 
    prop.PropertyID, 
    prop.LastValuationAmount, 
    act.Portfolio, 
    act.PortfolioID, 
    act.JudicialProcessID,
    act.LegalActID, 
    act.LegalActCode, 
    act.ActDate, 
    act.ActAmount,
    act.CreationUser,
    act.CreationDate,

    CASE 
        WHEN act.LegalActCode = 'Auction Start Date and Official ID' THEN 'Auction'
        WHEN act.LegalActCode = 'Assigment of awarding celebrated' THEN 'Assigment of awarding'
        WHEN act.LegalActCode IN (
            'Cash In Court Third Party - Secured', 
            'Cash In Court Third Party - Unsecured'
        ) THEN 'Cash In Court'
        WHEN act.LegalActCode = 'Awarding Title' THEN 'Testimony'
        WHEN act.LegalActCode = 'Lawsuit Presentation Date' THEN 'Demands'
        WHEN act.LegalActCode = 'OutCome - Judicial Possession of Keys' THEN 'Possession'
    END AS Bucket

FROM 
    legalactactivity AS act
    INNER JOIN legal AS l ON act.JudicialProcessID = l.JudicialProcessID
    LEFT JOIN Property AS prop ON act.PropertyID = prop.PropertyID

WHERE 
    act.countryID = 2
    AND act.ActDate >= '{start_date}' AND act.ActDate < '{end_date}'
    AND act.CreationDate >= '{start_date}'
    AND act.LegalActID IN (8, 23, 61, 71, 98, 134, 214, 258)

ORDER BY 
    l.InternalLawyerName, 
    act.LegalStage;
```

### Servicing Team Query

The system uses the following query for the Servicing Team performance data:

```sql
SELECT 
    ReceivedDate, 
    TotalAmount, 
    CashFlowType, 
    CollectionCategory,

    CASE 
        WHEN CollectionCategory IN (
            'Discounted Payoff  - Unsecured', 
            'Discounted Payoff  - Secured', 
            'Installment', 
            'Workout', 
            'Prepayment Full', 
            'Prepayment Partial', 
            'Consensual Sale Agreement'
        ) THEN 'Amicable Debtor Resolution'

        WHEN CollectionCategory IN (
            'Rent', 
            'Pspa', 
            'Sale Deed'
        ) THEN 'Real Estate'

        WHEN CollectionCategory IN (
            'Assignment Of Award - Sale Third Party', 
            'Collateral Sale', 
            'Loan Sale'
        ) THEN 'Third Part Resolution'
    END AS CollectionCategoryGroup,

    CASE 
        WHEN CollectionCategory IN (
            'Assignment Of Award – Sale Third Party', 
            'Cash In Court Third Party - Sale At Auction', 
            'Cash In Court Third Party - Servicing'
        ) THEN 'SSA'

        WHEN CollectionCategory IN (
            'Rent', 
            'Pspa', 
            'Sale Deed', 
            'Workout', 
            'Prepayment Partial', 
            'Prepayment Full', 
            'Loan Sale', 
            'Installment', 
            'Discounted Payoff  - Secured', 
            'Discounted Payoff  - Unsecured', 
            'Collateral Sale'
        ) THEN 'CF'

        WHEN CollectionCategory IN (
            'Cash In Court', 
            'Cash In Court Third Party - Secured', 
            'Cash In Court Third Party - Unsecured'
        ) THEN 'Legal'

        WHEN CollectionCategory IN (
            'Deed In Lieu', 
            'Consensual Sale Agreement'
        ) OR CollectionCategory IS NULL THEN 'Non-CF'
    END AS CFType,

    CollectionID,
    AssetManager

FROM 
    CollectionDetail

WHERE 
    Country = 'ESPANA'
    AND ReceivedDate BETWEEN '{start_date}' AND '{end_date}'

ORDER BY 
    ReceivedDate;
```

## 🚀 Activation Steps

### 1. Install Dependencies

The required dependencies are already included in `requirements.txt`:

```bash
pip install pyodbc==4.0.39
```

### 2. Enable SQL Server Connection

In `backend/app.py`, uncomment the SQL Server connection code in the `refresh_team_performance` function:

```python
# Remove the comment markers (#) from lines 465-520
# import pyodbc
# try:
#     connection = pyodbc.connect(SQL_SERVER_CONNECTION_STRING)
#     # ... rest of the SQL Server code
```

### 3. Test Connection

1. Start the backend server
2. Navigate to Performance Data in the frontend
3. Select Legal Team or Servicing Team and click the refresh button
4. Check the browser console and backend logs for any connection errors

## 📈 Data Structure

### Legal Team Performance Data

- **Total Legal Acts**: Number of legal activity records
- **Total Amount**: Sum of all legal act amounts
- **Average Amount per Act**: Total amount divided by number of acts
- **Bucket Distribution**: Breakdown by legal act categories (Auction, Cash In Court, etc.)
- **Lawyer Distribution**: Breakdown by internal lawyer
- **Legal Stages**: Breakdown by legal process stages
- **Quarterly Trends**: Monthly legal act counts

### Servicing Team Performance Data

- **Total Collections**: Number of collection records
- **Total Amount**: Sum of all collection amounts
- **Average Amount per Collection**: Total amount divided by number of collections
- **Category Distribution**: Breakdown by CollectionCategoryGroup
- **CF Type Distribution**: Breakdown by CFType
- **Quarterly Trends**: Monthly collection counts

## 🔍 Troubleshooting

### Common Issues

1. **Connection Failed**: Check SQL Server credentials and network connectivity
2. **Driver Not Found**: Install the appropriate SQL Server ODBC driver
3. **Permission Denied**: Ensure the SQL Server user has read access to the required tables
4. **Table Not Found**: Verify the tables exist in the specified database:
   - `legalactactivity` (Legal Team)
   - `legal` (Legal Team)
   - `Property` (Legal Team)
   - `CollectionDetail` (Servicing Team)

### Debug Mode

Enable debug logging by adding this to your `.env` file:

```env
FLASK_DEBUG=1
```

### Test Connection Manually

You can test the SQL Server connection manually:

```python
import pyodbc
connection_string = "DRIVER={SQL Server};SERVER=your_server;DATABASE=your_db;UID=your_user;PWD=your_password"
connection = pyodbc.connect(connection_string)
cursor = connection.cursor()

# Test Legal Team query
cursor.execute("SELECT TOP 1 * FROM legalactactivity")
result = cursor.fetchone()
print("Legal Team:", result)

# Test Servicing Team query
cursor.execute("SELECT TOP 1 * FROM CollectionDetail")
result = cursor.fetchone()
print("Servicing Team:", result)
```

## 📝 Notes

- **Legal Team**: Filters by `countryID = 2` and specific `LegalActID` values
- **Servicing Team**: Filters by `Country = 'ESPANA'`
- Date ranges are automatically calculated based on the selected quarter
- The system supports Q1-Q4 for years 2023-2025
- All amounts are displayed in Euros (€)
- The frontend automatically refreshes when quarter/year selection changes
- Each team has different metrics and visualizations based on their data structure 