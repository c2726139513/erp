import { prisma } from './prisma';

/**
 * 生成下一个单据编号
 * 格式：年月-编号（如：202602-01）
 * @param type 单据类型：'invoice' | 'payment'
 * @returns 下一个可用的编号
 */
export async function generateNextNumber(type: 'invoice' | 'payment'): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `${yearMonth}-`;

  const model = type === 'invoice' ? prisma.invoice : prisma.payment;
  const numberField = type === 'invoice' ? 'invoiceNumber' : 'paymentNumber';

  const records = await model.findMany({
    where: {
      [numberField]: {
        startsWith: prefix,
      },
    },
    select: {
      [numberField]: true,
    },
    orderBy: {
      [numberField]: 'desc',
    },
    take: 1,
  });

  let nextNumber = 1;

  if (records.length > 0) {
    const lastNumber = records[0][numberField];
    const lastSequence = parseInt(lastNumber.split('-')[1], 10);
    if (!isNaN(lastSequence)) {
      nextNumber = lastSequence + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(2, '0')}`;
}
