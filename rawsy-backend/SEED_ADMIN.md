# Admin User Seed Script

This script creates an admin user in the database.

## Usage

### Using Default Credentials

```bash
cd rawsy-backend
npm run seed:admin
```

This will create an admin user with:
- Email: `admin@rawsy.com`
- Password: `Admin@123`
- Name: `Admin User`

### Using Custom Credentials

Set environment variables before running the script:

```bash
ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=YourPassword123 ADMIN_NAME="Your Name" npm run seed:admin
```

Or add them to your `.env` file:

```env
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=YourPassword123
ADMIN_NAME=Your Name
```

Then run:

```bash
npm run seed:admin
```

## Important Notes

1. The script will skip creating an admin if one already exists with the same email
2. The password is hashed before being stored in the database
3. Please change the password after first login for security
4. The admin user can access the admin portal at the web interface
