import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Biblioteca API',
      version: '1.0.0',
      description: 'API REST para gestión de biblioteca digital con Supabase + Prisma',
    },
    components: {
      securitySchemes: {
        BearerToken: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'LIBRARIAN', 'ADMIN'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Book: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            isbn: { type: 'string' },
            title: { type: 'string' },
            author: { type: 'string' },
            genre: { type: 'string' },
            description: { type: 'string' },
            publishedYear: { type: 'integer' },
            copies: { type: 'integer' },
            available: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        BookInput: {
          type: 'object',
          required: ['isbn', 'title', 'author', 'genre', 'publishedYear', 'copies'],
          properties: {
            isbn: { type: 'string', example: '978-0-06-112008-4' },
            title: { type: 'string', example: 'To Kill a Mockingbird' },
            author: { type: 'string', example: 'Harper Lee' },
            genre: { type: 'string', example: 'Fiction' },
            description: { type: 'string' },
            publishedYear: { type: 'integer', example: 1960 },
            copies: { type: 'integer', example: 5 },
          },
        },
        Loan: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            bookId: { type: 'integer' },
            loanDate: { type: 'string', format: 'date-time' },
            dueDate: { type: 'string', format: 'date-time' },
            returnDate: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['ACTIVE', 'RETURNED', 'OVERDUE'] },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            bookId: { type: 'integer' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGci...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
