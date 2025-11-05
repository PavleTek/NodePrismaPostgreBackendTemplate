Backend template for dashboard webapps (JavaScript version).
In the future more will be added here

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

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

4. Start the development server:
```bash
npm run dev
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

#### Gmail
- `GMAIL_CLIENT_ID`: Gmail OAuth2 client ID (required)
- `GMAIL_CLIENT_SECRET`: Gmail OAuth2 client secret (required)

#### Outlook
- `OUTLOOK_CLIENT_ID`: Outlook OAuth2 client ID (required)
- `OUTLOOK_CLIENT_SECRET`: Outlook OAuth2 client secret (required)

**Note**: 
- Refresh tokens are stored per email sender in the database and must be added when creating or updating an email sender through the App Settings page in the frontend.
- Each email sender can have its own refresh token, allowing multiple email accounts to send emails.
- The refresh token is required when sending emails - if missing, an error will be thrown.
- Make sure to add email senders and their refresh tokens through the App Settings page before sending emails.

