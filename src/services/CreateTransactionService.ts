import { getCustomRepository, getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!title || !value || !type || !category) {
      throw new AppError('All credentials must be informed.');
    }

    const categoryRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(transactionCategory);
    }

    const { total: totalInBalance } = await transactionsRepository.getBalance();

    if (value > totalInBalance && type === 'outcome') {
      throw new AppError('There is no enough credit.');
    }

    const transaction = transactionsRepository.create({
      title,
      category_id: transactionCategory.id,
      value,
      type,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
