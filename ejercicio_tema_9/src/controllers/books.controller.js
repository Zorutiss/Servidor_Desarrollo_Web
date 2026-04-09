import prisma from '../config/prisma.js';

export const getBooks = async (req, res, next) => {
  try {
    const { genre, author, available, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (genre) where.genre = { contains: genre, mode: 'insensitive' };
    if (author) where.author = { contains: author, mode: 'insensitive' };
    if (available === 'true') where.available = { gt: 0 };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { title: 'asc' },
        include: {
          _count: { select: { reviews: true, loans: true } },
        },
      }),
      prisma.book.count({ where }),
    ]);

    return res.status(200).json({ books, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

export const getBookById = async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { loans: true } },
      },
    });

    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });

    return res.status(200).json({ book });
  } catch (error) {
    next(error);
  }
};

export const createBook = async (req, res, next) => {
  try {
    const { isbn, title, author, genre, description, publishedYear, copies } = req.body;

    const existing = await prisma.book.findUnique({ where: { isbn } });
    if (existing) return res.status(400).json({ message: 'El ISBN ya existe' });

    const book = await prisma.book.create({
      data: { isbn, title, author, genre, description, publishedYear, copies, available: copies },
    });

    return res.status(201).json({ book });
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Libro no encontrado' });

    const book = await prisma.book.update({ where: { id }, data: req.body });
    return res.status(200).json({ book });
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Libro no encontrado' });

    await prisma.book.delete({ where: { id } });
    return res.status(200).json({ message: 'Libro eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// BONUS: Statistics
export const getStats = async (req, res, next) => {
  try {
    const mostLoaned = await prisma.book.findMany({
      orderBy: { loans: { _count: 'desc' } },
      take: 5,
      select: {
        id: true, title: true, author: true,
        _count: { select: { loans: true } },
      },
    });

    const bestRated = await prisma.book.findMany({
      where: { reviews: { some: {} } },
      take: 5,
      include: {
        reviews: { select: { rating: true } },
      },
    });

    const bestRatedWithAvg = bestRated
      .map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        avgRating:
          book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length,
        totalReviews: book.reviews.length,
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    const totalBooks = await prisma.book.count();
    const totalLoans = await prisma.loan.count();
    const activeLoans = await prisma.loan.count({ where: { status: 'ACTIVE' } });
    const totalUsers = await prisma.user.count();

    return res.status(200).json({
      stats: { totalBooks, totalLoans, activeLoans, totalUsers },
      mostLoaned,
      bestRated: bestRatedWithAvg,
    });
  } catch (error) {
    next(error);
  }
};
