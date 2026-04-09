import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos de prueba...');

  // Limpiar datos previos
  await prisma.review.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuarios
  const adminPassword = await bcrypt.hash('admin1234', 10);
  const librarianPassword = await bcrypt.hash('librarian1234', 10);
  const userPassword = await bcrypt.hash('user1234', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@biblioteca.com',
      name: 'Admin Principal',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const librarian = await prisma.user.create({
    data: {
      email: 'biblioteca@biblioteca.com',
      name: 'María Bibliotecaria',
      password: librarianPassword,
      role: 'LIBRARIAN',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'lector1@biblioteca.com',
      name: 'Juan Lector',
      password: userPassword,
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'lector2@biblioteca.com',
      name: 'Ana Lectora',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log('✅ Usuarios creados');

  // Crear libros
  const books = await Promise.all([
    prisma.book.create({
      data: {
        isbn: '978-0-06-112008-4',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Fiction',
        description: 'A classic of modern American literature.',
        publishedYear: 1960,
        copies: 5,
        available: 5,
      },
    }),
    prisma.book.create({
      data: {
        isbn: '978-0-7432-7356-5',
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopia',
        description: 'A dystopian novel set in a totalitarian society.',
        publishedYear: 1949,
        copies: 4,
        available: 4,
      },
    }),
    prisma.book.create({
      data: {
        isbn: '978-0-7432-7357-2',
        title: 'El Quijote',
        author: 'Miguel de Cervantes',
        genre: 'Classic',
        description: 'La obra cumbre de la literatura española.',
        publishedYear: 1605,
        copies: 3,
        available: 3,
      },
    }),
    prisma.book.create({
      data: {
        isbn: '978-0-14-028329-7',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Fiction',
        description: 'A portrait of the Jazz Age in all of its decadence.',
        publishedYear: 1925,
        copies: 6,
        available: 6,
      },
    }),
    prisma.book.create({
      data: {
        isbn: '978-0-14-303943-3',
        title: 'One Hundred Years of Solitude',
        author: 'Gabriel García Márquez',
        genre: 'Magic Realism',
        description: 'A multi-generational story of the Buendía family.',
        publishedYear: 1967,
        copies: 4,
        available: 4,
      },
    }),
  ]);

  console.log('✅ Libros creados');

  // Crear préstamo de ejemplo (ya devuelto)
  const pastLoan = await prisma.loan.create({
    data: {
      userId: user1.id,
      bookId: books[0].id,
      loanDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-15'),
      returnDate: new Date('2024-01-12'),
      status: 'RETURNED',
    },
  });

  // Reducir disponibilidad si hay préstamo activo
  const activeLoan = await prisma.loan.create({
    data: {
      userId: user2.id,
      bookId: books[1].id,
      loanDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
    },
  });
  await prisma.book.update({
    where: { id: books[1].id },
    data: { available: { decrement: 1 } },
  });

  // Crear reseña del libro devuelto
  await prisma.review.create({
    data: {
      userId: user1.id,
      bookId: books[0].id,
      rating: 5,
      comment: 'Una obra maestra absoluta. Muy recomendable.',
    },
  });

  console.log('✅ Préstamos y reseñas creados');

  console.log('\n📚 Biblioteca sembrada correctamente!');
  console.log('\n👤 Credenciales de prueba:');
  console.log('  Admin:      admin@biblioteca.com / admin1234');
  console.log('  Librarian:  biblioteca@biblioteca.com / librarian1234');
  console.log('  Usuario:    lector1@biblioteca.com / user1234');
  console.log('  Usuario:    lector2@biblioteca.com / user1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
