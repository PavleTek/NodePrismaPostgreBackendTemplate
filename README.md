# Pavletek Backend Template

Backend template for dashboard webapps (JavaScript version).

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

3. Set up the database (must have a proper databaseURL in order for prisma to connect to it):
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
node src/index.js
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_EXPIRES_IN`: JWT token expiration time (default: 7d)
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: CORS origin URL (default: http://localhost:5173)

### Email Configuration

The email system uses OAuth2 refresh tokens stored per email sender in the database. Each email sender must have a refresh token configured.

#### Required Environment Variables

- `RESEND_API_KEY`: API key for the Resend email service.

**Note**:
- Email senders stored in the database only track the email address. Ensure those addresses are verified and allowed to send via Resend (configure domains/senders in the Resend dashboard).
- At least one email sender must be created through the App Settings page before attempting to send emails from the application.

---

## Mantenedores System

The backend includes a flexible "mantenedores" (maintainers/metadata) system for managing admin-style reference data like categories, types, statuses, etc.

### How It Works

- **Single table**: All mantenedor types are stored in one `Mantenedor` table
- **Flexible types**: The `type` field is a plain string (no enum restrictions)
- **JSON data**: Type-specific fields are stored in a `data` JSON column
- **Versioning**: A global version number tracks changes for frontend cache invalidation

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/mantenedores/version` | Get current version (for cache check) |
| `GET` | `/api/mantenedores` | Get all mantenedores grouped by type |
| `GET` | `/api/mantenedores/type/:type` | Get mantenedores by type |
| `GET` | `/api/mantenedores/:id` | Get single mantenedor by ID |
| `POST` | `/api/mantenedores` | Create new mantenedor (admin only) |
| `PUT` | `/api/mantenedores/:id` | Update mantenedor (admin only) |
| `DELETE` | `/api/mantenedores/:id` | Delete mantenedor (admin only) |

### Creating a Mantenedor

```bash
POST /api/mantenedores
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "COST_TYPE",
  "name": "Labor Costs",
  "code": "LABOR",
  "description": "All labor-related expenses"
}
```

The `type` and `name` fields are required. All other fields are stored in the `data` JSON column.

### Optional Validation

Validation is **optional** by default. To add validation for a specific type:

1. Edit `src/schemas/mantenedorSchemas.js`
2. Add a schema entry:

```javascript
const schemas = {
  INVOICE_CONCEPT: {
    fields: {
      code: { type: 'string', required: true },
      costTypeId: { type: 'number', required: true, reference: 'COST_TYPE' },
    },
  },
};
```

Types without schemas accept any data. This allows rapid development while supporting strict validation when needed.

---

## Railway Deployment

1. Start your backend service with this as a template
2. Start a service in Railway with your repo as the source
3. Ensure to start a PostgreSQL service in Railway. Once deployed, get the private URL from Railway and set the env variable `DATABASE_URL` with it
4. Set the rest of the env variables with your Resend API key, your JWT secret and expiry preference, and CORS policy
5. For the CORS variable, you can leave it as "" to allow any, or you can get your frontend URL and paste it there
6. Set the pre-deploy commands to: `npm run migrate && npm run build && npm run seed`
7. Trigger a deploy and your backend should be running with a database and testing accounts
8. You can opt to change the `prisma/seed.js` file if you do not wish to have these initial roles set up
