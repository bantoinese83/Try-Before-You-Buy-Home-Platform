# Try-Before-You-Buy Home Platform

A modern web-based platform that enables prospective home buyers to experience properties through short-term stays before making a purchase decision. Built with a microservices architecture using Next.js, TypeScript, and Tailwind CSS.

## 🏗️ Architecture Overview

The platform follows a microservices architecture with the following core components:

- **Frontend**: React/Next.js with Server-Side Rendering (SSR)
- **API Gateway**: Request routing and authentication enforcement
- **User Service**: Authentication and profile management
- **Property Service**: Property listings and search functionality
- **Booking Service**: Reservation management
- **Payment Service**: Secure transaction processing
- **Notification Service**: Email/SMS communications

## 🚀 Current Implementation Status

### ✅ Completed Features

1. **API Gateway Router** (TDD Implementation)
   - Comprehensive routing logic with priority-based rules
   - Support for exact path and prefix matching
   - HTTP method filtering
   - Dynamic rule updates
   - Full test coverage (16 passing tests)

2. **Interactive Demo Interface**
   - Visual API Gateway Router simulator
   - Real-time routing demonstrations
   - Rule management interface
   - Example request testing

3. **Development Environment**
   - Next.js 15 with TypeScript
   - Tailwind CSS for styling
   - Jest testing framework
   - ESLint configuration

### 🔄 In Progress / Planned

- User Service with authentication
- Property Service with Elasticsearch integration
- Booking Service with calendar management
- Payment Service with Stripe integration
- Supabase backend setup
- Notification Service

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest, React Testing Library
- **Backend**: Node.js microservices
- **Database**: PostgreSQL (via Supabase)
- **Search**: Elasticsearch
- **Caching**: Redis
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Cloud**: AWS/GCP

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tryb4buy-upwork
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint

## 🎯 Demo Features

### Main Dashboard
- **URL**: [http://localhost:3000](http://localhost:3000)
- **Features**: 
  - User authentication simulation
  - Property listing management
  - Booking system demonstration
  - Payment processing simulation
  - Service status monitoring

### API Gateway Simulator
- **URL**: [http://localhost:3000/api-gateway](http://localhost:3000/api-gateway)
- **Features**:
  - Interactive request routing
  - Real-time rule testing
  - Service discovery simulation
  - Request/response visualization

## 🧪 Testing

The project follows Test-Driven Development (TDD) principles. The API Gateway Router implementation includes comprehensive tests:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPatterns=router.test.ts

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

- **API Gateway Router**: 16 tests covering routing logic, priority handling, and edge cases
- **Unit Tests**: Individual routing functions
- **Integration Tests**: Complex routing scenarios

## 🎯 API Gateway Router Features

The core API Gateway Router implementation includes:

### Key Features

- **Priority-Based Routing**: Higher priority rules take precedence
- **Path Matching**: Support for both exact paths and prefix matching
- **HTTP Method Filtering**: Optional method-specific routing
- **Dynamic Rule Updates**: Runtime rule configuration changes
- **Path Transformation**: Automatic prefix stripping for target services

### Example Usage

```typescript
import { ApiGatewayRouter, RoutingRule } from '@/apiGateway/router'

const rules: RoutingRule[] = [
  { 
    id: 'users-api', 
    pathPrefix: '/users', 
    targetService: 'userService', 
    priority: 10 
  },
  { 
    id: 'health-check', 
    exactPath: '/health', 
    targetService: 'healthService', 
    method: 'GET', 
    priority: 20 
  }
]

const router = new ApiGatewayRouter(rules)
const result = router.routeRequest({ path: '/users/123', method: 'GET' })
// Returns: { targetService: 'userService', targetPath: '/123' }
```

## 🎨 Interactive Demo

The application includes a comprehensive interactive demo that allows you to:

- **Test Routing**: Send sample requests and see routing results
- **Visualize Rules**: View current routing rules in priority order
- **Modify Configuration**: Update routing rules via JSON editor
- **Quick Examples**: Try predefined request scenarios

## 🏛️ Project Structure

```
src/
├── apiGateway/
│   ├── router.ts              # Core routing logic
│   └── router.test.ts         # Comprehensive test suite
├── components/
│   └── ApiGatewayRouterSimulator.tsx  # Interactive demo
├── app/
│   └── page.tsx               # Main application page
└── ...
```

## 🔐 Security Considerations

- Input validation on all API endpoints
- Authentication and authorization enforcement
- Rate limiting implementation
- HTTPS enforcement
- SQL injection prevention
- XSS protection

## 🚀 Deployment

The application is designed for cloud deployment with:

- **Containerization**: Docker support for consistent deployments
- **Scalability**: Horizontal scaling capabilities
- **Monitoring**: Health checks and performance metrics
- **CI/CD**: Automated testing and deployment pipelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Guidelines

- Follow TDD principles
- Maintain high test coverage
- Use TypeScript strictly
- Follow ESLint rules
- Write descriptive commit messages
- Document complex logic

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Future Enhancements

- Real-time notifications
- Advanced property search filters
- Integration with external property APIs
- Mobile application
- AI-powered property recommendations
- Virtual property tours
- Multi-language support

---

**Built with ❤️ using modern web technologies and best practices**