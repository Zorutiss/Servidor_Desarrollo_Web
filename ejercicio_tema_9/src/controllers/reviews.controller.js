import prisma from '../config/prisma.js';

export const getBookReviews = async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id);

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });

    const reviews = await prisma.review.findMany({
      where: { bookId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    return res.status(200).json({ reviews, avgRating, total: reviews.length });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id);
    const userId = req.user.id;
    const { rating, comment } = req.body;

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });

    // Verificar que el usuario ha devuelto el libro
    const completedLoan = await prisma.loan.findFirst({
      where: { userId, bookId, status: 'RETURNED' },
    });
    if (!completedLoan) {
      return res.status(403).json({
        message: 'Solo puedes reseñar libros que hayas devuelto',
      });
    }

    // Verificar que no tiene ya una reseña
    const existingReview = await prisma.review.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    if (existingReview) {
      return res.status(400).json({ message: 'Ya has reseñado este libro' });
    }

    const review = await prisma.review.create({
      data: { userId, bookId, rating, comment },
      include: { user: { select: { id: true, name: true } } },
    });

    return res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const reviewId = parseInt(req.params.id);
    const userId = req.user.id;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });

    // Solo el autor o admin puede borrar
    if (review.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta reseña' });
    }

    await prisma.review.delete({ where: { id: reviewId } });
    return res.status(200).json({ message: 'Reseña eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};
