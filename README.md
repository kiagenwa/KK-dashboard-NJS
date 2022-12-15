# KK-dashboard-NJS
A dashboard for production data based on Node.js

Version: 0.1.1 - can use as intended, but still need more polishing

This is a simple project made to easily track the production trend.
The data is hosted on a SQL server and loaded by ETL script in my automation repository.

This is the end result of my ETL project.
Stack summary:
1. MS SQL Server  - data hosting
2. Python 3       - ETL from daily report files
3. Node.js        - Runtime for backend
4. Express.js     - Backend for dashboard application
5. Pug            - HTML renderer
6. D3.js          - generating graphic from data
7. Tedious        - connect and query SQL Server
8. Bootstrap      - (planned) interactive interface
9. React.js       - (planned) interactive dashboard

Next, it is planned to make the dashboard interactive using Bootstrap and React.
