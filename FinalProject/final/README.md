# Koseli Mart - Nepali Grocery Store E-commerce Platform

A full-stack e-commerce website for Koseli Mart, an authentic Nepali grocery store based in Artesia, CA. Built with React.js, Node.js, and MongoDB.

## 🚀 Features

### Customer Features

- **Product Browsing**: Browse products by categories with advanced filtering and search
- **User Authentication**: Register/login with email/password or OAuth (Google/Facebook)
- **Shopping Cart**: Add/remove items, update quantities, persistent cart
- **Order Management**: Place orders, track order status, view order history
- **Payment Processing**: Secure payments with Stripe integration
- **Responsive Design**: Mobile-first design that works on all devices

### Admin Features

- **Dashboard**: Analytics and overview of sales, orders, and inventory
- **Product Management**: Add, edit, delete products with image uploads
- **Category Management**: Organize products into categories
- **Order Management**: Process orders, update status, track shipments
- **User Management**: Manage customer accounts and permissions
- **Inventory Tracking**: Real-time stock management and low stock alerts

### Technical Features

- **Authentication**: JWT-based auth with OAuth integration
- **Real-time Updates**: Live inventory and order status updates
- **Search & Filtering**: Advanced product search with multiple filters
- **Stock Management**: Automatic stock deduction on order placement
- **Payment Security**: PCI-compliant payment processing with Stripe
- **Data Visualization**: Charts and graphs for business insights

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks and functional components
- **Chakra UI** - Beautiful and accessible component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling and validation
- **Stripe React** - Payment processing
- **Axios** - HTTP client for API calls

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Passport.js** - Authentication middleware
- **Stripe** - Payment processing
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation

### DevOps & Tools

- **Git** - Version control
- **NPM** - Package management
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting
- **Compression** - Response compression

## 📁 Project Structure

```
koseli-mart/
├── backend/                 # Node.js backend
│   ├── config/             # Configuration files
│   │   └── passport.js     # OAuth configuration
│   ├── middleware/         # Custom middleware
│   │   └── auth.js         # Authentication middleware
│   ├── models/             # MongoDB models
│   │   ├── User.js         # User schema
│   │   ├── Product.js      # Product schema
│   │   ├── Category.js     # Category schema
│   │   ├── Cart.js         # Cart schema
│   │   └── Order.js        # Order schema
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication routes
│   │   ├── products.js     # Product routes
│   │   ├── categories.js   # Category routes
│   │   ├── cart.js         # Cart routes
│   │   ├── orders.js       # Order routes
│   │   ├── users.js        # User routes
│   │   ├── admin.js        # Admin routes
│   │   └── stripe.js       # Payment routes
│   ├── package.json        # Backend dependencies
│   ├── server.js           # Main server file
│   └── env.example         # Environment variables template
├── frontend/               # React frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── Layout/     # Layout components
│   │   │   ├── Product/    # Product components
│   │   │   ├── Auth/       # Authentication components
│   │   │   └── UI/         # UI components
│   │   ├── contexts/       # React contexts
│   │   │   ├── AuthContext.js    # Authentication context
│   │   │   └── CartContext.js    # Shopping cart context
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin pages
│   │   │   └── ...         # Customer pages
│   │   ├── theme.js        # Chakra UI theme
│   │   ├── App.js          # Main app component
│   │   └── index.js        # App entry point
│   └── package.json        # Frontend dependencies
└── README.md               # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Stripe account for payments
- Google/Facebook OAuth apps (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd koseli-mart
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   ```bash
   # Copy the example environment file
   cp backend/env.example backend/.env

   # Edit the .env file with your configuration
   nano backend/.env
   ```

   Required environment variables:

   ```env
   MONGODB_URI=mongodb://localhost:27017/koseli_mart
   JWT_SECRET=your_jwt_secret_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the backend server**

   ```bash
   cd backend
   npm start
   ```

   The backend will run on `http://localhost:5000`

6. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

### Database Setup

The application will automatically create the necessary database collections when you first run it. You can also seed the database with sample data by running:

```bash
cd backend
npm run seed  # If you create a seed script
```

## 📱 Usage

### Customer Features

1. **Browse Products**: Visit the homepage to see featured products and categories
2. **Search & Filter**: Use the search bar and filters to find specific products
3. **Add to Cart**: Click "Add to Cart" on any product
4. **Checkout**: Proceed to checkout and complete your order
5. **Track Orders**: View your order history in your account dashboard

### Admin Features

1. **Access Admin Panel**: Login with an admin account and visit `/admin`
2. **Manage Products**: Add, edit, or delete products
3. **Process Orders**: Update order status and add tracking information
4. **View Analytics**: Check sales reports and inventory levels
5. **Manage Users**: View and manage customer accounts

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/facebook` - Facebook OAuth
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products

- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `GET /api/products/featured/list` - Get featured products
- `GET /api/products/category/:slug` - Get products by category
- `GET /api/products/search/query` - Search products

### Cart

- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:productId` - Update cart item
- `DELETE /api/cart/remove/:productId` - Remove cart item
- `DELETE /api/cart/clear` - Clear entire cart

### Orders

- `GET /api/orders` - Get user's orders
- `GET /api/orders/:orderId` - Get single order
- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/confirm-payment` - Confirm payment

### Admin

- `GET /api/admin/dashboard` - Dashboard analytics
- `GET /api/admin/products` - Admin product management
- `GET /api/admin/orders` - Admin order management
- `GET /api/admin/users` - Admin user management

## 🛡️ Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation with express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS for cross-origin requests
- **Helmet**: Security headers middleware
- **Environment Variables**: Sensitive data stored in environment variables

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean and intuitive interface with Chakra UI
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success and error notifications
- **Accessibility**: WCAG compliant components

## 🚀 Deployment

### Backend Deployment (Heroku)

1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Connect your GitHub repository
4. Deploy automatically on push to main branch

### Frontend Deployment (Vercel/Netlify)

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Deploy automatically on push to main branch

### Database (MongoDB Atlas)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get connection string and add to environment variables
4. Configure IP whitelist and database user

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: [Your Name]
- **Design**: [Designer Name]
- **Project Manager**: [PM Name]

## 📞 Support

For support, email support@koselimart.com or visit our contact page at [website-url]/contact.

## 🙏 Acknowledgments

- Chakra UI for the amazing component library
- Stripe for payment processing
- MongoDB for the database
- All the open-source contributors who made this project possible

---

**Koseli Mart** - Bringing authentic Nepali flavors to Artesia, CA 🥘
