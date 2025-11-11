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

- `RESEND_API_KEY`: API key for the Resend email service.

**Note**:
- Email senders stored in the database only track the email address. Ensure those addresses are verified and allowed to send via Resend (configure domains/senders in the Resend dashboard).
- At least one email sender must be created through the App Settings page before attempting to send emails from the application.

