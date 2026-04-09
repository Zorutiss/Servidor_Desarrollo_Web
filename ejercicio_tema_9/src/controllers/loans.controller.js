import prisma from '../config/prisma.js';

const MAX_ACTIVE_LOANS = 3;
const LOAN_DURATION_DAYS = 14;

export const getMyLoans = async (req, res, next) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user.id },
      include: { book: true },
      orderBy: { loanDate: 'desc' },
    });
    return res.status(200).json({ loans });
  } catch (error) {
    next(error);
  }
};

export const getAllLoans = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (status) where.status = status;

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, email: true } },
          book: { select: { id: true, title: true, isbn: true } },
        },
        orderBy: { loanDate: 'desc' },
      }),
      prisma.loan.count({ where }),
    ]);

    return res.status(200).json({ loans, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

export const createLoan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;

    if (!bookId) return res.status(400).json({ message: 'bookId es requerido' });

    // Verificar que el libro existe y tiene ejemplares
    const book = await prisma.book.findUnique({ where: { id: parseInt(bookId) } });
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });
    if (book.available <= 0) return res.status(400).json({ message: 'No hay ejemplares disponibles' });

    // Verificar límite de préstamos activos
    const activeLoans = await prisma.loan.count({ where: { userId, status: 'ACTIVE' } });
    if (activeLoans >= MAX_ACTIVE_LOANS) {
      return res.status(400).json({ message: `Límite de ${MAX_ACTIVE_LOANS} préstamos activos alcanzado` });
    }

    // Verificar que no tiene ya este libro prestado
    const existingLoan = await prisma.loan.findFirst({
      where: { userId, bookId: parseInt(bookId), status: 'ACTIVE' },
    });
    if (existingLoan) {
      return res.status(400).json({ message: 'Ya tienes este libro prestado' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);

    // Crear préstamo y decrementar disponibilidad en una transacción
    const [loan] = await prisma.$transaction([
      prisma.loan.create({
        data: { userId, bookId: parseInt(bookId), dueDate },
        include: { book: true },
      }),
      prisma.book.update({
        where: { id: parseInt(bookId) },
        data: { available: { decrement: 1 } },
      }),
    ]);

    return res.status(201).json({ loan });
  } catch (error) {
    next(error);
  }
};

export const returnBook = async (req, res, next) => {
  try {
    const loanId = parseInt(req.params.id);
    const userId = req.user.id;

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) return res.status(404).json({ message: 'Préstamo no encontrado' });

    // Solo el dueño o un librarian/admin puede devolver
    const isOwner = loan.userId === userId;
    const isStaff = ['LIBRARIAN', 'ADMIN'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'No tienes permiso para devolver este préstamo' });
    }

    if (loan.status === 'RETURNED') {
      return res.status(400).json({ message: 'Este libro ya fue devuelto' });
    }

    const [updatedLoan] = await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: { status: 'RETURNED', returnDate: new Date() },
        include: { book: true },
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { available: { increment: 1 } },
      }),
    ]);

    return res.status(200).json({ loan: updatedLoan });
  } catch (error) {
    next(error);
  }
};
