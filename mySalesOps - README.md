### THIS IS A HISTORICAL DOCUMENT AND SHOULD NOT BE CONSIDERED FOR CONTEXT AND BUILD #####
# mySalesOps - Government Contracting Business Management System

A comprehensive React-based business management system designed specifically for government contracting and business development teams. Features full-stack opportunity tracking, entity management, sales forecasting, and integrated analytics.

## Overview

mySalesOps streamlines the complexities of government contracting business development by providing a unified platform to manage opportunities, track entities, forecast revenue, and maintain relationships with government agencies and key contacts.

## Key Features

### 📊 Sales Opportunity Management
- **Comprehensive Opportunity Tracking**: Manage opportunities with 50+ data fields including:
  - Contract details (type, value, period of performance)
  - Agency relationships and hierarchy
  - Sales stages and probability weighting
  - Capture strategy and win themes
  - Teaming arrangements and partners
  - Bid/no-bid decision tracking
- **Advanced Filtering & Search**: Multi-criteria filtering, sorting, and search capabilities
- **Pipeline Analytics**: Real-time pipeline value, weighted pipeline, and win rate calculations
- **Excel Export**: Export opportunity data for offline analysis

### 🏢 Entity Management
- **Business Entity Tracking**: Complete LLC and subsidiary information management
- **SBA Reporting Automation**:
  - Automated SBA 8(a) reporting date tracking
  - Visual alerts for upcoming deadlines
  - Document management per entity
- **Revenue Analytics**: Performance tracking and metrics by entity
- **Compliance Tracking**: Maintain certifications and compliance documentation

### 🏛️ Agency & Contact Management
- **Hierarchical Agency Structure**: Track parent-child relationships between government organizations
- **Contact Relationship Tracking**: Maintain detailed contact information and relationship history
- **Agency Classification**: Federal, State, Local, and International categorization
- **Integration Points**: Connect agencies to opportunities and contracts

### 📈 Sales Forecasting & Targets
- **Configurable Forecast Groups**: Create custom groupings (divisions, markets, regions, etc.)
- **Target Setting**: Define revenue targets by forecast group and time period
- **Actual Tracking**: Monitor actual wins against forecasted pipeline
- **Multi-Dimensional Analysis**: Compare performance across different business dimensions
- **Weighted Pipeline**: Probability-based pipeline calculations

### 📋 Contract Vehicle Management
- **GWAC/IDIQ Tracking**: Manage Government-Wide Acquisition Contracts and IDIQs
- **Vehicle Attributes**: Track ceiling values, expiration dates, and eligibility
- **Opportunity Associations**: Link contract vehicles to opportunities
- **Strategic Planning**: Identify vehicle gaps and opportunities

### 📊 Reporting & Analytics
- **Power BI Integration Framework**: Embedded dashboard support for advanced analytics
- **Real-Time Dashboards**: Live performance metrics and KPIs
- **Custom Report Configuration**: Flexible reporting structure
- **Data Export**: Excel export capabilities for custom analysis

### ⚙️ Configuration & Administration
- **Role-Based Access Control**: Admin, Sales, and Viewer role management
- **Customizable System Settings**:
  - Sales stages and stage ordering
  - Agency types and classifications
  - Capability and service offerings
  - Contract types and vehicles
  - Custom forecast groupings
- **User Management**: Complete user administration
- **System Configuration**: Centralized settings management

## Technology Stack

### Frontend
- **React 18.2.0**: Modern UI framework with hooks
- **React Router DOM 6.30.1**: Client-side routing and navigation
- **TanStack React Query 5.90.5**: Powerful server state management
- **React Hook Form 7.65.0**: Performant form handling
- **Zod 4.1.12**: TypeScript-first schema validation
- **Tailwind CSS 3.4.18**: Utility-first CSS framework
- **Lucide React 0.263.1**: Beautiful icon library
- **XLSX 0.18.5**: Excel file generation and parsing

### Backend
- **Express 5.1.0**: Fast Node.js web framework
- **MSSQL 12.0.0**: Microsoft SQL Server client
- **CORS 2.8.5**: Cross-origin resource sharing
- **dotenv 17.2.3**: Environment configuration

### Database
- **Azure SQL Database**: Cloud-hosted SQL Server 2019+
- **Encrypted Connections**: TLS/SSL security
- **Connection Pooling**: Optimized database performance

### Build Tools
- **CRACO 7.1.0**: Create React App Configuration Override
- **React Scripts 5.0.1**: Build tooling
- **Concurrently 9.2.1**: Run frontend and backend simultaneously
- **PostCSS 8.5.6** + **Autoprefixer 10.4.21**: CSS processing

## Prerequisites

- **Node.js 16+** and npm
- **Azure SQL Database** or **SQL Server 2019+**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Git for version control

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AleutMySaleOps
```

### 2. Install Dependencies

```bash
npm install
```

This installs all frontend and backend dependencies in a single command.

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Database Configuration
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password

# Server Configuration
PORT=3002

# Azure Configuration (if using Azure Static Web Apps)
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database-name
AZURE_SQL_USER=your-username
AZURE_SQL_PASSWORD=your-password
```

See `.env.example` for a complete template.

### 4. Database Setup

The application requires a SQL Server database with the following core tables:
- **Opportunities**: Sales opportunity tracking
- **Agencies**: Government organization data
- **Contacts**: Key personnel information
- **Entities**: Business entity/LLC data
- **Forecasts**: Revenue forecasts and targets
- **ContractVehicles**: GWAC/IDIQ tracking
- **Users**: User authentication and authorization
- **Configuration**: System settings and customization

Refer to `DATABASE_SETUP.md` for detailed schema information and setup instructions.

## Running the Application

### Development Mode

**Option 1: Run Both Frontend and Backend (Recommended)**
```bash
npm run dev
```
This starts both the React development server (port 3000) and the Express API server (port 3002) concurrently.

**Option 2: Run Separately**

Terminal 1 - Frontend:
```bash
npm start
```

Terminal 2 - Backend:
```bash
npm run server
```

Access the application at: `http://localhost:3000`

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Project Structure

```
AleutMySaleOps/
├── src/                          # Frontend React application
│   ├── components/              # React components
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   └── ...
│   │   ├── Dashboard.jsx
│   │   ├── Header.jsx
│   │   ├── TopNav.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/                   # Page-level components
│   │   ├── DashboardPage.jsx           # Main dashboard
│   │   ├── OpportunitiesPage.jsx       # Opportunity list view
│   │   ├── OpportunityFormPage.jsx     # Opportunity create/edit
│   │   ├── AgenciesPage.jsx            # Agency management
│   │   ├── AgencyFormPage.jsx          # Agency form
│   │   ├── ContactFormPage.jsx         # Contact management
│   │   ├── ContractVehiclesPage.jsx    # Contract vehicle tracking
│   │   ├── ContractVehicleFormPage.jsx # Vehicle form
│   │   ├── EntitiesPage.jsx            # Entity management
│   │   ├── ForecastsPage.jsx           # Sales forecasting
│   │   ├── ReportingPage.jsx           # Power BI reports
│   │   ├── ConfigurationPage.jsx       # System configuration
│   │   └── LoginPage.jsx               # Authentication
│   ├── contexts/                # React Context providers
│   │   ├── AuthContext.jsx      # Authentication state
│   │   └── AppContext.jsx       # Global application state
│   ├── hooks/                   # Custom React hooks
│   │   ├── useOpportunities.js  # Opportunity data management
│   │   ├── useAgencies.js       # Agency data management
│   │   ├── useContacts.js       # Contact data management
│   │   ├── useContractVehicles.js
│   │   ├── useEntities.js       # Entity data management
│   │   └── useForecasts.js      # Forecast data management
│   ├── layouts/                 # Layout components
│   │   ├── AuthLayout.jsx       # Login page layout
│   │   └── MainLayout.jsx       # Main app layout
│   ├── services/                # API services
│   │   └── api.js              # API client
│   ├── utils/                   # Utility functions
│   ├── App.jsx                  # Root component
│   ├── index.js                 # Application entry point
│   └── index.css                # Global styles
├── server/                      # Backend Express API
│   ├── config/
│   │   └── database.js          # Azure SQL configuration
│   ├── routes/                  # API route handlers
│   │   ├── opportunities.js     # Opportunity endpoints
│   │   ├── agencies.js          # Agency endpoints
│   │   ├── contacts.js          # Contact endpoints
│   │   ├── entities.js          # Entity endpoints
│   │   ├── forecasts.js         # Forecast endpoints
│   │   └── users.js             # User management
│   └── index.js                 # Server entry point
├── public/                      # Static assets
│   ├── index.html
│   ├── logo.svg
│   └── ...
├── build/                       # Production build output
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
├── package.json                 # Dependencies and scripts
├── tailwind.config.js           # Tailwind CSS configuration
├── craco.config.js              # React app configuration
├── postcss.config.js            # PostCSS configuration
└── staticwebapp.config.json     # Azure Static Web Apps config
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Opportunities
- `GET /api/opportunities` - List all opportunities
- `GET /api/opportunities/:id` - Get single opportunity
- `POST /api/opportunities` - Create new opportunity
- `PUT /api/opportunities/:id` - Update opportunity
- `DELETE /api/opportunities/:id` - Delete opportunity

### Agencies
- `GET /api/agencies` - List all agencies
- `POST /api/agencies` - Create agency
- `PUT /api/agencies/:id` - Update agency
- `DELETE /api/agencies/:id` - Delete agency

### Contacts
- `GET /api/contacts` - List all contacts
- `GET /api/contacts/agency/:agencyId` - Get contacts by agency
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Entities
- `GET /api/entities` - List all entities
- `POST /api/entities` - Create entity
- `PUT /api/entities/:id` - Update entity
- `DELETE /api/entities/:id` - Delete entity

### Forecasts
- `GET /api/forecasts` - List all forecasts
- `POST /api/forecasts` - Create forecast
- `PUT /api/forecasts/:id` - Update forecast

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Deployment

### Azure Static Web Apps Deployment

The application is configured for deployment to Azure Static Web Apps with Azure App Service for the backend API.

**Configuration file**: `staticwebapp.config.json`

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  }
}
```

**Deployment Steps**:

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Deploy to Azure Static Web Apps**:
   - Use Azure Portal or Azure CLI
   - Point to the `build/` directory
   - Configure API backend connection

3. **Deploy backend API**:
   - Deploy `server/` directory to Azure App Service
   - Configure environment variables
   - Update CORS settings for frontend domain

4. **Database setup**:
   - Create Azure SQL Database
   - Run schema creation scripts
   - Update connection string in environment variables

### Alternative Deployment Options

- **Vercel**: Frontend hosting with serverless API routes
- **Heroku**: Full-stack deployment
- **AWS**: EC2 for backend, S3 + CloudFront for frontend, RDS for database
- **Docker**: Containerized deployment

## Configuration

### User Roles

The application supports three user roles:

- **Admin**: Full system access including configuration and user management
- **Sales**: Create and edit opportunities, view reports
- **Viewer**: Read-only access to opportunities and reports

### Customizable Settings

Administrators can customize the following via the Configuration page:

- **Sales Stages**: Define custom sales pipeline stages
- **Agency Types**: Government organization classifications
- **Capabilities**: Service offerings and technical capabilities
- **Contract Types**: Types of government contracts
- **Contract Vehicles**: Available GWACs and IDIQs
- **Forecast Groups**: Custom business dimension groupings

## Security Considerations

### Production Checklist

- [ ] Change all default passwords
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production domains only
- [ ] Enable SQL injection protection (parameterized queries)
- [ ] Set up rate limiting
- [ ] Configure Content Security Policy
- [ ] Enable database encryption at rest
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Review and limit API access
- [ ] Implement audit logging

### Environment Variables

Never commit sensitive information to version control. Always use environment variables for:
- Database credentials
- API keys and secrets
- Third-party service credentials
- Production configuration

## Power BI Integration

### Setup Overview

1. **Create Reports in Power BI Desktop**
   - Connect to Azure SQL Database
   - Design reports and dashboards
   - Publish to Power BI Service

2. **Configure Embed Tokens**
   - Register app in Azure AD
   - Configure API permissions for Power BI
   - Generate and manage embed tokens

3. **Update Application Configuration**
   - Add report URLs to configuration
   - Set embed parameters
   - Configure row-level security if needed

4. **Test Integration**
   - Verify reports load in Reporting page
   - Test filtering and interactivity
   - Validate security and permissions

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to Azure SQL Database

**Solutions**:
- Verify firewall rules allow your IP address
- Check connection string format
- Ensure database credentials are correct
- Test connection with Azure Data Studio or SSMS

```bash
# Test with Node.js
node -e "const sql = require('mssql'); sql.connect('your-connection-string').then(() => console.log('Connected!'))"
```

### Port Already in Use

**Problem**: Port 3000 or 3002 already in use

**Solution**:
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>

# Or change port in package.json scripts
```

### CORS Issues

**Problem**: API requests blocked by CORS policy

**Solutions**:
- Update CORS configuration in `server/index.js`
- Verify frontend origin is allowed
- Check HTTP vs HTTPS protocol consistency

### Build Errors

**Problem**: Build fails with dependency errors

**Solutions**:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

## Development Guidelines

### Code Style

- Use functional React components with hooks
- Follow ESLint configuration
- Use Tailwind CSS utility classes
- Implement error boundaries for robustness
- Use React Query for server state management

### Component Structure

- Keep components focused and single-purpose
- Extract reusable UI components to `src/components/ui/`
- Use custom hooks for business logic
- Implement proper loading and error states

### State Management

- Use React Context for global state (Auth, App data)
- Use React Query for server state
- Keep local state minimal and component-specific
- Use React Hook Form for form state

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support & Documentation

For additional documentation, see:
- `DATABASE_SETUP.md` - Database schema and setup
- `CODEBASE_ANALYSIS.md` - Detailed code structure analysis
- `MODERNIZATION.md` - Architecture and modernization notes

## Roadmap

Future enhancements under consideration:

- [ ] Mobile-responsive improvements
- [ ] Email notifications for opportunity milestones
- [ ] Document version control
- [ ] Integration with GovWin/SAM.gov APIs
- [ ] Advanced workflow automation
- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)
- [ ] Dark mode theme

## Author

**Geoff Vaughan** - Initial development

---

**Built for government contracting business development teams**
